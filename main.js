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

let soundEnabled = true;
let animationEnabled = true;
let difficulty = "normal";

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

const startScreen = document.getElementById("start-screen");
const startDifficultySelect = document.getElementById("start-difficulty-select");
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
  switch (value) {
    case "muy-facil":
      return "Palabras infantiles muy cortas. Ideal para empezar sin presión y familiarizarse con el teclado poco a poco.";
    case "facil":
      return "Palabras sencillas y frases cortas sobre objetos, animales, familia y cole. Pensado para peques que ya reconocen mejor las letras.";
    case "normal":
      return "Mezcla equilibrada de palabras comunes y frases simples. Buen punto de partida si ya hay algo de soltura escribiendo.";
    case "dificil":
      return "Frases completas con más longitud y más lectura. Requiere mantener atención durante más tiempo.";
    case "muy-dificil":
      return "Textos largos y frases más exigentes. Ideal para practicar ritmo, concentración y resistencia al escribir.";
    case "absurdo":
      return "Modo reto. Textos largos, raros o exagerados para quien quiera una experiencia caótica y divertida.";
    default:
      return "";
  }
}

function updateDifficultyDescriptions() {
  difficultyDescription.textContent = getDifficultyDescription(difficultySelect.value);
  startDifficultyDescription.textContent = getDifficultyDescription(startDifficultySelect.value);
}

function getDifficultyMultiplier() {
  switch (difficulty) {
    case "muy-facil":
      return 0.7;
    case "facil":
      return 0.85;
    case "normal":
      return 1;
    case "dificil":
      return 1.2;
    case "muy-dificil":
      return 1.4;
    case "absurdo":
      return 1.8;
    default:
      return 1;
  }
}

function getWordsGoalForLevel(currentLevel) {
  let baseGoal;

  if (currentLevel === 1) baseGoal = 6;
  else if (currentLevel === 2) baseGoal = 8;
  else if (currentLevel === 3) baseGoal = 10;
  else baseGoal = 12;

  return Math.max(4, Math.round(baseGoal * getDifficultyMultiplier()));
}

function getCurrentWordList() {
  const difficultyPack = WORD_LIST[difficulty];

  if (!difficultyPack) {
    return WORD_LIST["normal"].level1;
  }

  if (level === 1 && difficultyPack.level1?.length) {
    return difficultyPack.level1;
  }

  if (level === 2 && difficultyPack.level2?.length) {
    return difficultyPack.level2;
  }

  if (level >= 3 && difficultyPack.level3?.length) {
    return difficultyPack.level3;
  }

  return WORD_LIST["normal"].level1;
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

  if (!/^[a-zñ]$/i.test(nextChar)) return;

  const keyEl = document.querySelector(`.key[data-key="${nextChar.toLowerCase()}"]`);
  if (keyEl) {
    keyEl.classList.add("key--target");
  }
}

function flashKey(keyChar, className) {
  if (!/^[a-zñ]$/i.test(keyChar)) return;

  const keyEl = document.querySelector(`.key[data-key="${keyChar.toLowerCase()}"]`);
  if (!keyEl) return;

  keyEl.classList.remove("key--target");
  keyEl.classList.add(className);

  setTimeout(() => {
    keyEl.classList.remove(className);
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

function handleKeydown(event) {
  if (isPaused || !gameStarted) return;

  const key = event.key;

  if (key.length !== 1) return;

  totalKeystrokes++;

  const expected = currentWord[currentIndex];
  if (!expected) return;

  if (normalizeChar(key) === normalizeChar(expected)) {
    correctKeystrokes++;
    currentIndex++;

    if (/^[a-zñ]$/i.test(key)) {
      flashKey(key, "key--hit");
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

    if (/^[a-zñ]$/i.test(key)) {
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
  wordsGoal = getWordsGoalForLevel(level);

  startAPMTimer();
  updateStats();
  setNewWord();
  isPaused = false;
}

function applyDifficulty() {
  difficulty = difficultySelect.value;
  startDifficultySelect.value = difficulty;
  wordsGoal = getWordsGoalForLevel(level);
  updateStats();
  updateDifficultyDescriptions();
}

function startGame() {
  playSound(buttonClickSound);

  difficulty = startDifficultySelect.value;
  difficultySelect.value = difficulty;

  level = 1;
  wordsCompleted = 0;
  errors = 0;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  wordsGoal = getWordsGoalForLevel(level);

  gameStarted = true;
  isPaused = false;

  updateDifficultyDescriptions();
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

  startGameBtn.addEventListener("click", startGame);
});