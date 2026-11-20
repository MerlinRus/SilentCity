import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createAccountHandler } from '../account-server.mjs';

const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const handle = createAccountHandler({ origin, googleId: 'test-client', googleSecret: 'test-secret' });
server.on('request', (request, response) => handle(request, response, new URL(request.url, origin)));
const networkFetch = globalThis.fetch;
const call = (path = '', method = 'GET', body, cookie = '', from = origin) => networkFetch(`${origin}/api/account${path}`, { method, redirect: 'manual', headers: { Origin: from, 'Content-Type': 'application/json', Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
const credentials = { login: 'reader@example.test', password: 'long-test-password' };
const noteKey = 'after-rain-notes';

try {
  const guest = await call();
  assert.deepEqual(await guest.json(), { user: null, googleEnabled: true });
  const registration = await call('/register', 'POST', { ...credentials, seed: { [noteKey]: 'Local note' } });
  assert.equal(registration.status, 201);
  const firstCookie = registration.headers.getSetCookie()[0].split(';')[0];
  assert.match(registration.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);
  const { user, values } = await registration.json();
  assert.equal(values[noteKey].value, 'Local note');
  assert.equal((await call('/register', 'POST', credentials)).status, 409);
  assert.equal((await call('/login', 'POST', { ...credentials, password: 'wrong-password' })).status, 401);
  const login = await call('/login', 'POST', credentials);
  assert.equal(login.status, 200);
  const secondCookie = login.headers.getSetCookie()[0].split(';')[0];
  assert.notEqual(firstCookie, secondCookie);
  const update = { userId: user.id, changes: { [noteKey]: { value: 'Synced from phone', version: 1 } } };
  assert.equal((await call('', 'PATCH', update, firstCookie, 'https://elsewhere.test')).status, 403);
  assert.equal((await call('', 'PATCH', { ...update, userId: user.id + 1 }, firstCookie)).status, 401);
  assert.equal((await call('', 'PATCH', update, firstCookie)).status, 200);
  const secondState = await (await call('', 'GET', undefined, secondCookie)).json();
  assert.equal(secondState.values[noteKey].value, 'Synced from phone');
  assert.equal((await call('', 'PATCH', update, firstCookie)).status, 200);
  update.changes[noteKey].value = 'Stale edit';
  const conflict = await call('', 'PATCH', update, secondCookie);
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).values[noteKey].value, 'Synced from phone');

  const google = await call('/google');
  assert.equal(google.status, 303);
  const route = new URL(google.headers.get('location'));
  assert.equal(route.searchParams.get('scope'), 'openid email');
  assert.equal(route.searchParams.get('code_challenge_method'), 'S256');
  const googleCookie = google.headers.getSetCookie()[0].split(';')[0];
  const rejected = await call('/google/callback?state=other&code=test', 'GET', undefined, googleCookie);
  assert.equal(rejected.headers.get('location'), '/#account-error');
  globalThis.fetch = async (url, options) => {
    if (url === 'https://oauth2.googleapis.com/token') {
      assert.ok(options.body.get('code_verifier'));
      return Response.json({ access_token: 'test-token' });
    }
    assert.equal(url, 'https://openidconnect.googleapis.com/v1/userinfo');
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    return Response.json({ sub: 'test-google-account', email: credentials.login, email_verified: true });
  };
  const callback = await call(`/google/callback?state=${route.searchParams.get('state')}&code=test`, 'GET', undefined, googleCookie);
  assert.equal(callback.headers.get('location'), '/#account');
  const googleSession = callback.headers.getSetCookie()[1].split(';')[0];
  const googleState = await (await call('', 'GET', undefined, googleSession)).json();
  assert.notEqual(googleState.user.id, user.id);
  assert.deepEqual(googleState.values, {});

  assert.equal((await call('/logout', 'POST', undefined, firstCookie)).status, 200);
  assert.equal((await (await call('', 'GET', undefined, firstCookie)).json()).user, null);
  assert.equal((await (await call('', 'GET', undefined, secondCookie)).json()).user.id, user.id);
  console.log('Accounts: import, session isolation, two-browser sync, conflict, origin protection, Google flow and logout passed');
} finally {
  globalThis.fetch = networkFetch;
  server.close();
}
