import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import fs from 'fs';
import path from 'path';

const PHRASES = [
  { id: 'welcome', text: '¡Hola, supermecanógrafo! Soy Roby, tu compañero de aventuras. ¡Vamos a aprender jugando!' },
  { id: 'hand_position', text: 'Coloca tus dedos índices en las teclas F y J. Tienen pequeñas marcas para descansar las manos.' },
  { id: 'error_cheer_1', text: '¡No te preocupes! Equivocarse es el truco secreto para aprender. ¡Sigue así!' },
  { id: 'error_cheer_2', text: '¡Respira hondo y busca la tecla iluminada! ¡Tú tienes superpoderes!' },
  { id: 'streak_10', text: '¡Increíble racha de diez aciertos! ¡Tus dedos se mueven como el viento!' },
  { id: 'streak_20', text: '¡Sensacional! ¡Veinte aciertos seguidos! ¡Estás en modo súper estrella!' },
  { id: 'level_complete_3stars', text: '¡Misión cumplida! ¡Tres estrellas perfectas! ¡Choca esos cinco!' },
  { id: 'level_complete_2stars', text: '¡Muy bien hecho! ¡Has superado el desafío con dos estrellas fantásticas!' },
  { id: 'level_complete_1star', text: '¡Bien jugado! ¡Has completado el nivel! ¡Cada día eres más rápido!' },
  { id: 'high_five', text: '¡Choca esos cinco! ¡Pulsa la barra espaciadora para celebrar!' }
];

const OUTPUT_DIR = path.resolve('assets/audio/voices');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function generateAll() {
  console.log(`Starting neural audio generation for ${PHRASES.length} phrases...`);
  const tts = new MsEdgeTTS();
  await tts.setMetadata('es-ES-AlvaroNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const manifest = {
    voice: 'es-ES-AlvaroNeural',
    generatedAt: new Date().toISOString(),
    phrases: {}
  };

  const tempFolder = path.resolve('temp_tts_gen');
  fs.mkdirSync(tempFolder, { recursive: true });

  for (const item of PHRASES) {
    console.log(`Generating "${item.id}"...`);
    await tts.toFile(tempFolder, item.text);
    const generatedFile = path.join(tempFolder, 'audio.mp3');
    const targetFile = path.join(OUTPUT_DIR, `${item.id}.mp3`);
    fs.copyFileSync(generatedFile, targetFile);
    fs.unlinkSync(generatedFile);

    manifest.phrases[item.id] = {
      file: `assets/audio/voices/${item.id}.mp3`,
      text: item.text,
      durationMs: 0
    };
    console.log(`✓ Saved ${item.id}.mp3`);
  }

  try {
    fs.rmdirSync(tempFolder);
  } catch (_) {}

  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✓ Saved manifest to ${manifestPath}`);
  tts.close();
}

generateAll().catch(err => {
  console.error('TTS Generation failed:', err);
  process.exit(1);
});
