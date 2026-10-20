import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9335;
const edgeProc = spawn(edgePath, [
  '--headless=new',
  '--window-size=1280,840',
  '--remote-debugging-port=' + port,
  '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_debug_file_click',
  'file:///c:/mecano/Mecano-main/Mecano-main/index.html'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:' + port + '/json/list');
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
    ws.addEventListener('message', (evt) => {
      const d = JSON.parse(evt.data);
      if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails);
    });
    await send('Runtime.enable');

    await new Promise(r => setTimeout(r, 1000));
    const clickRes = await send('Runtime.evaluate', {
      expression: 'document.getElementById("start-game-btn").click()'
    });
    console.log('Click res:', clickRes);
    await new Promise(r => setTimeout(r, 1000));
    console.log('Exceptions:', errors);

    const isStarted = await send('Runtime.evaluate', {
      expression: '({ hidden: document.getElementById("start-screen").classList.contains("hidden"), level: document.getElementById("level").textContent })',
      returnByValue: true
    });
    console.log('isStarted:', isStarted);

    ws.close();
  } catch(e) {
    console.error(e);
  } finally {
    edgeProc.kill();
  }
}, 2000);
