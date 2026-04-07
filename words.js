// Nueva estructura: 8 niveles sin sub-niveles
// Cada nivel tiene su propio tipo de contenido específico

const WORD_LIST = {
  // NIVEL 1: INFANTIL - Palabras simples 3-5 letras, sin acentos
  "1-infantil": [
    "sol", "luz", "pez", "pan", "mar", "oso", "uva", "flor", "gato", "luna",
    "mesa", "pato", "casa", "bota", "mano", "nube", "tren", "rana", "dedo", "queso",
    "pera", "moto", "vaca", "loro", "pino", "nido", "lago", "roca", "cola", "dado",
    "tasa", "vela", "sopa", "tasa", "omo", "fino", "humo", "nene", "papa", "mama",
    "pelo", "cola", "pata", "rama", "tema", "nota", "lama", "mina", "puma", "seda"
  ],

  // NIVEL 2: BASICO - Palabras 5-8 letras con algún acento
  "2-basico": [
    "perro", "pelota", "ratón", "amigo", "nariz", "silla", "puerta", "coche", "leche", "rosa",
    "verde", "conejo", "colegio", "escuela", "banana", "abuelo", "abuela", "hermano", "hermana", "profesor",
    "palabra", "tierra", "cielo", "pájaro", "caballo", "elefante", "jirafa", "tigre", "ballena", "delfín",
    "computadora", "teléfono", "ventana", "lámpara", "espejo", "sofá", "tapete", "fábula", "película", "música"
  ],

  // NIVEL 3: PRINCIPIANTE - Frases cortas simples
  "3-principiante": [
    "la casa es bonita",
    "quiero jugar fuera",
    "me gusta pintar flores",
    "el perro corre mucho",
    "mi amiga canta bien",
    "la luna brilla hoy",
    "vamos al parque",
    "el gato duerme aqui",
    "mi mama hace sopa",
    "el oso come miel",
    "los ninos juegan felices",
    "la maestra lee cuentos",
    "me duele la cabeza",
    "tengo hambre ahora",
    "el cafe esta caliente",
    "la nieve es blanca",
    "el sol calienta mucho",
    "los pajaros cantan bonito",
    "mi amigo es muy simpatico",
    "la flor huele muy bien"
  ],

  // NIVEL 4: INTERMEDIO - Frases medianas con puntuación
  "4-intermedio": [
    "hoy llevamos cuentos al cole.",
    "mi mochila tiene lápices nuevos.",
    "el pato nada en el agua.",
    "me gusta saltar en el patio.",
    "mi hermano juega con bloques.",
    "la maestra sonríe al entrar.",
    "la pelota rueda por el suelo.",
    "mi abuelo lee muy despacio.",
    "esta noche vamos al cine.",
    "en la escuela aprendemos muchas cosas.",
    "los gatos duermen en el sofá.",
    "mi tia trabaja en un hospital.",
    "el viaje fue largo pero agradable.",
    "el helado de chocolate es mi favorito.",
    "en verano vamos a la playa.",
    "llueve mucho en primavera.",
    "las flores del jardín son hermosas.",
    "el tren sale a las ocho.",
    "mi primo vive muy lejos.",
    "la pizzería está cerca de casa."
  ],

  // NIVEL 5: AVANZADO - Textos medianos con variedad de puntuación
  "5-avanzado": [
    "escribir con calma ayuda a cometer menos errores.",
    "cuando practico un poco cada día mejoro bastante.",
    "las palabras cortas son una buena forma de empezar.",
    "el teclado parece difícil al principio, pero luego mejora.",
    "una sonrisa hace que aprender sea mucho más divertido.",
    "si me concentro puedo encontrar mejor cada letra.",
    "hoy he escrito varias palabras sin mirar tanto las manos.",
    "mi objetivo no es correr sino escribir bien y sentirme segura.",
    "poco a poco puedo reconocer mejor donde esta cada letra.",
    "la paciencia me ayuda a terminar frases más largas.",
    "esta tarde iremos todos juntos al parque.",
    "mi conejo pequeño corre por el jardín.",
    "en clase pintamos nubes azules y soles grandes.",
    "mi amiga trae galletas para compartir conmigo.",
    "cada día aprendo letras nuevas con calma.",
    "la tortuga camina lenta pero siempre avanza.",
    "en las montañas hace más frío que en la ciudad.",
    "los libros nos enseñan historias fascinantes.",
    "mi hermana compró un vestido rojo muy bonito.",
    "por la mañana desayuno leche con cereales."
  ],

  // NIVEL 6: EXPERTO - Textos largos y complejos con puntuación intermedia
  "6-experto": [
    "La práctica constante suele dar mejores resultados que intentar correr demasiado desde el principio.",
    "Escribir con precisión ayuda a desarrollar confianza y reduce la frustración durante el aprendizaje.",
    "Un teclado deja de parecer extraño cuando repetimos movimientos pequeños muchas veces.",
    "Cada sesión corta puede convertirse en una pequeña aventura si el juego responde de forma amable y clara.",
    "La mecanografía mejora cuando combinamos atención, constancia y una dificultad ajustada al momento.",
    "Aprender despacio no significa avanzar poco; muchas veces significa avanzar mejor.",
    "Si una niña se siente tranquila, curiosa y capaz, es mucho más probable que quiera volver a practicar mañana.",
    "Un buen juego educativo no solo mide errores y velocidad, también crea motivación y sensación de progreso.",
    "A veces mejorar consiste simplemente en escribir con menos tensión y con un poco más de control.",
    "Cuando respiro con calma y miro bien el texto me equivoco menos y avanzo mejor.",
    "Cada nivel nuevo me ayuda a recordar donde están las letras y a ganar confianza.",
    "Aprender jugando hace que el teclado parezca menos difícil y mucho más divertido.",
    "Si mantengo un ritmo tranquilo puedo completar frases largas sin agobiarme.",
    "Los libros son ventanas al mundo que nos permiten explorar lugares nuevos.",
    "La música clásica ayuda a concentrarse mejor mientras realizamos actividades importantes.",
    "Los animales salvajes merecen respeto y protección en sus hábitats naturales.",
    "El deporte es fundamental para mantener una buena salud física y mental.",
    "La amistad verdadera se basa en la confianza, el respeto y la sinceridad.",
    "Viajar amplía la mente y nos enseña a entender mejor a otras culturas.",
    "La lectura habitual mejora nuestro vocabulario y nuestra forma de expresarnos."
  ],

  // NIVEL 7: MAESTRIA - Textos muy largos con estructura compleja
  "7-maestria": [
    "Hoy el objetivo consiste en mantener la concentración, respirar con calma y escribir cada palabra con intención.",
    "Las frases largas obligan a sostener la atención durante más tiempo y ayudan a interiorizar mejor el teclado.",
    "Practicar con textos amplios permite notar mejor el ritmo, la lectura y la colocación de las manos.",
    "A veces confundimos velocidad con dominio, pero el dominio real aparece cuando los dedos encuentran cada tecla con seguridad.",
    "El progreso auténtico se nota cuando ya no pensamos solo en la siguiente letra, sino también en el ritmo general de la frase.",
    "Cuando una persona gana soltura, empieza a leer, anticipar y escribir casi como si todo fuera una sola acción continua.",
    "Practicar mecanografía puede parecer una tarea técnica, pero en realidad también entrena paciencia, observación y constancia.",
    "Cuando el nivel sube, no basta con reaccionar rápido: también hace falta mantener una lectura estable y una escritura limpia.",
    "En textos largos se vuelve importante dosificar la atención para no perder el hilo y seguir escribiendo con fluidez.",
    "La educación es la herramienta más poderosa que tenemos para cambiar el mundo y crear un futuro mejor para todos.",
    "La tecnología ha transformado fundamentalmente la manera en que nos comunicamos, trabajamos y aprendemos en la sociedad actual.",
    "El cambio climático representa uno de los desafíos más importantes que enfrentará la humanidad en los próximos años.",
    "La importancia de desarrollar habilidades de pensamiento crítico y análisis en la era de la información es fundamental.",
    "La colaboración internacional es esencial para resolver los grandes problemas globales que afectan a toda la humanidad.",
    "La historia nos enseña lecciones valiosas sobre errores pasados para evitarlos en el presente y futuro.",
    "La diversidad cultural enriquece nuestras sociedades y nos permite aprender unos de otros de manera significativa.",
    "El arte en todas sus formas es una expresión fundamental de la creatividad y la identidad humana.",
    "La perseverancia y la dedicación son más importantes que el talento natural para lograr cualquier objetivo."
  ],

  // NIVEL 8: ABSURDO - Textos extravagantes y delirantes
  "8-absurdo": [
    "En una tarde improbable, el pequeño zorro bibliotecario decidió clasificar galaxias de plastilina mientras una orquesta de teclados invisibles interpretaba melodías imposibles junto al pupitre.",
    "La brújula del aula apuntaba misteriosamente hacia una montaña de sílabas perdidas, donde cada error ortográfico despertaba a un pingüino filósofo con gafas de color naranja.",
    "Si alguien consigue escribir este texto completo sin desesperarse, probablemente merezca una medalla, una limonada fría y un castillo hinchable aparcado justo en medio del salón principal.",
    "La dificultad absurda no pretende ser razonable, sino convertir la mecanografía en una expedición delirante llena de frases larguísimas, pausas mínimas y decisiones lingüísticas un poco temerarias.",
    "Mientras las nubes discutían sobre gramática avanzada, una bicicleta anfibia cruzó la biblioteca municipal transportando diccionarios interplanetarios, croquetas luminosas y un mapa secreto.",
    "Este nivel existe únicamente para quienes sienten una necesidad profundamente sospechosa de enfrentarse a textos interminables, extravagantes y casi cómicamente excesivos.",
    "Los elefantes voladores decidieron celebrar una fiesta de cumpleaños en la estación espacial utilizando únicamente ingredientes invisibles y recetas medievales.",
    "Un pulpo contable se perdió en el supermercado buscando tinta ultravioleta para rellenar documentos que solo existían en dimensiones alternativas.",
    "La sinfonía de los calcetines huérfanos resonaba a través de los pasillos del museo de cosas raras donde los tiburones practicaban ballet acuático.",
    "Cuando la inteligencia artificial aprendió a cantar ópera en idioma de pingüinos, todo el universo conocido se convirtió en una partida de ajedrez jugada por gatos dormilones."
  ]
};

