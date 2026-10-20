import { spawn } from 'child_process';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9396;

async function run() {
  const edge = spawn(edgePath, [
    '--headless=new',
    '--window-size=1280,720',
    '--remote-debugging-port=' + port,
    '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_check_rects',
    'http://localhost:3000'
  ]);
  await new Promise(r => setTimeout(r, 1600));

  try {
    const tabs = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise(res => {
        const cur = id++;
        const fn = evt => {
          const d = JSON.parse(evt.data);
          if (d.id === cur) {
            ws.removeEventListener('message', fn);
            res(d.result || d);
          }
        };
        ws.addEventListener('message', fn);
        ws.send(JSON.stringify({ id: cur, method, params }));
      });
    }

    await send('Runtime.evaluate', { expression: `document.getElementById('start-game-btn')?.click();` });
    await new Promise(r => setTimeout(r, 800));

    await send('Runtime.evaluate', {
      expression: `
        // Fix header wrap
        const h = document.getElementById('top-game-header');
        h.style.setProperty('flex-wrap', 'nowrap', 'important');

        // Chassis unified layout
        const c = document.getElementById('cockpit-unified-chassis');
        c.style.setProperty('justify-content', 'flex-start', 'important');

        const oled = document.getElementById('play-area');
        oled.style.setProperty('flex', '1 1 auto', 'important');
        oled.style.setProperty('min-height', '110px', 'important');
        oled.style.setProperty('max-height', 'none', 'important');

        const ld = document.getElementById('finger-guide-bar');
        ld.style.setProperty('flex', '0 0 auto', 'important');
        ld.style.setProperty('padding', '12px 24px 16px 24px', 'important');
      `
    });
    await new Promise(r => setTimeout(r, 400));

    const info = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `
        (() => {
          const getRect = sel => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
              top: Math.round(r.top),
              bottom: Math.round(r.bottom),
              height: Math.round(r.height),
              width: Math.round(r.width),
              left: Math.round(r.left),
              right: Math.round(r.right)
            };
          };

          return {
            windowInner: { width: window.innerWidth, height: window.innerHeight },
            bodyScrollHeight: document.body.scrollHeight,
            cockpit: getRect('#mecano-cockpit'),
            oledSlot: getRect('#play-area'),
            targetWord: getRect('#target-word'),
            lowerDeck: getRect('#finger-guide-bar'),
            kbWrapper: getRect('.keyboard-center-wrapper'),
            fingerHint: getRect('#current-finger-hint'),
            keyboard: getRect('#keyboard'),
            handLeft: getRect('#hand-card-left'),
            handRight: getRect('#hand-card-right'),
            targetWordHeight: document.getElementById('target-word')?.offsetHeight,
            oledHeight: document.getElementById('play-area')?.offsetHeight,
            lowerDeckHeight: document.getElementById('finger-guide-bar')?.offsetHeight
          };
        })()
      `
    });

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\test_preview_1280.png', Buffer.from(shot.data, 'base64'));

    console.log('REFINED TEST:', JSON.stringify(info.result?.value, null, 2));

    ws.close();
    edge.kill();
  } catch (err) {
    console.error('Error:', err);
    edge.kill();
  }
}

run();
