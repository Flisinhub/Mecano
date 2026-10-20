#!/usr/bin/env python3
"""
generate_voices.py - Neural TTS voice generation for Mecano using edge-tts.
Generates high-definition MP3 files for Roby's fixed phrases with AlvaroNeural (+2Hz pitch, +3% rate).
"""

import asyncio
import json
import os
import sys

try:
    import edge_tts
except ImportError:
    print("Error: edge-tts is not installed. Please run: pip install edge-tts", file=sys.stderr)
    sys.exit(1)

VOICE = "es-ES-AlvaroNeural"
PITCH = "+2Hz"
RATE = "+3%"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "audio", "voices")

PHRASES = [
    {"id": "welcome", "text": "¡Hola, supermecanógrafo! Soy Roby, tu compañero de aventuras. ¡Vamos a aprender jugando!"},
    {"id": "hand_position", "text": "Coloca tus dedos índices en las teclas F y J. Tienen pequeñas marcas para descansar las manos."},
    {"id": "error_cheer_1", "text": "¡No te preocupes! Equivocarse es el truco secreto para aprender. ¡Sigue así!"},
    {"id": "error_cheer_2", "text": "¡Respira hondo y busca la tecla iluminada! ¡Tú tienes superpoderes!"},
    {"id": "streak_10", "text": "¡Increíble racha de diez aciertos! ¡Tus dedos se mueven como el viento!"},
    {"id": "streak_20", "text": "¡Sensacional! ¡Veinte aciertos seguidos! ¡Estás en modo súper estrella!"},
    {"id": "level_complete_3stars", "text": "¡Misión cumplida! ¡Tres estrellas perfectas! ¡Choca esos cinco!"},
    {"id": "level_complete_2stars", "text": "¡Muy bien hecho! ¡Has superado el desafío con dos estrellas fantásticas!"},
    {"id": "level_complete_1star", "text": "¡Bien jugado! ¡Has completado el nivel! ¡Cada día eres más rápido!"},
    {"id": "high_five", "text": "¡Choca esos cinco! ¡Pulsa la barra espaciadora para celebrar!"}
]

async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    manifest = {
        "voice": VOICE,
        "pitch": PITCH,
        "rate": RATE,
        "phrases": {}
    }

    for item in PHRASES:
        out_path = os.path.join(OUTPUT_DIR, f"{item['id']}.mp3")
        print(f"Generating: {item['id']} -> {out_path}")
        communicate = edge_tts.Communicate(item["text"], voice=VOICE, pitch=PITCH, rate=RATE)
        await communicate.save(out_path)
        manifest["phrases"][item["id"]] = {
            "file": f"assets/audio/voices/{item['id']}.mp3",
            "text": item["text"]
        }

    manifest_path = os.path.join(OUTPUT_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"✓ All voices generated. Manifest saved at: {manifest_path}")

if __name__ == "__main__":
    asyncio.run(main())
