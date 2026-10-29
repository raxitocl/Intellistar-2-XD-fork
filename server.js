/**
 * server.js
 * Servidor HTTP local de alto rendimiento y cero dependencias para IntelliStar 2 XD.
 * Utiliza exclusivamente las APIs nativas de Node.js (http, fs, path, url, os).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');

// Directorio raíz donde reside la aplicación
const PUBLIC_DIR = __dirname;

// Mapeo exhaustivo de tipos MIME
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

const server = http.createServer((req, res) => {
  // Manejo de preflight CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Método no permitido');
    return;
  }

  // Parsear la URL solicitada
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Ruta raíz entrega index.html
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  // Resolver ruta absoluta y prevenir Path Traversal
  const safePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Acceso denegado');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1>404 No Encontrado</h1><p>El archivo <code>${pathname}</code> no existe.</p>`);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Error interno del servidor: ' + err.code);
      }
      return;
    }

    let filePathToServe = safePath;
    if (stats.isDirectory()) {
      filePathToServe = path.join(safePath, 'index.html');
    }

    const ext = path.extname(filePathToServe).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Soporte para streaming y reproducción parcial de audio (HTTP Range)
    const totalSize = stats.size;
    const range = req.headers.range;

    if (range && (ext === '.wav' || ext === '.mp3' || ext === '.ogg')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.writeHead(416, {
          'Content-Range': `bytes */${totalSize}`
        });
        res.end();
        return;
      }

      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePathToServe, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });

      if (req.method === 'HEAD') {
        res.end();
      } else {
        fileStream.pipe(res);
      }
      return;
    }

    // Respuesta estándar
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': totalSize,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    });

    if (req.method === 'HEAD') {
      res.end();
    } else {
      fs.createReadStream(filePathToServe).pipe(res);
    }
  });
});

// Selección de puerto con tolerancia a puertos ocupados
let DEFAULT_PORT = parseInt(process.env.PORT, 10) || 8080;

function startServer(port) {
  server.listen(port, () => {
    const ips = getLocalIpAddresses();
    console.log('===========================================================');
    console.log('   THE WEATHER CHANNEL - INTELLISTAR 2 XD EMULATOR');
    console.log('   Servidor Web Local en Node.js Activo');
    console.log('===========================================================');
    console.log(` > Local:    http://localhost:${port}`);
    ips.forEach(ip => {
      console.log(` > En Red:   http://${ip}:${port}`);
    });
    console.log('===========================================================');
    console.log(' Presiona Ctrl+C en cualquier momento para detener el servidor.\n');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Aviso] El puerto ${port} está ocupado. Probando puerto ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Error fatal al iniciar servidor:', err);
    }
  });
}

startServer(DEFAULT_PORT);

