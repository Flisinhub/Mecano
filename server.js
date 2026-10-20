/**
 * server.js - Lightweight Zero-Dependency Local Dev Server for Mecano
 * 
 * Serves native ES modules with proper application/javascript MIME types,
 * prevents directory traversal, and provides CORS headers for local assets.
 * 
 * Usage:
 *   node server.js
 *   node server.js 8080
 *   PORT=8080 node server.js
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MIME_TYPES = Object.freeze({
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=UTF-8'
});

export function parsePort(args = process.argv, envPort = process.env.PORT) {
  // Check CLI arguments (e.g. node server.js 8080 or --port 8080)
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' || arg === '-p') {
      const next = Number(args[i + 1]);
      if (!Number.isNaN(next) && next > 0 && next < 65536) return next;
    }
    const num = Number(arg);
    if (!Number.isNaN(num) && num > 0 && num < 65536) {
      return num;
    }
  }

  // Check environment variable
  if (envPort) {
    const num = Number(envPort);
    if (!Number.isNaN(num) && num > 0 && num < 65536) return num;
  }

  return 3000;
}

export function createServer(rootDir = __dirname) {
  return http.createServer((req, res) => {
    // Parse URL and sanitize path
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);
    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    }

    const filePath = path.normalize(path.join(rootDir, pathname));

    // Security: prevent path traversal outside root directory
    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('403 Forbidden: Path traversal detected');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end(`404 Not Found: ${pathname}`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });

      const stream = fs.createReadStream(filePath);
      stream.on('error', (streamErr) => {
        console.error(`[Server] Stream error for ${filePath}:`, streamErr);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        }
        res.end('500 Internal Server Error');
      });
      stream.pipe(res);
    });
  });
}

// Auto-start if executed directly from CLI
const isDirectlyExecuted = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectlyExecuted) {
  const PORT = parsePort();
  const server = createServer(__dirname);

  server.listen(PORT, () => {
    console.log(`\n🚀 Mecano Dev Server running at: http://localhost:${PORT}/`);
    console.log(`📁 Serving directory: ${__dirname}\n`);
  });

  server.on('error', (err) => {
    console.error(`[Server] Fatal error:`, err);
    process.exit(1);
  });
}

export default createServer;
