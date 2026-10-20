# Guía de Vídeos Introductorios para Mecano

Esta carpeta `assets/videos/` está reservada para los clips de vídeo MP4 explicativos que los niños verán antes de comenzar cada lección o nivel.

---

## 📁 Nomenclatura de Archivos Soportada

El motor del juego busca automáticamente los vídeos en este orden de prioridad:

### 1. Por Sublección Específica (Recomendado):
- `intro_1_1.mp4` -> Vídeo de la Lección 1.1 (Índice izquierdo - F)
- `intro_1_2.mp4` -> Vídeo de la Lección 1.2 (Índice derecho - J)
- `intro_1_3.mp4` -> Vídeo de la Lección 1.3 (Fila guía - F y J)
- ...
- `intro_X_Y.mp4` -> Vídeo del Nivel X, Lección Y.

### 2. Por Nivel General (Fallback si no hay vídeo de sublección):
- `intro_level_1.mp4` -> Vídeo general del Nivel 1
- `intro_level_2.mp4` -> Vídeo general del Nivel 2
- ...
- `intro_level_8.mp4` -> Vídeo general del Nivel 8

---

## 🎬 Especificaciones Técnicas Recomendadas

- **Formato contenedor:** `.mp4` (o `.webm`)
- **Códec de vídeo:** H.264 / AVC (máxima compatibilidad en navegadores)
- **Códec de audio:** AAC estéreo (o mudo)
- **Resolución sugerida:** `1280x720` (720p) o `1920x1080` (1080p), relación de aspecto `16:9`
- **Tasa de fotogramas (FPS):** 30 fps o 60 fps
- **Duración ideal para niños:** Entre 5 y 20 segundos por lección (muestra breve de la postura de las manos y el dedo pulsando la tecla física).

---

## 🚀 Comportamiento en el Juego

1. Si el archivo MP4 existe en esta carpeta, se abrirá la ventana emergente con el reproductor de vídeo integrado antes de empezar la lección.
2. El niño/a puede pulsar **[Espacio]**, **[Enter]** o el botón **"¡Empezar a Escribir!"** para saltar el vídeo en cualquier momento.
3. Si el archivo no existe, el juego arranca la lección de inmediato sin mostrar ningún error.
4. En cualquier momento de la partida se puede pulsar el botón **"🎬 Vídeo Intro"** situado en la cabecera para volver a ver la explicación.
