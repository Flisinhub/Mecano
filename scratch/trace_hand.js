import http from 'http';
import fs from 'fs';
import { spawn } from 'child_process';

const html = `
<!DOCTYPE html>
<html>
<body>
<canvas id="c" width="670" height="850"></canvas>
<script>
window.traceHandContour = async function() {
  const img = new Image();
  img.src = '/assets/hand_left_realistic.png';
  await new Promise(r => img.onload = r);

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, 670, 850);
  const data = imgData.data;

  function isSolid(x, y) {
    if (x < 0 || x >= 670 || y < 0 || y >= 830) return false;
    return data[(y * 670 + x) * 4 + 3] > 80;
  }

  // Find contour points along rows
  const leftEdge = [];
  const rightEdge = [];
  for (let y = 10; y <= 825; y += 8) {
    let minX = -1, maxX = -1;
    for (let x = 0; x < 670; x++) {
      if (isSolid(x, y)) {
        if (minX === -1) minX = x;
        maxX = x;
      }
    }
    if (minX !== -1) {
      leftEdge.push({ x: minX, y });
      rightEdge.push({ x: maxX, y });
    }
  }

  // Sample finger tips and valleys in original 670x850
  return { leftEdge, rightEdge };
};
</script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
  if (req.url === '/assets/hand_left_realistic.png') {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(fs.readFileSync('assets/hand_left_realistic.png'));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const debugPort = 9327;
const edgeProc = spawn(edgePath, [
  '--headless=new',
  `--remote-debugging-port=${debugPort}`,
  '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_trace',
  `http://127.0.0.1:${port}/`
]);

await new Promise(r => setTimeout(r, 2000));
const listRes = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
const tabs = await listRes.json();
const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

function send(method, params = {}) {
  return new Promise(res => {
    const curId = Math.floor(Math.random() * 100000);
    const onMsg = (evt) => {
      const d = JSON.parse(evt.data);
      if (d.id === curId) {
        ws.removeEventListener('message', onMsg);
        res(d.result);
      }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

await send('Runtime.enable');
const evalResult = await send('Runtime.evaluate', {
  expression: 'window.traceHandContour()',
  awaitPromise: true,
  returnByValue: true
});

fs.writeFileSync('scratch/contour.json', JSON.stringify(evalResult.result.value, null, 2));
console.log('Saved contour to scratch/contour.json');

edgeProc.kill();
server.close();
process.exit(0);
