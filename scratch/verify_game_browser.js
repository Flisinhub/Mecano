import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import path from 'path';

// 1. Simple static HTTP server to serve the game cleanly
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

await new Promise(r => server.listen(8089, r));
console.log('HTTP test server running on http://localhost:8089');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9315;
const edgeProc = spawn(edgePath, [
  '--headless=new',
  '--window-size=1280,820',
  `--remote-debugging-port=${port}`,
  '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_verify',
  'http://localhost:8089/index.html'
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

  // Check console messages
  const consoleMessages = [];
  ws.addEventListener('message', (evt) => {
    const d = JSON.parse(evt.data);
    if (d.method === 'Console.messageAdded') {
      consoleMessages.push(d.params.message);
    }
  });
  await send('Console.enable');
  await send('Runtime.enable');

  // Evaluate DOM state
  const evalResult = await send('Runtime.evaluate', {
    expression: `
      ({
        hasVectorMascot: Boolean(document.getElementById('mascot-avatar-svg')),
        hasLeftHandSVG: Boolean(document.getElementById('hand-svg-left')),
        hasRightHandSVG: Boolean(document.getElementById('hand-svg-right')),
        leftFingersCount: document.querySelectorAll('#hand-svg-left .interactive-finger').length,
        rightFingersCount: document.querySelectorAll('#hand-svg-right .interactive-finger').length,
        hasVoiceSelect: Boolean(document.getElementById('voice-select')),
        hasVoiceTestBtn: Boolean(document.getElementById('voice-test-btn')),
        hasVoiceMuteBtn: Boolean(document.getElementById('voice-mute-btn')),
        hasZoomBtn: Boolean(document.getElementById('zoom-toggle-btn')),
        appRunning: Boolean(window.mecanoApp)
      })
    `,
    returnByValue: true
  });

  console.log('Browser Evaluation Result:', evalResult.value || (evalResult.result && evalResult.result.value));

  // Take screenshot 1: Start Screen with Vector Mascot & Hands
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  const data1 = shot1.data || (shot1.result && shot1.result.data);
  const shot1Path = 'C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\browser_start_screen.png';
  if (data1) fs.writeFileSync(shot1Path, Buffer.from(data1, 'base64'));
  console.log('Saved screenshot 1:', shot1Path);

  // Click start adventure button to enter gameplay
  await send('Runtime.evaluate', {
    expression: `
      const btn = document.getElementById('start-game-btn');
      if (btn) btn.click();
    `
  });
  await new Promise(r => setTimeout(r, 600));

  // Test zoom button click
  await send('Runtime.evaluate', {
    expression: `
      const zoomBtn = document.getElementById('zoom-toggle-btn');
      if (zoomBtn) zoomBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 400));

  const zoomState = await send('Runtime.evaluate', {
    expression: `
      ({
        bodyScale: document.body.dataset.textScale,
        rootScaleVar: document.documentElement.style.getPropertyValue('--text-scale'),
        targetWordFontSize: window.getComputedStyle(document.getElementById('target-word')).fontSize,
        activeFingers: Array.from(document.querySelectorAll('.is-active-finger')).map(el => el.id)
      })
    `,
    returnByValue: true
  });
  console.log('Zoom & Active Fingers state:', zoomState.value || (zoomState.result && zoomState.result.value));

  // Test tip next button click & pedagogical cycling
  const tip1 = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.getElementById('tip-next-btn');
        if (btn) btn.click();
        const icon = document.getElementById('tip-icon')?.textContent || '';
        const text = document.getElementById('mascot-lesson-tip')?.textContent || '';
        return { icon, text };
      })()
    `,
    returnByValue: true
  });
  console.log('Cycled Pedagogical Tip 1:', tip1.value || (tip1.result && tip1.result.value));

  const tip2 = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.getElementById('tip-next-btn');
        if (btn) btn.click();
        const icon = document.getElementById('tip-icon')?.textContent || '';
        const text = document.getElementById('mascot-lesson-tip')?.textContent || '';
        return { icon, text };
      })()
    `,
    returnByValue: true
  });
  console.log('Cycled Pedagogical Tip 2:', tip2.value || (tip2.result && tip2.result.value));

  // Test Roby mascot avatar click
  const robyClick = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const roby = document.getElementById('mascot-avatar');
        if (roby) roby.click();
        return document.getElementById('mascot-speech-text')?.textContent || '';
      })()
    `,
    returnByValue: true
  });
  console.log('Roby Click Spoken Advice:', robyClick.value || (robyClick.result && robyClick.result.value));

  const voiceDiag = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const app = window.app;
        const synth = window.speechSynthesis;
        return {
          hasApp: Boolean(app),
          hasVoiceEngine: Boolean(app?.voiceEngine),
          hasVoiceQueue: Boolean(app?.voiceQueue),
          voiceEngineMuted: app?.voiceEngine?._muted,
          voiceEngineVolume: app?.voiceEngine?._volume,
          voiceQueueMuted: app?.voiceQueue?._muted,
          voiceQueueVolume: app?.voiceQueue?._volume,
          isSpeakingSynth: synth ? synth.speaking : null,
          isPendingSynth: synth ? synth.pending : null,
          isPausedSynth: synth ? synth.paused : null,
          preferredVoice: app?.voiceEngine?._preferredVoice?.name || null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Voice Diagnostics:', voiceDiag.value || (voiceDiag.result && voiceDiag.result.value));

  const speakerClick = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.getElementById('mascot-speak-btn');
        if (!btn) return 'NO_BTN';
        btn.click();
        return 'CLICKED_SPEAKER';
      })()
    `,
    returnByValue: true
  });
  console.log('Speaker button click:', speakerClick.value || (speakerClick.result && speakerClick.result.value));
  await new Promise(r => setTimeout(r, 500));

  // Take screenshot 2: Gameplay with Active Illuminated Finger & Zoomed Text
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  const data2 = shot2.data || (shot2.result && shot2.result.data);
  const shot2Path = 'C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\browser_gameplay.png';
  if (data2) fs.writeFileSync(shot2Path, Buffer.from(data2, 'base64'));
  console.log('Saved screenshot 2:', shot2Path);

  // Check for any console errors
  console.log('Console errors captured:', consoleMessages.filter(m => m.level === 'error').length);

  ws.close();
} catch (err) {
  console.error('CDP verification error:', err);
} finally {
  edgeProc.kill();
  server.close();
  console.log('Verification finished cleanly.');
}
