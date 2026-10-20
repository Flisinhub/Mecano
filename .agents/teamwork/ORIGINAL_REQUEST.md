# Original User Request

## Initial Request — 2026-10-18T09:14:58Z

Orquestador y Arquitecto Principal con 4 especialistas en paralelo (Arte Técnico, Mascota e IA Emocional, UI/Pedagogía de Teclado, Audio Procedural y Accesibilidad).

Transformación integral de "Mecano", videojuego infantil educativo (6 a 11 años) para aprender mecanografía sin frustración, estructurado mediante una arquitectura desacoplada basada en un bus de eventos central (`EventBus`), animaciones y partículas procedurales ("Game Juice"), mascota reactiva con máquina de estados y lip-sync, teclado ergonómico 3D con manos guía, y audio adaptativo con escala musical procedural.

Working directory: c:\mecano\Mecano-main\Mecano-main
Integrity mode: development

## Requirements

### R1. Arquitectura Central, Bus de Eventos y Persistencia (Agente 0)
- Estructurar el código en módulos ES estándar dentro de directorios aislados (`src/core/`, `src/vfx/`, `src/mascot/`, `src/keyboard/`, `src/audio/`) para prevenir colisiones entre agentes.
- Implementar `EventBus` tipado Pub/Sub con los eventos:
  - `KEY_TARGET_CHANGED { key, finger, hand, screenPosition }`
  - `KEY_PRESSED_SUCCESS { key, comboCount, accuracy, keyScreenPosition }`
  - `KEY_PRESSED_FAIL { pressedKey, expectedKey, consecutiveErrors }`
  - `USER_STUCK { expectedKey, finger, idleTimeMs }`
  - `FEVER_MODE_CHANGED { isActive, multiplier }`
  - `MASCOT_SPEAK_REQUEST { text, audioId, priority, emotion }`
  - `LEVEL_COMPLETED { levelId, stars, accuracy, wpm }`
- Implementar `StorageManager` para persistir estrellas por nivel, accesorios desbloqueados de la mascota y mapa de calor de errores por letra (`errorHeatmap`).
- Desacoplar o reemplazar la dependencia pesada de video en segundo plano por el nuevo sistema de escena y animación en tiempo real. Proporcionar un servidor local ligero de desarrollo en Node.js.

### R2. Escena Viva, Arte Técnico y Motor de Partículas VFX (Agente 1)
- Contenedor de escenario reactivo con efecto Parallax suave sobre `Main Scene.png` y partículas ambientales flotantes (burbujas/estrellas suaves).
- Filtro de iluminación reactiva en Modo Fiebre (`FEVER_MODE_CHANGED`).
- Procesamiento visual unificado con contorno/sticker outline limpio de 3px y drop-shadow para los sprites recortados (`Sprites Global.png`, `Gemini_Generated_Image_*.png`).
- Motor de proyectiles mágicos en curva Bézier cuadrática disparados desde la tecla pulsada (`keyScreenPosition`) hacia la mascota o la barra de progreso, con estallido de partículas del color del dedo y función elástica `applySquashAndStretch`.

### R3. Mascota Interactiva, Animación Procedural e IA Emocional (Agente 2)
- Animador procedural sobre sprites: respiración sinusoidal en reposo, inclinación look-at (`-4deg` / `+4deg`) según posición de la tecla activa, y saltos con combo.
- Sincronización labial dinámica (lip-sync simulado con rebote/apertura) y bocadillo de diálogo estilo cómic con texto destacado.
- Máquina de estados finitos con 6 estados:
  - `IDLE`: Parpadeo y respiración suave.
  - `FLOW_DANCE`: Balanceo rítmico durante rachas de escritura fluida.
  - `HELPER_POINTING`: Señalización visual y frase de ayuda tras `USER_STUCK` indicando la tecla y el dedo correspondiente.
  - `SLEEPY`: Activado tras 25 segundos de inactividad con animación "Zzz...", con despertar alegre al pulsar cualquier tecla.
  - `HIGH_FIVE_WAIT`: Al completar nivel (`LEVEL_COMPLETED`), pide chocar los cinco con la tecla `Espacio` con explosión de confeti.
- Sistema de vestidor/accesorios (*socket* de accesorios: sombreros, gafas, coronas) desbloqueables mediante estrellas.

### R4. Teclado Ergonómico "Toy-Style", Manos Guía y Pedagogía Anti-Frustración (Agente 3)
- Teclado visual 3D estilo botón físico con marcas táctiles en `F` y `J`, siguiendo el estándar pedagógico de colores por dedo:
  - Meñiques (`Q,A,Z` / `P,Ñ,-`): Coral / Rojo suave.
  - Anulares (`W,S,X` / `O,L,.`): Naranja cálido.
  - Medios (`E,D,C` / `I,K,,`): Amarillo sol.
  - Índice Izquierdo (`R,F,V,T,G,B`): Verde menta.
  - Índice Derecho (`Y,H,N,U,J,M`): Azul cielo.
  - Pulgares (`Espacio`): Violeta mágico.
- Manos guía translúcidas (Ghost Hands) superpuestas con iluminación del dedo activo y animación indicativa si pasan más de 2 segundos.
- Lógica anti-frustración sin pantallas de Game Over ni deducción punitiva de puntos; la tecla errónea tiembla suavemente y la correcta resalta con un pulso luminoso.
- Progresión por micro-niveles estructurados (fila guía, superior, inferior, sílabas, palabras con imágenes).

### R5. Audio Procedural, Locución Inteligente y Accesibilidad (Agente 4)
- Motor de sonido con Web Audio API: escala pentatónica mayor procedural para aciertos sucesivos (Do, Re, Mi, Sol, La) y tono sordo de goma/madera en fallos.
- Gestor inteligente de voz (`VoiceQueue`) con Web Speech API: prevención de solapamiento, interjecciones cortas en alta velocidad y alternancia entre modo fonético y nombre de tecla.
- Panel de accesibilidad con control de volúmenes independientes (Música, Efectos, Voz), tipografía para dislexia (OpenDyslexic / Comic Sans redondeada) y modo de alto contraste.

### R6. Arnés de Verificación Automatizado y Pruebas Programáticas
- Crear un script ejecutable de verificación con Node.js (`test_harness.js` o similar) que simule eventos del `EventBus`, transiciones de la máquina de estados de la mascota, cálculo de precisión, progresión de niveles y persistencia en `StorageManager` sin depender de interacción manual.

## Acceptance Criteria

### Integración y Arquitectura
- [ ] Los módulos de cada agente residen en sus directorios independientes (`src/core/`, `src/vfx/`, `src/mascot/`, `src/keyboard/`, `src/audio/`) sin dependencias circulares.
- [ ] El `EventBus` despacha y suscribe todos los 7 eventos tipados sin errores en consola.
- [ ] La aplicación se ejecuta limpiamente a través del servidor local de desarrollo (`node server.js` o equivalente) cargando `index.html`.

### Efectos Visuales y Escena
- [ ] Al emitir `KEY_PRESSED_SUCCESS`, se instancia un proyectil con trayectoria parabólica/Bézier que termina en un estallido de partículas del color del dedo correspondiente.
- [ ] Al emitir `FEVER_MODE_CHANGED { isActive: true }`, se activa el efecto visual de resplandor dorado/arcoíris en la escena.
- [ ] La función `applySquashAndStretch` deforma y recupera elementos interactivos sin distorsión permanente.

### Mascota e IA Emocional
- [ ] La mascota ejecuta la respiración sinusoidal continua en estado `IDLE`.
- [ ] Al cambiar el objetivo a una tecla a la izquierda o derecha del teclado, la mascota rota hacia la dirección correspondiente.
- [ ] La máquina de estados transita adecuadamente a `HELPER_POINTING` tras el evento `USER_STUCK` y a `SLEEPY` tras 25 segundos de inactividad, despertando con una pulsación.
- [ ] El evento `LEVEL_COMPLETED` activa el estado `HIGH_FIVE_WAIT` y reacciona al pulsar la barra espaciadora.

### Teclado y Pedagogía
- [ ] Todas las teclas muestran los colores pedagógicos asignados a cada dedo y las teclas `F` y `J` tienen su marca física visual.
- [ ] Las manos guía iluminan el dedo correspondiente a la tecla esperada; tras 2 segundos de inactividad se inicia la animación de sugerencia de pulsación.
- [ ] Los errores nunca bloquean el juego ni muestran pantallas de derrota; activan retroalimentación visual no punitiva.

### Audio y Accesibilidad
- [ ] El audio Web Audio API incrementa el tono en la escala pentatónica en pulsaciones correctas consecutivas.
- [ ] La cola de voz `VoiceQueue` descarta o acorta frases si la velocidad de tecleo supera el umbral configurado, evitando voces encimadas.
- [ ] El panel de accesibilidad alterna correctamente la fuente para dislexia y el modo de alto contraste aplicando las clases CSS correspondientes.

### Verificación Programática
- [ ] La suite de pruebas automatizada (`node test_harness.js`) se ejecuta con código de salida 0 y valida el 100% de los módulos y contratos de eventos.
