import { spawn } from 'child_process';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9410;

async function testProductionHover() {
  console.log('Testing production hover stability on node 1.1...');
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--window-size=1280,720',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_prod_hover',
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

    // Complete 1.1 so it becomes a gold coin
    await evaluate(`
      (() => {
        const app = window.__MECANO_APP__;
        if (app && app.storage) {
          app.storage.saveLessonCompleted(1, '1.1');
          app.storage.saveLessonStars(1, '1.1', 3);
        }
      })()
    `);

    // Open map
    await evaluate(`
      const startScreen = document.getElementById('start-screen');
      if (startScreen) startScreen.classList.add('hidden');
      const btn = document.getElementById('world-map-btn');
      if (btn) btn.click();
    `);
    await new Promise(r => setTimeout(r, 600));

    // Get center of yellow gold coin node 1.1
    const coords = await evaluate(`
      (() => {
        const node = document.querySelector('.map-node-group[data-node-id="1.1"]');
        const rect = node.getBoundingClientRect();
        return {
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2)
        };
      })()
    `);
    console.log('Node 1.1 position:', coords);

    // Track mouse events
    await evaluate(`
      (() => {
        window.__events = [];
        const node = document.querySelector('.map-node-group[data-node-id="1.1"]');
        node.addEventListener('mouseenter', () => window.__events.push('mouseenter'));
        node.addEventListener('mouseleave', () => window.__events.push('mouseleave'));
        node.addEventListener('mouseover', () => window.__events.push('mouseover'));
        node.addEventListener('mouseout', () => window.__events.push('mouseout'));
      })()
    `);

    // Dispatch mouseMoved to node 1.1
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: coords.x,
      y: coords.y
    });

    // Wait 2 full seconds while hovering
    await new Promise(r => setTimeout(r, 2000));

    const events = await evaluate(`window.__events`);
    console.log('Production Events count during 2 seconds hover:', events.length);
    console.log('Events:', events);

    // Also check that clicking selects node and updates course card
    const clickResult = await evaluate(`
      (() => {
        const node = document.querySelector('.map-node-group[data-node-id="1.1"]');
        node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return {
          badge: document.getElementById('course-badge')?.textContent,
          title: document.getElementById('course-title')?.textContent,
          launchBtn: document.getElementById('course-launch-btn')?.textContent
        };
      })()
    `);
    console.log('Click result on yellow coin 1.1:', clickResult);

    ws.close();
    edgeProc.kill();
  } catch (err) {
    console.error(err);
    edgeProc.kill();
  }
}

testProductionHover();
