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
let animationEnabled = true;
let difficulty = "normal";
let keyboardType = "completo";

const targetWordEl = document.getElementById("target-word");
const errorsEl = document.getElementById("errors");
const apmEl = document.getElementById("apm");
const levelEl = document.getElementById("level");
const wordsCountEl = document.getElementById("words-count");
const wordsGoalEl = document.getElementById("words-goal");
const accuracyEl = document.getElementById("accuracy");
const feedbackMessageEl = document.getElementById("feedback-message");

const levelCompleteEl = document.getElementById("level-complete");
const levelCompleteCountEl = document.getElementById("level-complete-count");
const levelCompleteTitleEl = document.getElementById("level-complete-title");
const nextLevelBtn = document.getElementById("next-level-btn");

const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const soundToggleBtn = document.getElementById("sound-toggle");
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

function updateOptionButtons() {
  soundToggleBtn.textContent = soundEnabled ? "ON" : "OFF";
  soundToggleBtn.classList.toggle("off", !soundEnabled);

  animationToggleBtn.textContent = animationEnabled ? "ON" : "OFF";
  animationToggleBtn.classList.toggle("off", !animationEnabled);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  updateOptionButtons();
  if (soundEnabled) playSound(buttonClickSound);
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
    "1-infantil": "Palabras simples de 3-5 letras. Perfecto para comenzar sin presión.",
    "2-basico": "Palabras más largas de 5-8 letras con acentos. Construye familiaridad.",
    "3-principiante": "Frases cortas y simples para ganar seguridad escribiendo.",
    "4-intermedio": "Frases medianas con puntuación variada. Requiere más concentración.",
    "5-avanzado": "Textos medianos que requieren mantener ritmo y enfoque.",
    "6-experto": "Textos largos con estructura compleja. Para practicantes experimentados.",
    "7-maestria": "Textos muy largos para dominio completo del teclado.",
    "8-absurdo": "Desafío extremo. Textos alocados y extravagantes. ¡Bienvenido a la locura!"
  };
  
  return descriptions[value] || "";
}

function updateDifficultyDescriptions() {
  difficultyDescription.textContent = getDifficultyDescription(difficultySelect.value);
  startDifficultyDescription.textContent = getDifficultyDescription(startDifficultySelect.value);
}

function getWordsGoalForLevel() {
  // Base: 6 palabras
  const baseGoal = 6;
  
  // Multiplicador según nivel (ya no hay sub-niveles)
  const multipliers = {
    "1-infantil": 0.8,
    "2-basico": 0.9,
    "3-principiante": 1.0,
    "4-intermedio": 1.1,
    "5-avanzado": 1.2,
    "6-experto": 1.3,
    "7-maestria": 1.4,
    "8-absurdo": 1.5
  };
  
  const multiplier = multipliers[difficulty] || 1.0;
  return Math.max(4, Math.round(baseGoal * multiplier));
}

function getCurrentWordList() {
  // Ahora difficulty es directamente el nivel (ej: "1-infantil", "2-basico", etc)
  const wordList = WORD_LIST[difficulty];
  
  if (!wordList || wordList.length === 0) {
    return WORD_LIST["5-avanzado"];
  }
  
  return wordList;
}

function pickRandomWord() {
  const words = getCurrentWordList();

  if (words.length === 1) {
    return words[0];
  }

  let selected = words[Math.floor(Math.random() * words.length)];

  while (selected === lastWord) {
    selected = words[Math.floor(Math.random() * words.length)];
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

  targetWordEl.innerHTML = `
    <span class="typed-correct">${escapeHtml(correctPart)}</span><span id="current-target-char" class="typed-next">${escapeHtml(nextChar)}</span><span>${escapeHtml(remaining)}</span>
  `;

  scrollTargetIntoView();
}

function scrollTargetIntoView() {
  const currentTargetChar = document.getElementById("current-target-char");

  if (currentTargetChar) {
    currentTargetChar.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest"
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

  // Permitir espacios
  if (nextChar === " ") {
    const keyEl = document.querySelector(".key-spacebar");
    if (keyEl) {
      keyEl.classList.add("key--target");
    }
    return;
  }

  // Permitir salto de línea
  if (nextChar === "\n") {
    const keyEl = document.querySelector(".key-enter");
    if (keyEl) {
      keyEl.classList.add("key--target");
    }
    return;
  }

  const baseKeyChar = getKeyBaseChar(nextChar);

  // Si la letra es mayúscula, iluminar también el Shift
  if (nextChar === nextChar.toUpperCase() && nextChar !== nextChar.toLowerCase()) {
    const shiftEl = document.querySelector(".key-shift");
    if (shiftEl) {
      shiftEl.classList.add("key--target");
    }
  }

  // Si la letra es una diéresis, también iluminar Shift
  if (hasDiaeresis(nextChar)) {
    const shiftEl = document.querySelector(".key-shift");
    if (shiftEl) {
      shiftEl.classList.add("key--target");
    }
  }

  // Si la letra es una variante shift de puntuación, iluminar Shift
  if (/[;:?]/.test(nextChar)) {
    const shiftEl = document.querySelector(".key-shift");
    if (shiftEl) {
      shiftEl.classList.add("key--target");
    }
  }

  // Si requiere Shift (símbolos de números), iluminar Shift
  if (requiresShift(nextChar)) {
    const shiftEl = document.querySelector(".key-shift");
    if (shiftEl) {
      shiftEl.classList.add("key--target");
    }
  }

  // Si la letra tiene acento o diéresis, iluminar también el acento
  if (hasAccent(nextChar)) {
    const accentEl = document.querySelector(".key-accent");
    if (accentEl) {
      accentEl.classList.add("key--target");
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
  
  // Permitir espacios
  if (keyChar === " ") {
    keyEl = document.querySelector(".key-spacebar");
  } else if (keyChar === "\n" || keyChar === "Enter") {
    keyEl = document.querySelector(".key-enter");
  } else if (keyChar === "´" || keyChar === "¨") {
    keyEl = document.querySelector(".key-accent");
  } else {
    const baseKeyChar = getKeyBaseChar(keyChar);
    if (!baseKeyChar) return;

    // Detectar si la letra es mayúscula
    if (keyChar === keyChar.toUpperCase() && keyChar !== keyChar.toLowerCase()) {
      needsShift = true;
    }
    // Detectar si la letra es diéresis o un signo con shift
    if (hasDiaeresis(keyChar) || /[;:?]/.test(keyChar) || requiresShift(keyChar)) {
      needsShift = true;
    }
    // Detectar si tiene acento
    if (hasAccent(keyChar)) {
      needsAccent = true;
    }
    keyEl = document.querySelector(`.key[data-key="${baseKeyChar}"]`);
  }

  if (!keyEl) return;

  keyEl.classList.remove("key--target");
  keyEl.classList.add(className);

  // Si necesita Shift, también animar el Shift
  if (needsShift) {
    const shiftEl = document.querySelector(".key-shift");
    if (shiftEl) {
      shiftEl.classList.remove("key--target");
      shiftEl.classList.add(className);
    }
  }

  // Si necesita acento, también animar el acento
  if (needsAccent) {
    const accentEl = document.querySelector(".key-accent");
    if (accentEl) {
      accentEl.classList.remove("key--target");
      accentEl.classList.add(className);
    }
  }

  setTimeout(() => {
    keyEl.classList.remove(className);
    if (needsShift) {
      const shiftEl = document.querySelector(".key-shift");
      if (shiftEl) {
        shiftEl.classList.remove(className);
      }
    }
    if (needsAccent) {
      const accentEl = document.querySelector(".key-accent");
      if (accentEl) {
        accentEl.classList.remove(className);
      }
    }
    highlightTargetKey();
  }, 150);
}

function showFeedback(message, type) {
  feedbackMessageEl.textContent = message;
  feedbackMessageEl.className = "feedback-message";

  if (type === "good") {
    feedbackMessageEl.classList.add("feedback-good");
  } else if (type === "bad") {
    feedbackMessageEl.classList.add("feedback-bad");
  }
}

function clearFeedback() {
  feedbackMessageEl.textContent = "";
  feedbackMessageEl.className = "feedback-message";
}

function updateStats() {
  errorsEl.textContent = errors.toString();
  levelEl.textContent = level.toString();
  wordsCountEl.textContent = wordsCompleted.toString();
  wordsGoalEl.textContent = wordsGoal.toString();

  const elapsedMinutes = (Date.now() - startTime) / 60000;
  const apm = elapsedMinutes > 0 ? Math.round(totalKeystrokes / elapsedMinutes) : 0;
  apmEl.textContent = apm.toString();

  const accuracy =
    totalKeystrokes > 0
      ? Math.round((correctKeystrokes / totalKeystrokes) * 100)
      : 100;

  accuracyEl.textContent = accuracy.toString();
}

function normalizeChar(char) {
  return char.toLowerCase();
}

function getCharWithoutAccent(char) {
  const accentMap = {
    'á': 'a',
    'é': 'e',
    'í': 'i',
    'ó': 'o',
    'ú': 'u',
    'Á': 'a',
    'É': 'e',
    'Í': 'i',
    'Ó': 'o',
    'Ú': 'u',
    'ü': 'u',
    'Ü': 'u'
  };
  return accentMap[char] || char;
}

function getAccentedChar(baseChar) {
  const accentMap = {
    'a': 'á',
    'e': 'é',
    'i': 'í',
    'o': 'ó',
    'u': 'ú',
    'A': 'Á',
    'E': 'É',
    'I': 'Í',
    'O': 'Ó',
    'U': 'Ú'
  };
  return accentMap[baseChar] || baseChar;
}

function getDiaeresisChar(baseChar) {
  const diaeresisMap = {
    'u': 'ü',
    'U': 'Ü'
  };
  return diaeresisMap[baseChar] || baseChar;
}

function getShiftNumberChar(numberKey) {
  const shiftMap = {
    '1': '!',
    '2': '"',
    '3': '·',
    '4': '$',
    '5': '%',
    '6': '&',
    '7': '/',
    '8': '(',
    '9': ')',
    '0': '='
  };
  return shiftMap[numberKey] || numberKey;
}

function getKeyBaseChar(char) {
  // Símbolos de números con Shift
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
  
  if (char === ';' || char === ',') return ',';
  if (char === ':' || char === '.') return '.';
  if (char === '?' || char === '¿') return char;
  if (char === '-' || char === '_') return '-';
  if (/^[áéíóúÁÉÍÓÚüÜ]$/.test(char)) return getCharWithoutAccent(char).toLowerCase();
  if (/^[0-9]$/.test(char)) return char;
  if (/^[a-zñ]$/i.test(char)) return char.toLowerCase();
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

function handleKeydown(event) {
  if (isPaused || !gameStarted) return;

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
      if (shiftEl) {
        shiftEl.classList.add("key--target");
      }
    }
    return;
  }

  if (key !== "Enter" && key.length !== 1) return;

  let typedChar = key === "Enter" ? "\n" : key;
  if (pendingAccent) {
    typedChar = pendingAccent === 'diaeresis' ? getDiaeresisChar(key) : getAccentedChar(key);
    pendingAccent = null;
  } else if (event.shiftKey && /^[0-9]$/.test(key)) {
    // Convertir Shift+número a su símbolo correspondiente
    typedChar = getShiftNumberChar(key);
  }

  totalKeystrokes++;

  const expected = currentWord[currentIndex];
  if (!expected) return;

  if (normalizeChar(typedChar) === normalizeChar(expected)) {
    correctKeystrokes++;
    currentIndex++;

    // Permitir flashear tanto letras, acentos y espacios
    if (/^[a-zñáéíóúÁÉÍÓÚ!"·$%&/()\=]$/i.test(typedChar) || typedChar === " ") {
      flashKey(typedChar, "key--hit");
    }

    playSound(keyHitSound);

    if (currentIndex >= currentWord.length) {
      wordsCompleted++;
      showFeedback("¡Bien!", "good");
      playSound(goodSound);

      if (wordsCompleted >= wordsGoal) {
        showLevelComplete();
      } else {
        setTimeout(() => {
          setNewWord();
        }, 500);
      }
    } else {
      updateWordDisplay();
      clearFeedback();
    }
  } else {
    errors++;
    showFeedback("Ups", "bad");

    // Permitir flashear tanto letras, acentos y espacios
    if (/^[a-zñáéíóúÁÉÍÓÚ]$/i.test(key) || key === " ") {
      flashKey(key, "key--wrong");
    }

    playSound(errorSound);
  }

  updateStats();
}

function startAPMTimer() {
  if (apmInterval) clearInterval(apmInterval);
  startTime = Date.now();
  apmInterval = setInterval(updateStats, 1000);
}

function showLevelComplete() {
  isPaused = true;
  levelCompleteCountEl.textContent = wordsCompleted.toString();
  levelCompleteTitleEl.textContent = `¡Nivel ${level} completado!`;
  levelCompleteEl.classList.remove("hidden");
  playSound(levelUpSound);
}

function hideLevelCompleteAndNext() {
  playSound(buttonClickSound);

  levelCompleteEl.classList.add("hidden");
  level++;
  wordsCompleted = 0;
  errors = 0;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  wordsGoal = getWordsGoalForLevel();

  startAPMTimer();
  updateStats();
  setNewWord();
  isPaused = false;
}

function applyDifficulty() {
  difficulty = difficultySelect.value;
  startDifficultySelect.value = difficulty;
  
  // Si el juego ya ha comenzado, reiniciarlo con la nueva dificultad
  if (gameStarted) {
    level = 1;
    wordsCompleted = 0;
    errors = 0;
    totalKeystrokes = 0;
    correctKeystrokes = 0;
    isPaused = false;
    startAPMTimer();
  }
  
  wordsGoal = getWordsGoalForLevel();
  updateStats();
  updateDifficultyDescriptions();
  
  // Si el juego ya había comenzado, generar una nueva palabra
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
  wordsGoal = getWordsGoalForLevel();

  gameStarted = true;
  isPaused = false;

  updateDifficultyDescriptions();
  updateKeyboardVisibility();
  startScreen.classList.add("hidden");
  setNewWord();
  startAPMTimer();
  updateStats();
}

window.addEventListener("load", () => {
  updateOptionButtons();
  handleVideoFallback();
  updateStats();
  updateDifficultyDescriptions();

  window.addEventListener("keydown", handleKeydown);
  nextLevelBtn.addEventListener("click", hideLevelCompleteAndNext);

  settingsBtn.addEventListener("click", openSettings);
  closeSettingsBtn.addEventListener("click", closeSettings);

  soundToggleBtn.addEventListener("click", toggleSound);
  animationToggleBtn.addEventListener("click", toggleAnimation);

  difficultySelect.addEventListener("change", applyDifficulty);
  difficultySelect.addEventListener("change", updateDifficultyDescriptions);
  startDifficultySelect.addEventListener("change", updateDifficultyDescriptions);

  keyboardSelect.addEventListener("change", toggleKeyboardType);
  startKeyboardSelect.addEventListener("change", () => {
    keyboardType = startKeyboardSelect.value;
    updateKeyboardVisibility();
  });

  startGameBtn.addEventListener("click", startGame);
});