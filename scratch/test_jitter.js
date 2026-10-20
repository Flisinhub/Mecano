import { spawn } from 'child_process';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9406;

async function testJitter() {
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--window-size=1280,720',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_jitter2',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 1800));

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

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (res && res.result) return res.result.value;
      return null;
    }

    await send('Runtime.enable');
    await send('Page.enable');
    await new Promise(r => setTimeout(r, 800));

    // Open map
    await evaluate(`
      const startScreen = document.getElementById('start-screen');
      if (startScreen) startScreen.classList.add('hidden');
      const btn = document.getElementById('world-map-btn');
      if (btn) btn.click();
    `);
    await new Promise(r => setTimeout(r, 600));

    // Test real dispatch of mousemove directly over node 1.1 center
    const hoverTest = await evaluate(`
      (() => {
        const node = document.querySelector('.map-node-group[data-node-id="1.1"]');
        const rect1 = node.getBoundingClientRect();
        const clientX = rect1.left + rect1.width / 2;
        const clientY = rect1.top + rect1.height / 2;

        // Apply scale(1.16) to see rect shift
        node.style.transform = 'scale(1.16)';
        const rectAfter = node.getBoundingClientRect();

        return {
          originalRect: { left: rect1.left, top: rect1.top, width: rect1.width, height: rect1.height },
          scaledRect: { left: rectAfter.left, top: rectAfter.top, width: rectAfter.width, height: rectAfter.height },
          deltaX: rectAfter.left - rect1.left,
          deltaY: rectAfter.top - rect1.top
        };
      })()
    `);
    console.log('Hover Scale Rect Shift Result:', JSON.stringify(hoverTest, null, 2));

    ws.close();
    edgeProc.kill();
  } catch (err) {
    console.error(err);
    edgeProc.kill();
  }
}

testJitter();
