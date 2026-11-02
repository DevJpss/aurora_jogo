/* Sobe um servidor estático local, roda todas as suítes e encerra sozinho. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = 8123;
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

let child = null;
let shuttingDown = false;

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (child && !child.killed) {
    try { child.kill(); } catch (e) { /* ignore */ }
  }
  server.close(() => process.exit(code == null ? 0 : code));
  setTimeout(() => process.exit(code == null ? 0 : code), 2000).unref();
}

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (e) {
    res.statusCode = 400;
    res.end('Bad request');
    return;
  }
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    let target = filePath;
    if (stat.isDirectory()) target = path.join(filePath, 'index.html');
    fs.readFile(target, (e, data) => {
      if (e) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      const ext = path.extname(target).toLowerCase();
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.statusCode = 200;
      res.end(data);
    });
  });
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error('Porta ' + PORT + ' ja esta em uso. Encerre o processo (netstat -ano | findstr ' + PORT + ').');
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  child = spawn(process.execPath, [path.join(__dirname, 'run.js')], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env
  });
  child.on('close', (code) => {
    shutdown(code == null ? 0 : code);
  });
  child.on('error', (err) => {
    console.error(err);
    shutdown(1);
  });
});
