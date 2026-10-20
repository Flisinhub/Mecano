import http from 'http';
import fs from 'fs';
import { spawn } from 'child_process';

const html = `
<!DOCTYPE html>
<html>
<body>
<canvas id="c" width="670" height="850"></canvas>
<script>
window.extractExactHandPath = async function() { try {
  const img = new Image();
  img.src = '/assets/hand_left_realistic.png';
  await new Promise(r => img.onload = r);

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, 670, 850);
  const data = imgData.data;

  function isSolid(x, y) {
    if (x < 0 || x >= 670 || y < 0 || y >= 835) return false;
    return data[(y * 670 + x) * 4 + 3] > 60;
  }

  // 1. Find a starting border pixel at the wrist bottom (y = 830)
  let startX = -1, startY = 830;
  for (let x = 0; x < 670; x++) {
    if (isSolid(x, startY)) {
      startX = x;
      break;
    }
  }

  // 2. Moore-Neighbor Tracing
  const directions = [
    { dx: 0, dy: -1 }, // N
    { dx: 1, dy: -1 }, // NE
    { dx: 1, dy: 0 },  // E
    { dx: 1, dy: 1 },  // SE
    { dx: 0, dy: 1 },  // S
    { dx: -1, dy: 1 }, // SW
    { dx: -1, dy: 0 }, // W
    { dx: -1, dy: -1 } // NW
  ];

  const contour = [];
  let cx = startX, cy = startY;
  let dirIdx = 0; // backtrack dir

  let steps = 0;
  contour.push({ x: cx, y: cy });

  while (steps < 20000) {
    steps++;
    // Start searching from (dirIdx + 5) % 8
    let found = false;
    let checkDir = (dirIdx + 5) % 8;
    for (let i = 0; i < 8; i++) {
      const d = (checkDir + i) % 8;
      const nx = cx + directions[d].dx;
      const ny = cy + directions[d].dy;
      if (isSolid(nx, ny)) {
        cx = nx;
        cy = ny;
        dirIdx = d;
        found = true;
        break;
      }
    }
    if (!found) break;
    if (cx === startX && cy === startY && steps > 10) break;
    contour.push({ x: cx, y: cy });
  }

  // 3. Ramer-Douglas-Peucker simplification
  function rdp(points, epsilon) {
    if (points.length < 3) return points;
    let dmax = 0;
    let index = 0;
    const end = points.length - 1;
    for (let i = 1; i < end; i++) {
      const d = perpendicularDistance(points[i], points[0], points[end]);
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }
    if (dmax > epsilon) {
      const rec1 = rdp(points.slice(0, index + 1), epsilon);
      const rec2 = rdp(points.slice(index), epsilon);
      return rec1.slice(0, rec1.length - 1).concat(rec2);
    } else {
      return [points[0], points[end]];
    }
  }

  function perpendicularDistance(p, p1, p2) {
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    if (dx === 0 && dy === 0) {
      return Math.hypot(p.x - p1.x, p.y - p1.y);
    }
    const num = Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x);
    const den = Math.hypot(dx, dy);
    return num / den;
  }

  const simplified = rdp(contour, 1.8);

  // Scale and center into 400 x 480:
  // photo is 670 x 850
  // scale = 0.52
  // offsetX = (400 - 670 * 0.52) / 2 = 25.8
  // offsetY = 20
  const scale = 0.52;
  const offsetX = 26;
  const offsetY = 18;

  const scaled = simplified.map(p => ({
    x: Math.round((p.x * scale + offsetX) * 10) / 10,
    y: Math.round((p.y * scale + offsetY) * 10) / 10
  }));

  // Create SVG path string
  let d = 'M ' + scaled[0].x + ',' + scaled[0].y;
  for (let i = 1; i < scaled.length; i++) {
    d += ' L ' + scaled[i].x + ',' + scaled[i].y;
  }
  d += ' Z';

  return { pointCount: scaled.length, d,  }; } catch(err) { return { err: err.message, stack: err.stack }; }
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
const debugPort = 9330;
const edgeProc = spawn(edgePath, [
  '--headless=new',
  `--remote-debugging-port=${debugPort}`,
  '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_contour',
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
  expression: 'window.extractExactHandPath()',
  awaitPromise: true,
  returnByValue: true
});

const resVal = evalResult.result.value;
console.log('Result:', resVal);
fs.writeFileSync('scratch/exact_hand_path.json', JSON.stringify(resVal, null, 2));

edgeProc.kill();
server.close();
process.exit(0);
