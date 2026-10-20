import { spawn } from 'child_process';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

let nextPort = 9380;
async function testRes(w, h, name) {
  const port = nextPort++;
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    `--window-size=${w},${h}`,
    `--remote-debugging-port=${port}`,
    `--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_res_${w}_${h}`,
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 1500));
  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const tabs = await listRes.json();
    const targetTab = tabs.find(t => t.url.includes('localhost:3000')) || tabs[0];
    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
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
    await new Promise(r => setTimeout(r, 800));

    await send('Runtime.evaluate', {
      expression: `document.getElementById('start-game-btn')?.click();`
    });

    await new Promise(r => setTimeout(r, 1000));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const data = shot.data || shot.result?.data;
    if (data) {
      const outPath = `C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\${name}.png`;
      fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
      console.log(`Saved screenshot ${name}.png`);
    }
    ws.close();
  } catch (e) {
    console.error(`Error on ${w}x${h}:`, e);
  } finally {
    edgeProc.kill();
  }
}

async function main() {
  await testRes(1024, 648, 'cockpit_1024x648');
  await testRes(1280, 720, 'cockpit_1280x720');
  await testRes(1366, 768, 'cockpit_1366x768');
  await testRes(1920, 1080, 'cockpit_1920x1080');
  console.log('Done testing all 4 resolutions.');
}

main();
