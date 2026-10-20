import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9396;

async function run() {
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--window-size=1280,720',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_inspect_dom',
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

    // Click start
    await send('Runtime.evaluate', {
      expression: `document.getElementById('start-game-btn')?.click();`
    });
    await new Promise(r => setTimeout(r, 1000));

    const domInfo = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `
        (() => {
          function rect(id) {
            const el = document.getElementById(id);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            const s = window.getComputedStyle(el);
            return {
              id,
              x: r.x, y: r.y, w: r.width, h: r.height,
              display: s.display,
              position: s.position,
              visibility: s.visibility,
              opacity: s.opacity,
              classes: el.className
            };
          }
          return {
            bridge: rect('mascot-perched-bridge'),
            stage: rect('mascot-stage'),
            avatarWrapper: rect('mascot-avatar-wrapper'),
            portalFrame: rect('hologram-portal-frame'),
            canvas: rect('mascot-canvas'),
            avatarSvg: rect('mascot-avatar-svg'),
            sublessons: rect('sublessons-nav'),
            chassis: rect('cockpit-unified-chassis')
          };
        })()
      `
    });

    console.log('DOM Info:', JSON.stringify(domInfo.result?.value, null, 2));

    ws.close();
    edgeProc.kill();
  } catch (err) {
    console.error('Inspect error:', err);
    edgeProc.kill();
  }
}

run();
