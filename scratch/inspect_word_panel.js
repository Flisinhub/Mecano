import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join('c:\\mecano\\Mecano-main\\Mecano-main', reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

await new Promise(r => server.listen(8091, r));

const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--window-size=1280,820',
  '--remote-debugging-port=9320',
  '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_inspect',
  'http://localhost:8091/index.html'
]);

await new Promise(r => setTimeout(r, 2000));
const listRes = await fetch('http://127.0.0.1:9320/json/list');
const tabs = await listRes.json();
const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let id = 1;
function send(method, params = {}) {
  return new Promise(res => {
    const curId = id++;
    const onMsg = (evt) => {
      const d = JSON.parse(evt.data);
      if (d.id === curId) { ws.removeEventListener('message', onMsg); res(d.result || d); }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

// Click start
await send('Runtime.evaluate', { expression: "document.getElementById('start-game-btn').click()" });
await new Promise(r => setTimeout(r, 500));

const info = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const wp = document.getElementById('word-panel');
      const tw = document.getElementById('target-word');
      const vb = document.getElementById('word-visual-badge');
      return {
        wp: {
          height: wp.offsetHeight,
          clientHeight: wp.clientHeight,
          padding: window.getComputedStyle(wp).padding,
          display: window.getComputedStyle(wp).display,
          justifyContent: window.getComputedStyle(wp).justifyContent
        },
        vb: {
          height: vb.offsetHeight,
          marginBottom: window.getComputedStyle(vb).marginBottom
        },
        tw: {
          height: tw.offsetHeight,
          scrollHeight: tw.scrollHeight,
          scrollTop: tw.scrollTop,
          fontSize: window.getComputedStyle(tw).fontSize,
          lineHeight: window.getComputedStyle(tw).lineHeight,
          overflowY: window.getComputedStyle(tw).overflowY,
          innerHTML: tw.innerHTML
        }
      };
    })()
  `,
  returnByValue: true
});

console.log('Inspection Data:', JSON.stringify(info, null, 2));

ws.close();
edgeProc.kill();
server.close();
