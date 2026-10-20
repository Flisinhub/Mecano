import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9392;
const mascotDir = path.resolve('assets/mascot');
const backupDir = path.resolve('assets/mascot/raw_backup');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const files = [
  'mascot_idle.png',
  'mascot_speaking.png',
  'mascot_streak.png',
  'mascot_error.png'
];

async function main() {
  console.log('1. Backing up original images...');
  for (const f of files) {
    const src = path.join(mascotDir, f);
    const dest = path.join(backupDir, f);
    if (!fs.existsSync(dest) && fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }

  console.log('2. Launching headless Edge for Canvas RGBA processing...');
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--window-size=1280,1024',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_mascot_alpha',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1800));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const tabs = await listRes.json();
    const tab = tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
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

    await send('Runtime.enable');
    await send('Page.enable');

    for (const f of files) {
      console.log(`Processing ${f}...`);
      const imgPath = path.join(backupDir, f);
      const imgBase64 = fs.readFileSync(imgPath).toString('base64');
      const dataUri = `data:image/jpeg;base64,${imgBase64}`;

      const evalRes = await send('Runtime.evaluate', {
        awaitPromise: true,
        returnByValue: true,
        expression: `
          (new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const w = img.naturalWidth || img.width;
              const h = img.naturalHeight || img.height;
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);

              const imgData = ctx.getImageData(0, 0, w, h);
              const data = imgData.data;

              // Sample 4 corners
              const corners = [
                [0, 0],
                [w - 1, 0],
                [0, h - 1],
                [w - 1, h - 1],
                [Math.floor(w / 2), 0],
                [0, Math.floor(h / 2)],
                [w - 1, Math.floor(h / 2)]
              ];

              let sumR = 0, sumG = 0, sumB = 0, count = 0;
              for (const [cx, cy] of corners) {
                const idx = (cy * w + cx) * 4;
                sumR += data[idx];
                sumG += data[idx + 1];
                sumB += data[idx + 2];
                count++;
              }
              const bgR = sumR / count;
              const bgG = sumG / count;
              const bgB = sumB / count;

              function colorDist(r, g, b, cr, cg, cb) {
                const dr = r - cr;
                const dg = g - cg;
                const db = b - cb;
                return Math.sqrt(dr * dr + dg * dg + db * db);
              }

              // Flood fill queue
              const visited = new Uint8Array(w * h);
              const isBg = new Uint8Array(w * h);
              const queueX = new Int32Array(w * h);
              const queueY = new Int32Array(w * h);
              let qHead = 0;
              let qTail = 0;

              // Enqueue all perimeter pixels if they match background
              // This handles top, bottom, left, right borders seamlessly
              const tolerance = 42;

              for (let x = 0; x < w; x++) {
                // Top border
                let idx0 = x * 4;
                if (colorDist(data[idx0], data[idx0 + 1], data[idx0 + 2], bgR, bgG, bgB) <= tolerance + 15) {
                  visited[x] = 1;
                  isBg[x] = 1;
                  queueX[qTail] = x;
                  queueY[qTail] = 0;
                  qTail++;
                }
                // Bottom border
                let idxB = ((h - 1) * w + x) * 4;
                if (colorDist(data[idxB], data[idxB + 1], data[idxB + 2], bgR, bgG, bgB) <= tolerance + 15) {
                  let pIdx = (h - 1) * w + x;
                  visited[pIdx] = 1;
                  isBg[pIdx] = 1;
                  queueX[qTail] = x;
                  queueY[qTail] = h - 1;
                  qTail++;
                }
              }

              for (let y = 1; y < h - 1; y++) {
                // Left border
                let idxL = (y * w) * 4;
                if (colorDist(data[idxL], data[idxL + 1], data[idxL + 2], bgR, bgG, bgB) <= tolerance + 15) {
                  let pIdx = y * w;
                  if (!visited[pIdx]) {
                    visited[pIdx] = 1;
                    isBg[pIdx] = 1;
                    queueX[qTail] = 0;
                    queueY[qTail] = y;
                    qTail++;
                  }
                }
                // Right border
                let idxR = (y * w + (w - 1)) * 4;
                if (colorDist(data[idxR], data[idxR + 1], data[idxR + 2], bgR, bgG, bgB) <= tolerance + 15) {
                  let pIdx = y * w + (w - 1);
                  if (!visited[pIdx]) {
                    visited[pIdx] = 1;
                    isBg[pIdx] = 1;
                    queueX[qTail] = w - 1;
                    queueY[qTail] = y;
                    qTail++;
                  }
                }
              }

              while (qHead < qTail) {
                const cx = queueX[qHead];
                const cy = queueY[qHead];
                qHead++;

                const neighbors = [
                  [cx + 1, cy],
                  [cx - 1, cy],
                  [cx, cy + 1],
                  [cx, cy - 1]
                ];

                for (let i = 0; i < 4; i++) {
                  const nx = neighbors[i][0];
                  const ny = neighbors[i][1];
                  if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    const nIdx = ny * w + nx;
                    if (!visited[nIdx]) {
                      visited[nIdx] = 1;
                      const dIdx = nIdx * 4;
                      const d = colorDist(data[dIdx], data[dIdx + 1], data[dIdx + 2], bgR, bgG, bgB);
                      if (d <= tolerance) {
                        isBg[nIdx] = 1;
                        queueX[qTail] = nx;
                        queueY[qTail] = ny;
                        qTail++;
                      }
                    }
                  }
                }
              }

              // Soft feathering on background boundary
              for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                  const pIdx = y * w + x;
                  const dIdx = pIdx * 4;

                  if (isBg[pIdx]) {
                    data[dIdx + 3] = 0; // Completely transparent
                  } else {
                    // Check if adjacent to background
                    let hasBgNeighbor = false;
                    for (let dy = -1; dy <= 1; dy++) {
                      for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                          if (isBg[ny * w + nx]) {
                            hasBgNeighbor = true;
                            break;
                          }
                        }
                      }
                      if (hasBgNeighbor) break;
                    }

                    if (hasBgNeighbor) {
                      const d = colorDist(data[dIdx], data[dIdx + 1], data[dIdx + 2], bgR, bgG, bgB);
                      if (d < tolerance + 25) {
                        // Feather alpha smoothly
                        const alphaRatio = Math.max(0.0, Math.min(1.0, (d - tolerance) / 25));
                        data[dIdx + 3] = Math.round(255 * alphaRatio);
                      }
                    }
                  }
                }
              }

              ctx.putImageData(imgData, 0, 0);
              resolve({
                width: w,
                height: h,
                dataUrl: canvas.toDataURL('image/png')
              });
            };
            img.onerror = reject;
            img.src = '${dataUri}';
          }))
        `
      });

      if (evalRes && evalRes.result && evalRes.result.value) {
        const { width, height, dataUrl } = evalRes.result.value;
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        const outPath = path.join(mascotDir, f);
        fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
        console.log(`  ✓ Converted ${f} (${width}x${height}) to true 32-bit RGBA transparent PNG.`);
      } else {
        console.error(`  ✗ Error evaluating image ${f}:`, evalRes);
      }
    }

    ws.close();
    edgeProc.kill();
    console.log('All 4 mascot sprites successfully converted to transparent PNG!');
  } catch (err) {
    console.error('Fatal error:', err);
    edgeProc.kill();
  }
}

main();
