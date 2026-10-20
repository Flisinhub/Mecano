import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Load our actual server.js logic
import { createServer } from '../server.js';

const server = createServer();
await new Promise(r => server.listen(3000, r));
console.log('Dev server running on http://localhost:3000');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9330;
const edgeProc = spawn(edgePath, [
  '--headless=new',
  '--window-size=1280,840',
  `--remote-debugging-port=${port}`,
  '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_test_user_sim',
  'http://localhost:3000'
]);

try {
  await new Promise(r => setTimeout(r, 2000));
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

  const errors = [];
  const logs = [];
  ws.addEventListener('message', (evt) => {
    const d = JSON.parse(evt.data);
    if (d.method === 'Runtime.exceptionThrown') {
      errors.push({ type: 'exception', details: d.params.exceptionDetails });
    }
    if (d.method === 'Log.entryAdded') {
      logs.push(d.params.entry);
    }
    if (d.method === 'Console.messageAdded') {
      logs.push(d.params.message);
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  await new Promise(r => setTimeout(r, 1500));

  console.log('Errors on initial load:', JSON.stringify(errors, null, 2));

  // Now click start adventure button
  console.log('Clicking start button...');
  const clickRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.getElementById('start-game-btn');
        if (!btn) return 'NO_START_BTN';
        btn.click();
        return 'CLICKED';
      })()
    `,
    returnByValue: true
  });
  console.log('Start button click res:', clickRes);

  await new Promise(r => setTimeout(r, 1000));

  console.log('Errors after clicking start:', JSON.stringify(errors, null, 2));

  const postStartDOM = await send('Runtime.evaluate', {
    expression: `
      ({
        startScreenHidden: document.getElementById('start-screen').classList.contains('hidden'),
        startScreenStyleDisplay: window.getComputedStyle(document.getElementById('start-screen')).display,
        currentLevel: document.getElementById('level')?.textContent,
        targetWord: document.getElementById('target-word')?.textContent,
        targetKey: window.app?.gameEngine?.currentTargetKey,
        currentSublesson: window.app?.currentSubLessonId
      })
    `,
    returnByValue: true
  });
  console.log('Post-start DOM state:', JSON.stringify(postStartDOM.value || postStartDOM.result?.value, null, 2));

  ws.close();
} catch (err) {
  console.error('Test error:', err);
} finally {
  edgeProc.kill();
  server.close();
  console.log('Done simulation.');
}
