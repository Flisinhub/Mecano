import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import path from 'path';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join('c:\\mecano\\Mecano-main\\Mecano-main', reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + reqPath);
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

await new Promise(r => server.listen(8091, r));
console.log('HTTP test server running on http://localhost:8091');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9317;
const edgeProc = spawn(edgePath, [
  '--headless=new',
  '--window-size=1280,840',
  `--remote-debugging-port=${port}`,
  '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_verify_clean',
  'http://localhost:8091/index.html'
]);

try {
  await new Promise(r => setTimeout(r, 2200));

  const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
  const tabs = await listRes.json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
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

  await send('Console.enable');
  await send('Runtime.enable');

  // 1. Clear any zoom in localStorage to test standard baseline
  await send('Runtime.evaluate', {
    expression: `
      localStorage.removeItem('mecano_text_zoom');
      document.body.removeAttribute('data-text-scale');
    `
  });

  // 2. Start game
  await send('Runtime.evaluate', {
    expression: `
      const btn = document.getElementById('start-game-btn');
      if (btn) btn.click();
    `
  });
  await new Promise(r => setTimeout(r, 800));

  // 3. Inspect DOM elements: badge, mascot stage overflow, header, uppercase text
  const domCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const wordBadge = document.getElementById('word-visual-badge');
        const mascotStage = document.getElementById('mascot-stage');
        const stageRect = mascotStage ? mascotStage.getBoundingClientRect() : null;
        const tipEl = document.getElementById('mascot-lesson-tip');
        const tipRect = tipEl ? tipEl.getBoundingClientRect() : null;
        const avatarEl = document.getElementById('mascot-avatar');
        const avatarRect = avatarEl ? avatarEl.getBoundingClientRect() : null;
        const bubbleEl = document.querySelector('.mascot-bubble');
        const bubbleRect = bubbleEl ? bubbleEl.getBoundingClientRect() : null;
        const targetWord = document.getElementById('target-word')?.textContent || '';
        const currentTargetKey = window.app?.gameEngine?.currentTargetKey;
        const activeFingers = Array.from(document.querySelectorAll('.is-active-finger')).map(el => el.id);

        const toolsDrawerBtn = document.getElementById('tools-drawer-toggle');
        const toolsDrawerPopover = document.querySelector('.tools-drawer-popover');

        const topHeader = document.getElementById('top-game-header');
        const headerPills = Array.from(topHeader?.querySelectorAll('.header-stat-pill') || []).map(p => p.textContent.trim());

        return {
          wordBadgeExists: Boolean(wordBadge),
          targetWord,
          currentTargetKey,
          activeFingers,
          stageRect: stageRect ? { top: stageRect.top, bottom: stageRect.bottom, height: stageRect.height } : null,
          tipRect: tipRect ? { top: tipRect.top, bottom: tipRect.bottom, height: tipRect.height } : null,
          avatarRect: avatarRect ? { top: avatarRect.top, bottom: avatarRect.bottom, height: avatarRect.height } : null,
          bubbleRect: bubbleRect ? { top: bubbleRect.top, bottom: bubbleRect.bottom, height: bubbleRect.height } : null,
          hasToolsDrawerBtn: Boolean(toolsDrawerBtn),
          hasToolsPopover: Boolean(toolsDrawerPopover),
          headerPills
        };
      })()
    `,
    returnByValue: true
  });
  console.log('DOM Check Baseline:', JSON.stringify(domCheck.value || domCheck.result?.value, null, 2));

  // Take screenshot 1: Baseline gameplay with uppercase and compact header
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  const data1 = shot1.data || (shot1.result && shot1.result.data);
  const shot1Path = 'C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\phase5_gameplay_baseline.png';
  if (data1) fs.writeFileSync(shot1Path, Buffer.from(data1, 'base64'));
  console.log('Saved baseline gameplay screenshot:', shot1Path);

  // 4. Test pressing lowercase 'f' key on physical keyboard
  const keyPressResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const initialCombo = window.app?.gameEngine?.combo || 0;
        const evt = new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', bubbles: true });
        window.dispatchEvent(evt);
        return {
          afterCombo: window.app?.gameEngine?.combo,
          currentTargetKey: window.app?.gameEngine?.currentTargetKey,
          activeFingers: Array.from(document.querySelectorAll('.is-active-finger')).map(el => el.id)
        };
      })()
    `,
    returnByValue: true
  });
  console.log('KeyPress "f" Result:', JSON.stringify(keyPressResult.value || keyPressResult.result?.value, null, 2));

  // 5. Test Tools Drawer Toggle click
  const drawerClick = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const toggle = document.getElementById('tools-drawer-toggle');
        if (toggle) toggle.click();
        const drawer = document.querySelector('.header-tools-drawer');
        return {
          drawerIsOpen: drawer?.classList.contains('is-open')
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Drawer Click Result:', JSON.stringify(drawerClick.value || drawerClick.result?.value, null, 2));

  // Screenshot with drawer open
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  const data2 = shot2.data || (shot2.result && shot2.result.data);
  const shot2Path = 'C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\phase5_tools_drawer_open.png';
  if (data2) fs.writeFileSync(shot2Path, Buffer.from(data2, 'base64'));
  console.log('Saved tools drawer screenshot:', shot2Path);

  ws.close();
} catch (err) {
  console.error('CDP verification error:', err);
} finally {
  edgeProc.kill();
  server.close();
  console.log('Verification finished cleanly.');
}
