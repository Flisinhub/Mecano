// =============================================================================
// MECANO AVENTURA KIDS - LISTA DE PALABRAS Y MUNDOS DIDÁCTICOS (6 A 8 AÑOS)
// Estructura pedagógica graduada por memoria muscular, fonética y apoyos visuales
// =============================================================================

// 🥋 Rangos y Cinturones evolutivos de Roby
const ROBY_BELTS = {
  "blanco": {
    id: "blanco",
    name: "Cinturón Blanco",
    title: "Roby Aprendiz",
    color: "#f1f2f6",
    emoji: "🥋⚪",
    minLevel: 1,
    minStars: 0,
    cheer: "¡Has comenzado tu camino de supermecanógrafo con Roby!"
  },
  "amarillo": {
    id: "amarillo",
    name: "Cinturón Amarillo",
    title: "Roby Explorador",
    color: "#ffd32a",
    emoji: "🥋🟡",
    minLevel: 3,
    minStars: 5,
    cheer: "¡Increíble! ¡Roby ha conseguido el Cinturón Amarillo!"
  },
  "verde": {
    id: "verde",
    name: "Cinturón Verde",
    title: "Roby Ninja del Teclado",
    color: "#2ed573",
    emoji: "🥋🟢",
    minLevel: 5,
    minStars: 11,
    cheer: "¡Sensacional! ¡Tus dedos se mueven veloces como un ninja!"
  },
  "negro": {
    id: "negro",
    name: "Cinturón Negro y Corona",
    title: "Gran Maestro Roby",
    color: "#ffa502",
    emoji: "🥋⚫👑",
    minLevel: 7,
    minStars: 18,
    cheer: "¡Perfección legendaria! ¡Eres el Gran Maestro del Teclado!"
  }
};

const KIDS_LEVELS = {
  // ---------------------------------------------------------------------------
  // 🎯 NIVEL 1: LOS ÍNDICES EN CASA (F y J)
  // Fase 1: Sin espacios para asentar ritmo continuo entre índices.
  // Fase 2: Con espacio suave usando pulgares.
  // ---------------------------------------------------------------------------
  "1-indices": {
    id: "1-indices",
    levelNumber: 1,
    icon: "🎯",
    name: "1 - 🎯 Los Índices en Casa (F y J)",
    shortName: "Índices (F y J)",
    beltTier: "blanco",
    minAccuracy: 85, // Umbral adaptativo para evitar frustración inicial
    allowedKeys: ["f", "j", " "],
    objective: "Ubicar los índices en las marcas táctiles del teclado",
    speech: "¡Hola! Coloca tus dedos índices en las marcas de la F y la J. ¡Sigue el ritmo de las luces!",
    tip: "💡 Consejo de Roby: Fíjate en los pequeños bultitos en las teclas F y J. ¡Ahí descansan tus dedos índices!",
    words: [
      // Fase 1: Estrictamente continuas sin espacio
      { text: "f", icon: "👈", label: "Índice Izquierdo" },
      { text: "j", icon: "👉", label: "Índice Derecho" },
      { text: "ff", icon: "⚡", label: "Doble F" },
      { text: "jj", icon: "⚡", label: "Doble J" },
      { text: "fj", icon: "🎵", label: "Paso Izq-Der" },
      { text: "jf", icon: "🎵", label: "Paso Der-Izq" },
      { text: "ffjj", icon: "🚀", label: "Carrera F-J" },
      { text: "jjff", icon: "🚀", label: "Carrera J-F" },
      // Fase 2: Introducción suave de la barra espaciadora con pulgar
      { text: "f j", icon: "🎹", label: "Ritmo con espacio" },
      { text: "j f", icon: "🎹", label: "Ritmo con espacio" },
      { text: "f j f", icon: "🎶", label: "Compás suave" },
      { text: "j f j", icon: "🎶", label: "Compás suave" }
    ]
  },

  // ---------------------------------------------------------------------------
  // 🏠 NIVEL 2: LA FILA GUÍA BÁSICA (A, S, D, F / J, K, L, Ñ)
  // Patrones fonéticos de 2 a 3 letras. Todos los dedos anclados en su posición base.
  // ---------------------------------------------------------------------------
  "2-filaguia": {
    id: "2-filaguia",
    levelNumber: 2,
    icon: "🏠",
    name: "2 - 🏠 La Fila Guía Básica (A S D F / J K L Ñ)",
    shortName: "Fila Guía Central",
    beltTier: "blanco",
    minAccuracy: 85, // Umbral adaptativo para consolidación motriz
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", "ñ", " "],
    objective: "Descansar todos los dedos en la posición base",
    speech: "¡Muy bien! Ahora dejamos descansar todos los deditos en la fila central como patitas de gatito.",
    tip: "💡 Consejo de Roby: Cada dedo tiene su tecla: Meñique en la A, anular en la S, corazón en la D e índice en la F.",
    words: [
      { text: "as", icon: "🐾", label: "Paso suave" },
      { text: "fa", icon: "🎼", label: "Nota musical" },
      { text: "la", icon: "🎶", label: "Música" },
      { text: "da", icon: "🎁", label: "Dar" },
      { text: "sal", icon: "🧂", label: "Sal" },
      { text: "ala", icon: "🪽", label: "Ala de pájaro" },
      { text: "asa", icon: "☕", label: "Asa de taza" },
      { text: "sala", icon: "🛋️", label: "Sala de casa" },
      { text: "falda", icon: "👗", label: "Falda" },
      { text: "faja", icon: "🎀", label: "Lazo faja" },
      { text: "las", icon: "✨", label: "Las estrellas" },
      { text: "alla", icon: "👉", label: "Allá lejos" }
    ]
  },

  // ---------------------------------------------------------------------------
  // ✨ NIVEL 3: VOCALES SUPERIORES (E, I) Y PRIMERAS PALABRAS REALES
  // Alcance vertical corto de los dedos medios (D->E, K->I).
  // ---------------------------------------------------------------------------
  "3-vocales-ei": {
    id: "3-vocales-ei",
    levelNumber: 3,
    icon: "✨",
    name: "3 - ✨ Vocales Superiores (E, I) y Palabras",
    shortName: "Vocales E / I",
    beltTier: "amarillo",
    minAccuracy: 90, // Paso estricto del 90% a partir de nivel 3
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", "ñ", "e", "i", " "],
    objective: "Movimiento vertical corto de los dedos medios manteniendo la mano anclada",
    speech: "¡Atención! Añadimos las vocales E e I. Los dedos corazón suben un pasito y vuelven a casa.",
    tip: "💡 Consejo de Roby: Sube el dedo corazón a la E o la I y devuélvelo enseguida a su casa.",
    words: [
      { text: "isla", icon: "🏝️", label: "Isla mágica" },
      { text: "lila", icon: "🌸", label: "Flor lila" },
      { text: "fiel", icon: "🐶", label: "Perro fiel" },
      { text: "sed", icon: "💧", label: "Gota de agua" },
      { text: "dia", icon: "☀️", label: "Día soleado" },
      { text: "idea", icon: "💡", label: "Buena idea" },
      { text: "seda", icon: "🧣", label: "Seda suave" },
      { text: "fila", icon: "🚶", label: "Fila de niños" },
      { text: "ella", icon: "👧", label: "Ella" },
      { text: "el", icon: "👦", label: "Él" },
      { text: "leal", icon: "🤝", label: "Amigo leal" },
      { text: "fide", icon: "🍜", label: "Fideos ricos" }
    ]
  },

  // ---------------------------------------------------------------------------
  // 🍎 NIVEL 4: EXPANSIÓN DE VOCALES (O, U) Y CONSONANTES (C, M, P, T)
  // Vocabulario rico de objetos y animales familiares para el niño.
  // ---------------------------------------------------------------------------
  "4-expansion": {
    id: "4-expansion",
    levelNumber: 4,
    icon: "🍎",
    name: "4 - 🍎 Vocales (O, U) y Letras (C, M, P, T)",
    shortName: "Vocales O/U y C,M,P,T",
    beltTier: "amarillo",
    minAccuracy: 90,
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", "ñ", "e", "i", "o", "u", "c", "m", "p", "t", " "],
    objective: "Consolidar el alcance arriba y abajo con la mano anclada en el escritorio",
    speech: "¡Llegan las vocales O y U y las consonantes C, M, P y T! ¡Mira qué palabras tan chulas!",
    tip: "💡 Consejo de Roby: Mantén las muñecas relajadas sobre la mesa como si sostuvieras una manzana.",
    words: [
      { text: "mapa", icon: "🗺️", label: "Mapa del tesoro" },
      { text: "pato", icon: "🦆", label: "Pato simpático" },
      { text: "casa", icon: "🏠", label: "Casa bonita" },
      { text: "moto", icon: "🏍️", label: "Moto veloz" },
      { text: "tomate", icon: "🍅", label: "Tomate rojo" },
      { text: "sol", icon: "☀️", label: "Sol brillante" },
      { text: "oso", icon: "🐻", label: "Oso panda" },
      { text: "sopa", icon: "🥣", label: "Sopa calentita" },
      { text: "copa", icon: "🏆", label: "Copa de campeón" },
      { text: "pino", icon: "🌲", label: "Pino del bosque" },
      { text: "mesa", icon: "🪑", label: "Mesa de estudio" },
      { text: "puma", icon: "🐆", label: "Puma ágil" }
    ]
  },

  // ---------------------------------------------------------------------------
  // 🌟 NIVEL 5: PALABRAS COMPUESTAS Y LA BARRA ESPACIADORA
  // Frases de 2 a 3 palabras cortas. Sin tilde en teclado para no frustrar,
  // pero con ortografía y tilde visual en la etiqueta ilustrada.
  // ---------------------------------------------------------------------------
  "5-frases": {
    id: "5-frases",
    levelNumber: 5,
    icon: "🌟",
    name: "5 - 🌟 Frases Cortas y Barra Espaciadora",
    shortName: "Frases con Espacio",
    beltTier: "verde",
    minAccuracy: 90,
    allowedKeys: ["a", "s", "d", "f", "j", "k", "l", "ñ", "e", "i", "o", "u", "c", "m", "p", "t", "b", "r", "z", " "],
    objective: "Coordinar palabras independientes separadas por el pulgar en la barra espaciadora",
    speech: "¡Increíble! Ahora escribiremos frases de dos o tres palabras usando el pulgar para dar espacios.",
    tip: "💡 Consejo de Roby: Al terminar una palabra, pulsa la barra espaciadora con el pulgar para respirar.",
    words: [
      { text: "el pato", icon: "🦆", label: "El pato" },
      { text: "la casa", icon: "🏠", label: "La casa" },
      { text: "mi mama", icon: "❤️", label: "Mi mamá" },
      { text: "mi papa", icon: "⭐", label: "Mi papá" },
      { text: "el sol sale", icon: "🌅", label: "El sol sale" },
      { text: "el tomate rojo", icon: "🍅", label: "El tomate rojo" },
      { text: "la moto corre", icon: "🏍️", label: "La moto corre" },
      { text: "dame sopa", icon: "🥣", label: "Dame sopa" },
      { text: "mi oso duerme", icon: "🐻", label: "Mi oso duerme" },
      { text: "la sopa quema", icon: "🍲", label: "La sopa quema" },
      { text: "un pato nada", icon: "🦆", label: "Un pato nada" },
      { text: "la luna brilla", icon: "🌙", label: "La luna brilla" }
    ]
  },

  // ---------------------------------------------------------------------------
  // 🏰 NIVEL 6: EL REINO DE LOS CUENTOS Y AVENTURAS
  // Frases completas de una línea con todas las letras del abecedario.
  // ---------------------------------------------------------------------------
  "6-cuentos": {
    id: "6-cuentos",
    levelNumber: 6,
    icon: "🏰",
    name: "6 - 🏰 El Reino de los Cuentos y Aventuras",
    shortName: "Cuentos Divertidos",
    beltTier: "verde",
    minAccuracy: 90,
    allowedKeys: "abcdefghijklmnñopqrstuvwxyz .,áéíóú".split(""),
    objective: "Lectura fluida y coordinación de frases enteras",
    speech: "¡Había una vez...! Vamos a escribir historias mágicas de una línea completa.",
    tip: "💡 Consejo de Roby: Para escribir acentos, pulsa primero la tecla del acento (´) y luego la vocal.",
    words: [
      { text: "el gato con botas baila en el tejado.", icon: "🐱", label: "El gato con botas" },
      { text: "el pequeño dragón come helado de fresa.", icon: "🐉", label: "Dragón comilón" },
      { text: "mi perrito corre feliz por el parque verde.", icon: "🐶", label: "Perrito veloz" },
      { text: "la luna brilla y cuida todos mis sueños.", icon: "🌙", label: "Noche de luna" },
      { text: "el cohete espacial viaja hacia las estrellas.", icon: "🚀", label: "Cohete estelar" },
      { text: "la tortuga nada tranquila en el lago azul.", icon: "🐢", label: "Tortuga en el lago" },
      { text: "los delfines saltan felices sobre las olas.", icon: "🐬", label: "Delfines en el mar" },
      { text: "el osito panda come ricas hojas de bambu.", icon: "🐼", label: "Osito panda" },
      { text: "un arcoiris de colores cruza todo el cielo.", icon: "🌈", label: "Arcoíris mágico" },
      { text: "las mariposas juegan entre las flores rosas.", icon: "🦋", label: "Mariposas jugando" }
    ]
  },

  // ---------------------------------------------------------------------------
  // 😂 NIVEL 7: CLUB DE CHISTES Y TRABALENGUAS TRAVIESOS
  // Signos de interrogación, exclamación y retos de agilidad.
  // ---------------------------------------------------------------------------
  "7-chistes": {
    id: "7-chistes",
    levelNumber: 7,
    icon: "😂",
    name: "7 - 😂 Club de Chistes y Trabalenguas",
    shortName: "Chistes y Retos",
    beltTier: "negro",
    minAccuracy: 90,
    allowedKeys: "abcdefghijklmnñopqrstuvwxyz .,:;!¡¿?áéíóú".split(""),
    objective: "Dominar signos de puntuación, mayúsculas y reflejos rápidos",
    speech: "¡A reírnos y desafiar a los dedos! Cuidado que no se te trabe la lengua.",
    tip: "💡 Consejo de Roby: El dedo meñique es pequeño pero muy ágil. ¡Úsalo para la tecla Mayús!",
    words: [
      { text: "tres tristes tigres comian trigo en un trigal.", icon: "🐯", label: "Trabalenguas del tigre" },
      { text: "el cielo esta despejado y brilla un gran sol.", icon: "☀️", label: "Día hermoso" },
      { text: "pepe pela patatas para hacer rica tortilla.", icon: "🥔", label: "Cocina rica" },
      { text: "el hipopotamo hipo salta con mucha alegria.", icon: "🦛", label: "Hipopótamo saltarín" },
      { text: "cuca cose una camisa suave para su amigo conejo.", icon: "🧵", label: "Costura divertida" },
      { text: "un pez nada feliz bajo el agua del ancho rio.", icon: "🐠", label: "Pez en el río" },
      { text: "la ardilla veloz guarda bellotas en el roble.", icon: "🐿️", label: "Ardilla pizpireta" },
      { text: "el barco pirata busca una isla llena de tesoros.", icon: "🏴‍☠️", label: "Barco pirata" }
    ]
  },

  // ---------------------------------------------------------------------------
  // 🐉 NIVEL 8: GRAN DESAFÍO GALÁCTICO DEL DRAGÓN ROBOT
  // Párrafos enriquecidos de maestría total de mecanografía.
  // ---------------------------------------------------------------------------
  "8-galaxia": {
    id: "8-galaxia",
    levelNumber: 8,
    icon: "🐉",
    name: "8 - 🐉 Desafío Galáctico del Dragón Robot",
    shortName: "Desafío Galáctico",
    beltTier: "negro",
    minAccuracy: 90,
    allowedKeys: "abcdefghijklmnñopqrstuvwxyz .,:;!¡¿?áéíóúÁÉÍÓÚ\n".split(""),
    objective: "Fluidez absoluta de mecanógrafo con párrafos completos",
    speech: "¡El reto definitivo de los campeones! Roby y el Dragón Robot te coronarán como maestro del teclado.",
    tip: "💡 Consejo de Roby: ¡Respira hondo y confía en tus deditos mágicos! ¡Tú tienes superpoderes!",
    words: [
      {
        text: "El capitan Roby encendio los motores de la nave estelar Orion con una gran sonrisa.\n\nA traves de la ventanilla miles de estrellas brillaban como diamantes luminosos en el espacio infinito.\n\nSu mision secreta era explorar el fabuloso planeta Caramelo donde los rios son de chocolate con leche.",
        icon: "🚀",
        label: "Viaje al Planeta Caramelo"
      },
      {
        text: "En lo alto de la colina de cristal vive el simpatico dragon Chispitas.\n\nEn vez de lanzar fuego caliente lanza divertidas pompas de jabon multicolor que flotan por todo el valle.\n\nTodos los animales del bosque juegan a atraparlas mientras cantan canciones alegres bajo la luz de la luna llena.",
        icon: "🐉",
        label: "El Dragón de Pompas"
      },
      {
        text: "El misterioso robot Timi encontro una llave dorada enterrada junto a un viejo roble magico.\n\nAl girarla en la cerradura de la roca secreta una puerta luminosa se abrio ante el mostrando un inmenso jardin encantado.\n\nFlores que cantaban y mariposas de purpurina le dieron una calida bienvenida a su nuevo hogar.",
        icon: "🤖",
        label: "La Llave Secreta de Timi"
      }
    ]
  }
};

// Diccionario de compatibilidad para código que consulte WORD_LIST directamente
const WORD_LIST = {};
Object.keys(KIDS_LEVELS).forEach((lvlKey) => {
  WORD_LIST[lvlKey] = KIDS_LEVELS[lvlKey].words.map(w => w.text);
});

// Mapa global de iconos por texto para resolver rápidamente ilustraciones
const WORD_ICONS_MAP = {};
Object.values(KIDS_LEVELS).forEach((levelObj) => {
  levelObj.words.forEach((item) => {
    WORD_ICONS_MAP[item.text.toLowerCase().trim()] = {
      icon: item.icon,
      label: item.label
    };
  });
});

/**
 * Obtiene la información visual (icono y etiqueta) para cualquier texto
 */
function getWordVisualInfo(text) {
  if (!text) return { icon: "🎯", label: "Misión" };
  const key = text.toLowerCase().trim();
  if (WORD_ICONS_MAP[key]) return WORD_ICONS_MAP[key];

  // Si no está registrado directamente, deducir un icono amigable
  if (key.includes("pato")) return { icon: "🦆", label: "Pato" };
  if (key.includes("gato")) return { icon: "🐱", label: "Gato" };
  if (key.includes("perro") || key.includes("perrito")) return { icon: "🐶", label: "Perrito" };
  if (key.includes("casa")) return { icon: "🏠", label: "Casa" };
  if (key.includes("sol")) return { icon: "☀️", label: "Sol" };
  if (key.includes("luna")) return { icon: "🌙", label: "Luna" };
  if (key.includes("estrella")) return { icon: "⭐", label: "Estrellas" };
  if (key.includes("dragon")) return { icon: "🐉", label: "Dragón" };
  if (key.includes("cohete") || key.includes("nave")) return { icon: "🚀", label: "Nave" };
  if (key.includes("tomate")) return { icon: "🍅", label: "Tomate" };
  if (key.includes("moto")) return { icon: "🏍️", label: "Moto" };

  return { icon: "⭐", label: "Palabra Mágica" };
}
