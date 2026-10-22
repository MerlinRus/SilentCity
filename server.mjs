import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };
const port = Number(process.env.PORT || 4173);
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/city-weather' || pathname === '/city-search') {
      if (request.method !== 'GET') { response.writeHead(405).end(); return; }
      const search = new URL(request.url, 'http://localhost').search;
      const origin = process.env.CITY_DATA_ORIGIN;
      const endpoint = origin ? new URL(pathname + search, origin) : new URL((pathname === '/city-weather' ? 'https://api.open-meteo.com/v1/forecast' : 'https://geocoding-api.open-meteo.com/v1/search') + search);
      try {
        const upstream = await fetch(endpoint, { signal: AbortSignal.timeout(7000), redirect: 'error' });
        const body = await upstream.text();
        if (body.length > 65536) throw new Error('Response too large');
        response.writeHead(upstream.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(body);
      } catch { response.writeHead(502).end('City data unavailable'); }
      return;
    }
    const target = resolve(root, `.${pathname === '/' ? '/index.html' : pathname === '/weather.json' ? '/.weather/current.json' : pathname}`);
    if (!target.startsWith(root.endsWith(sep) ? root : root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const content = await readFile(target);
    response.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(content);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`После дождя: http://127.0.0.1:${port}`));
