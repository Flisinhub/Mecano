# Auditoría Exhaustiva del Repositorio y Catálogo Técnico de Activos: Mecano

**Fecha del informe**: 2026-10-18  
**Auditor**: Explorer Survey 1 (Codebase & Asset Auditor)  
**Ruta del proyecto**: `c:\mecano\Mecano-main\Mecano-main`  
**Modo de integridad**: Development / Read-Only Investigation  

---

## 1. Resumen Ejecutivo

El proyecto **Mecano** es una aplicación web didáctica dirigida a niños de 6 a 11 años para el aprendizaje de mecanografía sin frustración. 

El estado actual del repositorio es un prototipo monolítico funcional en navegador pero con alta deuda técnica y acoplamiento severo:
- Toda la lógica reside en un único script procedural global (`main.js`, 2.310 líneas) y una hoja de estilos monolítica (`style.css`, 2.673 líneas).
- No existe un sistema de eventos desacoplado (`EventBus` ausente), lo que provoca dependencias cruzadas continuas entre entrada por teclado, audio, animaciones, persistencia y visualización.
- La escena de fondo depende de un elemento `<video>` en `index.html:25` que apunta a `assets/animated_bg.mp4` (archivo inexistente en disco), forzando un fallback estático por captura de error.
- Los efectos de sonido utilizan elementos HTML5 Audio nativos que sufren latencia e impiden la síntesis procedural pentatónica requerida.
- La mascota Roby no posee máquina de estados finitos (FSM), ni respiración sinusoidal, ni lip-sync, ni orientación reactiva angular (*look-at*).
- Las manos guía son ilustraciones SVG fijas colocadas a los laterales del teclado, no manos translúcidas (*Ghost Hands*) superpuestas sobre el teclado como exige la pedagogía ergonómica moderna.
- No existe entorno de servidor local (`server.js` ni `package.json`), ni arnés de pruebas automatizado (`test_harness.js`).

---

## 2. Inventario Completo de Archivos del Repositorio

El repositorio cuenta con 35 archivos principales distribuidos en la raíz y subcarpetas (excluyendo metadatos de agentes):

| Ruta Relativa | Tamaño (Bytes / KB) | Tipo | Estado y Rol en el Sistema |
|---|---|---|---|
| `index.html` | 28.599 B (27,9 KB) | HTML5 | Estructura DOM completa del juego, modales, teclado y manos SVG. |
| `main.js` | 84.774 B (82,8 KB) | JavaScript | Monolito de 2.310 líneas. Controlador global de estado, eventos y DOM. |
| `style.css` | 52.543 B (51,3 KB) | CSS3 | Hoja de estilos con variables CSS, animaciones y maquetación. |
| `words.js` | 17.685 B (17,3 KB) | JavaScript | Estructura pedagógica de 8 niveles graduados, cinturones e iconos. |
| `README.md` | 71 B (0,1 KB) | Markdown | Documentación mínima de ejecución ("ejecutar index.html"). |
| `juego mecano.code-workspace` | 60 B (0,1 KB) | JSON | Configuración de espacio de trabajo de VS Code. |
| `.gitignore` | 58 B (0,1 KB) | Config | Reglas git de exclusión de archivos temporales. |
| `.gitattributes` | 66 B (0,1 KB) | Config | Reglas de normalización de saltos de línea LF/CRLF. |
| **Directorio `assets/`** | 20.841.677 B (~20 MB) | Directorio | Activos gráficos limpios en alta resolución y efectos de sonido WAV. |
| **Directorio `Sprites/`** | 16.143.689 B (~15,5 MB) | Directorio | Hojas de sprites, fondo de escena original, vídeos MP4 y variantes. |

---

## 3. Catálogo Técnico de Activos Multimedia

### 3.1. Efectos de Audio (`assets/sounds/`)
Se auditaron los 5 archivos WAV existentes mediante lectura de encabezados RIFF/WAVE:

| Archivo | Canales | Frecuencia de Muestreo | Profundidad de Bits | Duración | Uso Actual (`main.js`) |
|---|---|---|---|---|---|
| `button-click.wav` | 2 (Estéreo) | 44.100 Hz | 16-bit PCM | 0,50 s | Clics en botones, opciones y teclado táctil. |
| `error.wav` | 1 (Mono) | 44.100 Hz | 16-bit PCM | 0,29 s | Pulsación de tecla errónea (feedback negativo). |
| `good.wav` | 2 (Estéreo) | 44.100 Hz | 16-bit PCM | 0,30 s | Palabra completada con éxito. |
| `key-hit.wav` | 2 (Estéreo) | 44.100 Hz | 24-bit PCM | 0,71 s | Acierto de tecla individual. |
| `level-up.wav` | 2 (Estéreo) | 44.100 Hz | 16-bit PCM | 3,54 s | Fin de nivel y celebración con trofeo. |

**Diagnóstico Audio**:
- Todos los archivos son válidos y de alta fidelidad (44.1 kHz).
- Actualmente se cargan con `new Audio("assets/sounds/...")` en líneas 130-146 de `main.js`.
- No existe el sintetizador Web Audio API para la escala pentatónica mayor (Do, Re, Mi, Sol, La) requerida para la racha de aciertos.

---

### 3.2. Activos Gráficos: Comparación entre `assets/` y `Sprites/`

Se realizó inspección binaria de resolución, canales de color (RGBA colorType 6) y revisión visual directa:

#### A. Fondos de Escenario
1. `Sprites/Main Scene.png` (1408x768, 1.833 KB) y `assets/main_scene.png` (1408x768, 1.833 KB):
   - **Hash SHA-256**: `30804f588bd4fd8c2961e6c9ea0eae807038ea37d23aef6aa03f329164b0741a` (100% idénticos).
   - **Contenido**: Ilustración de aula infantil con pizarra interactiva ("ESCUELA DE MECANOGRAFÍA", "NIVEL 1: 4120"), estantería de libros, ventana soleada, alfombra con abecedario y robot hada flotante sobre teclado luminoso.
   - **Potencial**: Es el activo central perfecto para la escena reactiva viva con efecto Parallax y filtros de luz.
2. `assets/kids_world_bg.jpg` (1376x768, 869 KB):
   - Actualmente usado como imagen de respaldo estática en `style.css:70` (`.background-fallback`).

#### B. Sprites de la Mascota Roby
Existe una marcada diferencia de procesamiento visual entre `Sprites/` y `assets/`:

1. **La colección en `assets/` (Procesada, Limpia, Fondo Transparente Real)**:
   - `assets/robot_happy.png` (1024x1024, 1.159 KB): Roby alegre, con gafas, alas de hada iridiscentes, saludando con la mano izquierda y tecleando en teclado arcoíris.
   - `assets/robot_reading.png` (1024x1024, 1.093 KB): Roby sentado en cojín leyendo el libro "MY HAPPY TYPING ADVENTURE".
   - `assets/robot_thinking.png` (1024x1024, 975 KB): Roby con dedo índice apuntando hacia arriba, bombilla encendida ("ding!"), ideal para el estado `HELPER_POINTING`.
   - `assets/robot_error.png` (1024x1024, 847 KB): Roby volando con pulgares arriba y sonrisa de ánimo. Diseñado pedagógicamente para no frustrar.
   - `assets/robot_sleeping.png` (1024x1024, 799 KB): Roby durmiendo plácidamente sobre una nube blanca ("Z Z Z Z").
   - `assets/robot_victory.png` (1024x1024, 978 KB): Roby levantando el trofeo de ganador ("WINNER") con confeti y estrellas flotantes.
   - *Nota*: Todas estas imágenes en `assets/` poseen fondo transparente alfa puro y halo suave blanco/sticker.

2. **La colección en `Sprites/` (Originales sin depurar / Hojas globales)**:
   - `Sprites/Sprites Global.png` (1408x768, 1.634 KB): Hoja completa con 18 poses del robot rotuladas (Neutral, Happy con copa, Thoughtful, Error con humo y cartel TRY AGAIN, Front-Left Neutro, Front-Right Neutro, Front-Typing Fast, Front-Right Pointing, Victory Celebration ¡ÉXITO!, Sleeping/Power Down, Typing Combo, Reading, etc.).
   - `Sprites/Gemini_Generated_Image_swsctrswsctrswsc.png` (1408x768, 2.044 KB): Colección de 18 poses con etiquetas y cuadrícula.
   - `Sprites/Gemini_Generated_Image_l9u3col9u3col9u3.png` (1380x752, 1.751 KB): Pose Happy aislada pero con patrón de tablero de ajedrez horneado en los píxeles.
   - `Sprites/robot_error.png`, `Sprites/robot_error (1).png`, `Sprites/robot_sleeping.png`, `Sprites/robot_victory.png`: Tienen el patrón de ajedrez falso horneado en la imagen. No deben usarse directamente sin recorte/filtrado de sticker o deben preferirse las versiones limpias de `assets/`.
   - `Sprites/robot_happy.png` (705x558, 395 KB): Recorte limpio de la pose Happy con copa.

#### C. Activos de Manos Guía
- `assets/hand_left_realistic.png` (670x850, 560 KB): Ilustración realista de mano izquierda en vista dorsal.
- `assets/hand_right_realistic.png` (670x850, 558 KB): Ilustración realista de mano derecha en vista dorsal.
- En `index.html:126-165` y `337-375`, estas imágenes están integradas en elementos SVG con grupos `<g class="finger-unit">` posicionados con coordenadas precisas para cada yema de dedo.

#### D. Activos de Recompensa y Trofeos
- `assets/kids_gold_trophy.png` (1024x1024, 955 KB): Copa dorada con estrellas y cinta azul sobre fondo transparente alfa. Usada en pantalla de nivel completado.

---

### 3.3. Activos de Vídeo y Animación Pesada

1. `Sprites/3BqzFY3HM4hQrosUUUpkNCSF90u.mp4` (475 KB): Vídeo MP4 en la carpeta Sprites.
2. `assets/animated_bg.mp4`: **Inexistente en disco**.
   - En `index.html:25`, la etiqueta `<video>` tiene `<source src="assets/animated_bg.mp4" type="video/mp4" />`.
   - Al no existir el archivo, `main.js:973` captura el error y oculta el vídeo (`display: none`), mostrando el fondo estático.
3. `assets/Robot_typing_and_waving_20261001161235.gif` (9.916.846 B ~ 9,7 MB):
   - **Activo no referenciado**: Ningún archivo (`index.html`, `main.js`, `style.css`, `words.js`) hace referencia a este GIF gigante.
   - Pesa casi 10 MB, consumiendo espacio y ancho de banda si se cargara innecesariamente.

---

## 4. Análisis Detallado del Código Existente

### 4.1. Estructura de Niveles (`words.js`)
`words.js` posee una arquitectura de datos bien estructurada y pedagógicamente graduada que debe preservarse:
- `ROBY_BELTS`: 4 rangos de progreso (Blanco, Amarillo, Verde, Negro/Corona).
- `KIDS_LEVELS`: 8 niveles progresivos:
  1. `1-indices`: F y J continuos y con espacio suave (12 palabras/secuencias).
  2. `2-filaguia`: A, S, D, F, J, K, L, Ñ (12 palabras).
  3. `3-vocales-ei`: Alcance vertical de dedos corazón (12 palabras).
  4. `4-expansion`: Vocales O, U y consonantes C, M, P, T (12 palabras).
  5. `5-frases`: Frases cortas y coordinación de barra espaciadora (12 frases).
  6. `6-cuentos`: Historias mágicas de una línea con todas las letras y tildes (10 frases).
  7. `7-chistes`: Signos de puntuación, mayúsculas y trabalenguas (8 frases).
  8. `8-galaxia`: Párrafos enriquecidos de maestría galáctica (3 textos largos).
- `getWordVisualInfo(text)`: Mapeo de texto a icono visual amigable.

### 4.2. Flujo de Entrada y Lógica de Teclas (`main.js`)
- **Mapeo de dedos (`FINGER_MAP`)**: Líneas 565-580:
  - `lp`: Meñique Izquierdo (`#ff7675`, rosa/coral)
  - `lr`: Anular Izquierdo (`#e17055`, naranja)
  - `lm`: Corazón Izquierdo (`#f9ca24`, amarillo)
  - `li`: Índice Izquierdo (`#2ed573`, verde menta)
  - `thumb-l`, `thumb-r`, `thumb`: Pulgares (`#70a1ff`, azul/violeta)
  - `ri`: Índice Derecho (`#00cec9`, celeste/azul cielo)
  - `rm`: Corazón Derecho (`#f9ca24`, amarillo)
  - `rr`: Anular Derecho (`#e17055`, naranja)
  - `rp`: Meñique Derecho (`#a29bfe`, lila)
- **Gestión de Teclas Muertas (Dead Keys / Acentos)**: Líneas 1417-1443: Soporte para la tecla `´` (acento) y diéresis con Shift.
- **Filtro benevolente anti-titubeo**: Líneas 1508-1519: Si el niño presiona repetidamente la misma tecla incorrecta en menos de 400ms, solo cuenta como 1 fallo.
- **Temporizador de Inactividad**: Línea 506: Temporizador fijo a 14 segundos (requisito pide `USER_STUCK` a los 2s y `SLEEPY` a los 25s).

### 4.3. Persistencia de Datos
- Actualmente se almacena bajo la clave `localStorage.getItem("mecano_kids_progress")` (líneas 1571-1638).
- Objeto almacenado: `{ unlockedLevel, stars: { 1..8 }, currentBelt }`.
- **Faltantes en persistencia**: No guarda accesorios desbloqueados de la mascota ni el mapa de calor de errores (`errorHeatmap`).

### 4.4. Síntesis de Voz
- Utiliza la Web Speech API en `speakText(text)` (líneas 251-303).
- Implementa selección de voz en español con scoring (`getVoiceScore`).
- **Problema de solapamiento**: Llama a `window.speechSynthesis.cancel()` indiscriminadamente. No hay cola priorizada (`VoiceQueue`), lo que interrumpe explicaciones si el usuario teclea rápido.

---

## 5. Matriz de Brechas y Necesidades de Refactorización

| Componente | Estado Actual | Requisito Objetivo | Plan de Refactorización |
|---|---|---|---|
| **Arquitectura** | Monolito procedural global (`main.js`). | Módulos ES estándar en carpetas independientes (`src/core/`, `src/vfx/`, `src/mascot/`, `src/keyboard/`, `src/audio/`). | Descomponer en módulos exportables sin estado global disperso. |
| **Bus de Eventos** | Inexistente. Llamadas directas y dependencias cruzadas. | `EventBus` tipado Pub/Sub con 7 eventos canónicos. | Implementar `src/core/event_bus.js` con suscripción, despacho y tipado estricto. |
| **Persistencia** | `localStorage` básico para estrellas y nivel. | `StorageManager` completo (estrellas, accesorios, `errorHeatmap`). | Crear `src/core/storage_manager.js`. |
| **Servidor Dev** | Inexistente. Ejecución directa de archivo local. | Servidor Node.js ligero sin dependencias externas (`server.js`). | Crear `server.js` nativo con `http`, `fs` y tipos MIME. |
| **Escena y Fondo** | `<video>` roto a `assets/animated_bg.mp4` + fallback jpg estático. | Escena interactiva reactiva sobre `Main Scene.png` con Parallax y partículas ambientales. | Implementar `src/vfx/scene_manager.js` desacoplando el vídeo. |
| **Efectos VFX** | Solo `launchConfetti()` en canvas. | Proyectiles Bézier, estallido de color de dedo, squash & stretch, resplandor Fever Mode. | Implementar `src/vfx/particle_engine.js` y `src/vfx/juice.js`. |
| **Mascota Roby** | `<img>` con cambio de `src` y clases CSS básicas. | Máquina de estados (6 estados), respiración sinusoidal, look-at angular ±4°, lip-sync, accesorios. | Implementar `src/mascot/mascot_fsm.js` y `src/mascot/mascot_animator.js`. |
| **Teclado y Manos** | Teclado oscuro con punto de color; manos laterales SVG rígidas. | Teclado 3D botón físico con colores pedagógicos; Ghost Hands superpuestas; pulsos no punitivos. | Implementar `src/keyboard/keyboard_view.js` y `src/keyboard/ghost_hands.js`. |
| **Audio** | 5 archivos WAV con `new Audio()`. | Motor Web Audio API procedural (pentatónica mayor), sonidos de fallo suaves de madera. | Implementar `src/audio/audio_engine.js`. |
| **Locución** | `speakText` directo con cancelaciones bruscas. | `VoiceQueue` inteligente con control de solapamiento y alternancia fonética/nombre. | Implementar `src/audio/voice_queue.js`. |
| **Accesibilidad** | Solo escalado de fuente básico (125%, 150%). | Sliders de volumen independientes, tipografía dislexia, alto contraste. | Implementar panel de accesibilidad en `src/audio/` y estilos CSS dedicados. |
| **Pruebas** | Inexistente. | Suite automatizada `test_harness.js` con salida código 0. | Implementar arnés de simulación completa en Node.js. |

---

## 6. Recomendaciones y Hoja de Ruta para los Agentes Especialistas

### Para el Agente 0 (Arquitectura Central y Persistencia):
1. Crear `server.js` nativo en Node.js que sirva archivos estáticos en el puerto 3000 con soporte para ES modules (`type: "module"` en `index.html`).
2. Diseñar `src/core/event_bus.js` asegurando los 7 eventos requeridos:
   - `KEY_TARGET_CHANGED { key, finger, hand, screenPosition }`
   - `KEY_PRESSED_SUCCESS { key, comboCount, accuracy, keyScreenPosition }`
   - `KEY_PRESSED_FAIL { pressedKey, expectedKey, consecutiveErrors }`
   - `USER_STUCK { expectedKey, finger, idleTimeMs }`
   - `FEVER_MODE_CHANGED { isActive, multiplier }`
   - `MASCOT_SPEAK_REQUEST { text, audioId, priority, emotion }`
   - `LEVEL_COMPLETED { levelId, stars, accuracy, wpm }`
3. Implementar `src/core/storage_manager.js` con soporte para estrellas, accesorios y `errorHeatmap`.

### Para el Agente 1 (Arte Técnico y Motor de Partículas VFX):
1. Usar `Sprites/Main Scene.png` (o `assets/main_scene.png`) como base para la escena interactiva con capas Parallax.
2. Eliminar la etiqueta `<video>` innecesaria en `index.html`.
3. Desarrollar el sistema de proyectiles en curva Bézier cuadrática que nazca de `keyScreenPosition` y vuele hacia la mascota o la barra superior, culminando en un estallido con los colores del dedo activo.
4. Implementar `applySquashAndStretch` y el filtro de iluminación para Modo Fiebre.

### Para el Agente 2 (Mascota e IA Emocional):
1. Aprovechar los sprites limpios de `assets/robot_*.png` y extraer poses adicionales de `Sprites/Sprites Global.png` para animaciones continuas.
2. Construir la máquina de estados con los 6 estados canónicos: `IDLE`, `FLOW_DANCE`, `HELPER_POINTING`, `SLEEPY`, `HIGH_FIVE_WAIT`, y transiciones reactivas.
3. Incorporar oscilación sinusoidal continua para respiración y rotación angular de mirada (-4° a +4°) según la posición de la tecla activa en pantalla.

### Para el Agente 3 (Teclado Ergonómico y Pedagogía):
1. Transformar el teclado en pantalla a botones físicos 3D con colores pedagógicos vibrantes en cada tecla (no solo un punto minúsculo).
2. Crear las manos translúcidas (*Ghost Hands*) superpuestas de forma ergonómica sobre el teclado, activando el brillo del dedo correspondiente y el recordatorio a los 2 segundos de inactividad.
3. Asegurar marcas táctiles distintivas en `F` y `J`.

### Para el Agente 4 (Audio Procedural y Accesibilidad):
1. Crear el sintetizador Web Audio API que genere tonos de la escala pentatónica mayor en frecuencias exactas (Do4 261,63Hz, Re4 293,66Hz, Mi4 329,63Hz, Sol4 392,00Hz, La4 440,00Hz) aumentando de octava en rachas.
2. Desarrollar `VoiceQueue` para ordenar las frases de Roby evitando que se atropellen.
3. Implementar los controles de accesibilidad: volúmenes independientes (Música, Efectos, Voz), modo alto contraste y alternancia de tipografía para dislexia.

---

Este informe documenta con exactitud matemática y visual el punto de partida del proyecto Mecano y constituye el plano de referencia para la transformación arquitectónica.
