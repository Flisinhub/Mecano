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
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + reqPath);
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

await new Promise(r => server.listen(8095, r));
console.log('HTTP test server on 8095');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9320;
const edgeProc = spawn(edgePath, [
  '--headless=new',
  '--window-size=1280,840',
  `--remote-debugging-port=${port}`,
  '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_debug',
  'about:blank'
]);

try {
  await new Promise(r => setTimeout(r, 2000));
  const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
  const tabs = await listRes.json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise(res => {
      const curId = msgId++;
      const onMsg = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === curId) {
          ws.removeEventListener('message', onMsg);
          res(d.result || d);
        }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  const errors = [];
  const logs = [];
  ws.addEventListener('message', (evt) => {
    const d = JSON.parse(evt.data);
    if (d.method === 'Runtime.exceptionThrown') {
      errors.push({ type: 'exception', details: d.params.exceptionDetails });
    }
    if (d.method === 'Log.entryAdded') {
      logs.push(d.params.entry);
    }
    if (d.method === 'Console.messageAdded') {
      logs.push(d.params.message);
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  console.log('Navigating to http://localhost:8095/index.html...');
  await send('Page.navigate', { url: 'http://localhost:8095/index.html' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Exceptions caught:', JSON.stringify(errors, null, 2));
  console.log('Console/logs captured:', JSON.stringify(logs, null, 2));

  const state = await send('Runtime.evaluate', {
    expression: `
      ({
        readyState: document.readyState,
        title: document.title,
        bodyChildren: document.body.children.length,
        hasStartScreen: Boolean(document.getElementById('start-screen')),
        startScreenDisplay: window.getComputedStyle(document.getElementById('start-screen')).display,
        hasGameContainer: Boolean(document.querySelector('.game-container')),
        windowApp: Boolean(window.app),
        scriptsCount: document.scripts.length,
        bundleScriptSrc: document.querySelector('script[src="bundle.js"]')?.src
      })
    `,
    returnByValue: true
  });
  console.log('Browser State:', JSON.stringify(state.value || state.result?.value, null, 2));

  // Take screenshot
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const data = shot.data || shot.result?.data;
  if (data) {
    fs.writeFileSync('C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\page_load_check.png', Buffer.from(data, 'base64'));
    console.log('Screenshot saved.');
  }

  ws.close();
} catch (err) {
  console.error('Debug script error:', err);
} finally {
  edgeProc.kill();
  server.close();
}
