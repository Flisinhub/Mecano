// =============================================================================
// MECANO AVENTURA KIDS - LISTA DE PALABRAS Y MUNDOS DIDÁCTICOS
// Diseñado especialmente para niños: vocabulario positivo, divertido y progresivo
// =============================================================================

const WORD_LIST = {
  // 🌲 NIVEL 1: EL BOSQUE DE LAS VOCALES Y ANIMALES
  // Palabras cortitas de 3 a 5 letras, sin complicaciones, ideales para empezar
  "1-infantil": [
    "sol", "luz", "oso", "pez", "pan", "mar", "uva", "ola", "rio", "casa",
    "pato", "gato", "rana", "luna", "pino", "nube", "dado", "tren", "moto", "rosa",
    "vela", "pera", "bota", "mano", "sopa", "leche", "kiwi", "lobo", "isla", "nido",
    "foca", "cielo", "taza", "boca", "pelo", "pie", "miel", "copa", "poma", "mesa",
    "lupa", "cuna", "faro", "mapa", "toro", "hada", "pala", "caja", "lana", "loro"
  ],

  // 🏴‍☠️ NIVEL 2: LA ISLA PIRATA Y CRIATURAS MÁGICAS
  // Palabras más largas con acentos suaves y personajes fantásticos
  "2-basico": [
    "dragón", "cohete", "delfín", "mágico", "estrella", "tesoro", "conejo", "galleta",
    "árbol", "música", "planeta", "pelota", "castillo", "amigo", "brújula", "pirata",
    "unicornio", "arcoíris", "montaña", "bosque", "jardín", "princesa", "caballero",
    "tortuga", "ardilla", "jirafa", "pingüino", "burbuja", "diamante", "mariposa",
    "espada", "reina", "palacio", "canción", "familia", "sonrisa", "cometa", "aventura"
  ],

  // 🏰 NIVEL 3: EL REINO DE LOS CUENTOS DIVERTIDOS
  // Frases cortas y alegres de una sola línea para afianzar el ritmo
  "3-principiante": [
    "el gato con botas baila en el tejado.",
    "el pequeño dragón come helado de fresa.",
    "mi perrito corre feliz por el parque.",
    "la luna brilla y cuida todos mis sueños.",
    "el cohete espacial viaja hacia las estrellas.",
    "la tortuga nada tranquila en el lago azul.",
    "los delfines saltan felices sobre las olas.",
    "el osito panda come ricas hojas de bambú.",
    "un arcoíris de colores cruza todo el cielo.",
    "mi mejor amiga comparte sus juguetes conmigo.",
    "las mariposas juegan entre las flores rosas.",
    "el ratoncito busca un trozo de queso dulce.",
    "el hada madrina tiene una varita de estrellas.",
    "el barco pirata navega buscando una isla secreta.",
    "las ardillas guardan bellotas en el hueco del roble."
  ],

  // 🧩 NIVEL 4: ADIVINANZAS INFANTILES
  // Adivinanzas populares con su respuesta para despertar la curiosidad
  "4-intermedio": [
    "oro parece y plátano es, ¿qué fruta es? ¡el plátano!",
    "blanca por dentro, verde por fuera, si quieres que te lo diga, espera: ¡la pera!",
    "tengo agujas y no sé coser, tengo números y no sé leer: ¡el reloj!",
    "llevo mi casa siempre en la espalda y camino muy despacio: ¡el caracol!",
    "vuelo de noche y duermo de día, nunca verás plumas en el ala mía: ¡el murciélago!",
    "canto en la orilla y nado en el agua, no soy pez ni cigarra: ¡la rana!",
    "tengo orejas largas y rabo cortito, salto por el campo y como zanahoria: ¡el conejo!",
    "subo llena de agua y bajo vacía, si no me doy prisa, la sopa se enfría: ¡la cuchara!",
    "chiquito como un ratón, pero cuida la casa como un león: ¡el candado!",
    "salgo por el día y doy mucho calor, por la noche me duermo: ¡el sol brillante!",
    "vuelo sin alas, silbo sin boca, pego sin manos y nadie me toca: ¡el viento!",
    "dos ventanitas que abres por la mañana y cierras por la noche: ¡los ojos!"
  ],

  // 😂 NIVEL 5: CLUB DE CHISTES PARA NIÑOS
  // Chistes blancos y simpáticos para escribir entre risas
  "5-avanzado": [
    "¿qué le dice un pez a otro pez en el agua? ¡nada, nada!",
    "¿qué hace una abeja en el gimnasio? ¡está haciendo zumba!",
    "¿qué le dice una taza a otra taza? ¡oye, qué taza tan bonita tienes hoy!",
    "¿por qué los pájaros vuelan al sur en invierno? ¡porque caminando tardarían semanas!",
    "¿cuál es el colmo de un robot? ¡tener nervios de acero y quedarse sin batería!",
    "¿qué le dice una pared a otra pared en la esquina? ¡nos vemos en la esquina!",
    "¿cuál es el dinosaurio más limpio de la selva? ¡el jabonsaurio rex!",
    "¿qué hace un perro con un taladro en la mano? ¡está taladrando!",
    "¿por qué el tomate no toma café por la mañana? ¡porque toma té!",
    "¿qué le dice un semáforo a otro semáforo? ¡no me mires que me estoy poniendo rojo!",
    "¿cómo se llama el campeón de buceo japonés? ¡tokofondo!",
    "¿qué le dice una bombilla a un interruptor? ¡me enciendes cada día con tu alegría!"
  ],

  // 🌀 NIVEL 6: TRABALENGUAS TRAVIESOS
  // Retos de agilidad y coordinación para los dedos
  "6-experto": [
    "tres tristes tigres comían trigo en un gran trigal verde.",
    "pablito clavó un clavito pequeño en la calva de un calvito simpático.",
    "erre con erre guitarra, erre con erre barril, rueda que rueda la rueda del ferrocarril.",
    "el cielo está encapotado, ¿quién lo desencapotará? el buen desencapotador será.",
    "si Pancha plancha con cuatro planchas, ¿con cuántas planchas plancha Pancha?",
    "el hipopótamo Hipo tiene hipo, ¿quién le quita el hipo al hipopótamo Hipo?",
    "tres traviesos ratoncitos tropezaron jugando con tres trozos de queso fresco.",
    "cuca cose una camisa para el conejo que corre por la colina.",
    "compadre, cómpreme un coco. compadre, no compro coco, porque el que poco coco come, poco coco compra.",
    "pepe peña pela patata para una tortilla que prepara con primor en la cocina."
  ],

  // 🚀 NIVEL 7: EXPEDICIÓN GALÁCTICA A LAS ESTRELLAS
  // Párrafos de aventuras espaciales y mundos de fantasía
  "7-maestria": [
    "El capitán Roby encendió los motores de la nave estelar Orión con una gran sonrisa.\n\nA través de la ventanilla, miles de estrellas brillaban como diamantes luminosos en el espacio infinito.\n\nSu misión secreta era explorar el fabuloso planeta Caramelo, un mundo asombroso donde los ríos son de chocolate con leche y las montañas están cubiertas de suave nieve de vainilla.\n\nCon un suave giro de timón, la nave entró en la órbita del planeta para comenzar la mayor aventura de sus vidas.",

    "En lo más profundo del bosque encantado vivía un pequeño dragón llamado Chispa.\n\nA diferencia de otros dragones gigantes, Chispa no lanzaba fuego temible, sino pompas de jabón brillantes que flotaban suavemente entre los árboles centenarios.\n\nTodos los animalitos del bosque se reunían cada tarde para aplaudir sus piruetas en el aire y cantar alegres canciones junto al arroyo cristalino.",

    "La astronauta Sofía flotaba en gravedad cero dentro de la cúpula de la estación espacial.\n\nMiraba maravillada hacia abajo y contemplaba la Tierra: una preciosa esfera azul, blanca y verde girando en el silencio cósmico.\n\nTomó su diario de navegación y escribió emocionada: Cada día en el espacio me enseña que nuestro planeta es el tesoro más valioso que todos debemos cuidar y proteger con cariño.",

    "El expreso mágico de las nubes partió a toda velocidad desde el andén de las hadas.\n\nSus vagones de madera reluciente llevaban a los niños más curiosos rumbo a la cumbre de la Montaña Esmeralda.\n\nPor el camino, bandadas de colibríes de plumas doradas acompañaban la marcha con sus trinos alegres, anunciando que la fiesta de la primavera había comenzado en el valle encantado.",

    "El capitán Roby envió un mensaje secreto al correo aventuras@roby.com con el código #estrella.\n\nEnseguida recibió una respuesta luminosa: ¡Has ganado 100€ de energía cósmica para explorar la galaxia!\n\nRoby sonrió con alegría y activó los motores estelares para volar a toda velocidad hacia nuevos mundos mágicos."
  ],

  // 🐉 NIVEL 8: EL GRAN DESAFÍO DEL DRAGÓN ROBOT
  // Retos épicos de mecanografía con emoción y triunfo
  "8-absurdo": [
    "¡Alerta en la torre del castillo! El Dragón Mecánico de tres cabezas ha lanzado un hechizo de letras mágicas que flotan por los pasillos.\n\nSolo el hechicero del teclado más rápido y concentrado del reino podrá descifrar los conjuros secretos para liberar a los duendecillos traviesos.\n\n¡Respira hondo, mantén tus dedos ágiles sobre la fila guía y desata la magia de cada tecla para conquistar la victoria dorada!",

    "En el laboratorio del profesor Chiflado, una máquina de inventos comenzó a disparar rosquillas gigantes con forma de letras del abecedario.\n\nLos pequeños robots ayudantes corrían de un lado a otro esquivando donas voladoras, nubes de algodón de azúcar y ríos de batido de fresa.\n\nPara detener la máquina traviesa, debes teclear la clave secreta con precisión absoluta antes de que el laboratorio quede cubierto de chocolate caliente.",

    "Una carrera de unicornios con propulsores a reacción está a punto de comenzar en el Gran Cañón de la Luna Roja.\n\nLos jueces espaciales están asombrados por la increíble agilidad con la que los pequeños pilotos sortean los asteroides de colores y los anillos de Saturno.\n\n¡Acelera a toda potencia, activa el turbo de tus dedos y cruza la línea de meta para levantar el gran trofeo de campeón de la galaxia!"
  ]
};
