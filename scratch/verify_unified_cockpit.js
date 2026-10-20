import { spawn } from 'child_process';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9355;
const edgeProc = spawn(edgePath, [
  '--headless=new',
  '--window-size=1280,840',
  '--remote-debugging-port=' + port,
  '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_cockpit_verify',
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

    const errors = [];
    const logs = [];
    ws.addEventListener('message', (evt) => {
      const d = JSON.parse(evt.data);
      if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails);
      if (d.method === 'Log.entryAdded') logs.push(d.params.entry);
      if (d.method === 'Console.messageAdded' && d.params.message.level === 'error') {
        errors.push(d.params.message);
      }
    });

    await send('Runtime.enable');
    await send('Console.enable');
    await send('Page.enable');

    await new Promise(r => setTimeout(r, 1500));

    // Capture Screenshot 1: Start Screen with Mission Map
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const data1 = shot1.data || shot1.result?.data;
    if (data1) {
      fs.writeFileSync('C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\cockpit_start_screen.png', Buffer.from(data1, 'base64'));
      console.log('Saved screenshot 1: cockpit_start_screen.png');
    }

    // Inspect DOM on initial load
    const startState = await send('Runtime.evaluate', {
      expression: `
        ({
          hasCockpit: Boolean(document.getElementById('mecano-cockpit')),
          hasBacklight: Boolean(document.getElementById('cockpit-ambient-backlight')),
          hasCanvas: Boolean(document.getElementById('mascot-canvas')),
          hasPortal: Boolean(document.getElementById('hologram-portal-frame')),
          cockpitRect: document.getElementById('mecano-cockpit')?.getBoundingClientRect(),
          windowHeight: window.innerHeight,
          cockpitHeightRatio: document.getElementById('mecano-cockpit') ? (document.getElementById('mecano-cockpit').getBoundingClientRect().height / window.innerHeight).toFixed(2) : null
        })
      `,
      returnByValue: true
    });
    console.log('Start State:', JSON.stringify(startState.value || startState.result?.value, null, 2));

    // Click Start Game Button
    await send('Runtime.evaluate', {
      expression: `
        const btn = document.getElementById('start-game-btn');
        if (btn) btn.click();
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    // Inspect Gameplay State & Active Backlight
    const gameplayState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cockpit = document.getElementById('mecano-cockpit');
          const backlight = document.getElementById('cockpit-ambient-backlight');
          const targetWord = document.getElementById('target-word')?.textContent;
          const activeKey = window.app?.gameEngine?.currentTargetKey;
          const activeColor = backlight ? window.getComputedStyle(backlight).getPropertyValue('--active-finger-color') : null;
          const has3DSpritesLoaded = Boolean(window.app?.mascotController?._spritesLoaded);
          const portalHasCanvasClass = document.getElementById('hologram-portal-frame')?.classList.contains('has-canvas');

          return {
            targetWord,
            activeKey,
            activeColor,
            has3DSpritesLoaded,
            portalHasCanvasClass,
            cockpitHeight: cockpit ? cockpit.getBoundingClientRect().height : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Gameplay State:', JSON.stringify(gameplayState.value || gameplayState.result?.value, null, 2));

    // Capture Screenshot 2: Gameplay in Unified Cockpit
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const data2 = shot2.data || shot2.result?.data;
    if (data2) {
      fs.writeFileSync('C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\cockpit_gameplay.png', Buffer.from(data2, 'base64'));
      console.log('Saved screenshot 2: cockpit_gameplay.png');
    }

    // Trigger streak celebration emotion immediately before shot 3
    const streakRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (window.app?.mascotController) {
            window.app.mascotController.setEmotion('streak', 4000);
            return {
              emotion: window.app.mascotController.emotion,
              sprites: Object.keys(window.app.mascotController.sprites),
              streakLoaded: Boolean(window.app.mascotController.sprites.streak && window.app.mascotController.sprites.streak.complete)
            };
          }
          return null;
        })()
      `,
      returnByValue: true
    });
    console.log('Streak Eval Result:', JSON.stringify(streakRes.value || streakRes.result?.value, null, 2));
    await new Promise(r => setTimeout(r, 120));

    // Capture Screenshot 3: Roby Streak Celebration
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    const data3 = shot3.data || shot3.result?.data;
    if (data3) {
      fs.writeFileSync('C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\cockpit_roby_streak.png', Buffer.from(data3, 'base64'));
      console.log('Saved screenshot 3: cockpit_roby_streak.png');
    }

    console.log('Errors caught during run:', errors.length);
    if (errors.length > 0) {
      console.log('Errors details:', JSON.stringify(errors, null, 2));
    }

    ws.close();
  } catch(e) {
    console.error('Test script error:', e);
  } finally {
    edgeProc.kill();
    console.log('Verification script complete.');
  }
}, 2200);
