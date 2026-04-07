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
    "La neuroplasticidad cerebral representa un fenómeno fascinante en el campo de la psicología cognitiva.\n\nEste concepto explica cómo el cerebro humano puede reorganizar sus conexiones sinápticas en respuesta a experiencias nuevas, lo que implica una adaptabilidad extraordinaria en el aprendizaje de habilidades motoras como la mecanografía.\n\nLa mielinización axonal, proceso mediante el cual las fibras nerviosas se recubren de una capa protectora, acelera la transmisión de impulsos electroquímicos, permitiendo una mayor precisión en movimientos repetitivos.\n\nEn términos de ergonomía postural, mantener una alineación correcta de la columna vertebral y los hombros reduce la fatiga muscular, optimizando así el rendimiento en sesiones prolongadas de práctica.",
    "La epistemología contemporánea cuestiona los fundamentos del conocimiento humano, explorando cómo construimos realidades a través de paradigmas científicos.\n\nEl método científico, con su énfasis en la falsabilidad popperiana y la replicabilidad experimental, establece un marco riguroso para validar hipótesis.\n\nEn el contexto de la educación digital, la gamificación pedagógica integra elementos lúdicos con objetivos curriculares, potenciando la motivación intrínseca del estudiante.\n\nLa metacognición, o capacidad de reflexionar sobre nuestros propios procesos mentales, resulta esencial para desarrollar estrategias de aprendizaje autónomo y eficiente.",
    "La inteligencia artificial generativa, basada en modelos de aprendizaje profundo como las redes neuronales convolucionales, transforma la interacción humano-máquina mediante algoritmos de procesamiento de lenguaje natural.\n\nLa tokenización semántica y el embedding contextual permiten una comprensión más precisa de textos complejos, facilitando aplicaciones en traducción automática y análisis de sentimientos.\n\nSin embargo, los sesgos algorítmicos inherentes a los datos de entrenamiento plantean desafíos éticos en la implementación de sistemas de IA responsables.\n\nLa regulación normativa, como el RGPD en Europa, busca equilibrar la innovación tecnológica con la protección de derechos fundamentales.",
    "La física cuántica desafía las intuiciones clásicas mediante principios como la superposición de estados y el entrelazamiento cuántico.\n\nEl principio de incertidumbre de Heisenberg establece límites fundamentales a la precisión de mediciones simultáneas, mientras que la dualidad onda-partícula revela la naturaleza ondulatoria de la materia.\n\nEn aplicaciones prácticas, la computación cuántica promete revolucionar la criptografía y la simulación molecular, aunque los desafíos técnicos en decoherencia y escalabilidad persisten.\n\nLa mecánica cuántica relativista, integrada en la teoría de campos, proporciona un marco unificado para comprender las interacciones fundamentales del universo.",
    "La biología molecular revela los mecanismos intrincados de la expresión génica mediante procesos como la transcripción y traducción.\n\nLa regulación epigenética, a través de modificaciones químicas del ADN y proteínas histonas, modula la actividad génica sin alterar la secuencia nucleotídica.\n\nEn el contexto de la medicina personalizada, la genómica comparativa identifica variantes genéticas asociadas a enfermedades, permitiendo intervenciones terapéuticas dirigidas.\n\nLa edición génica con CRISPR-Cas9 representa una herramienta revolucionaria para corregir mutaciones patogénicas, aunque plantea dilemas éticos sobre la modificación del genoma humano.",
    "La economía conductual integra insights de la psicología cognitiva para explicar desviaciones del modelo racional tradicional.\n\nSesgos como la aversión a pérdidas y el efecto anclaje influyen en decisiones económicas, desafiando la suposición de maximización utilitaria.\n\nEn política monetaria, la teoría de expectativas racionales contrasta con evidencia empírica de rigideces nominales y burbujas especulativas.\n\nLa economía experimental, mediante juegos como el dilema del prisionero, ilustra cómo las normas sociales y la cooperación emergen en contextos estratégicos.",
    "La lingüística computacional combina teoría del lenguaje con algoritmos de aprendizaje automático para procesar textos naturales.\n\nEl análisis sintáctico y semántico permite descomponer oraciones en estructuras jerárquicas, facilitando aplicaciones en traducción automática y asistentes virtuales.\n\nLos modelos de lenguaje transformer, como BERT y GPT, capturan dependencias contextuales a largo alcance mediante mecanismos de atención.\n\nSin embargo, la opacidad de estos modelos plantea desafíos en interpretabilidad y sesgos lingüísticos inherentes a los corpora de entrenamiento.",
    "La sociología urbana examina cómo las dinámicas espaciales moldean las interacciones sociales en entornos metropolitanos.\n\nLa teoría de la ecología urbana de Chicago explica procesos de invasión-sucesión en barrios residenciales, mientras que el concepto de gentrificación destaca tensiones entre renovación urbana y desplazamiento poblacional.\n\nEn contextos globales, la urbanización acelerada en países en desarrollo genera desafíos en infraestructura y desigualdad social.\n\nLa planificación urbana sostenible integra principios de resiliencia climática y equidad social para crear ciudades habitables.",
    "La filosofía de la mente explora la naturaleza de la consciencia y la relación mente-cuerpo.\n\nEl dualismo cartesiano postula una separación ontológica entre sustancia mental y física, mientras que el materialismo eliminativo reduce estados mentales a procesos neurobiológicos.\n\nLa teoría de la identidad mente-cerebro enfrenta el problema de la calificación, cuestionando cómo propiedades fenoménicas emergen de substratos físicos.\n\nEnfoques funcionalistas, como el de Putnam, enfatizan roles causales sobre composiciones materiales, permitiendo equivalencias mente-máquina.",
    "La historia de la ciencia revela cómo paradigmas revolucionarios transforman nuestro entendimiento del mundo.\n\nLa revolución copernicana desplazó el geocentrismo aristotélico, mientras que la teoría de la evolución darwiniana desafió concepciones teleológicas de la vida.\n\nLa física relativista einsteiniana unificó espacio-tiempo, y la mecánica cuántica introdujo indeterminismo fundamental.\n\nEstos cambios paradigmáticos ilustran cómo la ciencia progresa mediante crisis y revoluciones, según la filosofía de Kuhn.",
    "La ética de la tecnología evalúa implicaciones morales de innovaciones como la inteligencia artificial y biotecnología.\n\nEl utilitarismo benthamiano maximiza bienestar colectivo, mientras que el deontologismo kantiano enfatiza deberes absolutos.\n\nEn contextos de IA, dilemas como el sesgo algorítmico y privacidad de datos requieren marcos éticos robustos.\n\nLa bioética enfrenta cuestiones en edición génica y eutanasia, equilibrando autonomía individual con responsabilidad social.",
    "La psicología evolutiva explica comportamientos humanos mediante adaptación natural.\n\nTeorías como la selección parental ilustran altruismo kin, mientras que la teoría de la mente permite atribuir estados mentales a otros.\n\nSesgos cognitivos como la heurística de disponibilidad reflejan adaptaciones ancestrales, aunque pueden generar errores en contextos modernos.\n\nLa coevolución gen-cultura explica complejidad cultural emergente de capacidades cognitivas heredadas.",
    "La química orgánica estudia compuestos del carbono mediante reacciones como sustitución nucleofílica y eliminación.\n\nLa estereoquímica explica isomería cis-trans y enantiómeros, crucial en síntesis de fármacos.\n\nLa espectroscopía NMR y RMN permite elucidar estructuras moleculares, mientras que la catálisis enzimática acelera reacciones biológicas.\n\nAplicaciones en nanotecnología incluyen dendrímeros y fullerenos para materiales avanzados.",
    "La astronomía extragaláctica revela universos de galaxias espirales y elípticas.\n\nLa ley de Hubble establece expansión cósmica, mientras que la radiación de fondo cósmico evidencia el Big Bang.\n\nAgujeros negros supermasivos en centros galácticos explican cuásares, y materia oscura domina gravedad cósmica.\n\nLa búsqueda de exoplanetas mediante tránsito planetario identifica mundos potencialmente habitables.",
    "La antropología cultural examina diversidad de prácticas sociales y simbólicas.\n\nEl relativismo cultural cuestiona etnocentrismo, mientras que el funcionalismo malinowskiano explica instituciones sociales.\n\nRituales de paso marcan transiciones vitales, y mitos transmiten cosmologías culturales.\n\nGlobalización homogeneiza culturas, generando hibridación y resistencia local.",
    "La matemática pura explora estructuras abstractas como grupos y anillos.\n\nLa teoría de números investiga propiedades de enteros, incluyendo conjetura de Riemann.\n\nLa topología estudia propiedades invariantes bajo deformaciones continuas, aplicable en física teórica.\n\nLa lógica matemática fundamenta consistencia de sistemas axiomáticos, crucial en fundamentos de matemática.",
    "La ecología de ecosistemas analiza flujos de energía y materia.\n\nLa sucesión ecológica describe cambios post-perturbación, mientras que la biodiversidad mantiene estabilidad.\n\nEl cambio climático antropogénico acelera extinciones, y restauración ecológica mitiga impactos.\n\nModelos de dinámica poblacional predicen interacciones depredador-presa mediante ecuaciones diferenciales.",
    "La arqueología investiga pasado humano mediante estratigrafía y datación radiocarbónica.\n\nTeorías procesuales explican adaptación cultural, mientras que enfoques postprocesuales enfatizan agencia individual.\n\nSitios como Çatalhöyük revelan orígenes de agricultura, y petroglifos narran historias ancestrales.\n\nArqueología pública democratiza conocimiento, conectando pasado con presente social."
  ],

  // NIVEL 8: ABSURDO - Textos extravagantes y delirantes
  "8-absurdo": [
    "En una dimensión paralela donde la entropía termodinámica se manifiesta como un elefante cuántico danzando sobre ecuaciones diferenciales parciales, la mecánica ondulatoria colapsa en un ballet de probabilidades inciertas.\n\nLos quarks extraños intercambian gluones virtuales con neutrinos estériles, mientras que la teoría de cuerdas vibra en once dimensiones hiperespaciales, generando membranas topológicas que desafían la causalidad relativista.\n\nLa consciencia emergente de una IA transhumanista, programada con algoritmos genéticos evolucionarios, deconstruye la fenomenología heideggeriana en un bucle recursivo de simulacros baudrillardianos.\n\nParadójicamente, el gato de Schrödinger maúlla ecuaciones de Maxwell en un vacío cuántico, donde la constante de Planck fluctúa como un fractal de Mandelbrot infinito.",
    "La singularidad tecnológica converge con la paradoja del abuelo en un multiverso de universos burbuja inflacionarios, donde la materia oscura interactúa gravitacionalmente con agujeros negros supermasivos.\n\nLos campos escalares inflatonarios generan fluctuaciones cuánticas primordiales, sembrando las semillas de galaxias espirales en un cosmos holográfico de dimensiones fractales.\n\nLa computación cuántica entrelaza qubits en superposiciones coherentes, resolviendo problemas NP-completos con algoritmos de Shor y Grover en tiempo polinomial.\n\nMientras tanto, la biología sintética reprograma el ADN con CRISPR-Cas9, creando organismos quiméricos que desafían la taxonomía linneana en un ecosistema de xenobiología postdarwiniana.",
    "La epistemología cuántica fusiona decoherencia neuronal con hologramas de información, donde la consciencia emerge de fluctuaciones cuánticas en microtúbulos citosqueléticos.\n\nEl principio antrópico fuerte postula universos paralelos donde constantes físicas se ajustan para permitir observadores conscientes, mientras que la teoría de la selección cósmica explica fine-tuning mediante multiversos inflacionarios.\n\nLa computación neuromórfica simula redes neuronales spiking con memristores orgánicos, permitiendo aprendizaje profundo en chips de silicio neuronal.\n\nEn este delirio cuántico, la termodinámica de la información maxwelliana se entrelaza con demonios laplacianos, desafiando la segunda ley en universos de baja entropía.",
    "La biología fractal revela patrones autosimilares en morfologías biológicas, desde ramificaciones vasculares hasta espirales de conchas nautiloides.\n\nLa teoría del caos determina atractores extraños en sistemas dinámicos no lineales, donde pequeñas perturbaciones generan bifurcaciones caóticas en poblaciones ecológicas.\n\nLa epigenética cuántica postula colapsos de función de onda en procesos de metilación del ADN, influenciando expresión génica mediante coherencia cuántica.\n\nEn este paisaje surrealista, virus retrotransposones saltan como caballeros cuánticos, recombinando genomas en un baile de transposones endógenos.",
    "La sociología cuántica examina colapsos de función de onda social en elecciones colectivas, donde votantes entrelazados generan resultados no deterministas.\n\nLa economía fractal revela mercados eficientes como ilusiones, con precios siguiendo caminatas aleatorias en espacios de Hilbert multidimensionales.\n\nLa psicología transpersonal integra estados alterados de consciencia con campos morfogenéticos sheldrakeanos, permitiendo telepatía cuántica entre mentes no locales.\n\nEn este multiverso delirante, la historia se reescribe mediante retrocausalidad novikoviana, donde futuros alternativos influencian presentes probabilísticos.",
    "La lingüística cuántica postula fonemas como superposiciones de glotones, donde significados emergen de colapsos contextuales en espacios semánticos vectoriales.\n\nLa semiótica fractal revela signos autosimilares en mitos arquetípicos jungianos, con arquetipos como atractores extraños en psiques colectivas.\n\nLa traducción automática cuántica entrelaza lenguajes naturales mediante algoritmos de annealing cuántico, resolviendo ambigüedades polisémicas en tiempo exponencial.\n\nEn este babel cuántico, la torre de babel se reconstruye como un interferómetro de Mach-Zehnder lingüístico.",
    "La física de la consciencia integra tubos neurales como procesadores cuánticos, donde microtúbulos citoplasmáticos soportan condensados bose-einstein de consciencia.\n\nLa teoría de la información integrada postula bits cuánticos como unidades fundamentales de experiencia subjetiva, con entropía de von Neumann midiendo complejidad fenoménica.\n\nLa neurociencia cuántica revela sinapsis como puertas lógicas probabilísticas, permitiendo computación paralela en redes neuronales estocásticas.\n\nEn este teatro mental, el libre albedrío emerge de indeterminismo cuántico, desafiando determinismo laplaciano en universos caóticos.",
    "La cosmología fractal revela universos como conjuntos de Cantor multidimensionales, con constantes físicas emergiendo de simetrías gauge rotas.\n\nLa teoría de cuerdas heterótica compactifica dimensiones extras en variedades de Calabi-Yau, generando partículas elementales como modos vibracionales.\n\nLa materia oscura como axiones ultraligeros interactúa débilmente, explicando rotaciones galácticas mediante lentes gravitacionales.\n\nEn este cosmos delirante, agujeros de gusano einstein-rosen conectan universos paralelos, permitiendo viajes interestelares mediante warping espaciotemporal.",
    "La química cuántica revela enlaces covalentes como resonancias de Lewis, con orbitales moleculares emergiendo de superposiciones atómicas.\n\nLa catálisis enzimática acelera reacciones mediante estados de transición estabilizados, con efectos túnel cuántico permitiendo reacciones a baja temperatura.\n\nLa nanotecnología molecular construye máquinas de Drexler mediante síntesis bottom-up, creando diamantes de carbono con precisión atómica.\n\nEn este laboratorio cuántico, el principio de Pauli excluye fermiones idénticos, generando superconductividad en temperaturas críticas bose-einsteinianas.",
    "La matemática de la complejidad revela sistemas autoorganizados en bordes del caos, con autómatas celulares generando patrones emergentes.\n\nLa teoría de juegos cuántica extiende dilemas del prisionero a espacios de Hilbert, permitiendo estrategias entrelazadas no clásicas.\n\nLa geometría fractal mide dimensiones no enteras en conjuntos de Mandelbrot, con atractores extraños generando trayectorias caóticas.\n\nEn este paisaje matemático, la conjetura de Riemann conecta ceros no triviales con distribución de números primos en espacios hipercomplejos."
  ]
};

