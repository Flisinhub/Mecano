import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

function getRealisticLeftHandSVG() {
  return `
<svg class="interactive-hand-svg natural-hand-dorsal" id="hand-svg-left" viewBox="0 0 400 480" width="100%" height="100%" aria-label="Mano Izquierda Guía" role="img" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Sombra suave y realista del contorno de la mano -->
    <filter id="hand-real-shadow" x="-20%" y="-15%" width="140%" height="135%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#070914" flood-opacity="0.5" />
    </filter>

    <!-- Gradiente de piel natural (Dorsal / Dorso) -->
    <linearGradient id="skin-base-l" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#FFE8D6" />
      <stop offset="40%" stop-color="#F8CEAB" />
      <stop offset="85%" stop-color="#EDB184" />
      <stop offset="100%" stop-color="#E19D6E" />
    </linearGradient>

    <!-- Gradiente de los dedos con relieve cilíndrico suave -->
    <linearGradient id="finger-skin-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F5C49F" />
      <stop offset="25%" stop-color="#FFEADB" />
      <stop offset="75%" stop-color="#F8CFAC" />
      <stop offset="100%" stop-color="#EDB286" />
    </linearGradient>

    <!-- Gradiente de uña pulida con brillo natural -->
    <linearGradient id="real-nail-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
      <stop offset="25%" stop-color="#FFF0F4" />
      <stop offset="70%" stop-color="#FCD5DF" />
      <stop offset="100%" stop-color="#F5B8C8" />
    </linearGradient>
  </defs>

  <g class="hand-real-container" filter="url(#hand-real-shadow)">

    <!-- ===================================================================
         CAPA 1: DEDOS ANATÓMICOS INDIVIDUALES (Base profunda bajo los nudillos)
         Cada dedo se extiende 20px bajo el arco del nudillo para que al elevarse
         nunca deje ver cortes ni líneas horizontales.
         =================================================================== -->

    <!-- 1. Meñique Izquierdo (finger-l-pinky) - Magenta #F538A0 -->
    <g class="interactive-finger finger-unit" id="finger-l-pinky" data-finger="lp" data-finger-id="finger-l-pinky" style="--default-color: #F538A0;">
      <path class="finger-body" d="
        M 45,310
        C 43,260 44,215 45,185
        C 46,160 48,142 54,136
        C 61,128 70,129 76,137
        C 82,146 81,168 83,195
        C 85,225 92,260 98,285
        C 80,305 60,312 45,310
        Z"
        fill="url(#finger-skin-grad)"
        stroke="#BD7748"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <!-- Pliegues de los nudillos -->
      <path class="finger-crease" d="M 49,202 Q 63,206 79,202" fill="none" stroke="#BD7748" stroke-width="1.4" stroke-linecap="round" opacity="0.45" />
      <path class="finger-crease" d="M 51,170 Q 64,174 76,170" fill="none" stroke="#BD7748" stroke-width="1.3" stroke-linecap="round" opacity="0.4" />

      <!-- Uña elegante -->
      <path class="finger-nail" d="
        M 52,152
        C 50,143 54,135 64,134
        C 73,135 77,143 75,152
        C 74,159 53,159 52,152
        Z"
        fill="url(#real-nail-grad)"
        stroke="#E69CAE"
        stroke-width="1"
      />
      <path class="nail-shine" d="M 55,141 Q 64,137 72,141" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="64" cy="144" r="12" />
      <circle class="finger-pulse-ring" cx="64" cy="144" r="14" />
    </g>

    <!-- 2. Anular Izquierdo (finger-l-ring) - Mandarina #FA903E -->
    <g class="interactive-finger finger-unit" id="finger-l-ring" data-finger="lr" data-finger-id="finger-l-ring" style="--default-color: #FA903E;">
      <path class="finger-body" d="
        M 96,285
        C 98,240 102,185 105,138
        C 107,106 110,76 120,66
        C 129,56 141,58 148,68
        C 155,80 153,108 154,142
        C 155,182 157,225 158,260
        C 140,272 118,280 96,285
        Z"
        fill="url(#finger-skin-grad)"
        stroke="#BD7748"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <path class="finger-crease" d="M 111,162 Q 128,167 148,162" fill="none" stroke="#BD7748" stroke-width="1.6" stroke-linecap="round" opacity="0.45" />
      <path class="finger-crease" d="M 114,115 Q 129,119 145,115" fill="none" stroke="#BD7748" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />

      <!-- Uña elegante -->
      <path class="finger-nail" d="
        M 116,90
        C 114,78 118,68 130,66
        C 141,68 145,78 143,90
        C 142,98 117,98 116,90
        Z"
        fill="url(#real-nail-grad)"
        stroke="#E69CAE"
        stroke-width="1"
      />
      <path class="nail-shine" d="M 119,75 Q 130,70 139,75" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="130" cy="79" r="14" />
      <circle class="finger-pulse-ring" cx="130" cy="79" r="16" />
    </g>

    <!-- 3. Corazón Izquierdo (finger-l-middle) - Ámbar #FCC934 -->
    <g class="interactive-finger finger-unit" id="finger-l-middle" data-finger="lm" data-finger-id="finger-l-middle" style="--default-color: #FCC934;">
      <path class="finger-body" d="
        M 154,260
        C 156,210 160,150 162,100
        C 164,65 167,38 180,26
        C 190,16 204,18 212,30
        C 219,42 218,68 218,105
        C 218,150 216,210 216,258
        C 196,266 174,266 154,260
        Z"
        fill="url(#finger-skin-grad)"
        stroke="#BD7748"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <path class="finger-crease" d="M 168,140 Q 188,145 208,140" fill="none" stroke="#BD7748" stroke-width="1.7" stroke-linecap="round" opacity="0.45" />
      <path class="finger-crease" d="M 171,84 Q 188,88 205,84" fill="none" stroke="#BD7748" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />

      <!-- Uña elegante -->
      <path class="finger-nail" d="
        M 173,56
        C 171,42 176,30 191,28
        C 205,30 209,42 208,56
        C 207,66 174,66 173,56
        Z"
        fill="url(#real-nail-grad)"
        stroke="#E69CAE"
        stroke-width="1"
      />
      <path class="nail-shine" d="M 177,38 Q 191,32 202,38" fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="191" cy="44" r="15" />
      <circle class="finger-pulse-ring" cx="191" cy="44" r="17" />
    </g>

    <!-- 4. Índice Izquierdo (finger-l-index) - Verde Menta #81C995 -->
    <g class="interactive-finger finger-unit" id="finger-l-index" data-finger="li" data-finger-id="finger-l-index" style="--default-color: #81C995;">
      <path class="finger-body" d="
        M 214,258
        C 216,215 220,165 224,118
        C 227,85 231,58 244,48
        C 254,38 268,41 276,53
        C 282,65 281,92 279,128
        C 278,172 276,225 276,285
        C 255,278 234,268 214,258
        Z"
        fill="url(#finger-skin-grad)"
        stroke="#BD7748"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <path class="finger-crease" d="M 230,152 Q 250,157 270,152" fill="none" stroke="#BD7748" stroke-width="1.7" stroke-linecap="round" opacity="0.45" />
      <path class="finger-crease" d="M 234,102 Q 251,106 267,102" fill="none" stroke="#BD7748" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />

      <!-- Uña elegante -->
      <path class="finger-nail" d="
        M 237,78
        C 235,65 240,54 254,52
        C 267,54 272,65 270,78
        C 269,87 238,87 237,78
        Z"
        fill="url(#real-nail-grad)"
        stroke="#E69CAE"
        stroke-width="1"
      />
      <path class="nail-shine" d="M 241,63 Q 254,58 264,63" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="254" cy="67" r="14" />
      <circle class="finger-pulse-ring" cx="254" cy="67" r="16" />
    </g>

    <!-- 5. Pulgar Izquierdo (finger-l-thumb) - Azul Intenso #1A73E8 -->
    <g class="interactive-finger finger-unit" id="finger-l-thumb" data-finger="thumb" data-finger-id="finger-l-thumb" style="--default-color: #1A73E8;">
      <path class="finger-body" d="
        M 276,285
        C 285,302 296,318 308,320
        C 324,296 342,274 358,254
        C 370,240 388,247 391,264
        C 394,280 382,300 368,318
        C 350,340 335,364 324,388
        C 305,355 288,320 276,285
        Z"
        fill="url(#finger-skin-grad)"
        stroke="#BD7748"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <path class="finger-crease" d="M 338,294 Q 352,302 368,290" fill="none" stroke="#BD7748" stroke-width="1.7" stroke-linecap="round" opacity="0.45" />

      <!-- Uña elegante del pulgar -->
      <path class="finger-nail" d="
        M 366,262
        C 368,251 377,248 385,257
        C 390,267 385,277 376,281
        C 370,283 363,274 366,262
        Z"
        fill="url(#real-nail-grad)"
        stroke="#E69CAE"
        stroke-width="1"
      />
      <path class="nail-shine" d="M 372,255 Q 379,254 384,260" fill="none" stroke="#FFFFFF" stroke-width="1.3" stroke-linecap="round" opacity="0.85" />

      <circle class="finger-pad" cx="377" cy="268" r="14" />
      <circle class="finger-pulse-ring" cx="377" cy="268" r="16" />
    </g>

    <!-- ===================================================================
         CAPA 2: PALMA / DORSO PRINCIPAL (Solapamiento anatómico perfecto)
         El dorso se sitúa sobre la base de los dedos, con sus nudillos redondeados
         ocultando de manera orgánica las raíces articulares.
         =================================================================== -->
    <g class="hand-palm-base">
      <path class="palm-body" d="
        M 93,455
        C 84,410 68,360 48,295
        C 42,275 60,262 76,264
        C 86,266 94,268 100,265
        C 114,248 136,240 154,234
        C 172,228 194,226 214,232
        C 232,238 255,252 276,285
        C 285,302 296,318 308,320
        C 325,324 342,338 345,357
        C 348,377 338,407 320,432
        C 305,446 295,453 290,455
        Z"
        fill="url(#skin-base-l)"
        stroke="#BD7748"
        stroke-width="2.2"
        stroke-linejoin="round"
      />

      <!-- Relieve anatómico de tendones extensores -->
      <path d="M 188,435 C 187,365 188,295 186,236" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" opacity="0.25" />
      <path d="M 194,435 C 212,370 240,305 258,242" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="0.2" />
      <path d="M 182,435 C 160,370 136,305 125,248" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="0.2" />
      <path d="M 176,435 C 140,375 100,325 80,272" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity="0.15" />

      <!-- Arcos de los nudillos principales (MCP) que ocultan las uniones -->
      <path d="M 76,268 Q 90,262 104,267" fill="none" stroke="#BD7748" stroke-width="1.8" stroke-linecap="round" opacity="0.5" />
      <path d="M 112,246 Q 134,238 156,242" fill="none" stroke="#BD7748" stroke-width="2.0" stroke-linecap="round" opacity="0.5" />
      <path d="M 166,236 Q 188,230 210,234" fill="none" stroke="#BD7748" stroke-width="2.2" stroke-linecap="round" opacity="0.5" />
      <path d="M 220,238 Q 242,244 266,254" fill="none" stroke="#BD7748" stroke-width="2.0" stroke-linecap="round" opacity="0.5" />

      <!-- Pliegue anatómico de la muñeca -->
      <path d="M 115,445 C 160,455 220,455 268,445" fill="none" stroke="#BD7748" stroke-width="2.0" stroke-linecap="round" opacity="0.35" />
    </g>

  </g>
</svg>
`;
}

// Generate an HTML preview file
const previewHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Prueba de Manos Anatómicas Refinadas</title>
  <style>
    body {
      background: #0f1326;
      color: white;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .cards-row {
      display: flex;
      gap: 36px;
    }
    .hand-card {
      width: 260px;
      height: 380px;
      background: #181d36;
      border: 2px solid rgba(255, 255, 255, 0.15);
      border-radius: 24px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 12px 36px rgba(0,0,0,0.55);
    }
    .card-title {
      font-weight: 800;
      font-size: 0.95rem;
      color: #fed7aa;
      margin-bottom: 12px;
      letter-spacing: 1px;
    }
    .hand-illustration {
      width: 100%;
      height: 320px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .interactive-hand-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    /* Estilos de dedos interactivos */
    .interactive-finger {
      cursor: pointer;
      transform-origin: 50% 80%;
      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.22s ease;
    }
    .interactive-finger .finger-pad {
      fill: transparent;
      stroke: transparent;
      transition: all 0.22s ease;
    }
    .interactive-finger .finger-pulse-ring {
      fill: none;
      stroke: transparent;
      transform-origin: center center;
    }

    /* =========================================================================
       Estado ACTIVO: Iluminación Neón + Elevación Suave sin Cortes
       ========================================================================= */
    .interactive-finger.is-illuminated,
    .interactive-finger.is-active-finger {
      transform: translateY(-6px) scale(1.02);
      filter: drop-shadow(0 0 10px var(--finger-glow, var(--default-color)))
              drop-shadow(0 0 24px var(--finger-glow, var(--default-color)));
    }
    .interactive-finger.is-illuminated .finger-body,
    .interactive-finger.is-active-finger .finger-body {
      fill: var(--finger-color, var(--default-color)) !important;
      stroke: #FFFFFF !important;
      stroke-width: 2.5px !important;
    }
    .interactive-finger.is-illuminated .finger-nail,
    .interactive-finger.is-active-finger .finger-nail {
      fill: #FFFFFF !important;
      stroke: #FFFFFF !important;
    }
    .interactive-finger.is-illuminated .finger-crease,
    .interactive-finger.is-active-finger .finger-crease {
      stroke: rgba(255, 255, 255, 0.7) !important;
    }
    .interactive-finger.is-illuminated .finger-pad,
    .interactive-finger.is-active-finger .finger-pad {
      fill: rgba(255, 255, 255, 0.85);
      stroke: #FFFFFF;
      stroke-width: 2px;
      opacity: 0.9;
    }
    .interactive-finger.is-illuminated .finger-pulse-ring,
    .interactive-finger.is-active-finger .finger-pulse-ring {
      stroke: #FFFFFF;
      animation: pulseRing 1.3s infinite ease-out;
    }

    @keyframes pulseRing {
      0% { r: 14px; opacity: 0.9; stroke-width: 3px; }
      100% { r: 32px; opacity: 0; stroke-width: 1px; }
    }
  </style>
</head>
<body>
  <h2>Nueva Mano Anatómica Natural con Nudillos Superpuestos</h2>
  <div class="cards-row">
    <div class="hand-card">
      <div class="card-title">MANO EN REPOSO</div>
      <div class="hand-illustration">
        ${getRealisticLeftHandSVG()}
      </div>
    </div>
    <div class="hand-card">
      <div class="card-title">ÍNDICE ACTIVO (F)</div>
      <div class="hand-illustration" id="card-active">
        ${getRealisticLeftHandSVG()}
      </div>
    </div>
  </div>

  <script>
    const activeIndex = document.querySelector('#card-active #finger-l-index');
    if (activeIndex) {
      activeIndex.classList.add('is-illuminated', 'is-active-finger');
      activeIndex.style.setProperty('--finger-color', '#81C995');
      activeIndex.style.setProperty('--finger-glow', '#81C995');
    }
  </script>
</body>
</html>
`;

const previewPath = path.resolve('scratch/preview_hand.html');
fs.writeFileSync(previewPath, previewHtml, 'utf8');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(fs.readFileSync(previewPath));
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const debugPort = 9329;
const edgeProc = spawn(edgePath, [
  '--headless=new',
  '--window-size=950,650',
  `--remote-debugging-port=${debugPort}`,
  '--user-data-dir=C:\\Users\\pacos\\.gemini\\antigravity\\brain\\e5ca1999-1b81-41de-97d2-bc94bf35da43\\scratch\\edge_hand',
  `http://127.0.0.1:${port}/`
]);

try {
  await new Promise(r => setTimeout(r, 2200));
  const listRes = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
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
          res(d.result);
        }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  await send('Page.enable');
  await new Promise(r => setTimeout(r, 500));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const shotPath = 'C:\\mecano\\Mecano-main\\Mecano-main\\scratch\\hand_overlapping_screenshot.png';
  fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshot to', shotPath);
  ws.close();
} catch (e) {
  console.error('Error during capture:', e);
} finally {
  edgeProc.kill();
  server.close();
  process.exit(0);
}
