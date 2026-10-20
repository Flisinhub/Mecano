import { spawn } from 'child_process';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9366;
const edgeProc = spawn(edgePath, [
  '--headless=new',
  '--window-size=1024,648',
  '--remote-debugging-port=' + port,
  '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_res_verify',
  'http://localhost:3000'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:' + port + '/json/list');
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

    await new Promise(r => setTimeout(r, 1200));

    // Click Start Game
    await send('Runtime.evaluate', {
      expression: `
        const btn = document.getElementById('start-game-btn');
        if (btn) btn.click();
      `
    });

    await new Promise(r => setTimeout(r, 1000));

    // Measure key vertical coordinates
    const measurements = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const winH = window.innerHeight;
          const winW = window.innerWidth;
          const cockpit = document.getElementById('mecano-cockpit');
          const bridge = document.querySelector('.cockpit-command-bridge');
          const keyboard = document.getElementById('keyboard');
          const spacebar = document.querySelector('.key[data-key=" "]');
          const handLeft = document.getElementById('hand-card-left');
          const handRight = document.getElementById('hand-card-right');
          const cRect = cockpit?.getBoundingClientRect();
          const bRect = bridge?.getBoundingClientRect();
          const kRect = keyboard?.getBoundingClientRect();
          const sRect = spacebar?.getBoundingClientRect();
          const hlRect = handLeft?.getBoundingClientRect();
          const hrRect = handRight?.getBoundingClientRect();

          return {
            window: { width: winW, height: winH },
            cockpit: cRect ? { top: cRect.top, bottom: cRect.bottom, height: cRect.height } : null,
            bridge: bRect ? { height: bRect.height } : null,
            keyboard: kRect ? { top: kRect.top, bottom: kRect.bottom, height: kRect.height } : null,
            spacebar: sRect ? { top: sRect.top, bottom: sRect.bottom, isVisible: sRect.bottom <= winH } : null,
            hands: {
              leftBottom: hlRect?.bottom,
              rightBottom: hrRect?.bottom,
              handsVisible: hlRect && hlRect.bottom <= winH
            }
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Measurements on 1024x648:', JSON.stringify(measurements.value || measurements.result?.value, null, 2));

    // Capture Full Screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const data = shot.data || shot.result?.data;
    if (data) {
      fs.writeFileSync('C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\cockpit_1024x648_fixed.png', Buffer.from(data, 'base64'));
      console.log('Saved screenshot: cockpit_1024x648_fixed.png');
    }

    ws.close();
  } catch (e) {
    console.error('Error during verification:', e);
  } finally {
    edgeProc.kill();
    console.log('Finished 1024x648 verification.');
  }
}, 2000);
