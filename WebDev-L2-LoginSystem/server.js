/**
 * AuthVault — Local Development Server
 * Zero-dependency native Node.js HTTP server for local testing.
 * Automatically configured to serve AuthVault on port 8080.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Parse incoming request URL
  let reqPath = decodeURI(req.url.split('?')[0]);
  
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/AuthVault/index.html';
  }

  // Resolve target absolute path within project root
  let filePath = path.join(ROOT_DIR, reqPath);

  // If path is a directory, look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Prevent directory traversal outside root
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden: Directory traversal prevented.');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>404 Not Found — AuthVault</title>
            <style>
              body { background: #10090D; color: #FFF0F3; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              h1 { color: #FF4D6D; margin-bottom: 0.5rem; }
              a { color: #FFB3C1; text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>404 — File Not Found</h1>
            <p>Could not locate requested path: <code>${reqPath}</code></p>
            <p><a href="/AuthVault/index.html">Return to AuthVault Login Portal</a></p>
          </body>
          </html>
        `);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`500 Internal Server Error: ${err.message}`);
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log('\n======================================================');
  console.log('   AuthVault — Local Development Server Running       ');
  console.log('======================================================');
  console.log(`> Local Server: http://localhost:${PORT}`);
  console.log(`> Login Portal: http://localhost:${PORT}/AuthVault/index.html`);
  console.log(`> Registration: http://localhost:${PORT}/AuthVault/register.html`);
  console.log(`> Dashboard:    http://localhost:${PORT}/AuthVault/dashboard.html`);
  console.log('======================================================\n');
});
