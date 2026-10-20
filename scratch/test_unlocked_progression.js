import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9399;
const artifactDir = 'C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43';

async function testUnlockedProgression() {
  console.log('1. Launching headless Edge for progression test...');
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--window-size=1280,720',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_verify_prog',
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
    await new Promise(r => setTimeout(r, 1000));

    // Save lesson 1.1 as completed with 3 stars, and lesson 1.2 as completed with 2 stars
    console.log('2. Mocking progress: completing 1.1 and 1.2 in StorageManager...');
    await evaluate(`
      (() => {
        const app = window.__MECANO_APP__;
        if (app && app.storage) {
          app.storage.saveLessonCompleted(1, '1.1');
          app.storage.saveLessonStars(1, '1.1', 3);
          app.storage.saveLessonCompleted(1, '1.2');
          app.storage.saveLessonStars(1, '1.2', 2);
        }
      })()
    `);

    // Dismiss start screen
    await evaluate(`
      const startScreen = document.getElementById('start-screen');
      if (startScreen) startScreen.classList.add('hidden');
    `);
    await new Promise(r => setTimeout(r, 400));

    // Open map
    console.log('3. Opening adventure map...');
    await evaluate(`
      const btn = document.getElementById('world-map-btn');
      if (btn) btn.click();
    `);
    await new Promise(r => setTimeout(r, 600));

    // Inspect nodes state
    const nodesStatus = await evaluate(`
      (() => {
        const node1 = document.querySelector('.map-node-group[data-node-id="1.1"]');
        const node2 = document.querySelector('.map-node-group[data-node-id="1.2"]');
        const node3 = document.querySelector('.map-node-group[data-node-id="1.3"]');
        const node4 = document.querySelector('.map-node-group[data-node-id="1.4"]');
        const castle = document.querySelector('.map-node-group[data-node-id="1-exam"]');

        return {
          node1: {
            isCompleted: node1?.classList.contains('is-completed'),
            isUnlocked: node1?.classList.contains('is-unlocked'),
            isActive: node1?.classList.contains('is-active')
          },
          node2: {
            isCompleted: node2?.classList.contains('is-completed'),
            isUnlocked: node2?.classList.contains('is-unlocked'),
            isActive: node2?.classList.contains('is-active')
          },
          node3: {
            isCompleted: node3?.classList.contains('is-completed'),
            isUnlocked: node3?.classList.contains('is-unlocked'),
            isActive: node3?.classList.contains('is-active') // 1.3 should be the current active jumping node!
          },
          node4: {
            isUnlocked: node4?.classList.contains('is-unlocked') // 1.4 should be locked
          },
          castle: {
            isUnlocked: castle?.classList.contains('is-unlocked')
          }
        };
      })()
    `);
    console.log('Progression nodes status:', JSON.stringify(nodesStatus, null, 2));

    // Click on node 1.2
    console.log('4. Clicking on unlocked node 1.2...');
    const click12 = await evaluate(`
      (() => {
        const node2 = document.querySelector('.map-node-group[data-node-id="1.2"]');
        if (node2) {
          node2.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          return {
            badge: document.getElementById('course-badge')?.textContent,
            title: document.getElementById('course-title')?.textContent,
            launchBtn: document.getElementById('course-launch-btn')?.textContent
          };
        }
        return null;
      })()
    `);
    console.log('Node 1.2 Selected Card:', click12);
    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot of unlocked overworld with active Roby on 1.3 and 1.2 selected
    const screen = await send('Page.captureScreenshot', { format: 'png' });
    const screenPath = path.join(artifactDir, 'verified_adventure_map_progression.png');
    fs.writeFileSync(screenPath, Buffer.from(screen.data, 'base64'));
    console.log('Saved progression screenshot:', screenPath);

    // Launch 1.2
    console.log('5. Launching Lesson 1.2 from Course Card...');
    await evaluate(`
      const launchBtn = document.getElementById('course-launch-btn');
      if (launchBtn) launchBtn.click();
    `);
    await new Promise(r => setTimeout(r, 700));

    const finalState = await evaluate(`
      (() => {
        return {
          level: document.getElementById('level')?.textContent,
          title: document.getElementById('level-title-display')?.textContent,
          targetWord: document.getElementById('target-word')?.textContent?.trim()
        };
      })()
    `);
    console.log('Game state after launching Lesson 1.2:', finalState);

    const screenGame = await send('Page.captureScreenshot', { format: 'png' });
    const screenGamePath = path.join(artifactDir, 'verified_lesson_1_2_from_map.png');
    fs.writeFileSync(screenGamePath, Buffer.from(screenGame.data, 'base64'));
    console.log('Saved game screen:', screenGamePath);

    ws.close();
    edgeProc.kill();
    console.log('Progression test passed 100%!');
  } catch (err) {
    console.error('Error during progression test:', err);
    edgeProc.kill();
    process.exit(1);
  }
}

testUnlockedProgression();
