import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9342;
const edgeProc = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_debug_file_inspect3',
  'file:///c:/mecano/Mecano-main/Mecano-main/index.html'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:' + port + '/json/list');
    const tabs = await listRes.json();
    const targetTab = tabs.find(t => t.url.includes('index.html'));
    console.log('Target tab found:', targetTab?.url);
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

    const errors = [];
    const consoleLogs = [];
    ws.addEventListener('message', (evt) => {
      const d = JSON.parse(evt.data);
      if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails);
      if (d.method === 'Console.messageAdded') consoleLogs.push(d.params.message);
    });
    await send('Runtime.enable');
    await send('Console.enable');

    await new Promise(r => setTimeout(r, 1000));
    const docInfo = await send('Runtime.evaluate', {
      expression: `
        ({
          href: location.href,
          title: document.title,
          hasStartBtn: Boolean(document.getElementById('start-game-btn')),
          hasApp: Boolean(window.app),
          bodyVisibility: window.getComputedStyle(document.body).visibility,
          bodyDisplay: window.getComputedStyle(document.body).display,
          gameContainerDisplay: window.getComputedStyle(document.querySelector('.game-container')).display,
          startScreenDisplay: window.getComputedStyle(document.getElementById('start-screen')).display
        })
      `,
      returnByValue: true
    });
    console.log('Doc info on file:///:', JSON.stringify(docInfo, null, 2));
    console.log('Errors:', errors);
    console.log('Console logs:', consoleLogs);
    ws.close();
  } catch(e) {
    console.error(e);
  } finally {
    edgeProc.kill();
  }
}, 2000);
