/**
 * MascotPhrases.js - Comprehensive Typing Teacher Pedagogical Advice & Mascot Dialogue
 * 
 * Curated from real typing teacher methodologies and pedagogical research for children (ages 6–11):
 * - Posture & Ergonomics (90° rule, floating wrists, curved fingers, eyes distance)
 * - Home Row & Guide Keys (campamento base, tactile bumps on F and J, finger territories, thumbs on spacebar)
 * - Touch Typing Technique (eyes on screen, steady rhythm, light gentle taps, phonetic subvocalization)
 * - Positive Psychology & Anti-Frustration (mistakes as clues, dragon breathing, patience, muscle memory)
 * - Active Hand Breaks & Warm-ups (twinkling star hands, magic potion wrist rolls, water drop shakes)
 * - Celebrations & Rhythms (fever streaks, level completions, playful greetings)
 */

export const PHRASE_CATEGORIES = Object.freeze({
  POSTURE: 'posture',
  HOME_ROW: 'home_row',
  TECHNIQUE: 'technique',
  ANTI_FRUSTRATION: 'anti_frustration',
  BREAKS: 'breaks',
  STREAKS: 'streaks',
  STUCK: 'stuck',
  VICTORY: 'victory',
  GREETINGS: 'greetings'
});

/**
 * 🧘 Category 1: Ergonomía y Postura Corporal
 */
export const POSTURE_TIPS = Object.freeze([
  {
    id: 'posture-1',
    category: 'posture',
    categoryLabel: 'Postura y Ergonomía',
    icon: '🧘',
    title: 'Espalda como un rey',
    text: 'Siéntate derecho apoyando la espalda en el respaldo de tu silla, ¡como un rey o reina en su trono!',
    speechText: 'Siéntate derecho apoyando la espalda en el respaldo de tu silla, como un rey o una reina en su trono.'
  },
  {
    id: 'posture-2',
    category: 'posture',
    categoryLabel: 'Postura y Ergonomía',
    icon: '🌳',
    title: 'Pies como raíces',
    text: 'Apoya ambos pies planos en el suelo para mantener un equilibrio firme y seguro.',
    speechText: 'Apoya ambos pies planos en el suelo para mantener un equilibrio firme y seguro.'
  },
  {
    id: 'posture-3',
    category: 'posture',
    categoryLabel: 'Postura y Ergonomía',
    icon: '☁️',
    title: 'Muñecas flotantes',
    text: 'No apoyes las muñecas en la mesa ni en el teclado; déjalas flotar en el aire como nubes suaves.',
    speechText: 'No apoyes las muñecas en la mesa ni en el teclado; déjalas flotar en el aire como nubes suaves.'
  },
  {
    id: 'posture-4',
    category: 'posture',
    categoryLabel: 'Postura y Ergonomía',
    icon: '🐱',
    title: 'Garras de gatito',
    text: 'Curva tus dedos suavemente sobre las teclas, como si sujetaras una manzana o una pompa de jabón.',
    speechText: 'Curva tus dedos suavemente sobre las teclas, como si sujetaras una manzana sin romperla.'
  },
  {
    id: 'posture-5',
    category: 'posture',
    categoryLabel: 'Postura y Ergonomía',
    icon: '📐',
    title: 'Regla de los 90 grados',
    text: 'Tus codos y tus rodillas deben doblarse en un ángulo recto bien cómodo y natural.',
    speechText: 'Tus codos y tus rodillas deben doblarse en un ángulo recto bien cómodo y natural.'
  },
  {
    id: 'posture-6',
    category: 'posture',
    categoryLabel: 'Postura y Ergonomía',
    icon: '👀',
    title: 'Ojos a distancia',
    text: 'Coloca la pantalla a la altura de tus ojos y a la distancia de tu brazo estirado.',
    speechText: 'Coloca la pantalla a la altura de tus ojos y a la distancia de tu brazo estirado.'
  },
  {
    id: 'posture-7',
    category: 'posture',
    categoryLabel: 'Postura y Ergonomía',
    icon: '🎈',
    title: 'Hombros ligeros',
    text: 'Relaja los hombros y suelta la tensión; teclear relajado es más rápido y divertido.',
    speechText: 'Relaja los hombros y suelta la tensión; teclear relajado es más rápido y divertido.'
  },
  {
    id: 'posture-8',
    category: 'posture',
    categoryLabel: 'Postura y Ergonomía',
    icon: '🕯️',
    title: 'Buena luz',
    text: 'Asegúrate de jugar en un espacio con buena luz para que tu vista no se fatigue.',
    speechText: 'Asegúrate de jugar en un espacio con buena luz para que tu vista no se fatigue.'
  }
]);

/**
 * 🏠 Category 2: Fila Guía y Posición de Dedos (Campamento Base)
 */
export const HOME_ROW_TIPS = Object.freeze([
  {
    id: 'home-1',
    category: 'home_row',
    categoryLabel: 'Campamento Base',
    icon: '🏠',
    title: 'Campamento base',
    text: 'Tus dedos siempre descansan en la fila central: [A] [S] [D] [F] con la izquierda y [J] [K] [L] [Ñ] con la derecha.',
    speechText: 'Tus dedos siempre descansan en la fila central: A S D F con la izquierda y J K L EÑE con la derecha.'
  },
  {
    id: 'home-2',
    category: 'home_row',
    categoryLabel: 'Campamento Base',
    icon: '⛰️',
    title: 'Las montañitas secretas',
    text: 'Las teclas [F] y [J] tienen dos pequeñas marcas táctiles para que tus índices las encuentren sin mirar.',
    speechText: 'Las teclas F y J tienen dos pequeñas marcas táctiles para que tus índices las encuentren sin mirar.'
  },
  {
    id: 'home-3',
    category: 'home_row',
    categoryLabel: 'Campamento Base',
    icon: '👑',
    title: 'Reyes del espacio',
    text: 'Usa siempre cualquiera de tus dos pulgares para pulsar la [Barra Espaciadora].',
    speechText: 'Usa siempre cualquiera de tus dos pulgares para pulsar la barra espaciadora.'
  },
  {
    id: 'home-4',
    category: 'home_row',
    categoryLabel: 'Campamento Base',
    icon: '🛡️',
    title: 'Meñiques guardianes',
    text: 'El dedo meñique es pequeño pero fuerte: vigila la [A], la [Ñ], [Intro] y la tecla [Mayús].',
    speechText: 'El dedo meñique es pequeño pero fuerte: vigila la A, la EÑE, Intro y la tecla Mayúsculas.'
  },
  {
    id: 'home-5',
    category: 'home_row',
    categoryLabel: 'Campamento Base',
    icon: '🤝',
    title: 'Cada dedo en su casa',
    text: 'No le robes el trabajo a tus dedos vecinos; cada dedo tiene su propio grupo de teclas asignadas.',
    speechText: 'No le robes el trabajo a tus dedos vecinos; cada dedo tiene su propio grupo de teclas asignadas.'
  },
  {
    id: 'home-6',
    category: 'home_row',
    categoryLabel: 'Campamento Base',
    icon: '🏡',
    title: 'Vuelve siempre a casa',
    text: 'Después de estirar un dedo para pulsar una tecla lejana, devuélvelo enseguida a la fila guía.',
    speechText: 'Después de estirar un dedo para pulsar una tecla lejana, devuélvelo enseguida a la fila guía.'
  },
  {
    id: 'home-7',
    category: 'home_row',
    categoryLabel: 'Campamento Base',
    icon: '💛',
    title: 'Corazón centinela',
    text: 'El dedo corazón izquierdo cuida la [E], la [D] y la [C]; y el derecho cuida la [I], la [K] y la coma.',
    speechText: 'El dedo corazón izquierdo cuida la E, la D y la C; y el derecho cuida la I, la K y la coma.'
  },
  {
    id: 'home-8',
    category: 'home_row',
    categoryLabel: 'Campamento Base',
    icon: '🧡',
    title: 'Anular equilibrista',
    text: 'El dedo anular izquierdo viaja por la [W], la [S] y la [X]; y el derecho por la [O], la [L] y el punto.',
    speechText: 'El dedo anular izquierdo viaja por la W, la S y la X; y el derecho por la O, la L y el punto.'
  }
]);

/**
 * 🎯 Category 3: Técnica de Escritura al Tacto
 */
export const TECHNIQUE_TIPS = Object.freeze([
  {
    id: 'tech-1',
    category: 'technique',
    categoryLabel: 'Técnica al Tacto',
    icon: '👁️',
    title: 'Ojos en la pantalla',
    text: 'Tus ojos son exploradores y tus dedos constructores. ¡Confía en tus manos sin mirar hacia abajo!',
    speechText: 'Tus ojos son exploradores y tus dedos constructores. Confía en tus manos sin mirar hacia abajo.'
  },
  {
    id: 'tech-2',
    category: 'technique',
    categoryLabel: 'Técnica al Tacto',
    icon: '🎵',
    title: 'Ritmo constante',
    text: 'Más vale escribir a un compás constante y suave que correr y tropezar: ¡tan, tan, tan!',
    speechText: 'Más vale escribir a un compás constante y suave que correr y tropezar: ritmo tan, tan, tan.'
  },
  {
    id: 'tech-3',
    category: 'technique',
    categoryLabel: 'Técnica al Tacto',
    icon: '🌧️',
    title: 'Gotas de lluvia',
    text: 'Toca las teclas con suavidad como gotas de lluvia sobre una hoja; no hace falta martillear con fuerza.',
    speechText: 'Toca las teclas con suavidad como gotas de lluvia sobre una hoja; no hace falta martillear con fuerza.'
  },
  {
    id: 'tech-4',
    category: 'technique',
    categoryLabel: 'Técnica al Tacto',
    icon: '🗣️',
    title: 'Pronuncia en voz baja',
    text: 'Si dices la letra o sílaba en voz bajita al pulsarla, tus dedos la memorizarán el doble de rápido.',
    speechText: 'Si dices la letra o sílaba en voz bajita al pulsarla, tus dedos la memorizarán el doble de rápido.'
  },
  {
    id: 'tech-5',
    category: 'technique',
    categoryLabel: 'Técnica al Tacto',
    icon: '🎯',
    title: 'Primero puntería',
    text: 'La rapidez llega sola con la práctica si primero aseguras el dedo y la tecla correctos.',
    speechText: 'La rapidez llega sola con la práctica si primero aseguras el dedo y la tecla correctos.'
  },
  {
    id: 'tech-6',
    category: 'technique',
    categoryLabel: 'Técnica al Tacto',
    icon: '⚡',
    title: 'Toque de pluma',
    text: 'No aprietes las teclas hasta el fondo; dale un toquecito ágil y suelta enseguida.',
    speechText: 'No aprietes las teclas hasta el fondo; dale un toquecito ágil y suelta enseguida.'
  },
  {
    id: 'tech-7',
    category: 'technique',
    categoryLabel: 'Técnica al Tacto',
    icon: '🧭',
    title: 'Brújula táctil',
    text: 'Si sientes que te has perdido, desliza tus índices hasta sentir las marquitas de la [F] y la [J].',
    speechText: 'Si sientes que te has perdido, desliza tus índices hasta sentir las marquitas de la F y la J.'
  },
  {
    id: 'tech-8',
    category: 'technique',
    categoryLabel: 'Técnica al Tacto',
    icon: '🎹',
    title: 'Manos de pianista',
    text: 'Tocar el teclado es como tocar el piano: cada dedo tiene su tecla y su propio turno.',
    speechText: 'Tocar el teclado es como tocar el piano: cada dedo tiene su tecla y su propio turno.'
  }
]);

/**
 * ✨ Category 4: Gestión Emocional y Anti-Frustración
 */
export const ANTI_FRUSTRATION_TIPS = Object.freeze([
  {
    id: 'anti-1',
    category: 'anti_frustration',
    categoryLabel: 'Ánimo y Paciencia',
    icon: '🧩',
    title: 'Los errores son pistas',
    text: 'Equivocarse es el truco secreto del cerebro para saber qué tecla necesita un poco más de cariño.',
    speechText: 'Equivocarse es el truco secreto del cerebro para saber qué tecla necesita un poco más de cariño.'
  },
  {
    id: 'anti-2',
    category: 'anti_frustration',
    categoryLabel: 'Ánimo y Paciencia',
    icon: '🐉',
    title: 'Respiración de dragón',
    text: 'Si una tecla se te resiste, respira hondo como un dragón sabio y vuelve a intentarlo con calma.',
    speechText: 'Si una tecla se te resiste, respira hondo como un dragón sabio y vuelve a intentarlo con calma.'
  },
  {
    id: 'anti-3',
    category: 'anti_frustration',
    categoryLabel: 'Ánimo y Paciencia',
    icon: '🚲',
    title: 'Como montar en bici',
    text: 'Al principio hay que prestar mucha atención, pero muy pronto tus dedos volarán solos sin pensarlo.',
    speechText: 'Al principio hay que prestar mucha atención, pero muy pronto tus dedos volarán solos sin pensarlo.'
  },
  {
    id: 'anti-4',
    category: 'anti_frustration',
    categoryLabel: 'Ánimo y Paciencia',
    icon: '✨',
    title: 'Magia de 5 minutos',
    text: 'Jugar un ratito corto cada día entrena la memoria muscular de tus manos para toda la vida.',
    speechText: 'Jugar un ratito corto cada día entrena la memoria muscular de tus manos para toda la vida.'
  },
  {
    id: 'anti-5',
    category: 'anti_frustration',
    categoryLabel: 'Ánimo y Paciencia',
    icon: '🏆',
    title: 'Campeón sin prisa',
    text: 'Aquí no hay prisa ni vidas que perder; cada acierto es un superpoder nuevo para tus dedos.',
    speechText: 'Aquí no hay prisa ni vidas que perder; cada acierto es un superpoder nuevo para tus dedos.'
  },
  {
    id: 'anti-6',
    category: 'anti_frustration',
    categoryLabel: 'Ánimo y Paciencia',
    icon: '💖',
    title: 'Paciencia y cariño',
    text: 'Trata con cariño a tus deditos; están aprendiendo un baile nuevo y lo están haciendo genial.',
    speechText: 'Trata con cariño a tus deditos; están aprendiendo un baile nuevo y lo están haciendo genial.'
  },
  {
    id: 'anti-7',
    category: 'anti_frustration',
    categoryLabel: 'Ánimo y Paciencia',
    icon: '🌟',
    title: 'Paso a pasito',
    text: 'Nadie nace sabiendo escribir sin mirar. ¡Con cada nivel estás más cerca de ser un maestro!',
    speechText: 'Nadie nace sabiendo escribir sin mirar. Con cada nivel estás más cerca de ser un maestro.'
  }
]);

/**
 * ⭐ Category 5: Pausas Activas y Ejercicios de Estiramiento
 */
export const BREAK_EXERCISES = Object.freeze([
  {
    id: 'break-1',
    category: 'breaks',
    categoryLabel: 'Pausa Activa',
    icon: '⭐',
    title: 'Estrellitas fugaces',
    text: 'Abre y cierra las manos 5 veces bien abiertas, como estrellitas parpadeando en el cielo.',
    speechText: 'Abre y cierra las manos cinco veces bien abiertas, como estrellitas parpadeando en el cielo.'
  },
  {
    id: 'break-2',
    category: 'breaks',
    categoryLabel: 'Pausa Activa',
    icon: '🥣',
    title: 'Sopa mágica',
    text: 'Gira las muñecas suavemente en círculos en el aire como si revolvieras una pócima mágica.',
    speechText: 'Gira las muñecas suavemente en círculos en el aire como si revolvieras una pócima mágica.'
  },
  {
    id: 'break-3',
    category: 'breaks',
    categoryLabel: 'Pausa Activa',
    icon: '💦',
    title: 'Sacudir gotas',
    text: 'Sacude las manos flojitas hacia abajo como si te secaras gotitas de agua de lluvia.',
    speechText: 'Sacude las manos flojitas hacia abajo como si te secaras gotitas de agua de lluvia.'
  },
  {
    id: 'break-4',
    category: 'breaks',
    categoryLabel: 'Pausa Activa',
    icon: '🔢',
    title: 'Baile de dedos',
    text: 'Toca la punta de tu pulgar con cada dedo uno a uno: índice, corazón, anular y meñique. ¡1, 2, 3, 4!',
    speechText: 'Toca la punta de tu pulgar con cada dedo uno a uno: índice, corazón, anular y meñique. Uno, dos, tres, cuatro.'
  },
  {
    id: 'break-5',
    category: 'breaks',
    categoryLabel: 'Pausa Activa',
    icon: '🔭',
    title: 'Mirada al horizonte',
    text: 'Mira por la ventana o a un rincón lejano durante 10 segundos para que tus ojos descansen felices.',
    speechText: 'Mira por la ventana o a un rincón lejano durante diez segundos para que tus ojos descansen felices.'
  },
  {
    id: 'break-6',
    category: 'breaks',
    categoryLabel: 'Pausa Activa',
    icon: '🦁',
    title: 'Bostezo de león',
    text: 'Estira los brazos hacia arriba bien alto, abre las manos y respira hondo como un león contento.',
    speechText: 'Estira los brazos hacia arriba bien alto, abre las manos y respira hondo como un león contento.'
  }
]);

/**
 * Combined list of all core pedagogical tips for cycling in the tip bar.
 */
export const ALL_PEDAGOGICAL_TIPS = Object.freeze([
  ...POSTURE_TIPS,
  ...HOME_ROW_TIPS,
  ...TECHNIQUE_TIPS,
  ...ANTI_FRUSTRATION_TIPS,
  ...BREAK_EXERCISES
]);

/**
 * 🔥 Category 6: Celebraciones de Racha y Modo Fiebre
 */
export const STREAK_CELEBRATIONS = Object.freeze([
  '¡Tus dedos tienen motores de cohete! 🚀 ¡Menudo ritmo llevas!',
  '¡Vaya puntería de gran pianista! 🎹 ¡La melodía de las teclas suena genial!',
  '¡Chispas de energía mágica! ⚡ ¡Tus reflejos están imparables!',
  '¡Nivel maestro! 🌟 Campamento base dominado y dedos voladores.',
  '¡Modo Fiebre a tope! 🔥 ¡Tus manos se mueven a la velocidad de la luz!',
  '¡Diana tras diana! 🎯 Escribir sin mirar ya es tu nuevo superpoder.'
]);

/**
 * 💡 Category 7: Pistas Amables cuando el Jugador se Detiene
 */
export const STUCK_HINTS = Object.freeze([
  'Busca con tu índice la montañita en la tecla para orientarte y pulsa la tecla que brilla.',
  'Tómate tu tiempo: mira el color de la mano en pantalla y pulsa con suavidad.',
  'Respira hondo y relajado: tus deditos saben perfectamente dónde está la tecla.',
  'Vuelve un segundo al campamento base y estira tu dedito hacia la tecla iluminada.',
  '¡Tranquilo, no hay prisa! En Mecano jugamos para divertirnos y aprender.'
]);

/**
 * 🏆 Category 8: Celebración de Nivel Completado
 */
export const LEVEL_VICTORY_PHRASES = Object.freeze([
  '¡Nivel superado con matrícula de honor! 🏆 ¡Choca esos cinco pulsando [Espacio]!',
  '¡Misión galáctica completada! ⭐ Pulsa [Espacio] para celebrar juntos.',
  '¡Brillante trabajo en equipo! 🎉 ¡Choca esos cinco con la barra espaciadora!',
  '¡Un paso gigante hacia el siguiente cinturón! 🥋 ¡Pulsa [Espacio] para festejar!',
  '¡Tus dedos son los reyes del teclado! 👑 ¡Pulsa [Espacio] y bailemos de alegría!'
]);

/**
 * 🤖 Category 9: Saludos y Consejos de Roby al hacerle clic
 */
export const MASCOT_GREETINGS = Object.freeze([
  '¡Hola, campeón! Mis sensores dicen que hoy vas a conseguir tres estrellas relucientes.',
  '¿Sabías que tus dedos aprenden mientras juegas? ¡Es el superpoder de la memoria táctil!',
  '¡Recuerda curvar tus dedos como si sostuvieras una manzana! ¡Tú puedes con todo!',
  '¡Roby es tu fan número uno en toda la galaxia! ¡A por la siguiente palabra!',
  'Si alguna tecla se te resiste, tómate un respiro; aquí aprendemos sonriendo.',
  '¡Tus manos son mágicas! Cada día que juegas, escribes con más seguridad y ritmo.'
]);

// Track cycling index in memory
let _tipCycleIndex = 0;

/**
 * Get next pedagogical tip sequentially to avoid immediate repetitions.
 * @returns {Object} Structured tip item
 */
export function getNextPedagogicalTip() {
  const tip = ALL_PEDAGOGICAL_TIPS[_tipCycleIndex % ALL_PEDAGOGICAL_TIPS.length];
  _tipCycleIndex = (_tipCycleIndex + 1) % ALL_PEDAGOGICAL_TIPS.length;
  return tip;
}

/**
 * Get random tip from a specific category or any category.
 * @param {string|null} category
 * @returns {Object}
 */
export function getRandomTip(category = null) {
  let pool = ALL_PEDAGOGICAL_TIPS;
  if (category) {
    const filtered = ALL_PEDAGOGICAL_TIPS.filter(t => t.category === category);
    if (filtered.length > 0) pool = filtered;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get random streak celebration phrase.
 * @returns {string}
 */
export function getRandomStreakPhrase() {
  return STREAK_CELEBRATIONS[Math.floor(Math.random() * STREAK_CELEBRATIONS.length)];
}

/**
 * Get encouraging hint when user is stuck.
 * @param {string} [expectedKey]
 * @param {string} [fingerName]
 * @param {string} [colorName]
 * @returns {string}
 */
export function getStuckHint(expectedKey = '', fingerName = '', colorName = '') {
  if (expectedKey) {
    const keyDisplay = expectedKey === ' ' ? 'Espacio' : expectedKey.toUpperCase();
    const fingerPart = fingerName ? ` con tu ${fingerName}` : '';
    const colorPart = colorName ? ` (${colorName})` : '';
    
    // Special home row pedagogical references
    if (expectedKey.toLowerCase() === 'f') {
      return `¡Busca la montañita secreta de la tecla [F] con tu índice izquierdo!`;
    }
    if (expectedKey.toLowerCase() === 'j') {
      return `¡Busca la montañita secreta de la tecla [J] con tu índice derecho!`;
    }
    if (expectedKey === ' ') {
      return `¡Usa cualquiera de tus dos pulgares para pulsar la [Barra Espaciadora]!`;
    }

    const hints = [
      `¡Pulsa la tecla [${keyDisplay}]${fingerPart}${colorPart}!`,
      `¡Tranquilo! Lleva tu ${fingerName || 'dedito'} a la tecla [${keyDisplay}]. ¡Tú puedes!`,
      `Vuelve a casa un segundo y pulsa [${keyDisplay}]${fingerPart}.`
    ];
    return hints[Math.floor(Math.random() * hints.length)];
  }

  return STUCK_HINTS[Math.floor(Math.random() * STUCK_HINTS.length)];
}

/**
 * Get victory phrase for level completion.
 * @returns {string}
 */
export function getVictoryPhrase() {
  return LEVEL_VICTORY_PHRASES[Math.floor(Math.random() * LEVEL_VICTORY_PHRASES.length)];
}

/**
 * Get random mascot greeting when child clicks on Roby.
 * @returns {string}
 */
export function getRandomGreeting() {
  return MASCOT_GREETINGS[Math.floor(Math.random() * MASCOT_GREETINGS.length)];
}
