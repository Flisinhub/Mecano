/**
 * CurriculumData.js - Comprehensive 120-Lesson & Exam Curriculum for Mecano
 * 
 * Provides 15+ progressive micro-lessons per level for Levels 1 to 8, plus
 * official level examinations with objective thresholds and pedagogical tips.
 * 
 * Standard Spanish QWERTY fingers:
 * - Left Pinky (lp, coral): Q, A, Z, 1
 * - Left Ring (lr, naranja): W, S, X, 2
 * - Left Middle (lm, amarillo): E, D, C, 3
 * - Left Index (li, verde): R, F, V, T, G, B, 4, 5
 * - Right Index (ri, azul): Y, U, H, J, N, M, 6, 7
 * - Right Middle (rm, amarillo): I, K, ,, 8
 * - Right Ring (rr, naranja): O, L, ., 9
 * - Right Pinky (rp, coral): P, Ñ, -, ´, ?, ¿, 0
 * - Thumbs (thumb, violeta): Espacio
 */

export const CURRICULUM_LEVELS = [
  // =========================================================================
  // NIVEL 1: Los Centinelas de Casa (F, J y Espacio)
  // =========================================================================
  {
    id: 1,
    slug: '1-indices',
    name: '1 - 🎯 Los Centinelas de Casa (F, J y Espacio)',
    shortName: 'Índices (F y J)',
    beltTier: 'blanco',
    minAccuracy: 85,
    minWPM: 6,
    allowedKeys: ['f', 'j', ' '],
    objective: 'Localizar los bultitos táctiles de F y J y usar el pulgar en el espacio',
    speech: '¡Hola! Coloca tus dedos índices en las marcas de la F y la J. ¡Vamos a empezar desde cero!',
    tip: 'Fíjate en las pequeñas marcas con relieve en las teclas F y J. ¡Tus dedos índices descansan ahí!',
    lessons: [
      {
        id: '1.1',
        title: 'El hogar del índice izquierdo (F)',
        tip: 'Siente la rayita táctil en la tecla F con tu dedo índice izquierdo.',
        speech: 'Toca suavemente la letra F con tu índice izquierdo. ¡Siente su marca!',
        words: [
          { text: 'F', icon: '👈', label: 'Índice Izquierdo' },
          { text: 'F F', icon: '👈', label: 'Paso F' },
          { text: 'F F F', icon: '👈', label: 'Toca la F' },
          { text: 'F F F F', icon: '👈', label: 'Cuatro Fs' }
        ]
      },
      {
        id: '1.2',
        title: 'El hogar del índice derecho (J)',
        tip: 'Siente la rayita táctil en la tecla J con tu dedo índice derecho.',
        speech: 'Ahora busca la tecla J con tu índice derecho. ¡Tiene otra marquita!',
        words: [
          { text: 'J', icon: '👉', label: 'Índice Derecho' },
          { text: 'J J', icon: '👉', label: 'Paso J' },
          { text: 'J J J', icon: '👉', label: 'Toca la J' },
          { text: 'J J J J', icon: '👉', label: 'Cuatro Js' }
        ]
      },
      {
        id: '1.3',
        title: 'Compás alterno inicial (F y J)',
        tip: 'Mueve un dedo y luego el otro sin mover las muñecas.',
        speech: 'Izquierda y derecha: F y J. ¡Como dos amigos saludándose!',
        words: [
          { text: 'F J', icon: '🎵', label: 'Izq - Der' },
          { text: 'J F', icon: '🎵', label: 'Der - Izq' },
          { text: 'F J F', icon: '🎶', label: 'Compás suave' },
          { text: 'J F J', icon: '🎶', label: 'Compás suave' }
        ]
      },
      {
        id: '1.4',
        title: 'El pulgar en la barra espaciadora',
        tip: 'Pulsa el espacio con el pulgar suavemente, como si dieras un saltito.',
        speech: '¡Llega el pulgar! Da un toque a la barra larga para dejar un espacio.',
        words: [
          { text: 'F F', icon: '🟣', label: 'F y Espacio' },
          { text: 'J J', icon: '🟣', label: 'J y Espacio' },
          { text: 'F J', icon: '🟣', label: 'Paso espaciado' },
          { text: 'J F', icon: '🟣', label: 'Paso espaciado' }
        ]
      },
      {
        id: '1.5',
        title: 'Doble toque de índice izquierdo (FF)',
        tip: 'Dos toquecitos seguidos con el mismo dedo sin despegar la mano.',
        speech: '¡Dos toquecitos en la F! Ta-tá.',
        words: [
          { text: 'FF', icon: '⚡', label: 'Doble F' },
          { text: 'FF F', icon: '⚡', label: 'Fuerte F' },
          { text: 'F FF', icon: '⚡', label: 'Eco F' },
          { text: 'FF FF', icon: '⚡', label: 'Ritmo FF' }
        ]
      },
      {
        id: '1.6',
        title: 'Doble toque de índice derecho (JJ)',
        tip: 'Dos toquecitos rápidos en la J con el índice derecho.',
        speech: 'Ahora dos toques en la J. ¡Siente el ritmo!',
        words: [
          { text: 'JJ', icon: '⚡', label: 'Doble J' },
          { text: 'JJ J', icon: '⚡', label: 'Fuerte J' },
          { text: 'J JJ', icon: '⚡', label: 'Eco J' },
          { text: 'JJ JJ', icon: '⚡', label: 'Ritmo JJ' }
        ]
      },
      {
        id: '1.7',
        title: 'Diálogo entre gemelos (FF y JJ)',
        tip: 'Dos toques a la izquierda, dos toques a la derecha.',
        speech: 'Doble F y luego doble J. ¡Alterna con calma!',
        words: [
          { text: 'FF JJ', icon: '👯', label: 'Pares F-J' },
          { text: 'JJ FF', icon: '👯', label: 'Pares J-F' },
          { text: 'FF JJ FF', icon: '👯', label: 'Pares tres' },
          { text: 'JJ FF JJ', icon: '👯', label: 'Pares tres' }
        ]
      },
      {
        id: '1.8',
        title: 'Paso cruzado rápido (FJ y JF)',
        tip: 'Pulsa F y enseguida J sin pausa intermedia.',
        speech: '¡Paso rápido! Un dedito y el otro enseguida.',
        words: [
          { text: 'FJ', icon: '⚡', label: 'Salto F-J' },
          { text: 'JF', icon: '⚡', label: 'Salto J-F' },
          { text: 'FJ JF', icon: '⚡', label: 'Ida y vuelta' },
          { text: 'JF FJ', icon: '⚡', label: 'Vuelta e ida' }
        ]
      },
      {
        id: '1.9',
        title: 'Tríos rítmicos (FJF y JFJ)',
        tip: 'Mantén un compás de tres tiempos como en una canción.',
        speech: 'Uno, dos, tres: F, J, F. ¡Siente la música en los dedos!',
        words: [
          { text: 'FJF', icon: '🥁', label: 'Trío F-J-F' },
          { text: 'JFJ', icon: '🥁', label: 'Trío J-F-J' },
          { text: 'FJF JFJ', icon: '🥁', label: 'Doble compás' },
          { text: 'JFJ FJF', icon: '🥁', label: 'Doble compás' }
        ]
      },
      {
        id: '1.10',
        title: 'El pulgar bailarín con tríos',
        tip: 'Tres toques y pulgar espaciador.',
        speech: 'Escribe el trío y descansa pulsando el espacio con el pulgar.',
        words: [
          { text: 'F F F', icon: '🎶', label: 'Trío F' },
          { text: 'J J J', icon: '🎶', label: 'Trío J' },
          { text: 'F J F', icon: '🎶', label: 'Trío alterno' },
          { text: 'J F J', icon: '🎶', label: 'Trío alterno' }
        ]
      },
      {
        id: '1.11',
        title: 'Cadenas de cuatro tiempos (FFJJ)',
        tip: 'Cuenta mentalmente: un-dos tres-cuatro.',
        speech: '¡Cuatro golpes seguidos! Dos en F y dos en J.',
        words: [
          { text: 'FFJJ', icon: '🚀', label: 'Vuelo F-J' },
          { text: 'JJFF', icon: '🚀', label: 'Vuelo J-F' },
          { text: 'FFJJ FFJJ', icon: '🚀', label: 'Doble vuelo' },
          { text: 'JJFF JJFF', icon: '🚀', label: 'Doble vuelo' }
        ]
      },
      {
        id: '1.12',
        title: 'Alternancia en cuartetos (FJFJ)',
        tip: 'Dedos ágiles: F, J, F, J sin detenerse.',
        speech: '¡Tic, tac, tic, tac! F, J, F, J.',
        words: [
          { text: 'FJFJ', icon: '⏱️', label: 'Tic-tac' },
          { text: 'JFJF', icon: '⏱️', label: 'Tac-tic' },
          { text: 'FJFJ JFJF', icon: '⏱️', label: 'Reloj continuo' },
          { text: 'JFJF FJFJ', icon: '⏱️', label: 'Reloj continuo' }
        ]
      },
      {
        id: '1.13',
        title: 'Resistencia y suavidad',
        tip: 'No mires tus dedos: confía en que están en las marcas F y J.',
        speech: '¡Intenta no mirar el teclado! Tus dedos ya saben dónde está su casa.',
        words: [
          { text: 'F FF F', icon: '🛡️', label: 'Escudo F' },
          { text: 'J JJ J', icon: '🛡️', label: 'Escudo J' },
          { text: 'FJ JF F', icon: '🛡️', label: 'Patrón mixto' },
          { text: 'JF FJ J', icon: '🛡️', label: 'Patrón mixto' }
        ]
      },
      {
        id: '1.14',
        title: 'Ritmo combinado con espacios',
        tip: 'Combina pulsaciones rápidas y pausas de pulgar.',
        speech: 'Casi listos para el gran examen. ¡Sigue la melodía!',
        words: [
          { text: 'FF J FF', icon: '🎹', label: 'Melodía uno' },
          { text: 'JJ F JJ', icon: '🎹', label: 'Melodía dos' },
          { text: 'FJ JF FJ', icon: '🎹', label: 'Paso armónico' },
          { text: 'JF FJ JF', icon: '🎹', label: 'Paso armónico' }
        ]
      },
      {
        id: '1.15',
        title: 'Ensayo general antes del examen',
        tip: 'Respira hondo y relaja los hombros. ¡Vas a bordarlo!',
        speech: '¡Último entrenamiento antes del examen! Demuestra lo que has aprendido.',
        words: [
          { text: 'F J FF JJ', icon: '🌟', label: 'Ensayo 1' },
          { text: 'JF FJ FJF', icon: '🌟', label: 'Ensayo 2' },
          { text: 'FFJJ JFJF', icon: '🌟', label: 'Ensayo 3' },
          { text: 'FJFJ JJFF', icon: '🌟', label: 'Ensayo final' }
        ]
      }
    ],
    exam: {
      id: '1.exam',
      title: '📋 Gran Examen de los Centinelas (Nivel 1)',
      badge: '🏅 Medalla de los Centinelas',
      minAccuracy: 85,
      minWPM: 6,
      speech: '¡Atención, cadete! Es la hora de tu primer Examen Oficial. Confía en tus dedos y no mires las teclas.',
      passSpeech: '¡FANTÁSTICO! Has superado el Examen del Nivel 1 con honores. ¡Has ganado tu primera medalla!',
      retrySpeech: '¡Buen intento! Tienes mucho talento. Recuerda mantener los índices en sus marcas y vuelve a probar.',
      words: [
        { text: 'F J F J', icon: '🎯', label: 'Reto 1: Compás' },
        { text: 'FF JJ FF JJ', icon: '🎯', label: 'Reto 2: Dobles' },
        { text: 'FJF JFJ FJ', icon: '🎯', label: 'Reto 3: Tríos' },
        { text: 'FFJJ JFJF FJ', icon: '🎯', label: 'Reto 4: Flujo' },
        { text: 'F J FJ JF JJ FF', icon: '🏆', label: 'Reto Final' }
      ]
    }
  },

  // =========================================================================
  // NIVEL 2: La Fila Guía Completa (A, S, D, F / J, K, L, Ñ)
  // =========================================================================
  {
    id: 2,
    slug: '2-filaguia',
    name: '2 - 🏠 La Fila Guía Completa (A S D F / J K L Ñ)',
    shortName: 'Fila Guía Central',
    beltTier: 'blanco',
    minAccuracy: 85,
    minWPM: 8,
    allowedKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', 'ñ', ' '],
    objective: 'Colocar y dominar los 8 dedos descansando en la fila central',
    speech: '¡Llega toda la familia de dedos! Descansamos cuatro dedos a la izquierda y cuatro a la derecha.',
    tip: 'Cada dedo tiene su tecla: Meñique en A, anular en S, corazón en D, índice en F; índice en J, corazón en K, anular en L y meñique en Ñ.',
    lessons: [
      {
        id: '2.1',
        title: 'Los dedos corazón en acción (D y K)',
        tip: 'El dedo corazón izquierdo pulsa la D y el derecho pulsa la K.',
        speech: '¡Dedos del medio! El corazón izquierdo en la D y el derecho en la K.',
        words: [
          { text: 'D K', icon: '💛', label: 'Medios D-K' },
          { text: 'K D', icon: '💛', label: 'Medios K-D' },
          { text: 'DD KK', icon: '💛', label: 'Dobles D-K' },
          { text: 'DK KD', icon: '💛', label: 'Paso D-K' }
        ]
      },
      {
        id: '2.2',
        title: 'Índices y corazones coordinados',
        tip: 'Alterna F con D a la izquierda, y J con K a la derecha.',
        speech: 'Índice y corazón trabajando juntos en cada mano.',
        words: [
          { text: 'FD JK', icon: '🐾', label: 'Paso FD-JK' },
          { text: 'DF KJ', icon: '🐾', label: 'Paso DF-KJ' },
          { text: 'FDF JKJ', icon: '🐾', label: 'Trío medio' },
          { text: 'DFD KJK', icon: '🐾', label: 'Trío medio' }
        ]
      },
      {
        id: '2.3',
        title: 'Los dedos anulares se despiertan (S y L)',
        tip: 'El anular izquierdo pulsa la S y el anular derecho pulsa la L.',
        speech: '¡Llegan los anulares! Mano izquierda en la S, mano derecha en la L.',
        words: [
          { text: 'S L', icon: '🧡', label: 'Anulares S-L' },
          { text: 'L S', icon: '🧡', label: 'Anulares L-S' },
          { text: 'SS LL', icon: '🧡', label: 'Dobles S-L' },
          { text: 'SL LS', icon: '🧡', label: 'Paso S-L' }
        ]
      },
      {
        id: '2.4',
        title: 'Terceto izquierdo (S, D, F)',
        tip: 'Anular (S), corazón (D) e índice (F). ¡Como una escalerita!',
        speech: 'Sube la escalerita izquierda: S, D, F.',
        words: [
          { text: 'SDF', icon: '🪜', label: 'Escalera SDF' },
          { text: 'FDS', icon: '🪜', label: 'Baja FDS' },
          { text: 'SDS FDF', icon: '🪜', label: 'Ritmo SDF' },
          { text: 'SDF FDS', icon: '🪜', label: 'Ida y vuelta' }
        ]
      },
      {
        id: '2.5',
        title: 'Terceto derecho (J, K, L)',
        tip: 'Índice (J), corazón (K) y anular (L).',
        speech: 'Ahora la escalerita derecha: J, K, L.',
        words: [
          { text: 'JKL', icon: '🪜', label: 'Escalera JKL' },
          { text: 'LKJ', icon: '🪜', label: 'Baja LKJ' },
          { text: 'KJK LKL', icon: '🪜', label: 'Ritmo JKL' },
          { text: 'JKL LKJ', icon: '🪜', label: 'Ida y vuelta' }
        ]
      },
      {
        id: '2.6',
        title: 'Los pequeños meñiques (A y Ñ)',
        tip: 'Los dedos más pequeños tienen mucha fuerza: A a la izquierda, Ñ a la derecha.',
        speech: '¡Los meñiques traviesos! A con la izquierda y Ñ con la derecha.',
        words: [
          { text: 'A Ñ', icon: '❤️', label: 'Meñiques A-Ñ' },
          { text: 'Ñ A', icon: '❤️', label: 'Meñiques Ñ-A' },
          { text: 'AA ÑÑ', icon: '❤️', label: 'Dobles A-Ñ' },
          { text: 'A Ñ A', icon: '❤️', label: 'Paso A-Ñ' }
        ]
      },
      {
        id: '2.7',
        title: 'La fila izquierda completa (ASDF)',
        tip: 'Los cuatro dedos izquierdos tocan en orden: Meñique, anular, corazón e índice.',
        speech: '¡Toda la mano izquierda afinada! A, S, D, F.',
        words: [
          { text: 'ASDF', icon: '🖐️', label: 'Mano izq ASDF' },
          { text: 'FDSA', icon: '🖐️', label: 'Baja FDSA' },
          { text: 'AS DF', icon: '🖐️', label: 'Pares izq' },
          { text: 'ASDF FDSA', icon: '🖐️', label: 'Mano completa' }
        ]
      },
      {
        id: '2.8',
        title: 'La fila derecha completa (JKLÑ)',
        tip: 'Los cuatro dedos derechos en orden: J, K, L, Ñ.',
        speech: '¡Toda la mano derecha afinada! J, K, L, Ñ.',
        words: [
          { text: 'JKLÑ', icon: '🖐️', label: 'Mano der JKLÑ' },
          { text: 'ÑLKJ', icon: '🖐️', label: 'Baja ÑLKJ' },
          { text: 'JK LÑ', icon: '🖐️', label: 'Pares der' },
          { text: 'JKLÑ ÑLKJ', icon: '🖐️', label: 'Mano completa' }
        ]
      },
      {
        id: '2.9',
        title: 'Los ocho centinelas juntos',
        tip: 'Mantén todos los deditos descansando como patitas de gatito.',
        speech: '¡Ocho dedos sincronizados! Izquierda y derecha alternándose.',
        words: [
          { text: 'ASDF JKLÑ', icon: '🎹', label: 'Las dos manos' },
          { text: 'FDSA ÑLKJ', icon: '🎹', label: 'Regreso' },
          { text: 'AF JÑ', icon: '🎹', label: 'Extremos y centro' },
          { text: 'FA ÑJ', icon: '🎹', label: 'Centro y extremos' }
        ]
      },
      {
        id: '2.10',
        title: 'Primeras sílabas reales de 2 letras',
        tip: '¡Ya estamos escribiendo palabras reales en español!',
        speech: '¡Mira qué bien! Ya formamos palabras reales de dos letras.',
        words: [
          { text: 'LA', icon: '🎶', label: 'La música' },
          { text: 'DA', icon: '🎁', label: 'Dar' },
          { text: 'FA', icon: '🎼', label: 'Nota Fa' },
          { text: 'AS', icon: '🃏', label: 'As de oros' }
        ]
      },
      {
        id: '2.11',
        title: 'Palabras mágicas de 3 letras (Parte 1)',
        tip: 'Sal, ala, asa. ¡Todas se escriben solo con la fila guía!',
        speech: '¡Palabras completas de tres letras! Lee cada una antes de teclearla.',
        words: [
          { text: 'SAL', icon: '🧂', label: 'Sal fina' },
          { text: 'ALA', icon: '🪽', label: 'Ala de hada' },
          { text: 'ASA', icon: '☕', label: 'Asa de taza' },
          { text: 'LAS', icon: '✨', label: 'Las estrellas' }
        ]
      },
      {
        id: '2.12',
        title: 'Palabras mágicas de 3 letras (Parte 2)',
        tip: 'Acuérdate de usar el pulgar para el espacio entre palabras.',
        speech: 'Más palabras de la fila central. ¡Tus dedos vuelan solos!',
        words: [
          { text: 'GAS', icon: '🎈', label: 'Globo de gas' },
          { text: 'FAS', icon: '🏛️', label: 'Columnas' },
          { text: 'AJA', icon: '💡', label: '¡Ajá!' },
          { text: 'ALLA', icon: '👉', label: 'Allá lejos' }
        ]
      },
      {
        id: '2.13',
        title: 'Palabras de 4 letras de la casa',
        tip: 'Sala, faja, falda. Sigue el ritmo sin prisas.',
        speech: '¡Cuatro letras por palabra! Mantén el ritmo suave.',
        words: [
          { text: 'SALA', icon: '🛋️', label: 'Sala cómoda' },
          { text: 'FAJA', icon: '🎀', label: 'Lazo faja' },
          { text: 'FALDA', icon: '👗', label: 'Falda de vuelo' },
          { text: 'SALSA', icon: '💃', label: 'Baile salsa' }
        ]
      },
      {
        id: '2.14',
        title: 'Frases rítmicas cortas',
        tip: 'Separa cada palabra con un toque ligero del pulgar en el espacio.',
        speech: '¡Primeras frases! Dos palabras juntas con espacio en el medio.',
        words: [
          { text: 'LA SAL', icon: '🧂', label: 'La sal' },
          { text: 'EL ALA', icon: '🪽', label: 'El ala' },
          { text: 'LA SALA', icon: '🛋️', label: 'La sala' },
          { text: 'DA LA SAL', icon: '🧂', label: 'Da la sal' }
        ]
      },
      {
        id: '2.15',
        title: 'Gran ensayo de la Fila Guía',
        tip: 'Los 8 dedos relajados. ¡Todo listo para el examen de la fila guía!',
        speech: '¡Excelente entrenamiento! Ya dominas la fila central al completo.',
        words: [
          { text: 'SAL LA SALA', icon: '🌟', label: 'Ensayo 1' },
          { text: 'LA FALDA FALLA', icon: '🌟', label: 'Ensayo 2' },
          { text: 'ALLA DA LA SAL', icon: '🌟', label: 'Ensayo 3' },
          { text: 'ASDF JKLÑ SALA', icon: '🌟', label: 'Ensayo 4' }
        ]
      }
    ],
    exam: {
      id: '2.exam',
      title: '📋 Gran Examen de la Fila Guía (Nivel 2)',
      badge: '🏅 Medalla de la Fila Guía',
      minAccuracy: 85,
      minWPM: 8,
      speech: '¡Llegó la prueba de fuego de la Fila Guía! Los ocho dedos listos en sus teclas base.',
      passSpeech: '¡INCREÍBLE! Dominas los 8 dedos de la fila guía como un auténtico profesional. ¡Medalla concedida!',
      retrySpeech: '¡Casi lo tienes! Repasa la posición de los 8 dedos y vuelve a intentarlo, lo lograrás muy pronto.',
      words: [
        { text: 'ASDF JKLÑ', icon: '🎯', label: 'Reto 1: 8 Dedos' },
        { text: 'SAL ALA ASA LAS', icon: '🎯', label: 'Reto 2: Palabras' },
        { text: 'LA FALDA DE LA SALA', icon: '🎯', label: 'Reto 3: Frase corta' },
        { text: 'ALLA DA LA SAL A LA FAJA', icon: '🎯', label: 'Reto 4: Frase fluida' },
        { text: 'LA SALSA DE LA SALA SALADA', icon: '🏆', label: 'Reto Final' }
      ]
    }
  },

  // =========================================================================
  // NIVEL 3: El Salto Superior (Vocales E, I y Dedos Índices R, U)
  // =========================================================================
  {
    id: 3,
    slug: '3-vocales-ei',
    name: '3 - ✨ El Salto Superior (Vocales E/I y R/U)',
    shortName: 'Vocales E/I y R/U',
    beltTier: 'amarillo',
    minAccuracy: 90,
    minWPM: 10,
    allowedKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', 'ñ', 'e', 'i', 'r', 'u', ' '],
    objective: 'Movimiento vertical de dedos medios e índices arriba, volviendo siempre a casa',
    speech: '¡Subimos un piso! Los dedos medios suben a la E y a la I, y los índices a la R y a la U.',
    tip: 'Sube el dedo un paso, pulsa la tecla superior y devuélvelo inmediatamente a la fila guía.',
    lessons: [
      {
        id: '3.1',
        title: 'El salto a la vocal E',
        tip: 'Dedo corazón izquierdo sube de la D a la E y vuelve a la D.',
        speech: '¡El corazón izquierdo sube a la E! Sube, pulsa y vuelve a casa.',
        words: [
          { text: 'DE', icon: '⬆️', label: 'Subida D-E' },
          { text: 'ED', icon: '⬆️', label: 'Bajada E-D' },
          { text: 'DED', icon: '⬆️', label: 'Salto D-E-D' },
          { text: 'DEEDE', icon: '⬆️', label: 'Paso E' }
        ]
      },
      {
        id: '3.2',
        title: 'El salto a la vocal I',
        tip: 'Dedo corazón derecho sube de la K a la I y vuelve a la K.',
        speech: '¡El corazón derecho sube a la I! Arriba y a casa.',
        words: [
          { text: 'KI', icon: '⬆️', label: 'Subida K-I' },
          { text: 'IK', icon: '⬆️', label: 'Bajada I-K' },
          { text: 'KIK', icon: '⬆️', label: 'Salto K-I-K' },
          { text: 'KIIKI', icon: '⬆️', label: 'Paso I' }
        ]
      },
      {
        id: '3.3',
        title: 'Danza de las vocales E e I',
        tip: 'Corazón izquierdo (E) y corazón derecho (I) alternándose.',
        speech: 'E a la izquierda, I a la derecha. ¡Las dos vocales más alegres!',
        words: [
          { text: 'E I', icon: '✨', label: 'Vocales E-I' },
          { text: 'I E', icon: '✨', label: 'Vocales I-E' },
          { text: 'DE KI', icon: '✨', label: 'Medios arriba' },
          { text: 'ED IK', icon: '✨', label: 'Medios a casa' }
        ]
      },
      {
        id: '3.4',
        title: 'Salto del índice izquierdo a la R',
        tip: 'Índice izquierdo sube de la F a la R.',
        speech: '¡Índice izquierdo arriba a la R! Fuerte como un rugido.',
        words: [
          { text: 'FR', icon: '🦁', label: 'Subida F-R' },
          { text: 'RF', icon: '🦁', label: 'Bajada R-F' },
          { text: 'FRF', icon: '🦁', label: 'Salto F-R-F' },
          { text: 'RED', icon: '🦁', label: 'Palabra Red' }
        ]
      },
      {
        id: '3.5',
        title: 'Salto del índice derecho a la U',
        tip: 'Índice derecho sube de la J a la U.',
        speech: '¡Índice derecho arriba a la U! Suave como una ola.',
        words: [
          { text: 'JU', icon: '🌊', label: 'Subida J-U' },
          { text: 'UJ', icon: '🌊', label: 'Bajada U-J' },
          { text: 'JUJ', icon: '🌊', label: 'Salto J-U-J' },
          { text: 'SUR', icon: '🌊', label: 'Palabra Sur' }
        ]
      },
      {
        id: '3.6',
        title: 'Los cuatro saltadores superiores (E, I, R, U)',
        tip: 'Combina saltos de índices y corazones de ambas manos.',
        speech: '¡Cuatro teclas arriba dominadas! E, I, R y U.',
        words: [
          { text: 'ER IU', icon: '🚀', label: 'Pares sup' },
          { text: 'RE UI', icon: '🚀', label: 'Pares sup' },
          { text: 'RIE FUE', icon: '🚀', label: 'Diptongos' },
          { text: 'RIO SUR', icon: '🚀', label: 'Palabras' }
        ]
      },
      {
        id: '3.7',
        title: 'Sílabas ricas en español con E',
        tip: 'De, re, se, le, fe.',
        speech: '¡Sílabas con la E! Muy útiles para escribir historias.',
        words: [
          { text: 'DE RE', icon: '🎼', label: 'De Re' },
          { text: 'SE LE', icon: '🎼', label: 'Se Le' },
          { text: 'FE ME', icon: '🎼', label: 'Fe Me' },
          { text: 'EL ES', icon: '🎼', label: 'El Es' }
        ]
      },
      {
        id: '3.8',
        title: 'Sílabas ricas en español con I',
        tip: 'Di, si, li, fi, ri.',
        speech: '¡Sílabas con la I! Finas y cantarinas.',
        words: [
          { text: 'DI SI', icon: '🔔', label: 'Di Si' },
          { text: 'LI FI', icon: '🔔', label: 'Li Fi' },
          { text: 'RI IR', icon: '🔔', label: 'Ri Ir' },
          { text: 'SI QUE', icon: '🔔', label: 'Si Que' }
        ]
      },
      {
        id: '3.9',
        title: 'Palabras reales de tres letras',
        tip: 'Sed, red, dia, rio, lio.',
        speech: '¡Palabras completas con vocales superiores!',
        words: [
          { text: 'SED', icon: '💧', label: 'Gota de agua' },
          { text: 'RED', icon: '🕸️', label: 'Red mágica' },
          { text: 'DIA', icon: '☀️', label: 'Día de sol' },
          { text: 'RIO', icon: '🏞️', label: 'Río azul' }
        ]
      },
      {
        id: '3.10',
        title: 'Vocabulario brillante de 4 letras',
        tip: 'Isla, lila, fiel, seda.',
        speech: '¡Mira cuántas palabras tan bonitas estás escribiendo!',
        words: [
          { text: 'ISLA', icon: '🏝️', label: 'Isla del tesoro' },
          { text: 'LILA', icon: '🌸', label: 'Flor lila' },
          { text: 'FIEL', icon: '🐶', label: 'Perrito fiel' },
          { text: 'SEDA', icon: '🧣', label: 'Seda suave' }
        ]
      },
      {
        id: '3.11',
        title: 'Palabras de amistad y familia',
        tip: 'Ella, leal, idea, fila.',
        speech: 'Palabras de cariño y compañerismo.',
        words: [
          { text: 'ELLA', icon: '👧', label: 'Ella' },
          { text: 'LEAL', icon: '🤝', label: 'Amigo leal' },
          { text: 'IDEA', icon: '💡', label: 'Gran idea' },
          { text: 'FILA', icon: '🚶', label: 'Fila india' }
        ]
      },
      {
        id: '3.12',
        title: 'Palabras ricas de 5 letras',
        tip: 'Fideo, rueda, feria, reina.',
        speech: '¡Palabras largas de 5 letras! Estás avanzando a pasos agigantados.',
        words: [
          { text: 'FIDEO', icon: '🍜', label: 'Fideo rico' },
          { text: 'RUEDA', icon: '🛞', label: 'Rueda veloz' },
          { text: 'FERIA', icon: '🎡', label: 'Feria alegre' },
          { text: 'REINA', icon: '👑', label: 'Reina buena' }
        ]
      },
      {
        id: '3.13',
        title: 'Cadenas de dos palabras',
        tip: 'Pulgar en el espacio entre ambas palabras.',
        speech: 'Frases de dos palabras con espacio intermedio.',
        words: [
          { text: 'LA ISLA', icon: '🏝️', label: 'La isla' },
          { text: 'EL RIO', icon: '🏞️', label: 'El río' },
          { text: 'MI FIEL', icon: '🐶', label: 'Mi fiel' },
          { text: 'LA SEDA', icon: '🧣', label: 'La seda' }
        ]
      },
      {
        id: '3.14',
        title: 'Oraciones completas de la fila superior',
        tip: 'Lee toda la frase antes de teclear y mantén un ritmo continuo.',
        speech: '¡Oraciones completas! Siente el ritmo fluido de los dedos.',
        words: [
          { text: 'EL DIA ES LILA', icon: '🌅', label: 'El día es lila' },
          { text: 'ELLA ES LEAL', icon: '🤝', label: 'Ella es leal' },
          { text: 'LA ISLA DEL RIO', icon: '🏞️', label: 'La isla del río' },
          { text: 'LA REINA RIE FIEL', icon: '👑', label: 'La reina ríe fiel' }
        ]
      },
      {
        id: '3.15',
        title: 'Desafío de agilidad y memoria motriz',
        tip: 'Manos relajadas y muñecas flotando suavemente.',
        speech: '¡Último repaso antes del examen del Nivel 3! Estás listo.',
        words: [
          { text: 'ISLA RIO SEDA FIEL', icon: '🌟', label: 'Repaso 1' },
          { text: 'LA REINA EN LA FERIA', icon: '🌟', label: 'Repaso 2' },
          { text: 'EL FIDEO EN LA MESA', icon: '🌟', label: 'Repaso 3' },
          { text: 'ELLA RIE FELIZ AL SOL', icon: '🌟', label: 'Repaso 4' }
        ]
      }
    ],
    exam: {
      id: '3.exam',
      title: '📋 Gran Examen del Salto Superior (Nivel 3)',
      badge: '🏅 Medalla del Salto Superior',
      minAccuracy: 90,
      minWPM: 10,
      speech: '¡Examen de Acreditación del Salto Superior! Demuestra la precisión de tus dedos medios e índices.',
      passSpeech: '¡ESPECTACULAR! Has superado el Examen de Nivel 3 con un dominio vertical asombroso. ¡Cinturón Amarillo desbloqueado!',
      retrySpeech: '¡Muy buen esfuerzo! El salto a la E y a la I requiere práctica. Repasa las lecciones y repite enseguida.',
      words: [
        { text: 'DED KIK FRF JUJ', icon: '🎯', label: 'Reto 1: Saltos' },
        { text: 'ISLA LILA FIEL SEDA', icon: '🎯', label: 'Reto 2: Palabras' },
        { text: 'EL RIO DE LA ISLA FELIZ', icon: '🎯', label: 'Reto 3: Oración' },
        { text: 'LA REINA LEAL DA SU RUEDA', icon: '🎯', label: 'Reto 4: Fluidez' },
        { text: 'ELLA RIE AL VER EL DIA LILA', icon: '🏆', label: 'Reto Final' }
      ]
    }
  },

  // =========================================================================
  // NIVEL 4: La Expansión Superior Completa (O, U, P, Q, W, T, Y)
  // =========================================================================
  {
    id: 4,
    slug: '4-expansion',
    name: '4 - 🍎 La Expansión Superior Completa (O, U, P, Q, W, T, Y)',
    shortName: 'Vocales O/U y P,Q,W,T,Y',
    beltTier: 'amarillo',
    minAccuracy: 90,
    minWPM: 12,
    allowedKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', 'ñ', 'e', 'i', 'r', 'u', 'o', 'p', 'q', 'w', 't', 'y', 'c', 'm', ' '],
    objective: 'Completar todas las vocales y consonantes superiores',
    speech: '¡El piso superior al completo! Llegan la O, la P, la T, la Q y todas las consonantes divertidas.',
    tip: 'El anular derecho sube a la O y el meñique derecho a la P. Mantén el resto de dedos en su sitio.',
    lessons: [
      {
        id: '4.1',
        title: 'El salto a la vocal O (Anular derecho)',
        tip: 'Anular derecho sube de la L a la O y vuelve a la L.',
        speech: '¡El anular derecho sube a la O! Redondita como una rosquilla.',
        words: [
          { text: 'LO', icon: '🍩', label: 'Subida L-O' },
          { text: 'OL', icon: '🍩', label: 'Bajada O-L' },
          { text: 'LOL', icon: '🍩', label: 'Salto L-O-L' },
          { text: 'OSO', icon: '🐻', label: 'Oso mimoso' }
        ]
      },
      {
        id: '4.2',
        title: 'El salto a la P (Meñique derecho)',
        tip: 'Meñique derecho sube de la Ñ a la P.',
        speech: '¡Meñique derecho arriba a la P! Con suavidad y destreza.',
        words: [
          { text: 'PO', icon: '🎈', label: 'Salto O-P' },
          { text: 'OP', icon: '🎈', label: 'Bajada P-O' },
          { text: 'POP', icon: '🎈', label: 'Toque Pop' },
          { text: 'POLO', icon: '🍧', label: 'Polo frío' }
        ]
      },
      {
        id: '4.3',
        title: 'Parejas ricas O y P',
        tip: 'Combina el anular (O) y meñique (P) de la mano derecha.',
        speech: 'Palabras con O y P: sopa, copa, palo, pelo.',
        words: [
          { text: 'SOPA', icon: '🥣', label: 'Sopa rica' },
          { text: 'COPA', icon: '🏆', label: 'Copa trofeo' },
          { text: 'PALO', icon: '🪵', label: 'Palo de madera' },
          { text: 'PELO', icon: '💇', label: 'Pelo limpio' }
        ]
      },
      {
        id: '4.4',
        title: 'El meñique izquierdo sube a la Q',
        tip: 'Meñique izquierdo sube de la A a la Q.',
        speech: '¡Meñique izquierdo arriba a la Q! Para escribir palabras como queso.',
        words: [
          { text: 'QA', icon: '🧀', label: 'Subida A-Q' },
          { text: 'QUE', icon: '🧀', label: 'Sílaba Que' },
          { text: 'AQUI', icon: '🧀', label: 'Aquí' },
          { text: 'QUESO', icon: '🧀', label: 'Rico queso' }
        ]
      },
      {
        id: '4.5',
        title: 'El anular izquierdo sube a la W',
        tip: 'Anular izquierdo sube de la S a la W.',
        speech: '¡Anular izquierdo arriba a la W! Para palabras curiosas como web o kiwi.',
        words: [
          { text: 'WS', icon: '🥝', label: 'Subida S-W' },
          { text: 'SW', icon: '🥝', label: 'Bajada W-S' },
          { text: 'WEB', icon: '🌐', label: 'Página web' },
          { text: 'KIWI', icon: '🥝', label: 'Kiwi verde' }
        ]
      },
      {
        id: '4.6',
        title: 'El índice izquierdo alcanza la T',
        tip: 'Índice izquierdo sube de la F hacia la T (al lado de la R).',
        speech: '¡Índice izquierdo arriba a la T! Pato, tomate, pelota.',
        words: [
          { text: 'FT', icon: '🦆', label: 'Salto F-T' },
          { text: 'TF', icon: '🦆', label: 'Bajada T-F' },
          { text: 'FTF', icon: '🦆', label: 'Compás T' },
          { text: 'PATO', icon: '🦆', label: 'Pato feliz' }
        ]
      },
      {
        id: '4.7',
        title: 'El índice derecho alcanza la Y',
        tip: 'Índice derecho sube de la J hacia la Y (al lado de la U).',
        speech: '¡Índice derecho arriba a la Y! Yate, payaso, rey.',
        words: [
          { text: 'JY', icon: '⛵', label: 'Salto J-Y' },
          { text: 'YJ', icon: '⛵', label: 'Bajada Y-J' },
          { text: 'JYJ', icon: '⛵', label: 'Compás Y' },
          { text: 'YATE', icon: '⛵', label: 'Yate blanco' }
        ]
      },
      {
        id: '4.8',
        title: 'La familia de la P (pa, pe, pi, po, pu)',
        tip: 'Todas las vocales combinadas con la letra P.',
        speech: '¡Toda la familia de la P! Pa, pe, pi, po, pu.',
        words: [
          { text: 'PA PE', icon: '🐾', label: 'Pa Pe' },
          { text: 'PI PO', icon: '🐾', label: 'Pi Po' },
          { text: 'PU PA', icon: '🐾', label: 'Pu Pa' },
          { text: 'PAPA PIPA', icon: '🐾', label: 'Palabras P' }
        ]
      },
      {
        id: '4.9',
        title: 'La familia de la T (ta, te, ti, to, tu)',
        tip: 'Todas las vocales combinadas con la letra T.',
        speech: '¡Toda la familia de la T! Ta, te, ti, to, tu.',
        words: [
          { text: 'TA TE', icon: '🥁', label: 'Ta Te' },
          { text: 'TI TO', icon: '🥁', label: 'Ti To' },
          { text: 'TU TA', icon: '🥁', label: 'Tu Ta' },
          { text: 'TAZA PATO', icon: '🥁', label: 'Palabras T' }
        ]
      },
      {
        id: '4.10',
        title: 'Animales y naturaleza de 4 letras',
        tip: 'Pato, gato, sapo, lobo, loro.',
        speech: '¡Escribimos animales amigos! Pato, sapo, loro, puma.',
        words: [
          { text: 'PATO', icon: '🦆', label: 'Pato' },
          { text: 'SAPO', icon: '🐸', label: 'Sapo verde' },
          { text: 'LORO', icon: '🦜', label: 'Loro cantor' },
          { text: 'PUMA', icon: '🐆', label: 'Puma ágil' }
        ]
      },
      {
        id: '4.11',
        title: 'Comida y cosas ricas de 4 letras',
        tip: 'Sopa, puré, tarta, pera.',
        speech: '¡Cosas deliciosas para merendar! Sopa, queso, pera.',
        words: [
          { text: 'SOPA', icon: '🥣', label: 'Sopa rica' },
          { text: 'QUESO', icon: '🧀', label: 'Queso tierno' },
          { text: 'PERA', icon: '🍐', label: 'Pera dulce' },
          { text: 'TARTA', icon: '🥧', label: 'Tarta rica' }
        ]
      },
      {
        id: '4.12',
        title: 'Palabras divertidas de 6 letras',
        tip: 'Tomate, payaso, pelota, quiosco.',
        speech: '¡Palabras largas de 6 letras! Tus dedos son ya super veloces.',
        words: [
          { text: 'TOMATE', icon: '🍅', label: 'Tomate rojo' },
          { text: 'PAYASO', icon: '🤡', label: 'Payaso alegre' },
          { text: 'PELOTA', icon: '⚽', label: 'Pelota de juego' },
          { text: 'PAQUETE', icon: '📦', label: 'Paquete sorpresa' }
        ]
      },
      {
        id: '4.13',
        title: 'Parejas de palabras con espacio',
        tip: 'El pato, la sopa, mi queso, la pelota.',
        speech: 'Parejas de palabras coordinadas con el pulgar.',
        words: [
          { text: 'EL PATO', icon: '🦆', label: 'El pato' },
          { text: 'LA SOPA', icon: '🥣', label: 'La sopa' },
          { text: 'MI QUESO', icon: '🧀', label: 'Mi queso' },
          { text: 'EL LORO', icon: '🦜', label: 'El loro' }
        ]
      },
      {
        id: '4.14',
        title: 'Frases completas de la fila superior',
        tip: 'Escribe a ritmo constante sin pausas bruscas.',
        speech: '¡Frases completas! Qué bien lees y escribes a la vez.',
        words: [
          { text: 'EL PATO COME SOPA', icon: '🦆', label: 'El pato come sopa' },
          { text: 'EL LORO PIDE QUESO', icon: '🦜', label: 'El loro pide queso' },
          { text: 'LA TARTA DE TOMATE', icon: '🥧', label: 'La tarta de tomate' },
          { text: 'EL PAYASO TIRA LA PELOTA', icon: '🤡', label: 'El payaso tira la pelota' }
        ]
      },
      {
        id: '4.15',
        title: 'Gran desafío pre-examen del piso superior',
        tip: '¡Todo el piso superior listo para ser evaluado!',
        speech: '¡Último ensayo! Mantén la calma y disfruta escribiendo.',
        words: [
          { text: 'PATO LORO QUESO TOMATE', icon: '🌟', label: 'Repaso 1' },
          { text: 'EL PAYASO TOCA LA PELOTA', icon: '🌟', label: 'Repaso 2' },
          { text: 'EL PUMA SALTA EN LA PLAYA', icon: '🌟', label: 'Repaso 3' },
          { text: 'MI LORO COME PERA Y QUESO', icon: '🌟', label: 'Repaso 4' }
        ]
      }
    ],
    exam: {
      id: '4.exam',
      title: '📋 Gran Examen de la Expansión Superior (Nivel 4)',
      badge: '🏅 Medalla del Teclado Superior',
      minAccuracy: 90,
      minWPM: 12,
      speech: '¡Examen Oficial del Teclado Superior Completo! Todas las vocales y consonantes en juego.',
      passSpeech: '¡MAGISTRAL! Has conquistado todo el piso superior del teclado. ¡Medalla de honor y pase al Nivel 5!',
      retrySpeech: '¡Gran esfuerzo! Las teclas superiores como la P y la T requieren práctica. ¡Vuelve a intentarlo ya mismo!',
      words: [
        { text: 'PATO QUESO LORO TOMATE', icon: '🎯', label: 'Reto 1: Palabras' },
        { text: 'EL PAYASO JUEGA PELOTA', icon: '🎯', label: 'Reto 2: Oración' },
        { text: 'MI LORO PIDE SOPA Y QUESO', icon: '🎯', label: 'Reto 3: Ritmo' },
        { text: 'EL PUMA COME PERA EN LA PLAYA', icon: '🎯', label: 'Reto 4: Vocabulario' },
        { text: 'UN PATO Y UN LORO JUEGAN PELOTA', icon: '🏆', label: 'Reto Final' }
      ]
    }
  },

  // =========================================================================
  // NIVEL 5: La Fila Inferior y Puntuación (Z, X, C, V, B, N, M, Coma y Punto)
  // =========================================================================
  {
    id: 5,
    slug: '5-frases',
    name: '5 - 🌟 La Fila Inferior y Puntuación Completa',
    shortName: 'Fila Inferior y Signos',
    beltTier: 'verde',
    minAccuracy: 90,
    minWPM: 15,
    allowedKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', 'ñ', 'e', 'i', 'r', 'u', 'o', 'p', 'q', 'w', 't', 'y', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', ' '],
    objective: 'Bajar los dedos a la fila inferior sin mover las palmas y usar signos de puntuación',
    speech: '¡Bajamos a la planta baja! Llegan la V, B, N, M, C, X, Z y los signos de coma y punto. ¡El teclado entero es tuyo!',
    tip: 'Baja los dedos suavemente hacia abajo y regresa enseguida a la posición base en la fila guía.',
    lessons: [
      {
        id: '5.1',
        title: 'Los índices bajan a la V y a la B',
        tip: 'Índice izquierdo baja de la F a la V (directo) y a la B (un pasito a la derecha).',
        speech: '¡Índice izquierdo abajo! Vaca con la V, barco con la B.',
        words: [
          { text: 'FV FB', icon: '🐄', label: 'Bajada F-V-B' },
          { text: 'VF BF', icon: '🐄', label: 'Subida a casa' },
          { text: 'VACA', icon: '🐄', label: 'Vaca lechera' },
          { text: 'BARCO', icon: '⛵', label: 'Barco pirata' }
        ]
      },
      {
        id: '5.2',
        title: 'Los índices bajan a la M y a la N',
        tip: 'Índice derecho baja de la J a la M (directo) y a la N (un pasito a la izquierda).',
        speech: '¡Índice derecho abajo! Mano con la M, nido con la N.',
        words: [
          { text: 'JM JN', icon: '✋', label: 'Bajada J-M-N' },
          { text: 'MJ NJ', icon: '✋', label: 'Subida a casa' },
          { text: 'MANO', icon: '✋', label: 'Mano amiga' },
          { text: 'NIDO', icon: '🪺', label: 'Nido de aves' }
        ]
      },
      {
        id: '5.3',
        title: 'El corazón izquierdo baja a la C',
        tip: 'Dedo corazón izquierdo baja de la D a la C.',
        speech: '¡Corazón izquierdo abajo a la C! Casa, cine, cielo.',
        words: [
          { text: 'DC', icon: '🏠', label: 'Bajada D-C' },
          { text: 'CD', icon: '🏠', label: 'Subida C-D' },
          { text: 'DCD', icon: '🏠', label: 'Salto D-C-D' },
          { text: 'CASA', icon: '🏠', label: 'Casa bonita' }
        ]
      },
      {
        id: '5.4',
        title: 'El corazón derecho baja a la coma (,)',
        tip: 'Dedo corazón derecho baja de la K a la coma (,).',
        speech: '¡Corazón derecho abajo a la coma! Para respirar y separar palabras.',
        words: [
          { text: 'K,', icon: 'comma', label: 'Bajada K-,' },
          { text: ',K', icon: 'comma', label: 'Subida ,-K' },
          { text: 'SOL,', icon: '☀️', label: 'Sol con coma' },
          { text: 'MAR,', icon: '🌊', label: 'Mar con coma' }
        ]
      },
      {
        id: '5.5',
        title: 'El anular izquierdo baja a la X',
        tip: 'Anular izquierdo baja de la S a la X.',
        speech: '¡Anular izquierdo abajo a la X! Taxi, texto, éxito.',
        words: [
          { text: 'SX', icon: '🚕', label: 'Bajada S-X' },
          { text: 'XS', icon: '🚕', label: 'Subida X-S' },
          { text: 'SXS', icon: '🚕', label: 'Salto S-X-S' },
          { text: 'TAXI', icon: '🚕', label: 'Taxi veloz' }
        ]
      },
      {
        id: '5.6',
        title: 'El meñique izquierdo baja a la Z',
        tip: 'Meñique izquierdo baja de la A a la Z.',
        speech: '¡Meñique izquierdo abajo a la Z! Zapato, zorro, taza.',
        words: [
          { text: 'AZ', icon: '🦊', label: 'Bajada A-Z' },
          { text: 'ZA', icon: '🦊', label: 'Subida Z-A' },
          { text: 'AZA', icon: '🦊', label: 'Salto A-Z-A' },
          { text: 'ZORRO', icon: '🦊', label: 'Zorro listo' }
        ]
      },
      {
        id: '5.7',
        title: 'El anular derecho baja al punto (.)',
        tip: 'Anular derecho baja de la L al punto (.).',
        speech: '¡Anular derecho abajo al punto! Para terminar una frase perfecta.',
        words: [
          { text: 'L.', icon: 'dot', label: 'Bajada L-.' },
          { text: '.L', icon: 'dot', label: 'Subida .-L' },
          { text: 'FIN.', icon: '🏁', label: 'Fin con punto' },
          { text: 'SOL.', icon: '☀️', label: 'Sol con punto' }
        ]
      },
      {
        id: '5.8',
        title: 'Sílabas de la planta baja (ba, va, ma, na, ca, za)',
        tip: 'Todas las consonantes inferiores coordinadas con vocales.',
        speech: '¡Sílabas de la fila inferior! Siente la coordinación de las tres alturas.',
        words: [
          { text: 'BA VA', icon: '🎵', label: 'Ba Va' },
          { text: 'MA NA', icon: '🎵', label: 'Ma Na' },
          { text: 'CA ZA', icon: '🎵', label: 'Ca Za' },
          { text: 'PAN VAN', icon: '🎵', label: 'Pan Van' }
        ]
      },
      {
        id: '5.9',
        title: 'Palabras de 4 letras de la fila inferior',
        tip: 'Vaca, bote, mano, nido, cine, taza.',
        speech: '¡Palabras completas de la fila baja! Escribe fluido y seguro.',
        words: [
          { text: 'VACA', icon: '🐄', label: 'Vaca' },
          { text: 'BOTE', icon: '⛵', label: 'Bote' },
          { text: 'MANO', icon: '✋', label: 'Mano' },
          { text: 'CINE', icon: '🎬', label: 'Cine' }
        ]
      },
      {
        id: '5.10',
        title: 'Palabras mágicas de 5 letras de todo el teclado',
        tip: 'Barco, noche, verde, cielo, zorro.',
        speech: '¡Tres filas alfanuméricas combinadas! Ya eres un auténtico mecanógrafo.',
        words: [
          { text: 'BARCO', icon: '⛵', label: 'Barco veloz' },
          { text: 'NOCHE', icon: '🌙', label: 'Noche estrellada' },
          { text: 'VERDE', icon: '🍃', label: 'Color verde' },
          { text: 'CIELO', icon: '☁️', label: 'Cielo azul' }
        ]
      },
      {
        id: '5.11',
        title: 'Palabras de 6 y 7 letras',
        tip: 'Manzana, planeta, zapato, música.',
        speech: '¡Palabras largas y ricas! Mira qué bien coordinas los 10 dedos.',
        words: [
          { text: 'MANZANA', icon: '🍎', label: 'Manzana roja' },
          { text: 'PLANETA', icon: '🪐', label: 'Planeta tierra' },
          { text: 'ZAPATO', icon: '👟', label: 'Zapato cómodo' },
          { text: 'MUSICA', icon: '🎵', label: 'Música alegre' }
        ]
      },
      {
        id: '5.12',
        title: 'Listas con coma (,)',
        tip: 'Usa la coma para hacer una pausa suave.',
        speech: '¡Listas con comas! Como cuando hacemos la lista de la compra.',
        words: [
          { text: 'SOL, MAR, PAN', icon: '🌊', label: 'Sol, mar, pan' },
          { text: 'CASA, MESA, CAMA', icon: '🏠', label: 'Casa, mesa, cama' },
          { text: 'VACA, PATO, LORO', icon: '🦆', label: 'Vaca, pato, loro' },
          { text: 'ROJO, VERDE, AZUL', icon: '🎨', label: 'Rojo, verde, azul' }
        ]
      },
      {
        id: '5.13',
        title: 'Oraciones cortas con punto final',
        tip: 'Toda buena oración termina con un punto.',
        speech: '¡Oraciones con punto final! Estructura perfecta.',
        words: [
          { text: 'EL PERRO CORRE.', icon: '🐶', label: 'El perro corre.' },
          { text: 'EL GATO SALTA.', icon: '🐱', label: 'El gato salta.' },
          { text: 'EL BARCO NAVEGA.', icon: '⛵', label: 'El barco navega.' },
          { text: 'LA LUNA BRILLA.', icon: '🌙', label: 'La luna brilla.' }
        ]
      },
      {
        id: '5.14',
        title: 'Oraciones completas con comas y puntos',
        tip: 'Pausa en la coma y cierra en el punto.',
        speech: '¡Oraciones narrativas completas! Ya escribes como un escritor.',
        words: [
          { text: 'EL PERRO CORRE, EL GATO SALTA.', icon: '🐾', label: 'Perro y gato' },
          { text: 'LA MANZANA ES DULCE, ROJA Y RICA.', icon: '🍎', label: 'Manzana dulce' },
          { text: 'UN BARCO NAVEGA, VELOZ EN EL MAR.', icon: '⛵', label: 'Barco en el mar' },
          { text: 'UN ZORRO VELOZ VIAJA EN TAXI.', icon: '🦊', label: 'Zorro en taxi' }
        ]
      },
      {
        id: '5.15',
        title: 'Gran Ensayo de Graduación Elemental',
        tip: 'Respira tranquilo y disfruta. ¡Estás a un paso de tu Título Oficial!',
        speech: '¡Último ensayo antes del Gran Examen de Acreditación! Todo tu esfuerzo se va a reflejar aquí.',
        words: [
          { text: 'VACA BARCO MANO CINE ZORRO TAXI.', icon: '🌟', label: 'Ensayo 1' },
          { text: 'EL BARCO VERDE NAVEGA POR EL MAR AZUL.', icon: '🌟', label: 'Ensayo 2' },
          { text: 'LA MANZANA ES DULCE, EL CIELO ESTA CLARO.', icon: '🌟', label: 'Ensayo 3' },
          { text: 'UN ZORRO COME MANZANA, QUESO Y PAN.', icon: '🌟', label: 'Ensayo 4' }
        ]
      }
    ],
    exam: {
      id: '5.exam',
      title: '📋 Gran Examen Oficial de Mecanografía Elemental (Nivel 5)',
      badge: '🎓 Título de Mecanógrafo Junior',
      minAccuracy: 90,
      minWPM: 15,
      isGraduationExam: true,
      diplomaTitle: 'Título Oficial de Mecanógrafo/a de Grado Elemental',
      speech: '¡ATENCIÓN! Este es el Gran Examen Oficial de Grado Elemental. Si lo apruebas, recibirás tu TÍTULO OFICIAL DE MECANOGRAFÍA homologado por la Academia Mecano.',
      passSpeech: '¡ENHORABUENA! ¡HAS APROBADO EL GRAN EXAMEN! Roby y toda la academia te otorgan con orgullo tu TÍTULO OFICIAL DE MECANOGRAFÍA. ¡Puedes verlo e imprimirlo ya mismo!',
      retrySpeech: '¡Has estado muy cerca! Has escrito de maravilla. Repasa un poquito las frases con coma y vuelve a intentarlo enseguida para conseguir tu Título Oficial.',
      words: [
        { text: 'BARCO VACA NOCHE VERDE MANZANA CIELO.', icon: '🎯', label: 'Reto 1: Tres filas' },
        { text: 'EL PERRO CORRE VELOZ, EL GATO SALTA ALTO.', icon: '🎯', label: 'Reto 2: Comas' },
        { text: 'UN BARCO NAVEGA EN EL MAR AZUL Y CLARO.', icon: '🎯', label: 'Reto 3: Puntuación' },
        { text: 'EL ZORRO COME MANZANA DULCE EN EL BOSQUE.', icon: '🎯', label: 'Reto 4: Vocabulario' },
        { text: 'UN ZORRO VELOZ VIAJA EN TAXI POR LA CIUDAD.', icon: '🏆', label: 'Reto de Graduación' }
      ]
    }
  },

  // =========================================================================
  // NIVEL 6: El Reino de los Cuentos y Aventuras (Tildes)
  // =========================================================================
  {
    id: 6,
    slug: '6-cuentos',
    name: '6 - 🏰 El Reino de los Cuentos y Aventuras (Tildes)',
    shortName: 'Cuentos y Tildes',
    beltTier: 'verde',
    minAccuracy: 90,
    minWPM: 18,
    allowedKeys: 'abcdefghijklmnñopqrstuvwxyz .,áéíóú´'.split(''),
    objective: 'Dominar la tecla del acento (´) antes de cada vocal y frases narrativas',
    speech: '¡Había una vez! Aprendemos a poner tildes: primero pulsas la tecla del acento (´) y luego la vocal.',
    tip: 'Para acentuar una vocal: pulsa la tecla ´ (al lado de la P o la Ñ) y luego la vocal que quieras acentuar.',
    lessons: [
      {
        id: '6.1',
        title: 'La tecla del acento (´) con la vocal A',
        tip: 'Pulsa ´ con el meñique derecho y luego la A con el meñique izquierdo.',
        speech: 'Acento y luego la A: á. ¡Como magia!',
        words: [
          { text: 'á', icon: '✨', label: 'A con tilde' },
          { text: 'mamá', icon: '❤️', label: 'Mamá' },
          { text: 'papá', icon: '⭐', label: 'Papá' },
          { text: 'está', icon: '📍', label: 'Está' }
        ]
      },
      {
        id: '6.2',
        title: 'El acento con la vocal E',
        tip: 'Pulsa ´ y luego la E con el corazón izquierdo.',
        speech: 'Acento y luego la E: é. ¡Café, bebé, puré!',
        words: [
          { text: 'é', icon: '✨', label: 'E con tilde' },
          { text: 'café', icon: '☕', label: 'Café rico' },
          { text: 'bebé', icon: '👶', label: 'Bebé risueño' },
          { text: 'puré', icon: '🥣', label: 'Puré suave' }
        ]
      },
      {
        id: '6.3',
        title: 'El acento con la vocal I',
        tip: 'Pulsa ´ y luego la I con el corazón derecho.',
        speech: 'Acento y luego la I: í. ¡Aquí, colibrí, rubí!',
        words: [
          { text: 'í', icon: '✨', label: 'I con tilde' },
          { text: 'aquí', icon: '📍', label: 'Aquí mismo' },
          { text: 'colibrí', icon: '🐦', label: 'Colibrí veloz' },
          { text: 'rubí', icon: '💎', label: 'Piedra rubí' }
        ]
      },
      {
        id: '6.4',
        title: 'El acento con la vocal O',
        tip: 'Pulsa ´ y luego la O con el anular derecho.',
        speech: 'Acento y luego la O: ó. ¡Ratón, camión, león!',
        words: [
          { text: 'ó', icon: '✨', label: 'O con tilde' },
          { text: 'ratón', icon: '🐭', label: 'Ratón travieso' },
          { text: 'camión', icon: '🚛', label: 'Camión grande' },
          { text: 'león', icon: '🦁', label: 'León fuerte' }
        ]
      },
      {
        id: '6.5',
        title: 'El acento con la vocal U',
        tip: 'Pulsa ´ y luego la U con el índice derecho.',
        speech: 'Acento y luego la U: ú. ¡Tú, baúl, menú!',
        words: [
          { text: 'ú', icon: '✨', label: 'U con tilde' },
          { text: 'tú', icon: '👉', label: 'Tú puedes' },
          { text: 'baúl', icon: '🧰', label: 'Baúl secreto' },
          { text: 'menú', icon: '📜', label: 'Menú rico' }
        ]
      },
      {
        id: '6.6',
        title: 'Palabras de fantasía con tildes',
        tip: 'Dragón, botón, corazón, jardín.',
        speech: 'Palabras llenas de magia y emoción.',
        words: [
          { text: 'dragón', icon: '🐉', label: 'Dragón verde' },
          { text: 'botón', icon: '🔘', label: 'Botón mágico' },
          { text: 'corazón', icon: '💖', label: 'Buen corazón' },
          { text: 'jardín', icon: '🌺', label: 'Jardín con flores' }
        ]
      },
      {
        id: '6.7',
        title: 'Verbos en pasado con tilde',
        tip: 'Cantó, saltó, bailó, corrió.',
        speech: 'Cosas que ya pasaron: ¡bailó, jugó, soñó!',
        words: [
          { text: 'cantó', icon: '🎤', label: 'Cantó lindo' },
          { text: 'saltó', icon: '🦘', label: 'Saltó alto' },
          { text: 'bailó', icon: '💃', label: 'Bailó feliz' },
          { text: 'corrió', icon: '🏃', label: 'Corrió rápido' }
        ]
      },
      {
        id: '6.8',
        title: 'Animales de cuento con acento',
        tip: 'El león, el delfín, el ratón.',
        speech: 'Los animales del bosque tienen acento en su nombre.',
        words: [
          { text: 'el león', icon: '🦁', label: 'El león' },
          { text: 'el delfín', icon: '🐬', label: 'El delfín' },
          { text: 'el ratón', icon: '🐭', label: 'El ratón' },
          { text: 'el tiburón', icon: '🦈', label: 'El tiburón' }
        ]
      },
      {
        id: '6.9',
        title: 'Cuentos de hadas (Frases cortas 1)',
        tip: 'El gato con botas.',
        speech: '¡Empiezan los cuentos clásicos!',
        words: [
          { text: 'el gato con botas baila feliz.', icon: '🐱', label: 'Gato con botas' },
          { text: 'el pequeño dragón come helado.', icon: '🐉', label: 'Dragón de helado' },
          { text: 'la reina canta en su jardín.', icon: '👑', label: 'Reina en el jardín' },
          { text: 'un duende juega con el botón.', icon: '🧝', label: 'Duende y botón' }
        ]
      },
      {
        id: '6.10',
        title: 'Cuentos de hadas (Frases cortas 2)',
        tip: 'Mantén el ritmo sin mirar el teclado.',
        speech: 'Más aventuras fantásticas para teclear.',
        words: [
          { text: 'mi perrito corre feliz por el parque.', icon: '🐶', label: 'Perrito en parque' },
          { text: 'la luna brilla y cuida mis sueños.', icon: '🌙', label: 'Luna brillante' },
          { text: 'el osito panda come hojas de bambú.', icon: '🐼', label: 'Osito y bambú' },
          { text: 'un arcoíris cruza todo el cielo azul.', icon: '🌈', label: 'Arcoíris en el cielo' }
        ]
      },
      {
        id: '6.11',
        title: 'Aventuras en el mar y el espacio',
        tip: 'Cohete espacial, delfines en las olas.',
        speech: '¡Viajamos al fondo del mar y a las estrellas!',
        words: [
          { text: 'el cohete espacial viaja muy veloz.', icon: '🚀', label: 'Cohete veloz' },
          { text: 'los delfines saltan sobre las olas.', icon: '🐬', label: 'Delfines saltarines' },
          { text: 'la tortuga nada tranquila en el lago.', icon: '🐢', label: 'Tortuga marina' },
          { text: 'un pez dorado nada en el ancho río.', icon: '🐠', label: 'Pez dorado' }
        ]
      },
      {
        id: '6.12',
        title: 'Cuentos con diálogos y acciones',
        tip: 'El león rugió con gran emoción.',
        speech: 'Historias con emoción y acción trepidante.',
        words: [
          { text: 'el león rugió con alegría y bailó.', icon: '🦁', label: 'León bailó' },
          { text: 'el capitán robó una risa al dragón.', icon: '🏴‍☠️', label: 'Risa de dragón' },
          { text: 'la mariposa voló hasta la cima alta.', icon: '🦋', label: 'Mariposa voló' },
          { text: 'el pequeño mago encontró un rubí.', icon: '🧙', label: 'Mago y rubí' }
        ]
      },
      {
        id: '6.13',
        title: 'Frases narrativas de dos líneas',
        tip: 'Lee con expresividad y teclea al compás de tu voz interior.',
        speech: '¡Frases largas! Siente cómo vuelan tus manos.',
        words: [
          { text: 'había una vez un dragón que soñaba con volar alto.', icon: '🐉', label: 'Dragón soñador' },
          { text: 'en lo alto del castillo brillaba una estrella de cristal.', icon: '🏰', label: 'Castillo y estrella' },
          { text: 'los piratas cantaron una canción bajo la luna llena.', icon: '🏴‍☠️', label: 'Canción pirata' },
          { text: 'la princesa descubrió un baúl lleno de cartas doradas.', icon: '👑', label: 'Baúl de cartas' }
        ]
      },
      {
        id: '6.14',
        title: 'Historias mágicas de la naturaleza',
        tip: 'Respira en cada coma y remata en el punto.',
        speech: 'Cuentos de bosques encantados y animales amigos.',
        words: [
          { text: 'en el bosque verde, las ardillas guardan bellotas con amor.', icon: '🐿️', label: 'Ardillas del bosque' },
          { text: 'el río canta melodías suaves mientras cruza todo el valle.', icon: '🏞️', label: 'Canto del río' },
          { text: 'el búho sabio mira las estrellas desde su viejo roble.', icon: '🦉', label: 'Búho sabio' },
          { text: 'las flores abren sus pétalos de colores al salir el sol.', icon: '🌸', label: 'Flores de sol' }
        ]
      },
      {
        id: '6.15',
        title: 'Gran Ensayo de Fluidez Narrativa',
        tip: '¡Todo el repertorio de tildes y cuentos dominado!',
        speech: '¡Impresionante nivel! Ya estás preparado para el Examen de Cuentos.',
        words: [
          { text: 'el dragón comió helado y cantó una bella canción.', icon: '🌟', label: 'Ensayo 1' },
          { text: 'la reina pasea por su jardín lleno de rosas y jazmín.', icon: '🌟', label: 'Ensayo 2' },
          { text: 'un cohete espacial llegó a la luna con el robot Roby.', icon: '🌟', label: 'Ensayo 3' },
          { text: 'el delfín saltó feliz y saludó al barco con emoción.', icon: '🌟', label: 'Ensayo 4' }
        ]
      }
    ],
    exam: {
      id: '6.exam',
      title: '📋 Gran Examen de los Cuentos y Aventuras (Nivel 6)',
      badge: '🏅 Medalla de los Cuentos Fantásticos',
      minAccuracy: 90,
      minWPM: 18,
      speech: '¡Examen de Fluidez Narrativa! Demuestra tu dominio de las tildes y las historias completas.',
      passSpeech: '¡MARAVILLOSO! Escribes historias con tildes perfectas y fluidez de maestro. ¡Medalla de Cuentos otorgada!',
      retrySpeech: '¡Muy buen trabajo! Recuerda pulsar primero la tecla ´ y luego la vocal. ¡Inténtalo de nuevo ya!',
      words: [
        { text: 'el dragón comió helado de fresa en el jardín.', icon: '🎯', label: 'Reto 1: Tildes' },
        { text: 'mi perrito corrió feliz por el parque verde.', icon: '🎯', label: 'Reto 2: Acción' },
        { text: 'el león rugió con alegría y bailó bajo el sol.', icon: '🎯', label: 'Reto 3: Cuento' },
        { text: 'la reina descubrió un baúl lleno de rubíes.', icon: '🎯', label: 'Reto 4: Aventura' },
        { text: 'el cohete espacial viajó hasta la luna de cristal.', icon: '🏆', label: 'Reto Final' }
      ]
    }
  },

  // =========================================================================
  // NIVEL 7: Club de Chistes y Trabalenguas (Mayúsculas y Puntuación)
  // =========================================================================
  {
    id: 7,
    slug: '7-chistes',
    name: '7 - 😂 Club de Chistes, Trabalenguas y Mayúsculas (Shift, ¡! ¿?)',
    shortName: 'Chistes, Shift y Signos',
    beltTier: 'negro',
    minAccuracy: 90,
    minWPM: 20,
    allowedKeys: 'abcdefghijklmnñopqrstuvwxyzABCDEFGHIJKLMNÑOPQRSTUVWXYZ .,:;!¡¿?áéíóú'.split(''),
    objective: 'Dominar la tecla Shift contralateral para mayúsculas y signos de puntuación dobles',
    speech: '¡A reírnos y afilar los reflejos! Aprenderemos a usar Mayús con la mano contraria y los signos ¡! y ¿?.',
    tip: 'Para escribir una mayúscula: mantén pulsada la tecla Shift con el meñique de la mano contraria y pulsa la letra.',
    lessons: [
      {
        id: '7.1',
        title: 'Mayúsculas con la mano izquierda (Shift Derecho)',
        tip: 'Mantén Shift con el meñique derecho y pulsa A, S, D, F con la mano izquierda.',
        speech: '¡Shift derecho para mayúsculas de la izquierda! A, S, D, F en mayúscula.',
        words: [
          { text: 'A S D F', icon: '🔠', label: 'Mayús Izq' },
          { text: 'Ana', icon: '👧', label: 'Nombre Ana' },
          { text: 'Sara', icon: '👧', label: 'Nombre Sara' },
          { text: 'Felipe', icon: '👦', label: 'Nombre Felipe' }
        ]
      },
      {
        id: '7.2',
        title: 'Mayúsculas con la mano derecha (Shift Izquierdo)',
        tip: 'Mantén Shift con el meñique izquierdo y pulsa J, K, L, Ñ con la mano derecha.',
        speech: '¡Shift izquierdo para mayúsculas de la derecha! Juan, Laura, Mateo.',
        words: [
          { text: 'J K L Ñ', icon: '🔠', label: 'Mayús Der' },
          { text: 'Juan', icon: '👦', label: 'Nombre Juan' },
          { text: 'Laura', icon: '👧', label: 'Nombre Laura' },
          { text: 'Nuria', icon: '👧', label: 'Nombre Nuria' }
        ]
      },
      {
        id: '7.3',
        title: 'Signos de exclamación (¡ y !)',
        tip: 'En español usamos signo al principio (¡) y al final (!).',
        speech: '¡Qué divertido! ¡Vamos a aprender los signos de sorpresa!',
        words: [
          { text: '¡Hola!', icon: '🎉', label: '¡Hola!' },
          { text: '¡Genial!', icon: '🎉', label: '¡Genial!' },
          { text: '¡Bravo!', icon: '🎉', label: '¡Bravo!' },
          { text: '¡A jugar!', icon: '🎉', label: '¡A jugar!' }
        ]
      },
      {
        id: '7.4',
        title: 'Signos de interrogación (¿ y ?)',
        tip: 'Signo de pregunta al abrir (¿) y al cerrar (?).',
        speech: '¿Quién es? ¿Qué hora es? ¡Preguntas curiosas!',
        words: [
          { text: '¿Quién es?', icon: '❓', label: '¿Quién es?' },
          { text: '¿Qué tal?', icon: '❓', label: '¿Qué tal?' },
          { text: '¿Cómo estás?', icon: '❓', label: '¿Cómo estás?' },
          { text: '¿Jugamos?', icon: '❓', label: '¿Jugamos?' }
        ]
      },
      {
        id: '7.5',
        title: 'Dos puntos y punto y coma (: y ;)',
        tip: 'Signos de puntuación para explicar y enumerar.',
        speech: 'Dos puntos para anunciar cosas: ¡atentos!',
        words: [
          { text: 'dijo: hola', icon: '💬', label: 'Dijo dos puntos' },
          { text: 'mira esto:', icon: '💬', label: 'Mira esto' },
          { text: 'uno; dos; tres;', icon: '💬', label: 'Punto y coma' },
          { text: 'Roby dice: ¡vamos!', icon: '💬', label: 'Roby dice' }
        ]
      },
      {
        id: '7.6',
        title: 'Nombres propios de personas y ciudades',
        tip: 'Los nombres siempre empiezan por mayúscula.',
        speech: '¡Nombres de amigos y ciudades del mundo!',
        words: [
          { text: 'Madrid y Barcelona', icon: '🏙️', label: 'Ciudades' },
          { text: 'Lucas y Sofía', icon: '👫', label: 'Amigos' },
          { text: 'España y Europa', icon: '🌍', label: 'Lugares' },
          { text: 'Roby el Robot', icon: '🤖', label: 'Roby Robot' }
        ]
      },
      {
        id: '7.7',
        title: 'Trabalenguas clásico: Tres tristes tigres',
        tip: 'Cuidado no se te traben los dedos.',
        speech: '¡El trabalenguas del tigre! Despacio y con ritmo.',
        words: [
          { text: 'tres tristes tigres', icon: '🐯', label: 'Tres tigres' },
          { text: 'comían trigo en un trigal', icon: '🐯', label: 'En un trigal' },
          { text: 'un tigre, dos tigres, tres tigres', icon: '🐯', label: 'Contando tigres' },
          { text: 'los tres tigres comían trigo feliz.', icon: '🐯', label: 'Tigres felices' }
        ]
      },
      {
        id: '7.8',
        title: 'Trabalenguas veloz: Pepe pela patatas',
        tip: 'La P y la T en acción rápida.',
        speech: '¡Pepe pela patatas para una rica tortilla!',
        words: [
          { text: 'pepe pela patatas', icon: '🥔', label: 'Pepe pela' },
          { text: 'para una rica tortilla', icon: '🥔', label: 'Rica tortilla' },
          { text: 'pepe pela y pica patatas', icon: '🥔', label: 'Pela y pica' },
          { text: '¡qué rica tortilla cocina Pepe!', icon: '🥔', label: 'Tortilla de Pepe' }
        ]
      },
      {
        id: '7.9',
        title: 'Trabalenguas del cielo: Despejado',
        tip: 'El cielo está despejado, ¿quién lo despejará?',
        speech: '¡Un clásico de la escuela! Cuidado con la J y la D.',
        words: [
          { text: 'el cielo está nublado', icon: '☁️', label: 'Cielo nublado' },
          { text: '¿quién lo despejará?', icon: '☀️', label: 'Pregunta' },
          { text: 'el que lo despeje', icon: '🌤️', label: 'Respuesta' },
          { text: '¡un gran despejador será!', icon: '🌈', label: 'Exclamación' }
        ]
      },
      {
        id: '7.10',
        title: 'Chistes de mecanografía: El ratón del ordenador',
        tip: '¿Qué le dijo un ratón a otro?',
        speech: '¡Primer chiste! ¿Qué le dice un ratón a una gata?',
        words: [
          { text: '¿Qué hace un ratón en el teclado?', icon: '🐭', label: 'Pregunta 1' },
          { text: '¡esperar a que llegue el queso!', icon: '🧀', label: 'Chiste 1' },
          { text: '¿Por qué vuela la computadora?', icon: '💻', label: 'Pregunta 2' },
          { text: '¡porque tiene un ratón volador!', icon: '🦇', label: 'Chiste 2' }
        ]
      },
      {
        id: '7.11',
        title: 'Chistes de animales simpáticos',
        tip: 'Chistes divertidos para sonreír mientras tecleas.',
        speech: '¡A reír mientras los dedos bailan!',
        words: [
          { text: '¿Qué le dice un pez a otro pez?', icon: '🐠', label: 'Pez chistoso' },
          { text: '¡nada de nada, amigo mío!', icon: '🌊', label: '¡Nada de nada!' },
          { text: '¿Qué le dice el café al azúcar?', icon: '☕', label: 'Café dulce' },
          { text: '¡sin ti mi vida es amarga!', icon: '🍬', label: '¡Qué dulce!' }
        ]
      },
      {
        id: '7.12',
        title: 'Diálogos teatrales con signos dobles',
        tip: 'Combina signos de interrogación y exclamación.',
        speech: 'Diálogos de teatro: ¡preguntas y respuestas con energía!',
        words: [
          { text: '—¿Cómo te llamas? —¡Me llamo Roby!', icon: '🎭', label: 'Presentación' },
          { text: '—¿Quieres jugar? —¡Claro que sí!', icon: '🎭', label: 'Invitación' },
          { text: '—¿Dónde está el tesoro? —¡Aquí mismo!', icon: '🎭', label: 'El tesoro' },
          { text: '—¡Qué emoción! —¡Vamos a ganar!', icon: '🎭', label: 'Victoria' }
        ]
      },
      {
        id: '7.13',
        title: 'Retos de velocidad: Adivinanzas',
        tip: 'Adivina, adivinanza.',
        speech: '¡Adivinanzas para mecanógrafos despiertos!',
        words: [
          { text: 'Blanca por dentro, verde por fuera.', icon: '🍐', label: 'La pera' },
          { text: 'Oro parece, plata no es.', icon: '🍌', label: 'El plátano' },
          { text: 'Tengo hojas y no soy árbol.', icon: '📖', label: 'El libro' },
          { text: 'Tengo teclas y no soy piano.', icon: '⌨️', label: '¡El teclado!' }
        ]
      },
      {
        id: '7.14',
        title: 'Párrafos de comedia y ritmo',
        tip: 'Coordina mayúsculas y signos a toda velocidad.',
        speech: '¡Párrafos cómicos! Mira qué soltura tienes ya.',
        words: [
          { text: 'El pingüino Pepe se puso pajarita para pasear por París.', icon: '🐧', label: 'Pingüino Pepe' },
          { text: 'Cuca cose una camisa de seda suave para su amigo conejo.', icon: '🧵', label: 'Costura de Cuca' },
          { text: 'El hipopótamo Hipo salta de alegría cuando come sandía.', icon: '🦛', label: 'Hipopótamo Hipo' },
          { text: '¡Atención a todos los pasajeros! El cohete va a despegar.', icon: '🚀', label: 'Despegue estelar' }
        ]
      },
      {
        id: '7.15',
        title: 'Gran Ensayo del Club de Chistes',
        tip: 'Todos los signos al alcance de tu mano.',
        speech: '¡Último ensayo! Vas directo al cinturón negro.',
        words: [
          { text: '¿Quién canta en el roble? ¡El ruiseñor real!', icon: '🌟', label: 'Ensayo 1' },
          { text: 'Pepe pela patatas y Lucas cocina la rica sopa.', icon: '🌟', label: 'Ensayo 2' },
          { text: '¡Cuidado con el tigre! Tres tigres comen trigo.', icon: '🌟', label: 'Ensayo 3' },
          { text: '¿Sabes quién soy? ¡Soy el gran maestro Roby!', icon: '🌟', label: 'Ensayo 4' }
        ]
      }
    ],
    exam: {
      id: '7.exam',
      title: '📋 Gran Examen de Mayúsculas, Puntuación y Chistes (Nivel 7)',
      badge: '🏅 Medalla del Cinturón Negro',
      minAccuracy: 90,
      minWPM: 20,
      speech: '¡Examen de Acreditación de Mayúsculas y Puntuación! Demuestra tu agilidad con Shift y todos los signos.',
      passSpeech: '¡INCREÍBLE! Dominas las mayúsculas y la puntuación completa con precisión de cinturón negro. ¡Medalla conseguida!',
      retrySpeech: '¡Gran esfuerzo! Recuerda pulsar Shift con la mano contraria a la letra. ¡Repite y lo bordarás!',
      words: [
        { text: '¿Cómo estás? ¡Estoy muy feliz de estar aquí!', icon: '🎯', label: 'Reto 1: Signos' },
        { text: 'Tres tristes tigres comían trigo en el trigal.', icon: '🎯', label: 'Reto 2: Trabalenguas' },
        { text: 'Pepe pela patatas para la cena de Madrid.', icon: '🎯', label: 'Reto 3: Mayúsculas' },
        { text: '—¿Dónde vas? —¡Voy al castillo de cristal!', icon: '🎯', label: 'Reto 4: Diálogo' },
        { text: '¡Roby el Robot coronó a Lucas como gran campeón!', icon: '🏆', label: 'Reto Final' }
      ]
    }
  },

  // =========================================================================
  // NIVEL 8: Desafío Galáctico del Dragón Robot (Gran Maestría)
  // =========================================================================
  {
    id: 8,
    slug: '8-galaxia',
    name: '8 - 🐉 Desafío Galáctico del Dragón Robot (Gran Maestría)',
    shortName: 'Desafío Galáctico',
    beltTier: 'negro',
    minAccuracy: 92,
    minWPM: 25,
    allowedKeys: 'abcdefghijklmnñopqrstuvwxyzABCDEFGHIJKLMNÑOPQRSTUVWXYZ .,:;!¡¿?áéíóúÁÉÍÓÚ\n'.split(''),
    objective: 'Fluidez absoluta de mecanógrafo experto con párrafos continuos e Intro',
    speech: '¡El reto definitivo de la galaxia! Roby y el Dragón Robot te coronarán como Gran Maestro Mecanógrafo.',
    tip: '¡Respira hondo y confía en tus deditos mágicos! Escribe relajado y con ritmo musical constante.',
    lessons: [
      {
        id: '8.1',
        title: 'La tecla Intro (\n) para saltos de línea',
        tip: 'Pulsa Intro con el meñique derecho para cambiar de párrafo.',
        speech: '¡La tecla Intro! Tu meñique derecho salta para empezar una nueva línea.',
        words: [
          { text: 'Hola.\nAdiós.', icon: '↵', label: 'Salto de línea' },
          { text: 'Roby vuela.\nEl dragón ríe.', icon: '↵', label: 'Dos líneas' },
          { text: 'Uno.\nDos.\nTres.', icon: '↵', label: 'Tres líneas' },
          { text: 'El cohete viaja.\nLas estrellas brillan.', icon: '↵', label: 'Espacio estelar' }
        ]
      },
      {
        id: '8.2',
        title: 'Misión en la Nave Estelar Orión',
        tip: 'Coordina saltos y párrafos sin perder el compás.',
        speech: '¡Despegamos en la nave Orión! Motores listos.',
        words: [
          { text: 'El capitán Roby encendió los motores de la nave estelar Orión.', icon: '🚀', label: 'Nave Orión' },
          { text: 'Las luces de la cabina parpadeaban con alegría multicolor.', icon: '🚀', label: 'Cabina' },
          { text: 'El radar indicaba un rumbo directo hacia el planeta Caramelo.', icon: '🚀', label: 'Rumbo estelar' },
          { text: 'Todos los robots saludaron levantando sus antenas brillantes.', icon: '🚀', label: 'Tripulación' }
        ]
      },
      {
        id: '8.3',
        title: 'El Planeta de los Ríos de Chocolate',
        tip: 'Frases completas y vocabulario dulce.',
        speech: '¡Un planeta delicioso donde los ríos son de chocolate!',
        words: [
          { text: 'En el planeta Caramelo los ríos son de chocolate con leche.', icon: '🍫', label: 'Ríos dulces' },
          { text: 'Las montañas son de galleta crujiente y nata montada.', icon: '🏔️', label: 'Montañas' },
          { text: 'Árboles de algodón de azúcar crecen junto al lago dulce.', icon: '🍭', label: 'Algodón dulce' },
          { text: 'Llovían gotas de caramelo tibio que olían a fresa.', icon: '🍓', label: 'Lluvia dulce' }
        ]
      },
      {
        id: '8.4',
        title: 'El Dragón de Pompas de Jabón',
        tip: 'Chispitas es un dragón muy simpático que no lanza fuego.',
        speech: 'Conoce al dragón Chispitas: ¡lanza pompas de jabón!',
        words: [
          { text: 'En la colina vive el simpático dragón Chispitas.', icon: '🐉', label: 'Chispitas' },
          { text: 'En vez de fuego caliente lanza pompas de jabón multicolor.', icon: '🫧', label: 'Pompas de jabón' },
          { text: 'Las pompas flotan por todo el valle y cantan melodías.', icon: '🫧', label: 'Pompas cantoras' },
          { text: 'Los animales del bosque juegan a atraparlas entre risas.', icon: '🐾', label: 'Juego feliz' }
        ]
      },
      {
        id: '8.5',
        title: 'La Llave Secreta de Timi el Robot',
        tip: 'Mantén la velocidad constante sin apresurarte.',
        speech: 'Timi ha encontrado una llave dorada en el bosque.',
        words: [
          { text: 'El robot Timi encontró una llave dorada bajo el viejo roble.', icon: '🗝️', label: 'Llave mágica' },
          { text: 'Al girarla en la roca una puerta luminosa se abrió ante él.', icon: '🚪', label: 'Puerta mágica' },
          { text: 'Un inmenso jardín encantado apareció lleno de mariposas.', icon: '🦋', label: 'Jardín encantado' },
          { text: 'Flores que cantaban le dieron una cálida bienvenida a su hogar.', icon: '🌺', label: 'Bienvenida' }
        ]
      },
      {
        id: '8.6',
        title: 'El Valle de los Cristales Cantores',
        tip: 'Coordina mayúsculas y acentos en palabras largas.',
        speech: 'Cristales que emiten notas musicales al tocarlos.',
        words: [
          { text: 'En el valle secreto de cristal cada roca emite una nota musical.', icon: '💎', label: 'Cristal cantor' },
          { text: 'Cuando el viento sopla suave todo el valle parece una orquesta.', icon: '🎼', label: 'Orquesta de viento' },
          { text: 'Roby bailó alegremente siguiendo el compás de las notas.', icon: '🤖', label: 'Baile de Roby' },
          { text: 'Las estrellas del cielo brillaban al ritmo de la música estelar.', icon: '✨', label: 'Estrellas' }
        ]
      },
      {
        id: '8.7',
        title: 'La Carrera de Trineos de Nieve de Azúcar',
        tip: 'Párrafos dinámicos de acción y velocidad.',
        speech: '¡Carrera de trineos por la colina más empinada!',
        words: [
          { text: 'Los pingüinos organizaron una gran carrera de trineos veloces.', icon: '🛷', label: 'Carrera de trineo' },
          { text: 'La nieve de azúcar crujía bajo las cuchillas brillantes.', icon: '❄️', label: 'Nieve crujiente' },
          { text: 'El conejo saltarín tomó la delantera en la última curva.', icon: '🐰', label: 'Conejo veloz' },
          { text: '¡Todos los espectadores aplaudieron emocionados al ganador!', icon: '👏', label: 'Aplausos' }
        ]
      },
      {
        id: '8.8',
        title: 'El Secreto de la Corona Dorada',
        tip: 'Palabras solemnes de maestría.',
        speech: 'La leyenda de la corona dorada de los mecanógrafos.',
        words: [
          { text: 'Cuenta la leyenda que quien domine los diez dedos recibirá una corona.', icon: '👑', label: 'Leyenda' },
          { text: 'Una corona mágica forjada con estrellas luminosas del espacio.', icon: '👑', label: 'Corona estelar' },
          { text: 'Esa corona otorga el don de escribir a la velocidad del rayo.', icon: '⚡', label: 'Don del rayo' },
          { text: 'Y hoy tú estás a punto de conquistar ese gran tesoro dorado.', icon: '🏆', label: 'Tu destino' }
        ]
      },
      {
        id: '8.9',
        title: 'Párrafo Narrativo: Viaje al Espacio Profundo',
        tip: 'Respira hondo y mantén la cadencia.',
        speech: '¡Párrafo continuo de alta precisión!',
        words: [
          {
            text: 'A través de la ventanilla de la nave espacial, miles de estrellas brillaban como diamantes en el infinito.',
            icon: '🌌',
            label: 'Espacio profundo'
          },
          {
            text: 'Roby observó una nebulosa dorada que danzaba suavemente al compás de la gravedad cósmica.',
            icon: '✨',
            label: 'Nebulosa dorada'
          }
        ]
      },
      {
        id: '8.10',
        title: 'Párrafo Narrativo: La Aldea de las Luciérnagas',
        tip: 'Lectura fluida y tecleo sin esfuerzo visual.',
        speech: 'La noche mágica en la aldea de las luciérnagas.',
        words: [
          {
            text: 'Cuando el sol se ocultaba tras los cerros, millones de pequeñas luces flotaban entre las ramas del sauce.',
            icon: '🪲',
            label: 'Luciérnagas'
          },
          {
            text: 'Los niños de la aldea salían a cantar canciones alegres iluminados por el resplandor cálido.',
            icon: '🎶',
            label: 'Canto cálido'
          }
        ]
      },
      {
        id: '8.11',
        title: 'Párrafo Narrativo: El Faro del Fin del Mundo',
        tip: 'Concentración total en cada cláusula.',
        speech: 'El faro que guía a los marineros de sueños.',
        words: [
          {
            text: 'En el acantilado más alto del océano se alzaba un viejo faro de piedra blanca y cúpula de bronce.',
            icon: '🗼',
            label: 'Viejo faro'
          },
          {
            text: 'Su haz de luz giratorio atravesaba la niebla protegiendo a los barcos de las rocas escarpadas.',
            icon: '💡',
            label: 'Luz giratoria'
          }
        ]
      },
      {
        id: '8.12',
        title: 'Párrafo Narrativo: El Baile de las Mariposas',
        tip: 'Mantén un ritmo de 25 WPM o más.',
        speech: 'La fiesta de primavera en el prado encantado.',
        words: [
          {
            text: 'Flores multicolores abrían sus pétalos al compás de una suave brisa que perfumaba todo el prado.',
            icon: '🌸',
            label: 'Prado en flor'
          },
          {
            text: 'Cientos de mariposas de purpurina azul danzaban en círculos celebrando la llegada del verano.',
            icon: '🦋',
            label: 'Baile azul'
          }
        ]
      },
      {
        id: '8.13',
        title: 'Desafío de Resistencia: El Banquete Galáctico',
        tip: 'Texto extenso de alta fluidez.',
        speech: '¡El banquete galáctico de los campeones!',
        words: [
          {
            text: 'En el gran salón estelar se sirvieron pasteles de cometa, galletas de polvo de estrella y zumo de aurora boreal.',
            icon: '🧁',
            label: 'Banquete estelar'
          },
          {
            text: 'Todos los robots y niños brindaron con copas de cristal por la amistad, la constancia y el aprendizaje.',
            icon: '🥂',
            label: 'Brindis de honor'
          }
        ]
      },
      {
        id: '8.14',
        title: 'Penúltimo Desafío: El Dragón Chispitas te saluda',
        tip: 'Siente el teclado como una extensión natural de tus dedos.',
        speech: 'El dragón Chispitas está orgulloso de ti. ¡Estás a un paso de la gloria!',
        words: [
          {
            text: 'El dragón Chispitas desplegó sus alas luminosas y lanzó una gran pompa dorada que decía tu nombre.',
            icon: '🐉',
            label: 'Homenaje del Dragón'
          },
          {
            text: 'Roby aplaudió con entusiasmo y te entregó la llave mágica de la Academia de Mecanografía.',
            icon: '🤖',
            label: 'Llave de oro'
          }
        ]
      },
      {
        id: '8.15',
        title: 'Gran Ensayo de Graduación de Maestro',
        tip: 'El último ensayo de la academia. Respira y brilla.',
        speech: '¡El último paso antes del Examen Final de Gran Maestro! Estás listo para coronarte.',
        words: [
          {
            text: 'El capitán Roby encendió los motores estelares de la nave Orión con una enorme sonrisa.',
            icon: '🌟',
            label: 'Ensayo Final 1'
          },
          {
            text: 'A través de la ventanilla miles de estrellas brillaban como diamantes en el espacio infinito.',
            icon: '🌟',
            label: 'Ensayo Final 2'
          },
          {
            text: 'Su misión era explorar el fabuloso planeta Caramelo donde los ríos son de chocolate.',
            icon: '🌟',
            label: 'Ensayo Final 3'
          },
          {
            text: '¡Has recorrido todo el camino y hoy te coronas como el mejor mecanógrafo de la galaxia!',
            icon: '🌟',
            label: 'Ensayo Final 4'
          }
        ]
      }
    ],
    exam: {
      id: '8.exam',
      title: '👑 Gran Examen Final de Graduación: Maestro Mecanógrafo (Nivel 8)',
      badge: '👑 Gran Título de Maestro Mecanógrafo',
      minAccuracy: 92,
      minWPM: 25,
      isGraduationExam: true,
      diplomaTitle: 'Título Superior Oficial de Gran Maestro Mecanógrafo (Cinturón Negro & Corona)',
      speech: '¡LLEGÓ EL MOMENTO CULMINANTE! El Gran Examen Final de Graduación de la Academia Mecano. Si lo superas, obtendrás el TÍTULO MÁXIMO DE GRAN MAESTRO MECANÓGRAFO y la Corona Dorada.',
      passSpeech: '¡GLORIOSO! ¡ERES UN GRAN MAESTRO MECANÓGRAFO! Has conquistado el teclado por completo con la máxima excelencia. ¡Tu Título Superior y tu Corona Dorada son tuyos!',
      retrySpeech: '¡Impresionante demostración! Mantén la calma en las frases largas. ¡Vuelve a intentarlo ahora mismo para conseguir tu Corona!',
      words: [
        {
          text: 'El capitán Roby encendió los motores de la nave Orión con una gran sonrisa.',
          icon: '🚀',
          label: 'Reto 1: Despegue'
        },
        {
          text: 'Miles de estrellas brillaban como diamantes luminosos en el espacio infinito.',
          icon: '🌌',
          label: 'Reto 2: El Cosmos'
        },
        {
          text: 'El dragón Chispitas lanzó divertidas pompas de jabón que flotaban por el valle.',
          icon: '🐉',
          label: 'Reto 3: El Dragón'
        },
        {
          text: 'El misterioso robot Timi abrió la puerta secreta del inmenso jardín encantado.',
          icon: '🤖',
          label: 'Reto 4: Timi'
        },
        {
          text: '¡Enhorabuena, campeón! Tus dedos vuelan como la luz y dominas todo el teclado a la perfección.',
          icon: '👑',
          label: 'Gran Reto de Graduación'
        }
      ]
    }
  }
];

export default CURRICULUM_LEVELS;
