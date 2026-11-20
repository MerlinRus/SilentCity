import { createServer } from 'node:http';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
const sessionAge = 30 * 24 * 60 * 60;
const limits = new Map([['after-rain-notes', 600000], ['after-rain-mix-v1', 16000], ['after-rain-city-v1', 4000], ['after-rain-resident-notes-v1', 8000]]);
const token = () => randomBytes(32).toString('base64url');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const validToken = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{43}$/.test(value);
const readCookie = (request, name) => request.headers.cookie?.split(/;\s*/).find((entry) => entry.startsWith(`${name}=`))?.slice(name.length + 1);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function respond(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(data));
}

async function readJson(request) {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') throw 415;
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 1500000) { request.resume(); throw 413; }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw 400; }
}

function validValue(key, value) {
  if (!limits.has(key) || typeof value !== 'string' || Buffer.byteLength(value) > limits.get(key)) return false;
  if (key === 'after-rain-notes') return true;
  try { return object(JSON.parse(value)); }
  catch { return false; }
}

export function createAccountHandler({ filename = ':memory:', origin, googleId, googleSecret, trustProxy = false }) {
  const database = new DatabaseSync(filename);
  database.exec(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, login TEXT UNIQUE, email TEXT, google_sub TEXT UNIQUE, salt TEXT, password BLOB);
    CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS values_by_user (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, key TEXT NOT NULL, value TEXT NOT NULL, version INTEGER NOT NULL, PRIMARY KEY (user_id, key));`);
  const findSession = database.prepare('SELECT users.id, users.login, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE hash = ? AND expires > ?');
  const removeSession = database.prepare('DELETE FROM sessions WHERE hash = ?');
  const readValues = database.prepare('SELECT key, value, version FROM values_by_user WHERE user_id = ?');
  const saveValue = database.prepare('INSERT INTO values_by_user VALUES (?, ?, ?, 1) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, version = version + 1');
  const userByLogin = database.prepare('SELECT id, login, salt, password FROM users WHERE login = ?');
  const activeSessions = database.prepare('INSERT INTO sessions VALUES (?, ?, ?)');
  const clearSessions = database.prepare('DELETE FROM sessions WHERE expires <= ?');
  const googleEnabled = Boolean(googleId && googleSecret);
  const callback = `${origin}/api/account/google/callback`;
  const secure = origin.startsWith('https:') ? '; Secure' : '';
  const sessionName = secure ? '__Host-silentcity' : 'silentcity';
  const attempts = new Map();
  let passwordWork = 0;

  function cookie(name, value, age) {
    return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure}`;
  }

  function publicState(user) {
    const values = Object.fromEntries(readValues.all(user.id).map(({ key, value, version }) => [key, { value, version }]));
    return { user: { id: user.id, name: user.login || user.email }, values, googleEnabled };
  }

  function session(request, user) {
    const previous = readCookie(request, sessionName);
    if (validToken(previous)) removeSession.run(digest(previous));
    const value = token();
    const now = Date.now();
    clearSessions.run(now);
    activeSessions.run(digest(value), user.id, now + sessionAge * 1000);
    return cookie(sessionName, value, sessionAge);
  }

  function limitAuth(request) {
    const forwarded = request.headers['x-silentcity-client'];
    const client = trustProxy && typeof forwarded === 'string' && isIP(forwarded) ? forwarded : request.socket.remoteAddress;
    const now = Date.now();
    if (attempts.size >= 5000) {
      for (const [address, entry] of attempts) if (entry.until <= now) attempts.delete(address);
      if (attempts.size >= 5000 && !attempts.has(client)) return false;
    }
    const entry = attempts.get(client);
    if (!entry || entry.until <= now) { attempts.set(client, { count: 1, until: now + 600000 }); return true; }
    return ++entry.count <= 20;
  }

  return async function handleAccount(request, response, url) {
    const route = url.pathname;
    const method = request.method;
    try {
      if (method !== 'GET' && request.headers.origin !== origin) throw 403;
      if (method === 'GET' && route === '/api/account/google' && googleEnabled) {
        if (!limitAuth(request)) throw 429;
        const state = token();
        const verifier = token();
        const challenge = createHash('sha256').update(verifier).digest('base64url');
        const target = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        target.search = new URLSearchParams({ client_id: googleId, redirect_uri: callback, response_type: 'code', scope: 'openid email', state, code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account' });
        return response.writeHead(303, { Location: target.href, 'Cache-Control': 'no-store', 'Set-Cookie': cookie('silentcity-google', `${state}.${verifier}`, 600) }).end();
      }
      if (method === 'GET' && route === '/api/account/google/callback' && googleEnabled) {
        const cookies = [cookie('silentcity-google', '', 0)];
        let location = '/#account-error';
        try {
          const [state, verifier] = (readCookie(request, 'silentcity-google') || '').split('.');
          const code = url.searchParams.get('code');
          if (!validToken(state) || !validToken(verifier) || url.searchParams.get('state') !== state || !code || code.length > 4096) throw 400;
          const exchange = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ code, client_id: googleId, client_secret: googleSecret, redirect_uri: callback, grant_type: 'authorization_code', code_verifier: verifier }), signal: AbortSignal.timeout(8000), redirect: 'error' });
          if (!exchange.ok) throw 502;
          const { access_token: accessToken } = await exchange.json();
          if (typeof accessToken !== 'string' || !accessToken) throw 502;
          const profile = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(8000), redirect: 'error' });
          if (!profile.ok) throw 502;
          const { sub, email, email_verified: verified } = await profile.json();
          if (typeof sub !== 'string' || !sub || sub.length > 128 || typeof email !== 'string' || email.length > 254 || verified !== true) throw 502;
          const user = database.prepare('INSERT INTO users (google_sub, email) VALUES (?, ?) ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email RETURNING id').get(sub, email);
          cookies.push(session(request, user));
          location = '/#account';
        } catch {}
        return response.writeHead(303, { Location: location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Set-Cookie': cookies }).end();
      }
      const sessionToken = readCookie(request, sessionName);
      const user = validToken(sessionToken) ? findSession.get(digest(sessionToken), Date.now()) : null;
      if (method === 'GET' && route === '/api/account') return respond(response, 200, user ? publicState(user) : { user: null, googleEnabled });
      if (method === 'POST' && route === '/api/account/logout') {
        if (user) removeSession.run(digest(sessionToken));
        response.setHeader('Set-Cookie', cookie(sessionName, '', 0));
        return respond(response, 200, { user: null });
      }
      if (method === 'POST' && (route === '/api/account/login' || route === '/api/account/register')) {
        if (!limitAuth(request)) throw 429;
        const body = await readJson(request);
        const login = typeof body?.login === 'string' ? body.login.trim().toLowerCase() : '';
        const password = body?.password;
        const register = route.endsWith('/register');
        if (login.length > 254 || !/^(?:[a-z0-9_.-]{3,32}|[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(login) || typeof password !== 'string' || password.length < 8 || password.length > 128) throw 400;
        const seed = body.seed ?? {};
        if (register && (!object(seed) || !Object.entries(seed).every(([key, value]) => validValue(key, value)))) throw 400;
        if (passwordWork >= 4) throw 429;
        const existing = userByLogin.get(login);
        if (register && existing) throw 409;
        const salt = existing?.salt || token();
        passwordWork++;
        let passwordHash;
        try { passwordHash = await deriveKey(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }); }
        finally { passwordWork--; }
        let signedIn = existing;
        if (register) {
          database.exec('BEGIN');
          try {
            signedIn = database.prepare('INSERT INTO users (login, salt, password) VALUES (?, ?, ?) ON CONFLICT(login) DO NOTHING RETURNING id, login').get(login, salt, passwordHash);
            if (!signedIn) throw 409;
            for (const [key, value] of Object.entries(seed)) saveValue.run(signedIn.id, key, value);
            database.exec('COMMIT');
          } catch (error) { database.exec('ROLLBACK'); throw error; }
        } else if (!existing || !timingSafeEqual(passwordHash, existing.password)) throw 401;
        response.setHeader('Set-Cookie', session(request, signedIn));
        return respond(response, register ? 201 : 200, publicState(signedIn));
      }
      if (method === 'PATCH' && route === '/api/account') {
        if (!user) throw 401;
        const body = await readJson(request);
        if (!object(body?.changes) || !Number.isSafeInteger(body.userId)) throw 400;
        if (body.userId !== user.id || !findSession.get(digest(sessionToken), Date.now())) throw 401;
        const entries = Object.entries(body.changes);
        if (!entries.length || !entries.every(([key, entry]) => object(entry) && validValue(key, entry.value) && Number.isSafeInteger(entry.version) && entry.version >= 0)) throw 400;
        const current = publicState(user);
        if (entries.some(([key, entry]) => current.values[key]?.value !== entry.value && (current.values[key]?.version ?? 0) !== entry.version)) return respond(response, 409, current);
        database.exec('BEGIN');
        try {
          for (const [key, entry] of entries) if (current.values[key]?.value !== entry.value) saveValue.run(user.id, key, entry.value);
          database.exec('COMMIT');
        } catch (error) { database.exec('ROLLBACK'); throw error; }
        return respond(response, 200, publicState(user));
      }
      return respond(response, 404, { error: 404 });
    } catch (error) {
      const status = Number.isInteger(error) ? error : 500;
      if (status === 500) console.error('Account API request failed', error?.code || error?.name);
      return respond(response, status, { error: status });
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const handleAccount = createAccountHandler({ filename: process.env.ACCOUNT_DB, origin: process.env.ACCOUNT_ORIGIN, googleId: process.env.GOOGLE_CLIENT_ID, googleSecret: process.env.GOOGLE_CLIENT_SECRET, trustProxy: true });
  createServer((request, response) => handleAccount(request, response, new URL(request.url, 'http://localhost'))).listen(4173, '0.0.0.0');
}
