# Mecano Aventura Kids 🚀🎮
**Videojuego Infantil para Aprender Mecanografía con Arquitectura Multiagente Desacoplada**

---

## 🌟 Descripción General
**Mecano** es un videojuego educativo diseñado para niños de 6 a 11 años que enseña mecanografía real (memoria muscular y posicionamiento de dedos sin mirar al teclado físico) con **cero frustración**, diseño de juguete 3D, efectos visuales reactivos ("Game Juice"), una mascota interactiva con IA emocional y audio musical adaptativo.

---

## 🏗️ Arquitectura Modular Desacoplada

El sistema fue transformado mediante una arquitectura multiagente desacoplada comunicada exclusivamente a través de un bus central de eventos pub/sub (`EventBus`). Cada subsistema reside en su propio directorio independiente:

```
c:\mecano\Mecano-main\Mecano-main\
├── index.html                   # Shell web principal interactiva
├── server.js                    # Servidor local ligero de desarrollo en Node.js (cero dependencias)
├── test_harness.js              # Arnés de verificación automatizada headless (24/24 tests)
├── style.css                    # Estilos globales y layout
├── src/
│   ├── main.js                  # Orquestador y punto de entrada (ES Modules)
│   ├── core/                    # M1 - Arquitectura Base y Persistencia
│   │   ├── EventBus.js          # Bus central Pub/Sub con 7 eventos tipados
│   │   ├── StorageManager.js    # Persistencia de estrellas, mapa de calor y vestidor
│   │   ├── GameEngine.js        # Cálculo de WPM, PPM, combos, racha y modo fiebre
│   │   └── core.test.js         # Pruebas unitarias de núcleo
│   ├── vfx/                     # M2 - Arte Técnico, Escena y Efectos Visuales
│   │   ├── LiveScene.js         # Contenedor de escena Parallax sobre Main Scene.png
│   │   ├── ParticleEngine.js    # Partículas ambientales flotantes y destellos
│   │   ├── BezierProjectiles.js # Proyectiles con trayectoria Bézier y estallido cromático
│   │   ├── SquashStretch.js     # Física elástica reutilizable (deformación de gelatina)
│   │   └── vfx.css              # Estilos de lienzos y filtros de iluminación
│   ├── mascot/                  # M3 - Mascota Roby e IA Emocional
│   │   ├── MascotAnimator.js    # Respiración sinusoidal, rotación look-at y saltos de ritmo
│   │   ├── MascotFSM.js         # Máquina de 6 estados: IDLE, FLOW_DANCE, HELPER_POINTING,
│   │   │                        # SLEEPY, HIGH_FIVE_WAIT y CELEBRATING
│   │   ├── SpeechBubble.js      # Bocadillo de cómic animado sincronizado
│   │   ├── LipSync.js           # Sincronización labial dinámica procedural
│   │   ├── AccessorySocket.js   # Vestidor con sombreros, gafas y coronas desbloqueables
│   │   └── mascot.css           # Estilos visuales de la mascota y accesorios
│   ├── keyboard/                # M4 - Teclado Ergonómico 3D y Pedagogía
│   │   ├── ToyKeyboard.js       # Teclado táctil estilo botón 3D con marcas en F y J
│   │   ├── GhostHands.js        # Manos guía translúcidas superpuestas y animadas
│   │   ├── KeyboardLayout.js    # Mapeo pedagógico de colores estándar por dedo
│   │   ├── PedagogyEngine.js    # Progresión de 8 niveles, cinturones y lógica sin Game Over
│   │   └── keyboard.css         # Estilos 3D de teclas, marcas y manos fantasma
│   └── audio/                   # M5 - Audio Procedural y Accesibilidad
│       ├── ProceduralAudio.js   # Escala pentatónica mayor (Web Audio API) y sonido sordo en error
│       ├── VoiceQueue.js        # Gestor de voz (Web Speech API) con cola anti-solapamiento
│       ├── AccessibilityPanel.js# Panel A11y: volumen, fuente para dislexia y alto contraste
│       └── audio.css            # Estilos del panel de accesibilidad y temas de contraste
└── assets/ & Sprites/           # Recursos visuales y sonoros
```

---

## 📡 Contrato de Eventos Central (`EventBus`)

Los componentes nunca se llaman directamente entre sí; se coordinan emitiendo y suscribiéndose a los siguientes 7 eventos tipados:

| Evento | Carga Útil (*Payload*) | Descripción |
|---|---|---|
| `KEY_TARGET_CHANGED` | `{ key, finger, hand, screenPosition }` | Notifica nueva tecla objetivo. Activa el look-at de Roby y la iluminación en el teclado y manos guía. |
| `KEY_PRESSED_SUCCESS` | `{ key, comboCount, accuracy, keyScreenPosition }` | Notifica acierto. Dispara proyectil Bézier, nota de la escala pentatónica y animación de salto. |
| `KEY_PRESSED_FAIL` | `{ pressedKey, expectedKey, consecutiveErrors }` | Notifica fallo no punitivo. Activa temblor suave de tecla, sonido de madera sordo y registro en el mapa de calor. |
| `USER_STUCK` | `{ expectedKey, finger, idleTimeMs }` | Disparado tras 3 errores o inactividad prolongada (>2-4s). Transita a Roby al estado `HELPER_POINTING` con consejo de voz. |
| `FEVER_MODE_CHANGED` | `{ isActive, multiplier }` | Activa/desactiva resplandor dorado/arcoíris en la escena viva al alcanzar rachas de combo $\ge 10$. |
| `MASCOT_SPEAK_REQUEST` | `{ text, audioId, priority, emotion }` | Encola mensajes para la mascota en `VoiceQueue` evitando interrupciones molestas durante escritura rápida. |
| `LEVEL_COMPLETED` | `{ levelId, stars, accuracy, wpm }` | Dispara el estado `HIGH_FIVE_WAIT` de Roby, cálculo de estrellas en `StorageManager` y confeti. |

---

## 🎨 Código Pedagógico de Colores por Dedo

| Dedo | Teclas Principales | Color Pedagógico |
|---|---|---|
| **Meñique Izquierdo** | `Q, A, Z` | Coral / Rojo suave |
| **Anular Izquierdo** | `W, S, X` | Naranja cálido |
| **Medio Izquierdo** | `E, D, C` | Amarillo sol |
| **Índice Izquierdo** | `R, F, V, T, G, B` | Verde menta |
| **Índice Derecho** | `Y, H, N, U, J, M` | Azul cielo |
| **Medio Derecho** | `I, K, ,` | Amarillo sol |
| **Anular Derecho** | `O, L, .` | Naranja cálido |
| **Meñique Derecho** | `P, Ñ, -` | Coral / Rojo suave |
| **Pulgares** | `Espacio` | Violeta mágico |

---

## 🚀 Cómo Ejecutar el Juego

### 1. Servidor de Desarrollo Local (Recomendado para Módulos ES)
Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
node server.js
```

Abre en tu navegador la dirección:
👉 **`http://localhost:3000/`**

### 2. Ejecutar la Suite de Pruebas Automatizadas
Para verificar la integridad del 100% de los módulos, contratos del `EventBus`, casos de estrés y subsistemas audiovisuales sin abrir el navegador:

```bash
npm test
```

Ejecuta 3 suites completas con **51 pruebas automatizadas** en milisegundos:
1. `test_harness.js`: Contratos Pub/Sub, persistencia `StorageManager`, métricas `GameEngine`, FSM y pedagogía (24 tests).
2. `test_edge_cases.js`: Supresión de rebotes de motricidad fina (<400ms), resiliencia a JSON corrupto, aceleración PPM > 25 (16 tests).
3. `test_audiovisual_refactor.js`: Cadena DSP Web Audio, selector heurístico de voces, generación SVG de manos con 10 dedos, iluminación multi-tecla simultánea y lip-sync RMS (11 tests).

### 3. Compilación de Producción
El proyecto incluye un bundle unificado generado mediante `esbuild`:

```bash
npm run build
```

---

## 🎙️ Motor de Voz Neuronal y Web Audio DSP (`VoiceEngine.js`)
Para erradicar definitivamente el timbre metálico robótico ("efecto Loquendo"), el subsistema de audio implementa una arquitectura híbrida de alta fidelidad:

1. **Cadena DSP de Calidad Estudio (Web Audio API):**
   - **High-Pass Filter:** Corte en 85 Hz ($Q = 0.707$) para eliminar ruidos subgraves y soplos de micrófono.
   - **Peaking EQ:** Realce cálido en 2.800 Hz (+2.5 dB, $Q = 1.2$) para máxima claridad en formantes vocales infantiles.
   - **DynamicsCompressor:** Control suave de dinámica (Threshold -18 dB, Knee 6 dB, Ratio 3:1, Attack 12 ms, Release 140 ms).
   - **AnalyserNode:** FFT Size de 256 para análisis acústico RMS en tiempo real (60 FPS) directo a la boca de la mascota.

2. **Audios Neuronales Pre-renderizados (`edge-tts`):**
   - 10 locuciones HD de alta definición con la voz `es-ES-AlvaroNeural` generadas en `assets/audio/voices/` con su correspondiente `manifest.json`.
   - Cero latencia, pronunciación castellana nativa y entonación cariñosa.

3. **Selector Heurístico Inteligente de Síntesis Vocal (`SpeechSynthesis`):**
   - **Prioridad 1 (+100 pts):** Voces Online/Natural de Microsoft Edge (`Microsoft Alvaro Online (Natural)`, `Microsoft Elvira Online (Natural)`, `Microsoft Alonso Online (Natural)`).
   - **Prioridad 2 (+80 pts):** Voces neuronales de Google (`Google español`, `Google español de Estados Unidos`).
   - **Prioridad 3 (+70 pts):** Voces mejoradas de Apple (`Mónica`, `Paulina`).
   - **Penalización (-100 pts):** Relega voces robóticas de escritorio SAPI5 heredadas (`Desktop`, `eSpeak`, `Helena Desktop`).
   - **Preservación de formantes:** Pitch estrictamente calibrado en `1.00 - 1.04` y Rate en `0.98 - 1.03`.

---

## 🐾 Mascota Vectorial Roby y Lip-Sync Acústico en Tiempo Real (`MascotController.js`)
- **Avatar 100% Vectorial SVG:** Creado con geometría SVG pura y animaciones CSS (ojos LED crecientes, alas translúcidas, antenas bouncies y pantalla oscura). Cero imágenes fotográficas o borrosas.
- **Lip-Sync Acústico por RMS:** Envolvente RMS calculada a 60 FPS por el `AnalyserNode`, suavizada mediante Filtro de Media Móvil Exponencial (EMA con $\alpha = 0.35$), mapeada de forma continua a la apertura y curvatura de la boca SVG (`d="M 12 18 Q 24 ${y} 36 18"`).
- **Visemas Fallback:** Emulación fonética natural durante la síntesis del navegador.
- **Micro-expresiones:** Parpadeo orgánico probabilístico cada 3-6 segundos, pupilas con seguimiento sutil (*look-at*) hacia la tecla activa y 4 estados emocionales (`idle`, `speaking`, `streak`, `error`).

---

## 🖐️ Manos Vectoriales Interactivas SVG (`InteractiveHandsSVG.js`)
- **Sustitución Total de Fotografías:** Eliminación completa de `hand_left_realistic.png` y `hand_right_realistic.png`.
- **Identificadores Universales:** 10 dedos únicos (`finger-l-pinky`, `finger-l-ring`, `finger-l-middle`, `finger-l-index`, `finger-l-thumb`, `finger-r-thumb`, `finger-r-index`, `finger-r-middle`, `finger-r-ring`, `finger-r-pinky`).
- **Iluminación Simultánea Multi-Tecla:** Para combinaciones complejas como `Alt Gr` + `2` (`@`) o `Mayús` + letra, el sistema detecta y enciende **ambos dedos al mismo tiempo** con elevación táctil (`translateY(-6px) scale(1.04)`).

---

## 🛡️ Principios Pedagógicos Anti-Frustración
- **Cero Game Over:** Nunca se restan vidas ni se bloquea el progreso del niño ante un error.
- **Feedback Benevolente:** La tecla errónea tiembla suavemente en color neutro mientras la tecla correcta incrementa su pulso luminoso para atraer la mirada de manera natural.
- **Progresión por Micro-Niveles:** Desafíos breves de 60-90 segundos orientados a la formación de memoria muscular sólida.
- **Lectura Estacionaria y Zoom Accesible:** Cinta de texto central 100% fija sin oscilaciones molestas ni mareos, con escalado tipográfico dinámico (1.0x, 1.5x y 2.0x).

