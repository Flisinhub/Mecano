import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9398;
const artifactDir = 'C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43';

async function run() {
  console.log('1. Checking server...');
  try {
    await fetch('http://localhost:3000');
    console.log('Server is running on port 3000.');
  } catch (err) {
    console.error('Server not reachable on port 3000! Start server first.');
    process.exit(1);
  }

  console.log('2. Launching headless Edge (1280x720)...');
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--window-size=1280,720',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_verify_map',
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

    // Dismiss start screen to enter main cockpit
    console.log('3. Dismissing start screen...');
    await evaluate(`
      const startBtn = document.getElementById('start-game-btn');
      if (startBtn) startBtn.click();
      const startScreen = document.getElementById('start-screen');
      if (startScreen) startScreen.classList.add('hidden');
    `);
    await new Promise(r => setTimeout(r, 500));

    // Click on #world-map-btn
    console.log('4. Clicking #world-map-btn to open Adventure Map...');
    const mapOpened = await evaluate(`
      const btn = document.getElementById('world-map-btn');
      if (btn) {
        btn.click();
        true;
      } else {
        false;
      }
    `);
    console.log('Map button clicked:', mapOpened);
    await new Promise(r => setTimeout(r, 800));

    // Verify modal and elements
    const mapStats = await evaluate(`
      (() => {
        const modal = document.getElementById('adventure-map-modal');
        if (!modal) return { error: 'Modal not found in DOM' };
        const isHidden = modal.classList.contains('hidden');
        const title = document.getElementById('map-header-title')?.textContent;
        const tabsCount = document.querySelectorAll('.map-world-tab').length;
        const splinePath = document.querySelector('.map-trail-line')?.getAttribute('d') || '';
        const nodesCount = document.querySelectorAll('.map-node-group').length;
        const miniRoby = document.querySelector('.mario-roby-marker') !== null;
        const courseBadge = document.getElementById('course-badge')?.textContent;
        const courseTitle = document.getElementById('course-title')?.textContent;
        const launchBtnText = document.getElementById('course-launch-btn')?.textContent;

        return {
          isHidden,
          title,
          tabsCount,
          hasSpline: splinePath.length > 20,
          splinePathSample: splinePath.substring(0, 50),
          nodesCount,
          miniRoby,
          courseBadge,
          courseTitle,
          launchBtnText
        };
      })()
    `);
    console.log('Adventure Map Inspection Result:', JSON.stringify(mapStats, null, 2));

    // Capture screenshot of the Overworld Map
    console.log('5. Capturing screenshot: verified_adventure_map_world1.png...');
    const screen1 = await send('Page.captureScreenshot', { format: 'png' });
    const img1Path = path.join(artifactDir, 'verified_adventure_map_world1.png');
    fs.writeFileSync(img1Path, Buffer.from(screen1.data, 'base64'));
    console.log('Saved:', img1Path);

    // Select node 2 (Lesson 1.2)
    console.log('6. Selecting Node 2 (Lesson 1.2)...');
    const selectNode2 = await evaluate(`
      (() => {
        const node2 = document.querySelector('.map-node-group[data-node-id="1.2"]') ||
                     document.querySelectorAll('.map-node-group')[1];
        if (node2) {
          node2.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          return {
            clicked: true,
            id: node2.dataset.nodeId,
            courseBadge: document.getElementById('course-badge')?.textContent,
            courseTitle: document.getElementById('course-title')?.textContent,
            launchBtn: document.getElementById('course-launch-btn')?.textContent
          };
        }
        return { clicked: false };
      })()
    `);
    console.log('Select Node 2 Result:', selectNode2);
    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot with Node 2 selected
    console.log('7. Capturing screenshot: verified_adventure_map_node_selected.png...');
    const screen2 = await send('Page.captureScreenshot', { format: 'png' });
    const img2Path = path.join(artifactDir, 'verified_adventure_map_node_selected.png');
    fs.writeFileSync(img2Path, Buffer.from(screen2.data, 'base64'));
    console.log('Saved:', img2Path);

    // Launch course from map
    console.log('8. Launching course via #course-launch-btn...');
    await evaluate(`
      const launchBtn = document.getElementById('course-launch-btn');
      if (launchBtn) launchBtn.click();
    `);
    await new Promise(r => setTimeout(r, 800));

    // Check main cockpit state
    const gameState = await evaluate(`
      (() => {
        const modal = document.getElementById('adventure-map-modal');
        const isMapHidden = modal ? modal.classList.contains('hidden') : true;
        const levelDisplay = document.getElementById('level')?.textContent;
        const targetWord = document.getElementById('target-word')?.textContent;
        const currentHint = document.getElementById('current-finger-hint')?.textContent;
        return {
          isMapHidden,
          levelDisplay,
          targetWord,
          currentHint
        };
      })()
    `);
    console.log('Game state after launching from map:', gameState);

    // Capture screenshot of the gameplay after launching
    const screen3 = await send('Page.captureScreenshot', { format: 'png' });
    const img3Path = path.join(artifactDir, 'verified_lesson_from_map.png');
    fs.writeFileSync(img3Path, Buffer.from(screen3.data, 'base64'));
    console.log('Saved:', img3Path);

    ws.close();
    edgeProc.kill();
    console.log('SUCCESS: All Adventure Map verification steps completed.');
  } catch (e) {
    console.error('Verification error:', e);
    edgeProc.kill();
    process.exit(1);
  }
}

run();
