import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9394;
const artifactDir = 'C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43';

async function run() {
  console.log('1. Starting dev server in background if needed...');
  // Check if server is running
  let serverProc = null;
  try {
    const res = await fetch('http://localhost:3000');
    console.log('Server already running on port 3000.');
  } catch (err) {
    console.log('Starting server.js...');
    serverProc = spawn('node', ['server.js'], { stdio: 'inherit' });
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log('2. Launching headless Edge (1280x720)...');
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--window-size=1280,720',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_verify_zerodiv',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 1600));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('localhost:3000')) || tabs[0];
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
    await new Promise(r => setTimeout(r, 800));

    // 1. Click Start Game to enter lesson
    await send('Runtime.evaluate', {
      expression: `document.getElementById('start-game-btn')?.click();`
    });
    await new Promise(r => setTimeout(r, 1000));

    // 2. Measure layout boxes and verify zero-div look
    const layoutEval = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `
        (() => {
          const mascotStage = document.getElementById('mascot-stage');
          const unifiedChassis = document.getElementById('cockpit-unified-chassis');
          const oledSlot = document.getElementById('play-area');
          const keyboardTray = document.getElementById('finger-guide-bar');
          const canvas = document.getElementById('mascot-canvas');

          const sStyle = window.getComputedStyle(mascotStage);
          const cStyle = window.getComputedStyle(unifiedChassis);
          const oStyle = window.getComputedStyle(oledSlot);
          const kStyle = window.getComputedStyle(keyboardTray);

          return {
            mascotBg: sStyle.backgroundColor,
            mascotBorder: sStyle.border,
            mascotBoxShadow: sStyle.boxShadow,
            chassisBorder: cStyle.border,
            chassisRadius: cStyle.borderRadius,
            chassisBg: cStyle.backgroundColor,
            oledBorderBottom: oStyle.borderBottom,
            oledSlotTop: oledSlot.getBoundingClientRect().top,
            oledSlotBottom: oledSlot.getBoundingClientRect().bottom,
            keyboardTrayTop: keyboardTray.getBoundingClientRect().top,
            gapBetweenOledAndKeyboard: keyboardTray.getBoundingClientRect().top - oledSlot.getBoundingClientRect().bottom,
            canvasDisplay: window.getComputedStyle(canvas).display,
            hasCanvasClass: document.getElementById('hologram-portal-frame')?.classList.contains('has-canvas')
          };
        })()
      `
    });

    console.log('Layout evaluation:', layoutEval.result?.value);

    // 3. Capture full cockpit screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(artifactDir, 'cockpit_zero_div_unified.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log('✓ Captured screenshot at:', shotPath);

    // 4. Test error emotion visual
    await send('Runtime.evaluate', {
      expression: `
        const app = window.app || window.__MECANO_APP__;
        if (app && app.mascotController) {
          app.mascotController.setEmotion('error', 4000);
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));
    const shotError = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'cockpit_mascot_error_state.png'), Buffer.from(shotError.data, 'base64'));
    console.log('✓ Captured error state screenshot');

    // 5. Test streak emotion visual
    await send('Runtime.evaluate', {
      expression: `
        const app = window.app || window.__MECANO_APP__;
        if (app && app.mascotController) {
          app.mascotController.setEmotion('streak', 4000);
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));
    const shotStreak = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'cockpit_mascot_streak_state.png'), Buffer.from(shotStreak.data, 'base64'));
    console.log('✓ Captured streak state screenshot');

    ws.close();
    edgeProc.kill();
    if (serverProc) serverProc.kill();
  } catch (err) {
    console.error('Error during verification:', err);
    edgeProc.kill();
    if (serverProc) serverProc.kill();
  }
}

run();
