// Serve a Unity Web build locally the way itch.io does (no dependencies).
//   node tools/serve-web.mjs <build dir> [port]
// Pre-compressed *.unityweb files are sent with Content-Encoding (gzip or br) and the
// MIME type of the inner file, so the loader streams the wasm instead of falling back.
import { createServer } from 'node:http';
import { createReadStream, statSync, openSync, readSync, closeSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';

const dir = process.argv[2];
const port = Number(process.argv[3] ?? 8768);
if (!dir) {
  console.error('usage: node tools/serve-web.mjs <build dir> [port]');
  process.exit(1);
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.data': 'application/octet-stream',
};

function innerType(name) {
  if (name.includes('.wasm')) return 'application/wasm';
  if (name.includes('.js')) return 'application/javascript';
  return 'application/octet-stream';
}

createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = normalize(join(dir, url === '/' ? '/index.html' : url));
  if (!file.startsWith(normalize(dir))) {
    res.writeHead(403).end();
    return;
  }
  let st;
  try {
    st = statSync(file);
  } catch {
    res.writeHead(404).end('not found');
    return;
  }
  const headers = { 'Content-Length': st.size, 'Cache-Control': 'no-cache' };
  if (file.endsWith('.unityweb')) {
    const fd = openSync(file, 'r');
    const magic = Buffer.alloc(2);
    readSync(fd, magic, 0, 2, 0);
    closeSync(fd);
    headers['Content-Encoding'] = magic[0] === 0x1f && magic[1] === 0x8b ? 'gzip' : 'br';
    headers['Content-Type'] = innerType(file);
  } else {
    headers['Content-Type'] = mime[extname(file)] ?? 'application/octet-stream';
  }
  res.writeHead(200, headers);
  createReadStream(file).pipe(res);
  console.log(`${res.statusCode} ${url}`);
}).listen(port, '127.0.0.1', () => console.log(`serving ${dir} on http://127.0.0.1:${port}/`));
