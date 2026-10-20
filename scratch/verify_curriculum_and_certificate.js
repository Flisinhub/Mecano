import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import path from 'path';

// 1. HTTP server to serve the Mecano files
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
  '--window-size=1366,860',
  `--remote-debugging-port=${port}`,
  '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_verify_curriculum',
  'http://localhost:8091/index.html'
]);

try {
  await new Promise(r => setTimeout(r, 2200));

  const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
  const tabs = await listRes.json();
  const pageTab = tabs.find(t => t.type === 'page' && t.url.includes('localhost')) || tabs.find(t => t.type === 'page') || tabs[0];
  console.log('Connecting to target page tab:', pageTab.title, pageTab.url);
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
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

  // Monitor console errors
  const errors = [];
  ws.addEventListener('message', (evt) => {
    const d = JSON.parse(evt.data);
    if (d.method === 'Console.messageAdded' && d.params.message.level === 'error') {
      errors.push(d.params.message.text);
    }
  });
  await send('Console.enable');
  await send('Runtime.enable');

  console.log('--- 1. Enter Gameplay ---');
  await send('Runtime.evaluate', {
    expression: `
      const btn = document.getElementById('start-game-btn');
      if (btn) btn.click();
    `
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('--- 2. Inspect Sublessons Nav ---');
  const navCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const nav = document.getElementById('sublessons-nav');
        const chips = document.querySelectorAll('.sublesson-chip');
        const examChip = document.querySelector('.sublesson-chip-exam');
        const diplomaBtn = document.getElementById('diploma-btn');
        return {
          hasNav: Boolean(nav),
          navVisible: nav ? window.getComputedStyle(nav).display : null,
          chipCount: chips.length,
          hasExamChip: Boolean(examChip),
          examChipText: examChip ? examChip.textContent.trim() : null,
          hasDiplomaBtn: Boolean(diplomaBtn),
          activeChip: document.querySelector('.sublesson-chip.is-active')?.textContent.trim() || null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Sublessons Nav Status:', navCheck.value || (navCheck.result && navCheck.result.value));

  // Take screenshot 1: Navigation with 15 chips and exam chip
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  const data1 = shot1.data || (shot1.result && shot1.result.data);
  const shot1Path = 'C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\browser_sublessons_nav.png';
  if (data1) fs.writeFileSync(shot1Path, Buffer.from(data1, 'base64'));
  console.log('Saved screenshot 1:', shot1Path);

  console.log('--- 3. Test Clicking Lesson 1.3 ---');
  const chipClick = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const chips = Array.from(document.querySelectorAll('.sublesson-chip'));
        const chip1_3 = chips.find(c => c.textContent.includes('1.3'));
        if (chip1_3) {
          chip1_3.click();
          return { clicked: true, targetText: document.getElementById('target-word')?.textContent };
        }
        return { clicked: false };
      })()
    `,
    returnByValue: true
  });
  console.log('Lesson 1.3 selected:', chipClick.value || (chipClick.result && chipClick.result.value));

  console.log('--- 4. Test Exam Flow (Level 1 Exam) ---');
  const examStart = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const examChip = document.querySelector('.exam-chip');
        if (examChip) {
          examChip.click();
          return {
            started: true,
            isExamMode: window.app?.isExamMode,
            isGameEngineExam: window.app?.gameEngine?.isExam,
            lessonId: window.app?.gameEngine?.currentLessonId,
            examConfig: window.app?.gameEngine?.currentExamConfig
          };
        }
        return { started: false };
      })()
    `,
    returnByValue: true
  });
  console.log('Exam Started:', examStart.value || (examStart.result && examStart.result.value));

  // Trigger exam completion
  const examFinish = await send('Runtime.evaluate', {
    expression: `
      (() => {
        window.app.handleLevelCompleted({
          levelId: 1,
          isExam: true,
          accuracy: 96,
          wpm: 19,
          errors: 1,
          totalKeystrokes: 40
        });
        
        const modal = document.getElementById('exam-modal');
        return {
          modalVisible: modal ? !modal.classList.contains('hidden') : false,
          modalTitle: document.getElementById('exam-modal-title')?.textContent,
          modalStats: document.getElementById('exam-modal-stats')?.innerText,
          starsCount: modal?.querySelectorAll('.star.filled')?.length,
          hasRetryBtn: Boolean(document.getElementById('exam-retry-btn')),
          hasNextLevelBtn: Boolean(document.getElementById('exam-next-level-btn'))
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Exam Result Modal State:', examFinish.value || (examFinish.result && examFinish.result.value));
  await new Promise(r => setTimeout(r, 400));

  // Take screenshot 2: Exam Result Modal
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  const data2 = shot2.data || (shot2.result && shot2.result.data);
  const shot2Path = 'C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\browser_exam_modal.png';
  if (data2) fs.writeFileSync(shot2Path, Buffer.from(data2, 'base64'));
  console.log('Saved screenshot 2:', shot2Path);

  console.log('--- 5. Test Diploma Modal & Canvas Generation ---');
  const diplomaCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        // Close exam modal and open diploma modal via #diploma-btn
        window.app.hideExamModal();
        const diplomaBtn = document.getElementById('diploma-btn');
        if (diplomaBtn) diplomaBtn.click();
        else window.app.showDiplomaModal();

        const diplomaModal = document.getElementById('diploma-modal');
        const canvas = document.getElementById('diploma-canvas');
        const studentNameInput = document.getElementById('diploma-student-name');
        
        // Update student name
        if (studentNameInput) {
          studentNameInput.value = 'Lucas García';
          studentNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        return {
          diplomaModalVisible: diplomaModal ? !diplomaModal.classList.contains('hidden') : false,
          canvasWidth: canvas?.width,
          canvasHeight: canvas?.height,
          studentName: studentNameInput?.value,
          hasDownloadBtn: Boolean(document.getElementById('diploma-download-btn')),
          hasPrintBtn: Boolean(document.getElementById('diploma-print-btn'))
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Diploma Modal & Canvas Status:', diplomaCheck.value || (diplomaCheck.result && diplomaCheck.result.value));
  await new Promise(r => setTimeout(r, 500));

  // Take screenshot 3: Official Typing Diploma Modal with Canvas
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  const data3 = shot3.data || (shot3.result && shot3.result.data);
  const shot3Path = 'C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\browser_diploma_modal.png';
  if (data3) fs.writeFileSync(shot3Path, Buffer.from(data3, 'base64'));
  console.log('Saved screenshot 3:', shot3Path);

  console.log('--- 6. Console Error Check ---');
  console.log('Errors caught:', errors);

  ws.close();
} catch (err) {
  console.error('CDP verification error:', err);
} finally {
  edgeProc.kill();
  server.close();
  console.log('Verification finished cleanly.');
}
