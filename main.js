// =============================================================================
// MECANO AVENTURA KIDS - LÓGICA PRINCIPAL DEL JUEGO
// Con Roby la mascota interactiva, síntesis de voz, pedagogía de dedos y confeti
// =============================================================================

let currentWord = "";
let currentIndex = 0;
let lastWord = "";

let errors = 0;
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let level = 1;

let wordsCompleted = 0;
let wordsGoal = 6;

let startTime = Date.now();
let apmInterval = null;
let isPaused = true;
let gameStarted = false;
let pendingAccent = null;

let soundEnabled = true;
let voiceEnabled = true;
let animationEnabled = true;
let difficulty = "1-infantil";
let keyboardType = "completo";

// Sistema de Combos y Racha
let currentCombo = 0;
let bestCombo = 0;
let idleTimer = null;
let mascotMood = "happy";
let currentSpeechMessage = "";

// Elementos del DOM
const targetWordEl = document.getElementById("target-word");
const errorsEl = document.getElementById("errors");
const apmEl = document.getElementById("apm");
const ppmEl = document.getElementById("ppm");
const levelEl = document.getElementById("level");
const levelTitleDisplay = document.getElementById("level-title-display");
const wordsCountEl = document.getElementById("words-count");
const wordsGoalEl = document.getElementById("words-goal");
const accuracyEl = document.getElementById("accuracy");
const feedbackMessageEl = document.getElementById("feedback-message");
const wordCategoryBadge = document.getElementById("word-category-badge");
const comboCounter = document.getElementById("combo-counter");
const comboNumber = document.getElementById("combo-number");
const zoomToggleBtn = document.getElementById("zoom-toggle-btn");
const accessibilityTextSize = document.getElementById("accessibility-text-size");

// Mascota Roby
const mascotAvatar = document.getElementById("mascot-avatar");
const mascotSpeechText = document.getElementById("mascot-speech-text");
const mascotSpeakBtn = document.getElementById("mascot-speak-btn");
const mascotLessonTip = document.getElementById("mascot-lesson-tip");
const mascotBadge = document.getElementById("mascot-badge");
const mascotBubble = document.getElementById("mascot-bubble");
const voiceWaveIndicator = document.getElementById("voice-wave-indicator");
const mascotTipBar = document.getElementById("mascot-tip-bar");
const tipNextBtn = document.getElementById("tip-next-btn");

// Guía de manos y dedos para niños
const handCardLeft = document.getElementById("hand-card-left");
const handCardRight = document.getElementById("hand-card-right");
const hintArrowLeft = document.getElementById("hint-arrow-left");
const hintArrowRight = document.getElementById("hint-arrow-right");
const hintHandName = document.getElementById("hint-hand-name");
const hintFingerBadge = document.getElementById("hint-finger-badge");
const hintVisualHelper = document.getElementById("hint-visual-helper");

// Selector y prueba de voz de Roby
const voiceSelect = document.getElementById("voice-select");
const testVoiceBtn = document.getElementById("test-voice-btn");

// Modales y menús
const levelCompleteEl = document.getElementById("level-complete");
const levelCompleteCountEl = document.getElementById("level-complete-count");
const levelCompleteTitleEl = document.getElementById("level-complete-title");
const levelCompleteMessageEl = document.getElementById("level-complete-message");
const levelCompleteStatsSummary = document.getElementById("level-complete-stats-summary");
const levelCompleteMascotSpeech = document.getElementById("level-complete-mascot-speech");
const starsRatingEl = document.getElementById("stars-rating");
const nextLevelBtn = document.getElementById("next-level-btn");

const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const soundToggleBtn = document.getElementById("sound-toggle");
const voiceToggleBtn = document.getElementById("voice-toggle");
const animationToggleBtn = document.getElementById("animation-toggle");
const difficultySelect = document.getElementById("difficulty-select");
const keyboardSelect = document.getElementById("keyboard-select");

const startScreen = document.getElementById("start-screen");
const startDifficultySelect = document.getElementById("start-difficulty-select");
const startKeyboardSelect = document.getElementById("start-keyboard-select");
const startGameBtn = document.getElementById("start-game-btn");

const difficultyDescription = document.getElementById("difficulty-description");
const startDifficultyDescription = document.getElementById("start-difficulty-description");
const backgroundVideo = document.getElementById("background-video");

// SONIDOS
const goodSound = new Audio("assets/sounds/good.wav");
const errorSound = new Audio("assets/sounds/error.wav");
const keyHitSound = new Audio("assets/sounds/key-hit.wav");
const levelUpSound = new Audio("assets/sounds/level-up.wav");
const buttonClickSound = new Audio("assets/sounds/button-click.wav");

goodSound.volume = 0.45;
errorSound.volume = 0.30;
keyHitSound.volume = 0.20;
levelUpSound.volume = 0.55;
buttonClickSound.volume = 0.25;

function playSound(sound) {
  if (!soundEnabled) return;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

// =============================================================================
// 🗣️ SÍNTESIS DE VOZ DE ROBY (WEB SPEECH API CON VOCES NATURALES HUMANAS)
// =============================================================================

let availableVoices = [];
let selectedVoiceURI = localStorage.getItem("mecano_selected_voice") || "auto";

/**
 * Puntuación de calidad de voz:
 * Prioriza voces neuronales / naturales que no suenan robóticas ni metálicas,
 * evitando las voces sintéticas antiguas SAPI de escritorio de Windows.
 */
function getVoiceScore(voice) {
  let score = 0;
  const name = (voice.name || "").toLowerCase();
  const lang = (voice.lang || "").toLowerCase();

  // Preferir español
  if (!lang.startsWith("es")) return -999;

  // 1. Voces neuronales online de Microsoft / Edge (ultra realistas y humanas)
  if (name.includes("natural") || name.includes("online")) score += 200;

  // 2. Voces de Google (Google español es sumamente clara, natural y sin artefactos)
  if (name.includes("google")) score += 150;

  // 3. Voces OneCore modernas de Windows (Laura, Alvaro, Elvira, Pablo)
  if (name.includes("laura") || name.includes("elvira") || name.includes("alvaro") || name.includes("pablo")) score += 120;
  if (name.includes("monica") || name.includes("jorge") || name.includes("paulina") || name.includes("diego") || name.includes("carlos")) score += 80;

  // 4. Penalizar fuertemente voces sintéticas antiguas SAPI Desktop (suenan a robot metálico de lata)
  if (name.includes("desktop") || name.includes("sapi")) score -= 150;

  // Preferencia regional por español de España o variantes claras
  if (lang === "es-es" || lang === "es_es") score += 10;
  if (voice.default) score += 5;

  return score;
}

function getBestSpanishVoice() {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Si el usuario eligió manualmente una voz en Ajustes
  if (selectedVoiceURI && selectedVoiceURI !== "auto") {
    const customVoice = voices.find(v => v.voiceURI === selectedVoiceURI || v.name === selectedVoiceURI);
    if (customVoice) return customVoice;
  }

  // Filtrar voces en español y ordenarlas por naturalidad
  const spanishVoices = voices.filter(v => (v.lang || "").toLowerCase().startsWith("es"));
  if (spanishVoices.length === 0) {
    return voices.find(v => v.default) || voices[0];
  }

  spanishVoices.sort((a, b) => getVoiceScore(b) - getVoiceScore(a));
  return spanishVoices[0];
}

function populateVoiceList() {
  if (!window.speechSynthesis || !voiceSelect) return;
  availableVoices = window.speechSynthesis.getVoices();
  if (!availableVoices || availableVoices.length === 0) return;

  const esVoices = availableVoices.filter(v => (v.lang || "").toLowerCase().startsWith("es"));
  esVoices.sort((a, b) => getVoiceScore(b) - getVoiceScore(a));

  voiceSelect.innerHTML = "";

  // Opción inteligente automática
  const autoOption = document.createElement("option");
  autoOption.value = "auto";
  const bestVoice = esVoices[0];
  const bestName = bestVoice ? ` (${bestVoice.name.replace(/Microsoft |Google /g, '')})` : "";
  autoOption.textContent = `⭐ Automática (Más Natural)${bestName}`;
  voiceSelect.appendChild(autoOption);

  esVoices.forEach((voice) => {
    const opt = document.createElement("option");
    opt.value = voice.voiceURI || voice.name;
    const isNatural = voice.name.toLowerCase().includes("natural") || voice.name.toLowerCase().includes("google");
    const prefix = isNatural ? "✨ " : "👤 ";
    opt.textContent = `${prefix}${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(opt);
  });

  if (selectedVoiceURI && (selectedVoiceURI === "auto" || esVoices.some(v => (v.voiceURI || v.name) === selectedVoiceURI))) {
    voiceSelect.value = selectedVoiceURI;
  } else {
    voiceSelect.value = "auto";
  }
}

// 🔊 Inicialización anticipada para navegadores basados en Chromium / Edge
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    populateVoiceList();
  };
  populateVoiceList();
}

function speakText(text) {
  if (!voiceEnabled || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    // Limpieza de emojis y caracteres que provocan lecturas raras
    const cleanText = text
      .replace(/<[^>]*>/g, '')
      .replace(/[💡⭐🎉🔥🚀😂🐉🌀🏰🧩🌲🏴‍☠️🤚✋👉👈🌸🟠🟡🟢👍💎💜🍎🏎️🐾🎈🌟🦊🐢💖☀️💤👏🕊️🎨🦸🪄💥]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // CRÍTICO: pitch = 1.0 evita que los sintetizadores de Windows activen el filtro DSP
    // que causa el sonido metálico y robótico.
    utterance.pitch = 1.0;
    utterance.rate = 0.98; // Ritmo humano natural, amigable y claro

    const bestVoice = getBestSpanishVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang || "es-ES";
    } else {
      utterance.lang = "es-ES";
    }

    if (voiceWaveIndicator) voiceWaveIndicator.classList.add("is-speaking");
    if (mascotAvatar) {
      mascotAvatar.classList.remove("mascot-idle", "mascot-comfort", "mascot-thinking", "mascot-cheering", "mascot-sleeping");
      mascotAvatar.classList.add("mascot-talking");
    }

    const onSpeechEnd = () => {
      if (voiceWaveIndicator) voiceWaveIndicator.classList.remove("is-speaking");
      if (mascotAvatar) {
        mascotAvatar.classList.remove("mascot-talking");
        if (mascotMood === "happy") mascotAvatar.classList.add("mascot-idle");
        else if (mascotMood === "thinking" || mascotMood === "reading") mascotAvatar.classList.add("mascot-thinking");
        else if (mascotMood === "victory") mascotAvatar.classList.add("mascot-cheering");
        else if (mascotMood === "error") mascotAvatar.classList.add("mascot-comfort");
        else if (mascotMood === "sleeping") mascotAvatar.classList.add("mascot-sleeping");
      }
    };

    utterance.onend = onSpeechEnd;
    utterance.onerror = onSpeechEnd;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis unavailable:", err);
  }
}

// =============================================================================
// 🤖 ESTADO Y EXPRESIONES DE ROBY LA MASCOTA
// =============================================================================

const MASCOT_SPRITES = {
  happy: "assets/robot_happy.png",
  reading: "assets/robot_reading.png",
  thinking: "assets/robot_thinking.png",
  error: "assets/robot_error.png",
  victory: "assets/robot_victory.png",
  sleeping: "assets/robot_sleeping.png"
};

const ROBY_PHRASES = {
  combos: {
    3: [
      "¡Tres seguidas! ¡Buen comienzo! 🚀",
      "¡Qué bien apuntas a las teclas! 🎯",
      "¡Tus dedos ya han calentado motores! 🔥"
    ],
    5: [
      "¡Racha de 5 seguidas! ¡Tus dedos vuelan! ⚡",
      "¡Cinco aciertos! ¡Estás hecho un artista! 🎨",
      "¡Bravo! ¡Sigue ese ritmo de campeón! 🌟"
    ],
    8: [
      "¡Ocho seguidas sin fallar! ¡Qué puntería! 🎯",
      "¡Menuda velocidad! ¡Roby se emociona! 🤩",
      "¡Eres imparable! ¡Volar sobre el teclado es mágico! 🕊️"
    ],
    10: [
      "¡Racha de 10! ¡Eres una estrella de la mecanografía! ⭐",
      "¡Diez perfectas! ¡Roby está alucinando en colores! 🌈",
      "¡Sensacional! ¡Tus dedos conocen el teclado de memoria! 🧠"
    ],
    15: [
      "¡15 seguidas! ¡El récord del reino está temblando! 🏰🔥",
      "¡Increíble! ¡Tienes superpoderes en las manos! 🦸",
      "¡15 aciertos! ¡Te mereces un trofeo galáctico! 🏆"
    ],
    20: [
      "¡Modo robot súper maestro activado! ¡Imparable! 🤖💥",
      "¡20 seguidas! ¡La magia de la mecanografía fluye en ti! 🪄✨"
    ]
  },
  wordsCompleted: [
    "¡Palabra completada! ¡Qué crack! 🌟",
    "¡Bieeeen hecho! ¡A por la siguiente! 🎈",
    "¡Esa ha sido rapidísima! 🏎️",
    "¡Qué dedos más listos tienes! 🐾",
    "¡Choca esos cinco conmigo! ✋🤖",
    "¡Punto para ti, campeón/a! 🎯",
    "¡Excelente trabajo! ¡Me encanta cómo tecleas! 💖",
    "¡Otra palabra al saco! ¡Suma y sigue! 🎒",
    "¡Maravilloso! ¡Tus dedos se deslizan como patines! ⛸️",
    "¡Qué fácil lo haces parecer! ¡Genial! 🎪"
  ],
  halfway: [
    "¡Ya llevamos la mitad del nivel! ¡Estás a un paso de ganar! 🏁",
    "¡Mitad del camino conseguida! ¡Vas como un cohete! 🚀",
    "¡Más de la mitad! ¡El trofeo ya casi es tuyo! 🏆"
  ],
  comfortErrors: [
    "¡No pasa nada! Respira hondo y busca la tecla iluminada. 🌸",
    "¡Tranquilo/a! Hasta los robots nos equivocamos de botón. 🤖",
    "¡Tómate tu tiempo, sin prisas! Esto no es una carrera. 🐢",
    "¡Casi la tienes! Vuelve a probar con el dedito indicado. 👆",
    "¡Esa tecla era traviesa! ¡Ahora la atrapas! 🦊",
    "¡Suelta los hombros, sonríe y a por ella! 😊",
    "¡Un pequeño despiste no frena a un supercampeón! 🛡️",
    "¡Equivocarse es el truco secreto para aprender! 💡"
  ],
  clicks: [
    "¡Jejeje, me haces cosquillas en los circuitos! ⚡😄",
    "¡Hola! ¿Sabías que tecleas súper bien? 👍",
    "¡Bip bop! Mis sensores dicen que hoy conseguirás 3 estrellas. ⭐",
    "¡Choca esos cinco conmigo! ✋🤖",
    "¡Recuerda: manos curvadas como si sostuvieras una manzana! 🍎",
    "¡Roby es tu fan número uno! ¡Sigue así! 💖",
    "¡Bip bop! ¡Tienes deditos de pianista veloz! 🎹",
    "¡Si te cansas, sacude las manitas como mariposas al viento! 🦋",
    "¡Aquí estoy para acompañarte en toda tu aventura! 🌟",
    "¡Tú concéntrate en la tecla luminosa y verás qué magia! ✨"
  ],
  wakeUp: [
    "¡Bip bop! ¡Buenos días! ¡Arriba esos dedos mágicos! ☀️",
    "¡Ostras, me quedé frito! ¡Vamos a seguir jugando! ⚡",
    "¡Roby despierto y listo para verte teclear! 🚀"
  ]
};

const ROBY_TIPS = [
  "💡 Postura de superhéroe: Espalda recta como un árbol y pies apoyados en el suelo.",
  "💡 Las marcas secretas: Las teclas F y J tienen dos marquitas para encontrarlas sin mirar.",
  "💡 Manitas de gatito: Curva tus dedos suavemente, como si acariciaras un gatito dormido.",
  "💡 La pantalla mágica: Mira la pantalla en vez de las teclas y confía en tus deditos.",
  "💡 Los pulgares amigos: Usa siempre cualquiera de tus dos pulgares para la barra de espacio.",
  "💡 El ritmo cantarín: Más vale escribir a un ritmo constante que correr y tropezar.",
  "💡 El meñique ágil: El dedito meñique es pequeño pero fuerte: úsalo para Intro y Mayús.",
  "💡 Respira y relájate: Si una letra te cuesta, suelta los hombros y busca la luz del teclado.",
  "💡 Paciencia de campeón: Aprender a teclear es como andar en bici: al principio cuesta, ¡luego vuelas!",
  "💡 Cuida tus ojos: Parpadea a menudo y mira a lo lejos de vez en cuando para descansar.",
  "💡 La fila guía: Deja tus dedos descansando en la fila central: A-S-D-F y J-K-L-Ñ."
];

let currentTipIndex = 0;

function cycleRobyTip(shouldSpeak = false) {
  currentTipIndex = (currentTipIndex + 1) % ROBY_TIPS.length;
  const tip = ROBY_TIPS[currentTipIndex];
  if (mascotLessonTip) {
    mascotLessonTip.textContent = tip.replace(/^💡\s*/, '');
  }
  setMascotMood("thinking", tip, shouldSpeak);
}

function handleMascotClick() {
  playSound(buttonClickSound);
  if (mascotAvatar) {
    mascotAvatar.classList.remove("mascot-clicked");
    void mascotAvatar.offsetWidth;
    mascotAvatar.classList.add("mascot-clicked");
  }

  const randomClickPhrase = ROBY_PHRASES.clicks[Math.floor(Math.random() * ROBY_PHRASES.clicks.length)];
  setMascotMood("happy", randomClickPhrase, true);
}

function setMascotMood(mood, speechMessage, shouldSpeak = false) {
  mascotMood = mood;
  if (mascotAvatar && MASCOT_SPRITES[mood]) {
    mascotAvatar.src = MASCOT_SPRITES[mood];
    mascotAvatar.className = "mascot-avatar";

    if (mood === "happy") {
      mascotAvatar.classList.add("mascot-idle");
      if (mascotBadge) {
        mascotBadge.textContent = "Roby 🤖";
        mascotBadge.className = "mascot-badge badge-happy";
      }
    } else if (mood === "reading") {
      mascotAvatar.classList.add("mascot-thinking");
      if (mascotBadge) {
        mascotBadge.textContent = "Roby 📖 Explicando";
        mascotBadge.className = "mascot-badge badge-tip";
      }
    } else if (mood === "thinking") {
      mascotAvatar.classList.add("mascot-thinking");
      if (mascotBadge) {
        mascotBadge.textContent = "Roby 💡 ¡Consejo!";
        mascotBadge.className = "mascot-badge badge-tip";
      }
    } else if (mood === "error") {
      mascotAvatar.classList.add("mascot-comfort");
      if (mascotBadge) {
        mascotBadge.textContent = "Roby 💖 ¡Tú puedes!";
        mascotBadge.className = "mascot-badge badge-comfort";
      }
    } else if (mood === "victory") {
      mascotAvatar.classList.add("mascot-cheering");
      if (mascotBadge) {
        mascotBadge.textContent = "Roby 🏆 ¡Genial!";
        mascotBadge.className = "mascot-badge badge-victory";
      }
    } else if (mood === "sleeping") {
      mascotAvatar.classList.add("mascot-sleeping");
      if (mascotBadge) {
        mascotBadge.textContent = "Roby 💤 Zzz...";
        mascotBadge.className = "mascot-badge badge-sleeping";
      }
    }
  }

  if (speechMessage && mascotSpeechText) {
    currentSpeechMessage = speechMessage;
    mascotSpeechText.textContent = speechMessage;

    if (mascotBubble) {
      mascotBubble.classList.remove("bubble-pop");
      void mascotBubble.offsetWidth;
      mascotBubble.classList.add("bubble-pop");
    }

    if (shouldSpeak) {
      speakText(speechMessage);
    }
  }
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  if (!gameStarted || isPaused) return;

  if (mascotMood === "sleeping") {
    const wakeMsg = ROBY_PHRASES.wakeUp[Math.floor(Math.random() * ROBY_PHRASES.wakeUp.length)];
    setMascotMood("happy", wakeMsg, false);
  }

  idleTimer = setTimeout(() => {
    if (!gameStarted || isPaused) return;
    setMascotMood("sleeping", "Zzz... ¿Te has dormido? Pulsa una tecla para despertar a Roby.", true);
  }, 14000);
}

// Lecciones y consejos pedagógicos de Roby por cada nivel
const LEVEL_LESSONS = {
  "1-infantil": {
    name: "🌲 El Bosque de las Vocales",
    speech: "¡Hola! En este nivel practicaremos palabras cortitas. ¡Mira la tecla que se ilumina!",
    tip: "💡 Consejo de Roby: Coloca tus dedos índices en la F y la J. ¡Tienen marquitas para descansar las manos ahí!"
  },
  "2-basico": {
    name: "🏴‍☠️ La Isla Pirata Mágica",
    speech: "¡Rumbo a la Isla Pirata! Aquí practicaremos palabras mágicas con acentos.",
    tip: "💡 Consejo de Roby: Para escribir acentos, pulsa primero la tecla del acento (´) y luego la vocal."
  },
  "3-principiante": {
    name: "🏰 El Reino de los Cuentos",
    speech: "¡Había una vez...! Vamos a escribir frases completas de historias mágicas.",
    tip: "💡 Consejo de Roby: Usa los dos pulgares para la barra de espacio al final de cada palabra."
  },
  "4-intermedio": {
    name: "🧩 Adivinanzas Infantiles",
    speech: "¡Hora de adivinar! Lee la adivinanza y escribe la respuesta divertida.",
    tip: "💡 Consejo de Roby: ¡Intenta no mirar las manos! Mira la pantalla y confía en tus deditos."
  },
  "5-avanzado": {
    name: "😂 Club de Chistes",
    speech: "¡A reírnos un rato! Escribiremos chistes divertidos con signos de exclamación y risas.",
    tip: "💡 Consejo de Roby: Mantén un ritmo suave y constante, como si cantaras una canción."
  },
  "6-experto": {
    name: "🌀 Trabalenguas Traviesos",
    speech: "¡Cuidado no se te trabe la lengua ni los dedos! A ver qué tal este trabalenguas.",
    tip: "💡 Consejo de Roby: El dedo meñique es pequeño pero muy ágil. ¡Úsalo para la tecla Mayús!"
  },
  "7-maestria": {
    name: "🚀 Expedición Galáctica",
    speech: "¡3, 2, 1... Despegue! Escribiremos relatos espaciales rumbo a las estrellas.",
    tip: "💡 Consejo de Roby: Mantén la espalda recta y las muñecas relajadas sobre la mesa."
  },
  "8-absurdo": {
    name: "🐉 El Desafío del Dragón",
    speech: "¡El reto definitivo! El Dragón Robot quiere ver la magia de tus pulsaciones.",
    tip: "💡 Consejo de Roby: ¡Concéntrate al máximo, supercampeón! ¡Tú puedes lograr las 3 estrellas!"
  }
};

function updateLessonInfo(speakLesson = false) {
  const lesson = LEVEL_LESSONS[difficulty] || LEVEL_LESSONS["1-infantil"];
  if (wordCategoryBadge) wordCategoryBadge.textContent = lesson.name;
  if (levelTitleDisplay) levelTitleDisplay.textContent = lesson.name;
  if (mascotLessonTip) mascotLessonTip.textContent = lesson.tip;
  setMascotMood("reading", lesson.speech, speakLesson);
}

// =============================================================================
// 🖐️ GUÍA PEDAGÓGICA DE DEDOS
// =============================================================================

const FINGER_MAP = {
  // Mano Izquierda
  "lp": { hand: "left", id: "fg-lp", colorName: "Rosa", emoji: "🌸", label: "Dedo Rosa 🌸 (Izquierda)" },
  "lr": { hand: "left", id: "fg-lr", colorName: "Naranja", emoji: "🟠", label: "Dedo Naranja 🟠 (Izquierda)" },
  "lm": { hand: "left", id: "fg-lm", colorName: "Amarillo", emoji: "🟡", label: "Dedo Amarillo 🟡 (Izquierda)" },
  "li": { hand: "left", id: "fg-li", colorName: "Verde", emoji: "🟢", label: "Dedo Verde 🟢 (Izquierda)" },
  // Pulgares
  "thumb-l": { hand: "left", id: "fg-thumb-l", colorName: "Azul", emoji: "👍", label: "Pulgar Izquierdo 👍 (Azul)" },
  "thumb-r": { hand: "right", id: "fg-thumb-r", colorName: "Azul", emoji: "👍", label: "Pulgar Derecho 👍 (Alt Gr)" },
  "thumb": { hand: "both", id: ["fg-thumb-l", "fg-thumb-r"], colorName: "Azul", emoji: "👍", label: "Cualquier Pulgar 👍 (Espacio)" },
  // Mano Derecha
  "ri": { hand: "right", id: "fg-ri", colorName: "Celeste", emoji: "💎", label: "Dedo Celeste 💎 (Derecha)" },
  "rm": { hand: "right", id: "fg-rm", colorName: "Amarillo", emoji: "🟡", label: "Dedo Amarillo 🟡 (Derecha)" },
  "rr": { hand: "right", id: "fg-rr", colorName: "Naranja", emoji: "🟠", label: "Dedo Naranja 🟠 (Derecha)" },
  "rp": { hand: "right", id: "fg-rp", colorName: "Lila", emoji: "💜", label: "Dedo Lila 💜 (Derecha)" }
};

function updateFingerGuide(nextChar) {
  // Limpiar iluminaciones de todos los dedos SVG
  document.querySelectorAll(".finger-unit").forEach(fu => fu.classList.remove("is-active-finger"));

  // Resetear estados visuales de ambas manitas
  if (handCardLeft) handCardLeft.classList.remove("is-active-hand", "is-dimmed-hand");
  if (handCardRight) handCardRight.classList.remove("is-active-hand", "is-dimmed-hand");

  if (!nextChar) {
    if (hintFingerBadge) {
      hintFingerBadge.textContent = "¡Misión completada! ⭐";
      hintFingerBadge.className = "hint-badge dot-li";
    }
    if (hintHandName) hintHandName.textContent = "¡Buen trabajo!";
    if (hintArrowLeft) hintArrowLeft.style.visibility = "hidden";
    if (hintArrowRight) hintArrowRight.style.visibility = "hidden";
    if (hintVisualHelper) hintVisualHelper.textContent = "⭐ ¡Has completado el texto!";
    return;
  }

  function activateFingerId(fId) {
    const data = FINGER_MAP[fId];
    if (!data) return;
    if (Array.isArray(data.id)) {
      data.id.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("is-active-finger");
      });
    } else {
      const el = document.getElementById(data.id);
      if (el) el.classList.add("is-active-finger");
    }
  }

  // 1. ESPACIO
  if (nextChar === " ") {
    if (handCardLeft) handCardLeft.classList.add("is-active-hand");
    if (handCardRight) handCardRight.classList.add("is-active-hand");
    if (hintHandName) hintHandName.textContent = "Ambos Pulgares";
    if (hintArrowLeft) hintArrowLeft.style.visibility = "visible";
    if (hintArrowRight) hintArrowRight.style.visibility = "visible";
    if (hintFingerBadge) {
      hintFingerBadge.className = "hint-badge dot-thumb";
      hintFingerBadge.textContent = "Cualquier Pulgar 👍 (Espacio)";
    }
    if (hintVisualHelper) hintVisualHelper.textContent = "⭐ Usa cualquiera de tus dos pulgares para el Espacio";
    activateFingerId("thumb");
    return;
  }

  // 2. INTRO / ENTER
  if (nextChar === "\n") {
    if (handCardRight) handCardRight.classList.add("is-active-hand");
    if (handCardLeft) handCardLeft.classList.add("is-dimmed-hand");
    if (hintHandName) hintHandName.textContent = "Mano Derecha";
    if (hintArrowLeft) hintArrowLeft.style.visibility = "hidden";
    if (hintArrowRight) hintArrowRight.style.visibility = "visible";
    if (hintFingerBadge) {
      hintFingerBadge.className = "hint-badge dot-rp";
      hintFingerBadge.textContent = "Dedo Lila 💜 (Intro)";
    }
    if (hintVisualHelper) hintVisualHelper.textContent = "⭐ Pulsa Intro con el meñique de tu mano derecha";
    activateFingerId("rp");
    return;
  }

  const baseChar = getKeyBaseChar(nextChar);
  const keyEl = document.querySelector(`.key[data-key="${baseChar}"]`);
  const baseFinger = (keyEl && keyEl.dataset.finger) ? keyEl.dataset.finger : "li";
  const baseFingerData = FINGER_MAP[baseFinger] || FINGER_MAP["li"];

  // =========================================================================
  // CASO 1: TILDE / ACENTO (á, é, í, ó, ú)
  // =========================================================================
  if (hasAccent(nextChar)) {
    // Si la tilde ya fue pulsada y está pendiente la vocal:
    if (pendingAccent === 'accent') {
      activateFingerId(baseFinger);
      if (baseFingerData.hand === "left") {
        if (handCardLeft) handCardLeft.classList.add("is-active-hand");
        if (handCardRight) handCardRight.classList.add("is-dimmed-hand");
        if (hintHandName) hintHandName.textContent = "Mano Izquierda";
        if (hintArrowLeft) hintArrowLeft.style.visibility = "visible";
        if (hintArrowRight) hintArrowRight.style.visibility = "hidden";
      } else {
        if (handCardRight) handCardRight.classList.add("is-active-hand");
        if (handCardLeft) handCardLeft.classList.add("is-dimmed-hand");
        if (hintHandName) hintHandName.textContent = "Mano Derecha";
        if (hintArrowLeft) hintArrowLeft.style.visibility = "hidden";
        if (hintArrowRight) hintArrowRight.style.visibility = "visible";
      }
      if (hintFingerBadge) {
        hintFingerBadge.className = `hint-badge dot-${baseFinger}`;
        hintFingerBadge.textContent = `¡Tilde lista! Ahora pulsa [${baseChar.toUpperCase()}] ${baseFingerData.emoji}`;
      }
      if (hintVisualHelper) {
        hintVisualHelper.textContent = `⭐ Tilde ya pulsada. Pulsa la vocal ${baseChar.toUpperCase()} con el dedito ${baseFingerData.colorName.toLowerCase()}`;
      }
      return;
    }

    // Antes de pulsar la tilde: SE ILUMINAN AMBOS DEDOS (Tilde `rp` + Vocal `baseFinger`)
    activateFingerId("rp"); // Tilde: Meñique derecho Lila 💜
    activateFingerId(baseFinger); // Vocal

    const tildeFingerData = FINGER_MAP["rp"];

    if (baseFingerData.hand === "left") {
      // Tilde en mano derecha, vocal en mano izquierda -> ¡AMBAS MANOS ACTIVAS!
      if (handCardLeft) handCardLeft.classList.add("is-active-hand");
      if (handCardRight) handCardRight.classList.add("is-active-hand");
      if (hintArrowLeft) hintArrowLeft.style.visibility = "visible";
      if (hintArrowRight) hintArrowRight.style.visibility = "visible";
      if (hintHandName) hintHandName.textContent = "Ambas Manos: Tilde + Vocal";
    } else {
      // Tilde y vocal ambas en mano derecha (í, ó, ú)
      if (handCardRight) handCardRight.classList.add("is-active-hand");
      if (handCardLeft) handCardLeft.classList.add("is-dimmed-hand");
      if (hintArrowLeft) hintArrowLeft.style.visibility = "hidden";
      if (hintArrowRight) hintArrowRight.style.visibility = "visible";
      if (hintHandName) hintHandName.textContent = "Mano Derecha: 2 pasos";
    }

    if (hintFingerBadge) {
      hintFingerBadge.className = "hint-badge hint-badge--combo";
      hintFingerBadge.innerHTML = `
        <span class="hint-step-pill dot-rp">1º Tilde ´ ${tildeFingerData.emoji}</span>
        <span class="hint-sep-arrow">➔</span>
        <span class="hint-step-pill dot-${baseFinger}">2º [${baseChar.toUpperCase()}] ${baseFingerData.emoji}</span>
      `;
    }
    if (hintVisualHelper) {
      hintVisualHelper.textContent = `⭐ Pulsa primero la Tilde ´ (Meñique Der. Lila) y después la vocal ${baseChar.toUpperCase()}`;
    }
    return;
  }

  // =========================================================================
  // CASO 2: CARÁCTER CON DIÉRESIS (ü, Ü)
  // =========================================================================
  if (hasDiaeresis(nextChar)) {
    activateFingerId("lp"); // Shift izquierdo
    activateFingerId("rp"); // Tecla tilde (diéresis ¨)
    activateFingerId(baseFinger); // Vocal u (índice der ri)

    if (handCardLeft) handCardLeft.classList.add("is-active-hand");
    if (handCardRight) handCardRight.classList.add("is-active-hand");
    if (hintArrowLeft) hintArrowLeft.style.visibility = "visible";
    if (hintArrowRight) hintArrowRight.style.visibility = "visible";
    if (hintHandName) hintHandName.textContent = "Combinación Diéresis (¨ + U)";

    if (hintFingerBadge) {
      hintFingerBadge.className = "hint-badge hint-badge--combo";
      hintFingerBadge.innerHTML = `
        <span class="hint-step-pill dot-lp">1º Mayús + ¨</span>
        <span class="hint-sep-arrow">➔</span>
        <span class="hint-step-pill dot-${baseFinger}">2º [${baseChar.toUpperCase()}] ${baseFingerData.emoji}</span>
      `;
    }
    if (hintVisualHelper) {
      hintVisualHelper.textContent = "⭐ Pulsa Mayús + Diéresis ¨ y luego la letra U";
    }
    return;
  }

  // =========================================================================
  // CASO 3: ALT GR (@, #, €, ~, |, \, {, }, [, ])
  // =========================================================================
  if (requiresAltGr(nextChar)) {
    activateFingerId("thumb-r"); // Pulgar derecho para Alt Gr
    activateFingerId(baseFinger); // Dedo de la tecla base

    if (handCardLeft) handCardLeft.classList.add("is-active-hand");
    if (handCardRight) handCardRight.classList.add("is-active-hand");
    if (hintArrowLeft) hintArrowLeft.style.visibility = "visible";
    if (hintArrowRight) hintArrowRight.style.visibility = "visible";
    if (hintHandName) hintHandName.textContent = "Ambas Manos: Alt Gr + Tecla";

    if (hintFingerBadge) {
      hintFingerBadge.className = "hint-badge hint-badge--combo";
      hintFingerBadge.innerHTML = `
        <span class="hint-step-pill dot-thumb-r">Alt Gr (Pulgar 👍)</span>
        <span class="hint-sep-arrow">+</span>
        <span class="hint-step-pill dot-${baseFinger}">Tecla [${baseChar.toUpperCase()}] ${baseFingerData.emoji}</span>
      `;
    }
    if (hintVisualHelper) {
      hintVisualHelper.textContent = `⭐ Mantén pulsado Alt Gr con el pulgar derecho y pulsa [${baseChar.toUpperCase()}] para escribir ${nextChar}`;
    }
    return;
  }

  // =========================================================================
  // CASO 4: MAYÚSCULAS O SÍMBOLOS CON SHIFT (! " · $ % & / ( ) = ; : _ ?)
  // =========================================================================
  const isUpper = (nextChar === nextChar.toUpperCase() && nextChar !== nextChar.toLowerCase());
  const isShiftSymbol = requiresShift(nextChar) || /[;:_]/.test(nextChar);

  if (isUpper || isShiftSymbol) {
    const shiftFinger = baseFinger.startsWith("r") ? "lp" : "rp";
    activateFingerId(shiftFinger);
    activateFingerId(baseFinger);

    const shiftData = FINGER_MAP[shiftFinger];

    if (handCardLeft) handCardLeft.classList.add("is-active-hand");
    if (handCardRight) handCardRight.classList.add("is-active-hand");
    if (hintArrowLeft) hintArrowLeft.style.visibility = "visible";
    if (hintArrowRight) hintArrowRight.style.visibility = "visible";
    if (hintHandName) hintHandName.textContent = "Ambas Manos: Mayús + Tecla";

    if (hintFingerBadge) {
      hintFingerBadge.className = "hint-badge hint-badge--combo";
      hintFingerBadge.innerHTML = `
        <span class="hint-step-pill dot-${shiftFinger}">Mayús ⇧ (${shiftData.colorName} ${shiftData.emoji})</span>
        <span class="hint-sep-arrow">+</span>
        <span class="hint-step-pill dot-${baseFinger}">[${baseChar.toUpperCase()}] ${baseFingerData.emoji}</span>
      `;
    }
    if (hintVisualHelper) {
      hintVisualHelper.textContent = `⭐ Mantén pulsada Mayús (${shiftData.colorName}) y pulsa [${baseChar.toUpperCase()}] (${baseFingerData.colorName})`;
    }
    return;
  }

  // =========================================================================
  // CASO 5: CARÁCTER DIRECTO (1 sola tecla)
  // =========================================================================
  activateFingerId(baseFinger);

  if (baseFingerData.hand === "left") {
    if (handCardLeft) handCardLeft.classList.add("is-active-hand");
    if (handCardRight) handCardRight.classList.add("is-dimmed-hand");
    if (hintHandName) hintHandName.textContent = "Mano Izquierda";
    if (hintArrowLeft) hintArrowLeft.style.visibility = "visible";
    if (hintArrowRight) hintArrowRight.style.visibility = "hidden";
  } else {
    if (handCardRight) handCardRight.classList.add("is-active-hand");
    if (handCardLeft) handCardLeft.classList.add("is-dimmed-hand");
    if (hintHandName) hintHandName.textContent = "Mano Derecha";
    if (hintArrowLeft) hintArrowLeft.style.visibility = "hidden";
    if (hintArrowRight) hintArrowRight.style.visibility = "visible";
  }

  if (hintFingerBadge) {
    hintFingerBadge.className = `hint-badge dot-${baseFinger}`;
    hintFingerBadge.textContent = baseFingerData.label;
  }
  if (hintVisualHelper) {
    hintVisualHelper.textContent = `⭐ Usa el dedito ${baseFingerData.colorName.toLowerCase()} iluminado`;
  }
}

// =============================================================================
// 🎉 CONFETI CELEBRATORIO EN CANVAS
// =============================================================================

function launchConfetti(duration = 2600) {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ["#ff7675", "#74b9ff", "#ffeaa7", "#55efc4", "#a29bfe", "#fd79a8", "#ffd32a", "#00cec9"];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 260,
      y: canvas.height * 0.45 + (Math.random() - 0.5) * 120,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 1) * 14 - 3,
      size: Math.random() * 9 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
      opacity: 1
    });
  }

  const startTime = Date.now();

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startTime;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.38; // Gravedad
      p.rotation += p.vRot;

      if (elapsed > duration * 0.7) {
        p.opacity = Math.max(0, 1 - (elapsed - duration * 0.7) / (duration * 0.3));
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    if (elapsed < duration) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  requestAnimationFrame(animate);
}

// =============================================================================
// CONFIGURACIONES Y AUDIO
// =============================================================================

function updateOptionButtons() {
  soundToggleBtn.textContent = soundEnabled ? "ON" : "OFF";
  soundToggleBtn.classList.toggle("off", !soundEnabled);

  if (voiceToggleBtn) {
    voiceToggleBtn.textContent = voiceEnabled ? "ON" : "OFF";
    voiceToggleBtn.classList.toggle("off", !voiceEnabled);
  }

  animationToggleBtn.textContent = animationEnabled ? "ON" : "OFF";
  animationToggleBtn.classList.toggle("off", !animationEnabled);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  updateOptionButtons();
  if (soundEnabled) playSound(buttonClickSound);
}

function toggleVoice() {
  voiceEnabled = !voiceEnabled;
  updateOptionButtons();
  playSound(buttonClickSound);
  if (voiceEnabled) {
    speakText("¡Voz de Roby activada!");
  } else if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function toggleAnimation() {
  playSound(buttonClickSound);
  animationEnabled = !animationEnabled;
  updateOptionButtons();

  if (animationEnabled) {
    backgroundVideo.style.display = "block";
    backgroundVideo.play().catch(() => {});
  } else {
    backgroundVideo.pause();
    backgroundVideo.style.display = "none";
  }
}

function updateKeyboardVisibility() {
  const keyboard = document.querySelector(".keyboard");
  if (!keyboard) return;
  if (keyboardType === "infantil") {
    keyboard.classList.add("keyboard-infantil");
  } else {
    keyboard.classList.remove("keyboard-infantil");
  }
}

function toggleKeyboardType() {
  keyboardType = keyboardSelect.value;
  startKeyboardSelect.value = keyboardType;
  updateKeyboardVisibility();
}

function openSettings() {
  playSound(buttonClickSound);
  settingsPanel.classList.remove("hidden");
}

function closeSettings() {
  playSound(buttonClickSound);
  settingsPanel.classList.add("hidden");
}

function handleVideoFallback() {
  backgroundVideo.addEventListener("error", () => {
    backgroundVideo.style.display = "none";
  });

  backgroundVideo.addEventListener("loadeddata", () => {
    if (animationEnabled) {
      backgroundVideo.style.display = "block";
    }
  });
}

function getDifficultyDescription(value) {
  const descriptions = {
    "1-infantil": "Palabras cortas y dulces (sol, oso, gato, luna). ¡Ideal para empezar a familiarizarse sin prisas!",
    "2-basico": "Palabras mágicas y piratas con acentos suaves (dragón, cohete, estrella, tesoro). ¡Para ganar soltura!",
    "3-principiante": "Frases sencillas de cuentos fantásticos para escribir coordinando ambas manos.",
    "4-intermedio": "¡Adivinanzas infantiles! Lee la adivinanza y escribe la respuesta para descubrirla.",
    "5-avanzado": "Chistes limpios y graciosos para practicar signos de interrogación y puntuación entre risas.",
    "6-experto": "Trabalenguas traviesos que pondrán a prueba la agilidad de tus dedos. ¡Cuidado no te trabes!",
    "7-maestria": "Crónicas galácticas de exploradores y estrellas para campeones de la mecanografía.",
    "8-absurdo": "¡El Desafío del Dragón Robot! Retos épicos con hechizos y turbo de velocidad."
  };
  return descriptions[value] || "";
}

function updateDifficultyDescriptions() {
  difficultyDescription.textContent = getDifficultyDescription(difficultySelect.value);
  startDifficultyDescription.textContent = getDifficultyDescription(startDifficultySelect.value);
}

function getWordsGoalForLevel() {
  const multipliers = {
    "1-infantil": 0.8,
    "2-basico": 0.9,
    "3-principiante": 1.0,
    "4-intermedio": 1.0,
    "5-avanzado": 1.1,
    "6-experto": 1.1,
    "7-maestria": 1.2,
    "8-absurdo": 1.2
  };
  const multiplier = multipliers[difficulty] || 1.0;
  return Math.max(4, Math.round(5 * multiplier));
}

function getCurrentWordList() {
  const wordList = WORD_LIST[difficulty];
  if (!wordList || wordList.length === 0) {
    return WORD_LIST["1-infantil"];
  }
  return wordList;
}

function pickRandomWord() {
  const words = getCurrentWordList();
  if (words.length === 1) return words[0];

  let selected = words[Math.floor(Math.random() * words.length)];
  let attempts = 0;
  while (selected === lastWord && attempts < 10) {
    selected = words[Math.floor(Math.random() * words.length)];
    attempts++;
  }
  return selected;
}

function setNewWord() {
  currentWord = pickRandomWord();
  lastWord = currentWord;
  currentIndex = 0;
  updateWordDisplay();
  highlightTargetKey();
  clearFeedback();
  resetIdleTimer();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function updateWordDisplay() {
  const correctPart = currentWord.slice(0, currentIndex);
  const nextChar = currentWord[currentIndex] || "";
  const remaining = currentWord.slice(currentIndex + 1);

  // Escalar el tamaño de fuente dinámicamente según la longitud del texto
  const len = currentWord.length;
  targetWordEl.className = "target-word unified-text";
  if (len <= 10) {
    targetWordEl.classList.add("text--short");
  } else if (len <= 28) {
    targetWordEl.classList.add("text--medium");
  } else if (len <= 65) {
    targetWordEl.classList.add("text--long");
  } else if (len <= 130) {
    targetWordEl.classList.add("text--paragraph");
  } else {
    targetWordEl.classList.add("text--story");
  }

  targetWordEl.innerHTML = `
    <span class="typed-correct">${escapeHtml(correctPart)}</span><span id="current-target-char" class="typed-next">${escapeHtml(nextChar)}</span><span>${escapeHtml(remaining)}</span>
  `;

  scrollTargetIntoView();
  updateFingerGuide(nextChar);
}

function scrollTargetIntoView() {
  const currentTargetChar = document.getElementById("current-target-char");
  if (currentTargetChar && targetWordEl) {
    const charTop = currentTargetChar.offsetTop;
    const containerHeight = targetWordEl.clientHeight;
    const targetScroll = charTop - (containerHeight / 2) + (currentTargetChar.clientHeight / 2);
    targetWordEl.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: "smooth"
    });
  }
}

function clearKeyboardHighlight() {
  document.querySelectorAll(".key").forEach((key) => {
    key.classList.remove("key--target", "key--hit", "key--wrong");
  });
}

function highlightTargetKey() {
  clearKeyboardHighlight();
  const nextChar = currentWord[currentIndex];
  if (!nextChar) return;

  if (nextChar === " ") {
    const keyEl = document.querySelector(".key-spacebar");
    if (keyEl) keyEl.classList.add("key--target");
    return;
  }

  if (nextChar === "\n") {
    const keyEl = document.querySelector(".key-enter");
    if (keyEl) keyEl.classList.add("key--target");
    return;
  }

  const baseKeyChar = getKeyBaseChar(nextChar);

  // Iluminar la tecla Shift contraria a la mano que escribe la letra (mecanografía ergonómica)
  function highlightShift() {
    const keyTarget = document.querySelector(`.key[data-key="${baseKeyChar}"]`);
    const finger = keyTarget ? keyTarget.dataset.finger : "";
    if (finger && finger.startsWith("r")) {
      const leftShift = document.querySelector('.key-shift[data-finger="lp"]');
      if (leftShift) leftShift.classList.add("key--target");
    } else if (finger && finger.startsWith("l")) {
      const rightShift = document.querySelector('.key-shift[data-finger="rp"]');
      if (rightShift) rightShift.classList.add("key--target");
    } else {
      document.querySelectorAll(".key-shift").forEach(el => el.classList.add("key--target"));
    }
  }

  // Alt Gr (@, #, €, ~, |, etc.)
  if (requiresAltGr(nextChar)) {
    const altGrEl = document.querySelector(".key-altgr");
    if (altGrEl) altGrEl.classList.add("key--target");
  }

  // Mayúscula
  if (nextChar === nextChar.toUpperCase() && nextChar !== nextChar.toLowerCase()) {
    highlightShift();
  }

  // Diéresis
  if (hasDiaeresis(nextChar)) {
    if (!pendingAccent) {
      highlightShift();
      const accentEl = document.querySelector(".key-accent");
      if (accentEl) accentEl.classList.add("key--target");
    }
  }

  // Puntuación con shift
  if (/[;:?_]/.test(nextChar) || requiresShift(nextChar)) {
    highlightShift();
  }

  // Acento / Tilde (si aún no se ha pulsado la tilde)
  if (hasAccent(nextChar)) {
    if (!pendingAccent) {
      const accentEl = document.querySelector(".key-accent");
      if (accentEl) accentEl.classList.add("key--target");
    }
  }

  const keyEl = document.querySelector(`.key[data-key="${baseKeyChar}"]`);
  if (keyEl) {
    keyEl.classList.add("key--target");
  }
}

function flashKey(keyChar, className) {
  let keyEl;
  let needsShift = false;
  let needsAccent = false;
  let needsAltGr = false;

  if (keyChar === " ") {
    keyEl = document.querySelector(".key-spacebar");
  } else if (keyChar === "\n" || keyChar === "Enter") {
    keyEl = document.querySelector(".key-enter");
  } else if (keyChar === "´" || keyChar === "¨") {
    keyEl = document.querySelector(".key-accent");
  } else {
    const baseKeyChar = getKeyBaseChar(keyChar);
    if (!baseKeyChar) return;

    if (keyChar === keyChar.toUpperCase() && keyChar !== keyChar.toLowerCase()) needsShift = true;
    if (hasDiaeresis(keyChar) || /[;:?_]/.test(keyChar) || requiresShift(keyChar)) needsShift = true;
    if (hasAccent(keyChar)) needsAccent = true;
    if (requiresAltGr(keyChar)) needsAltGr = true;

    keyEl = document.querySelector(`.key[data-key="${baseKeyChar}"]`);
  }

  if (!keyEl) return;

  keyEl.classList.remove("key--target");
  keyEl.classList.add(className);

  if (needsShift) {
    document.querySelectorAll(".key-shift").forEach(shiftEl => {
      shiftEl.classList.remove("key--target");
      shiftEl.classList.add(className);
    });
  }

  if (needsAccent) {
    const accentEl = document.querySelector(".key-accent");
    if (accentEl) {
      accentEl.classList.remove("key--target");
      accentEl.classList.add(className);
    }
  }

  if (needsAltGr) {
    const altGrEl = document.querySelector(".key-altgr");
    if (altGrEl) {
      altGrEl.classList.remove("key--target");
      altGrEl.classList.add(className);
    }
  }

  setTimeout(() => {
    keyEl.classList.remove(className);
    if (needsShift) {
      document.querySelectorAll(".key-shift").forEach(shiftEl => shiftEl.classList.remove(className));
    }
    if (needsAccent) {
      const accentEl = document.querySelector(".key-accent");
      if (accentEl) accentEl.classList.remove(className);
    }
    if (needsAltGr) {
      const altGrEl = document.querySelector(".key-altgr");
      if (altGrEl) altGrEl.classList.remove(className);
    }
    highlightTargetKey();
  }, 150);
}

function showFeedback(message, type) {
  if (!feedbackMessageEl) return;
  feedbackMessageEl.textContent = message;
  feedbackMessageEl.className = "feedback-message";

  if (type === "good") {
    feedbackMessageEl.classList.add("feedback-good");
  } else if (type === "bad") {
    feedbackMessageEl.classList.add("feedback-bad");
  }
}

function clearFeedback() {
  if (!feedbackMessageEl) return;
  feedbackMessageEl.textContent = "";
  feedbackMessageEl.className = "feedback-message";
}

function updateStats() {
  if (errorsEl) errorsEl.textContent = errors.toString();
  if (levelEl) levelEl.textContent = level.toString();
  if (wordsCountEl) wordsCountEl.textContent = wordsCompleted.toString();
  if (wordsGoalEl) wordsGoalEl.textContent = wordsGoal.toString();

  const elapsedMinutes = (Date.now() - startTime) / 60000;
  const ppm = elapsedMinutes > 0 ? Math.round(totalKeystrokes / elapsedMinutes) : 0;
  if (ppmEl) ppmEl.textContent = ppm.toString();
  if (apmEl) apmEl.textContent = ppm.toString();

  const accuracy =
    totalKeystrokes > 0
      ? Math.round((correctKeystrokes / totalKeystrokes) * 100)
      : 100;

  if (accuracyEl) accuracyEl.textContent = accuracy.toString();
}

function normalizeChar(char) {
  return char.toLowerCase();
}

function getCharWithoutAccent(char) {
  const accentMap = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u',
    'ü': 'u', 'Ü': 'u'
  };
  return accentMap[char] || char;
}

function getAccentedChar(baseChar) {
  const accentMap = {
    'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú',
    'A': 'Á', 'E': 'É', 'I': 'Í', 'O': 'Ó', 'U': 'Ú'
  };
  return accentMap[baseChar] || baseChar;
}

function getDiaeresisChar(baseChar) {
  const diaeresisMap = { 'u': 'ü', 'U': 'Ü' };
  return diaeresisMap[baseChar] || baseChar;
}

function getShiftNumberChar(numberKey) {
  const shiftMap = {
    '1': '!', '2': '"', '3': '·', '4': '$', '5': '%',
    '6': '&', '7': '/', '8': '(', '9': ')', '0': '='
  };
  return shiftMap[numberKey] || numberKey;
}

function getKeyBaseChar(char) {
  if (char === '!') return '1';
  if (char === '"') return '2';
  if (char === '·') return '3';
  if (char === '$') return '4';
  if (char === '%') return '5';
  if (char === '&') return '6';
  if (char === '/') return '7';
  if (char === '(') return '8';
  if (char === ')') return '9';
  if (char === '=') return '0';

  // Símbolos con Alt Gr
  if (char === '@') return '2';
  if (char === '#') return '3';
  if (char === '~') return '4';
  if (char === '€') return 'e';
  if (char === '|') return '1';
  if (char === '\\') return '1';
  if (char === '{') return '´';
  if (char === '}') return 'ç';
  if (char === '[') return '`';
  if (char === ']') return '+';

  if (char === ';' || char === ',') return ',';
  if (char === ':' || char === '.') return '.';
  if (char === '?' || char === '¿') return char;
  if (char === '-' || char === '_') return '-';
  if (/^[áéíóúÁÉÍÓÚüÜ]$/.test(char)) return getCharWithoutAccent(char).toLowerCase();
  if (/^[0-9]$/.test(char)) return char;
  if (/^[a-zñç]$/i.test(char)) return char.toLowerCase();
  return char;
}

function hasAccent(char) {
  return /[áéíóúÁÉÍÓÚüÜ]/.test(char);
}

function hasDiaeresis(char) {
  return /[üÜ]/.test(char);
}

function requiresShift(char) {
  return /[!"·$%&/()\=]/.test(char);
}

function requiresAltGr(char) {
  return /[@#~€|\\{}[\]]/.test(char);
}

// =============================================================================
// ⌨️ GESTIÓN DE ENTRADA DE TECLADO
// =============================================================================

function handleKeydown(event) {
  if (isPaused || !gameStarted) return;

  resetIdleTimer();

  const key = event.key;

  // Soportar tecla muerta de acento
  if (key === "Dead") {
    pendingAccent = event.shiftKey ? 'diaeresis' : 'accent';
    const expected = currentWord[currentIndex];
    if (hasAccent(expected)) {
      flashKey("´", "key--hit");
    }
    if (hasDiaeresis(expected) && expected === expected.toUpperCase()) {
      flashKey("´", "key--hit");
      const shiftEl = document.querySelector(".key-shift");
      if (shiftEl) shiftEl.classList.add("key--target");
    }
    updateFingerGuide(expected);
    highlightTargetKey();
    return;
  }

  if (key !== "Enter" && key.length !== 1) return;

  let typedChar = key === "Enter" ? "\n" : key;
  if (pendingAccent) {
    typedChar = pendingAccent === 'diaeresis' ? getDiaeresisChar(key) : getAccentedChar(key);
    pendingAccent = null;
  } else if (event.shiftKey && /^[0-9]$/.test(key)) {
    typedChar = getShiftNumberChar(key);
  }

  totalKeystrokes++;

  const expected = currentWord[currentIndex];
  if (!expected) return;

  if (normalizeChar(typedChar) === normalizeChar(expected)) {
    correctKeystrokes++;
    currentIndex++;
    currentCombo++;

    // Efecto visual en la tecla
    if (/^[a-zñçáéíóúÁÉÍÓÚ!"·$%&/()\=;:.,¿?]$/i.test(typedChar) || typedChar === " " || typedChar === "\n") {
      flashKey(typedChar, "key--hit");
    }

    playSound(keyHitSound);

    // Sistema de combos y ánimo
    if (currentCombo >= 4) {
      comboCounter.classList.remove("hidden");
      comboNumber.textContent = currentCombo.toString();

      if (ROBY_PHRASES.combos[currentCombo]) {
        const phrases = ROBY_PHRASES.combos[currentCombo];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        const mood = currentCombo >= 10 ? "victory" : "happy";
        setMascotMood(mood, phrase, currentCombo === 10 || currentCombo === 15);
      }
    }

    if (currentIndex >= currentWord.length) {
      wordsCompleted++;
      showFeedback("¡Sensacional! ⭐", "good");
      playSound(goodSound);

      if (wordsCompleted === Math.floor(wordsGoal / 2) && wordsGoal >= 4) {
        const halfMsg = ROBY_PHRASES.halfway[Math.floor(Math.random() * ROBY_PHRASES.halfway.length)];
        setMascotMood("victory", halfMsg, false);
      } else {
        const randomCheers = ROBY_PHRASES.wordsCompleted[Math.floor(Math.random() * ROBY_PHRASES.wordsCompleted.length)];
        setMascotMood("happy", randomCheers, false);
      }

      if (wordsCompleted >= wordsGoal) {
        showLevelComplete();
      } else {
        setTimeout(() => {
          setNewWord();
        }, 450);
      }
    } else {
      updateWordDisplay();
      clearFeedback();
    }
  } else {
    errors++;
    currentCombo = 0;
    pendingAccent = null;
    comboCounter.classList.add("hidden");
    showFeedback("¡Ánimo!", "bad");

    const errorMsg = ROBY_PHRASES.comfortErrors[Math.floor(Math.random() * ROBY_PHRASES.comfortErrors.length)];
    setMascotMood("error", errorMsg, false);

    if (/^[a-zñçáéíóúÁÉÍÓÚ!"·$%&/()\=;:.,¿?@#~€|\\{}[\]]$/i.test(key) || key === " " || key === "Enter") {
      flashKey(key, "key--wrong");
    }

    playSound(errorSound);

    updateFingerGuide(expected);
    highlightTargetKey();

    // Volver a feliz tras 1.4s
    setTimeout(() => {
      if (mascotMood === "error") {
        setMascotMood("happy", "¡Vamos a por la siguiente letra!");
      }
    }, 1400);
  }

  updateStats();
}

function startAPMTimer() {
  if (apmInterval) clearInterval(apmInterval);
  startTime = Date.now();
  apmInterval = setInterval(updateStats, 1000);
}

// =============================================================================
// ⭐ PERSISTENCIA DE PROGRESO Y ESTRELLAS POR MUNDO (localStorage)
// =============================================================================

function getStarsProgress() {
  try {
    return JSON.parse(localStorage.getItem("mecano_stars_progress") || "{}");
  } catch (e) {
    return {};
  }
}

function saveLevelStars(diffKey, newStars) {
  const progress = getStarsProgress();
  const prevStars = progress[diffKey] || 0;
  if (newStars > prevStars) {
    progress[diffKey] = newStars;
    try {
      localStorage.setItem("mecano_stars_progress", JSON.stringify(progress));
    } catch (e) {}
    updateLevelSelectLabels();
  }
}

function updateLevelSelectLabels() {
  const progress = getStarsProgress();
  const baseLabels = {
    "1-infantil": "1 - 🌲 El Bosque de las Vocales y Animales",
    "2-basico": "2 - 🏴‍☠️ La Isla Pirata y Criaturas Mágicas",
    "3-principiante": "3 - 🏰 El Reino de los Cuentos Divertidos",
    "4-intermedio": "4 - 🧩 Adivinanzas Infantiles",
    "5-avanzado": "5 - 😂 Club de Chistes para Niños",
    "6-experto": "6 - 🌀 Trabalenguas Traviesos",
    "7-maestria": "7 - 🚀 Expedición Galáctica a las Estrellas",
    "8-absurdo": "8 - 🐉 El Gran Desafío del Dragón Robot"
  };

  [startDifficultySelect, difficultySelect].forEach(selectEl => {
    if (!selectEl) return;
    Array.from(selectEl.options).forEach(opt => {
      const base = baseLabels[opt.value];
      if (base) {
        const stars = progress[opt.value] || 0;
        let starBadge = "";
        for (let i = 0; i < stars; i++) starBadge += "⭐";
        opt.textContent = starBadge ? `${base} [${starBadge}]` : base;
      }
    });
  });
}

// =============================================================================
// 🏆 FINALIZACIÓN DE NIVEL Y CELEBRACIÓN
// =============================================================================

function showLevelComplete() {
  isPaused = true;
  if (idleTimer) clearTimeout(idleTimer);

  const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;
  let stars = 3;
  let speech = "¡Perfección absoluta! ¡Eres un auténtico maestro del teclado!";

  if (errors > 4 || accuracy < 80) {
    stars = 1;
    speech = "¡Bien jugado! Si practicas una vez más conseguirás todas las estrellas.";
  } else if (errors > 1 || accuracy < 92) {
    stars = 2;
    speech = "¡Sensacional! ¡Has rozado la perfección!";
  }

  let starsStr = "";
  for (let i = 0; i < stars; i++) starsStr += "⭐";
  starsRatingEl.textContent = starsStr;

  saveLevelStars(difficulty, stars);

  const elapsedMinutes = (Date.now() - startTime) / 60000;
  const ppm = elapsedMinutes > 0 ? Math.round(totalKeystrokes / elapsedMinutes) : 0;

  levelCompleteCountEl.textContent = wordsCompleted.toString();
  levelCompleteTitleEl.textContent = `¡Misión ${level} Cumplida! 🎉`;
  levelCompleteMessageEl.innerHTML = `Has completado <strong>${wordsCompleted} textos</strong> con <strong>${accuracy}%</strong> de precisión.`;

  if (levelCompleteStatsSummary) {
    levelCompleteStatsSummary.innerHTML = `
      <div class="summary-badge"><span class="badge-icon">⚡</span> <strong>${ppm} PPM</strong> (Pulsaciones/min)</div>
      <div class="summary-badge"><span class="badge-icon">✨</span> <strong>${accuracy}% Acierto</strong></div>
      <div class="summary-badge"><span class="badge-icon">🛡️</span> <strong>${errors} Errores</strong></div>
    `;
  }

  levelCompleteMascotSpeech.textContent = `Roby: "${speech}"`;

  setMascotMood("victory", speech, true);
  levelCompleteEl.classList.remove("hidden");
  playSound(levelUpSound);

  launchConfetti(3500);
}

function hideLevelCompleteAndNext() {
  playSound(buttonClickSound);

  levelCompleteEl.classList.add("hidden");
  level++;
  wordsCompleted = 0;
  errors = 0;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  currentCombo = 0;
  comboCounter.classList.add("hidden");
  wordsGoal = getWordsGoalForLevel();

  startAPMTimer();
  updateStats();
  setNewWord();
  updateLessonInfo(true);
  isPaused = false;
}

function applyDifficulty() {
  difficulty = difficultySelect.value;
  startDifficultySelect.value = difficulty;

  if (gameStarted) {
    level = 1;
    wordsCompleted = 0;
    errors = 0;
    totalKeystrokes = 0;
    correctKeystrokes = 0;
    currentCombo = 0;
    comboCounter.classList.add("hidden");
    isPaused = false;
    startAPMTimer();
  }

  wordsGoal = getWordsGoalForLevel();
  updateStats();
  updateDifficultyDescriptions();
  updateLessonInfo(false);

  if (gameStarted) {
    setNewWord();
    closeSettings();
  }
}

function startGame() {
  playSound(buttonClickSound);

  difficulty = startDifficultySelect.value;
  keyboardType = startKeyboardSelect.value;
  difficultySelect.value = difficulty;
  keyboardSelect.value = keyboardType;

  level = 1;
  wordsCompleted = 0;
  errors = 0;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  currentCombo = 0;
  comboCounter.classList.add("hidden");
  wordsGoal = getWordsGoalForLevel();

  gameStarted = true;
  isPaused = false;

  updateDifficultyDescriptions();
  updateKeyboardVisibility();
  startScreen.classList.add("hidden");
  updateLessonInfo(true);
  setNewWord();
  startAPMTimer();
  updateStats();
}

// =============================================================================
// ACCESIBILIDAD Y TAMAÑO DE TEXTO (PARA PERSONAS CON DIFICULTAD VISUAL)
// =============================================================================

let currentTextScale = localStorage.getItem("mecano_text_scale") || "normal";

function applyTextScale(scale) {
  currentTextScale = scale;
  localStorage.setItem("mecano_text_scale", scale);
  document.documentElement.setAttribute("data-text-scale", scale);

  if (zoomToggleBtn) {
    if (scale === "extra") {
      zoomToggleBtn.textContent = "🔍 A++";
      zoomToggleBtn.title = "Tamaño de texto: Extra Grande (pulsa para volver a Normal)";
    } else if (scale === "grande") {
      zoomToggleBtn.textContent = "🔍 A+";
      zoomToggleBtn.title = "Tamaño de texto: Grande (pulsa para Extra Grande)";
    } else {
      zoomToggleBtn.textContent = "🔍 Aa";
      zoomToggleBtn.title = "Tamaño de texto: Normal (pulsa para Grande)";
    }
  }

  if (accessibilityTextSize) {
    accessibilityTextSize.value = scale;
  }
}

function cycleTextScale() {
  if (currentTextScale === "normal") {
    applyTextScale("grande");
  } else if (currentTextScale === "grande") {
    applyTextScale("extra");
  } else {
    applyTextScale("normal");
  }
}

// =============================================================================
// 📱 SOPORTE TÁCTIL Y CLICS EN TECLADO VIRTUAL
// =============================================================================

let virtualShiftActive = false;
let virtualAltGrActive = false;

function initVirtualKeyboardClicks() {
  const keyboard = document.getElementById("keyboard");
  if (!keyboard) return;

  keyboard.addEventListener("pointerdown", (e) => {
    const keyEl = e.target.closest(".key");
    if (!keyEl) return;
    e.preventDefault();

    const dataKey = keyEl.dataset.key;
    if (!dataKey) return;

    // Toggle de Mayúsculas virtuales
    if (dataKey === "Shift") {
      virtualShiftActive = !virtualShiftActive;
      document.querySelectorAll(".key-shift").forEach((el) => {
        el.classList.toggle("key--target", virtualShiftActive);
      });
      playSound(buttonClickSound);
      return;
    }

    // Toggle de Alt Gr virtual
    if (dataKey === "AltGraph") {
      virtualAltGrActive = !virtualAltGrActive;
      document.querySelectorAll(".key-altgr").forEach((el) => {
        el.classList.toggle("key--target", virtualAltGrActive);
      });
      playSound(buttonClickSound);
      return;
    }

    // Teclas modificadoras pasivas como Ctrl o Alt normal
    if (dataKey === "Control" || dataKey === "Alt") {
      playSound(buttonClickSound);
      return;
    }

    // Tecla de acento / diéresis
    if (dataKey === "´") {
      handleKeydown({
        key: "Dead",
        shiftKey: virtualShiftActive,
        preventDefault: () => {}
      });
      if (virtualShiftActive) {
        virtualShiftActive = false;
        document.querySelectorAll(".key-shift").forEach((el) => el.classList.remove("key--target"));
      }
      return;
    }

    let charToSend = dataKey;
    if (dataKey === "Enter") {
      charToSend = "Enter";
    } else if (dataKey === " ") {
      charToSend = " ";
    } else if (virtualAltGrActive) {
      if (dataKey === "2") charToSend = "@";
      else if (dataKey === "3") charToSend = "#";
      else if (dataKey === "4") charToSend = "~";
      else if (dataKey === "1") charToSend = "|";
      else if (dataKey === "e" || dataKey === "E") charToSend = "€";
      else if (dataKey === "´") charToSend = "{";
      else if (dataKey === "ç") charToSend = "}";
      virtualAltGrActive = false;
      document.querySelectorAll(".key-altgr").forEach((el) => el.classList.remove("key--target"));
    } else if (virtualShiftActive) {
      if (/^[0-9]$/.test(dataKey)) {
        charToSend = getShiftNumberChar(dataKey);
      } else if (dataKey === ",") {
        charToSend = ";";
      } else if (dataKey === ".") {
        charToSend = ":";
      } else if (dataKey === "-") {
        charToSend = "_";
      } else {
        charToSend = dataKey.toUpperCase();
      }
      virtualShiftActive = false;
      document.querySelectorAll(".key-shift").forEach((el) => el.classList.remove("key--target"));
    }

    handleKeydown({
      key: charToSend,
      shiftKey: false,
      preventDefault: () => {}
    });
  });
}

// =============================================================================
// INICIALIZACIÓN
// =============================================================================

window.addEventListener("load", () => {
  applyTextScale(currentTextScale);
  updateOptionButtons();
  handleVideoFallback();
  updateStats();
  updateDifficultyDescriptions();
  updateLevelSelectLabels();
  initVirtualKeyboardClicks();

  // Asegurar carga de voces
  if (window.speechSynthesis) {
    populateVoiceList();
    window.speechSynthesis.onvoiceschanged = () => {
      populateVoiceList();
    };
  }

  window.addEventListener("keydown", handleKeydown);
  nextLevelBtn.addEventListener("click", hideLevelCompleteAndNext);

  settingsBtn.addEventListener("click", openSettings);
  closeSettingsBtn.addEventListener("click", closeSettings);

  if (zoomToggleBtn) {
    zoomToggleBtn.addEventListener("click", () => {
      playSound(buttonClickSound);
      cycleTextScale();
    });
  }

  if (accessibilityTextSize) {
    accessibilityTextSize.addEventListener("change", (e) => {
      playSound(buttonClickSound);
      applyTextScale(e.target.value);
    });
  }

  if (voiceSelect) {
    voiceSelect.addEventListener("change", () => {
      selectedVoiceURI = voiceSelect.value;
      localStorage.setItem("mecano_selected_voice", selectedVoiceURI);
    });
  }

  if (testVoiceBtn) {
    testVoiceBtn.addEventListener("click", () => {
      playSound(buttonClickSound);
      speakText("¡Hola! Soy Roby. ¿Te gusta cómo suena mi voz para aprender a escribir?");
    });
  }

  soundToggleBtn.addEventListener("click", toggleSound);
  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener("click", toggleVoice);
  }
  animationToggleBtn.addEventListener("click", toggleAnimation);

  if (mascotSpeakBtn) {
    mascotSpeakBtn.addEventListener("click", () => {
      playSound(buttonClickSound);
      speakText(currentSpeechMessage || "¡Hola! Soy Roby.");
    });
  }

  if (mascotAvatar) {
    mascotAvatar.addEventListener("click", handleMascotClick);
  }

  if (mascotTipBar) {
    mascotTipBar.addEventListener("click", (e) => {
      // Si hizo clic en el botón de siguiente o en la barra
      cycleRobyTip(true);
    });
  }

  if (tipNextBtn) {
    tipNextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      cycleRobyTip(true);
    });
  }

  difficultySelect.addEventListener("change", applyDifficulty);
  startDifficultySelect.addEventListener("change", () => {
    difficulty = startDifficultySelect.value;
    difficultySelect.value = difficulty;
    updateDifficultyDescriptions();
  });

  keyboardSelect.addEventListener("change", toggleKeyboardType);
  startKeyboardSelect.addEventListener("change", () => {
    keyboardType = startKeyboardSelect.value;
    keyboardSelect.value = keyboardType;
    updateKeyboardVisibility();
  });

  startGameBtn.addEventListener("click", startGame);

  // Mensaje inicial de Roby en pantalla de inicio
  setTimeout(() => {
    speakText("¡Hola, supermecanógrafo! Soy Roby. Elige tu nivel y prepárate para divertirte jugando.");
  }, 600);
});