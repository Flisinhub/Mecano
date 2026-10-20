import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9406;

async function run() {
  const p = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 1600));

  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const tabs = await res.json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `
        (() => {
          return {
            title: document.title,
            readyState: document.readyState,
            scripts: Array.from(document.scripts).map(s => s.src || s.textContent.slice(0, 50)),
            windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('mecano') || k === 'app')
          };
        })()
      `,
      returnByValue: true
    }
  }));

  ws.onmessage = (e) => {
    console.log('Streak check result:', JSON.parse(e.data).result?.result?.value);
    ws.close();
    p.kill();
    process.exit(0);
  };
}

run();
