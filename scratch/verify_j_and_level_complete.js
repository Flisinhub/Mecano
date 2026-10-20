import { spawn } from 'child_process';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9390;

async function run() {
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--window-size=1280,720',
    `--remote-debugging-port=${port}`,
    '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_verify_j',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 1500));
  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const tabs = await listRes.json();
    const targetTab = tabs.find(t => t.url.includes('localhost:3000')) || tabs[0];
    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
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
    await new Promise(r => setTimeout(r, 600));

    // 1. Click Start Game to enter Lesson 1.1
    await send('Runtime.evaluate', {
      expression: `document.getElementById('start-game-btn')?.click();`
    });
    await new Promise(r => setTimeout(r, 800));

    // 2. Switch to Lesson 1.2 (J)
    await send('Runtime.evaluate', {
      expression: `
        // Click on chip 1.2
        const chip12 = document.querySelector('.sublesson-chip[data-lesson-id="1.2"]');
        if (chip12) chip12.click();
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // 3. Inspect illuminated fingers on Left and Right hands
    const fingerState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const leftPinky = document.getElementById('finger-l-pinky');
          const rightIndex = document.getElementById('finger-r-index');
          const allActive = Array.from(document.querySelectorAll('.finger-unit.is-active-finger')).map(el => el.id);
          return {
            leftPinkyHasActive: leftPinky?.classList.contains('is-active-finger'),
            rightIndexHasActive: rightIndex?.classList.contains('is-active-finger'),
            allActiveFingerIds: allActive,
            targetWordText: document.getElementById('target-word')?.textContent
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Finger illumination state on Lesson 1.2 (J):', JSON.stringify(fingerState.value || fingerState.result?.value, null, 2));

    // Take screenshot of 'J' state
    const shotJ = await send('Page.captureScreenshot', { format: 'png' });
    if (shotJ.data || shotJ.result?.data) {
      fs.writeFileSync('C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\verified_lesson_1_2_j.png', Buffer.from(shotJ.data || shotJ.result?.data, 'base64'));
      console.log('Saved screenshot of J key without left pinky illumination');
    }

    // 4. Simulate typing all remaining characters of Lesson 1.2 to trigger level complete
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Send keystrokes for all characters in the current target text
          const text = window.app?.gameEngine?.levelText || 'JJJJJJJJJJ';
          for (let i = 0; i < text.length + 5; i++) {
            const char = text[window.app.gameEngine.targetIndex] || 'J';
            window.app.gameEngine.handleKeyPress(char, { x: 500, y: 400 });
          }
        })()
      `
    });

    await new Promise(r => setTimeout(r, 900));

    // 5. Check if level complete modal is now visible
    const modalState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('level-complete');
          const title = document.getElementById('level-complete-title')?.textContent;
          const isVisible = modal && !modal.classList.contains('hidden');
          const nextBtnText = document.getElementById('next-level-btn')?.textContent;
          return { isVisible, title, nextBtnText };
        })()
      `,
      returnByValue: true
    });
    console.log('Level Complete Modal State:', JSON.stringify(modalState.value || modalState.result?.value, null, 2));

    // Take screenshot of Level Complete Modal
    const shotModal = await send('Page.captureScreenshot', { format: 'png' });
    if (shotModal.data || shotModal.result?.data) {
      fs.writeFileSync('C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\verified_level_complete_modal.png', Buffer.from(shotModal.data || shotModal.result?.data, 'base64'));
      console.log('Saved screenshot of Level Complete modal');
    }

    // 6. Test advancing to next lesson via Enter key
    await send('Runtime.evaluate', {
      expression: `
        const evt = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        window.dispatchEvent(evt);
      `
    });

    await new Promise(r => setTimeout(r, 800));

    const nextLessonState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            currentLessonId: window.app?.currentLessonId,
            levelNumber: document.getElementById('level-number')?.textContent,
            levelTitle: document.getElementById('level-title')?.textContent,
            modalIsHidden: document.getElementById('level-complete')?.classList.contains('hidden')
          };
        })()
      `,
      returnByValue: true
    });
    console.log('After pressing Enter on modal, next lesson state:', JSON.stringify(nextLessonState.value || nextLessonState.result?.value, null, 2));

    // 7. Test Video Modal opening and closing
    await send('Runtime.evaluate', {
      expression: `document.getElementById('lesson-video-btn')?.click();`
    });
    await new Promise(r => setTimeout(r, 600));

    const videoModalState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.getElementById('video-intro-modal');
          return {
            isVisible: modal && !modal.classList.contains('hidden'),
            title: document.getElementById('video-intro-title')?.textContent,
            placeholderVisible: !document.getElementById('video-intro-placeholder')?.classList.contains('hidden')
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Video Modal State:', JSON.stringify(videoModalState.value || videoModalState.result?.value, null, 2));

    const shotVideo = await send('Page.captureScreenshot', { format: 'png' });
    if (shotVideo.data || shotVideo.result?.data) {
      fs.writeFileSync('C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\verified_video_modal.png', Buffer.from(shotVideo.data || shotVideo.result?.data, 'base64'));
      console.log('Saved screenshot of Video Intro modal');
    }

    // Close video modal
    await send('Runtime.evaluate', {
      expression: `document.getElementById('video-intro-skip-btn')?.click();`
    });
    await new Promise(r => setTimeout(r, 500));

    ws.close();
  } catch (e) {
    console.error('Error during verification:', e);
  } finally {
    edgeProc.kill();
  }
}

run();
