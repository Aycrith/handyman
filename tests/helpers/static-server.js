const fs = require('fs');
const http = require('http');
const path = require('path');

function startStaticServer(rootPath, port) {
  return new Promise((resolve) => {
    const root = path.resolve(rootPath);

    const server = http.createServer((req, res) => {
      const requestUrl = new URL(req.url, 'http://localhost');
      const relativePath = requestUrl.pathname === '/' ? 'index.html' : `.${requestUrl.pathname}`;
      const filePath = path.resolve(root, relativePath);

      if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const mime = {
          '.css': 'text/css',
          '.glb': 'model/gltf-binary',
          '.gltf': 'model/gltf+json',
          '.html': 'text/html',
          '.jpg': 'image/jpeg',
          '.js': 'application/javascript',
          '.json': 'application/json',
          '.png': 'image/png',
          '.svg': 'image/svg+xml',
        }[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      });
    });

    server.listen(port, () => resolve(server));
  });
}

module.exports = { startStaticServer };
