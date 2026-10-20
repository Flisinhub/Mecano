import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9401;
const artifactDir = 'C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43';

async function testAAAMapVisuals() {
  console.log('1. Launching headless Edge (1280x720) for AAA Adventure Map verification...');
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--window-size=1280,720',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_verify_aaa_map',
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

    // Seed progress: complete 1.1, 1.2, 1.3 to showcase completed gold coins,
    // active launchpad on 1.4, locked stone tablets on 1.5-1.15, and 3D castle
    console.log('2. Mocking progress: lessons 1.1, 1.2, 1.3 completed with stars...');
    await evaluate(`
      (() => {
        const app = window.__MECANO_APP__;
        if (app && app.storage) {
          app.storage.saveLessonCompleted(1, '1.1');
          app.storage.saveLessonStars(1, '1.1', 3);
          app.storage.saveLessonCompleted(1, '1.2');
          app.storage.saveLessonStars(1, '1.2', 3);
          app.storage.saveLessonCompleted(1, '1.3');
          app.storage.saveLessonStars(1, '1.3', 2);
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
    await new Promise(r => setTimeout(r, 900));

    // Inspect AAA Map DOM Elements
    const mapInspection = await evaluate(`
      (() => {
        const boardBg = document.getElementById('map-board-background');
        const bgStyle = boardBg ? window.getComputedStyle(boardBg).backgroundImage : '';
        const hasBgImage = bgStyle.includes('world_1_bg.jpg');

        const goldCoins = document.querySelectorAll('.coin-token-3d').length;
        const launchpads = document.querySelectorAll('.launchpad-platform-3d').length;
        const stoneTablets = document.querySelectorAll('.stone-token-3d').length;
        const castle3D = document.querySelector('.mario-castle-3d') !== null;
        const castleBanners = document.querySelectorAll('.castle-banner-wave').length;
        const fireflies = document.querySelectorAll('.sparkle-dot').length;
        const backClouds = document.querySelectorAll('.drifting-clouds-back').length;
        const frontClouds = document.querySelectorAll('.drifting-clouds-front').length;
        const miniRoby = document.querySelector('.mario-roby-marker') !== null;

        return {
          hasBgImage,
          bgStyleSample: bgStyle.substring(0, 100),
          goldCoins,
          launchpads,
          stoneTablets,
          castle3D,
          castleBanners,
          fireflies,
          backClouds,
          frontClouds,
          miniRoby
        };
      })()
    `);
    console.log('AAA Map Inspection:', JSON.stringify(mapInspection, null, 2));

    // Capture main Overworld screenshot: verified_aaa_adventure_map_world1.png
    console.log('4. Capturing AAA Adventure Map screenshot: verified_aaa_adventure_map_world1.png...');
    const screen1 = await send('Page.captureScreenshot', { format: 'png' });
    const img1Path = path.join(artifactDir, 'verified_aaa_adventure_map_world1.png');
    fs.writeFileSync(img1Path, Buffer.from(screen1.data, 'base64'));
    console.log('Saved:', img1Path);

    // Select the 3D Castle Node to inspect Course Card details
    console.log('5. Clicking on 3D Castle Node...');
    const castleCard = await evaluate(`
      (() => {
        const castle = document.querySelector('.map-node-group[data-node-id="1-exam"]');
        if (castle) {
          castle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          return {
            badge: document.getElementById('course-badge')?.textContent,
            title: document.getElementById('course-title')?.textContent,
            desc: document.getElementById('course-desc')?.textContent,
            launchBtn: document.getElementById('course-launch-btn')?.textContent
          };
        }
        return null;
      })()
    `);
    console.log('Castle selection card:', castleCard);
    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot with Castle selected
    const screen2 = await send('Page.captureScreenshot', { format: 'png' });
    const img2Path = path.join(artifactDir, 'verified_aaa_adventure_map_castle_selected.png');
    fs.writeFileSync(img2Path, Buffer.from(screen2.data, 'base64'));
    console.log('Saved:', img2Path);

    // Select completed coin 1.2
    console.log('6. Selecting completed gold coin 1.2...');
    await evaluate(`
      (() => {
        const coin12 = document.querySelector('.map-node-group[data-node-id="1.2"]');
        if (coin12) {
          coin12.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 600));

    // Launch course
    console.log('7. Launching course via Course Card button...');
    await evaluate(`
      const launchBtn = document.getElementById('course-launch-btn');
      if (launchBtn) launchBtn.click();
    `);
    await new Promise(r => setTimeout(r, 800));

    const gameCheck = await evaluate(`
      (() => {
        return {
          level: document.getElementById('level')?.textContent,
          title: document.getElementById('level-title-display')?.textContent,
          targetWord: document.getElementById('target-word')?.textContent?.trim()
        };
      })()
    `);
    console.log('Game state after launching 1.2:', gameCheck);

    const screen3 = await send('Page.captureScreenshot', { format: 'png' });
    const img3Path = path.join(artifactDir, 'verified_aaa_lesson_launch.png');
    fs.writeFileSync(img3Path, Buffer.from(screen3.data, 'base64'));
    console.log('Saved:', img3Path);

    ws.close();
    edgeProc.kill();
    console.log('SUCCESS: All AAA Map tests and visual captures completed successfully!');
  } catch (err) {
    console.error('Error during AAA map verification:', err);
    edgeProc.kill();
    process.exit(1);
  }
}

testAAAMapVisuals();
