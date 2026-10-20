import http from 'http';
import fs from 'fs';
import { spawn } from 'child_process';

const html = `
<!DOCTYPE html>
<html>
<body>
<canvas id="c" width="670" height="850"></canvas>
<script>
window.analyzeHand = async function() {
  const img = new Image();
  img.src = '/assets/hand_left_realistic.png';
  await new Promise(r => img.onload = r);

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, 670, 850);
  const data = imgData.data;

  function getAlpha(x, y) {
    if (x < 0 || x >= 670 || y < 0 || y >= 850) return 0;
    return data[(y * 670 + x) * 4 + 3];
  }

  // Find top-most point of each finger by column slices
  // Fingers roughly:
  // Pinky: x: 20..110
  // Ring: x: 120..220
  // Middle: x: 230..350
  // Index: x: 360..480
  // Thumb: x: 490..650

  const fingerBnds = [
    { name: 'pinky', minX: 20, maxX: 120 },
    { name: 'ring', minX: 130, maxX: 230 },
    { name: 'middle', minX: 240, maxX: 350 },
    { name: 'index', minX: 360, maxX: 490 },
    { name: 'thumb', minX: 480, maxX: 660 }
  ];

  const tips = {};
  for (const f of fingerBnds) {
    let topY = 9999;
    let topX = 0;
    for (let x = f.minX; x <= f.maxX; x++) {
      for (let y = 0; y < 800; y++) {
        if (getAlpha(x, y) > 120) {
          if (y < topY) {
            topY = y;
            topX = x;
          }
          break;
        }
      }
    }
    tips[f.name] = { x: topX, y: topY };
  }

  // Find webbing valleys between fingers
  // Pinky-Ring valley: between tips.pinky.x and tips.ring.x
  function findValley(x1, x2) {
    let maxY = 0;
    let valleyX = 0;
    for (let x = x1; x <= x2; x++) {
      for (let y = 0; y < 800; y++) {
        if (getAlpha(x, y) > 120) {
          if (y > maxY) {
            maxY = y;
            valleyX = x;
          }
          break;
        }
      }
    }
    return { x: valleyX, y: maxY };
  }

  const valleys = {
    pinky_ring: findValley(tips.pinky.x, tips.ring.x),
    ring_middle: findValley(tips.ring.x, tips.middle.x),
    middle_index: findValley(tips.middle.x, tips.index.x),
    index_thumb: findValley(tips.index.x, tips.thumb.x)
  };

  // Find left edge and right edge at y = 400, 500, 600, 700, 800
  const slices = [];
  for (let y = 200; y <= 840; y += 40) {
    let minX = -1, maxX = -1;
    for (let x = 0; x < 670; x++) {
      if (getAlpha(x, y) > 120) {
        if (minX === -1) minX = x;
        maxX = x;
      }
    }
    slices.push({ y, minX, maxX, width: maxX - minX });
  }

  return { tips, valleys, slices };
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
const debugPort = 9326;
const edgeProc = spawn(edgePath, [
  '--headless=new',
  `--remote-debugging-port=${debugPort}`,
  '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_analyze',
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
  expression: 'window.analyzeHand()',
  awaitPromise: true,
  returnByValue: true
});

console.log('EvalResult:', JSON.stringify(evalResult, null, 2));

edgeProc.kill();
server.close();
process.exit(0);
