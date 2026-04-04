from PIL import Image
import math

INPUT_FILE = r"E:\juego mecano\assets\robot_error.png"
OUTPUT_FILE = r"E:\juego mecano\assets\robot_error.png"

# Ajusta estos valores si hace falta
COLOR_TOLERANCE = 55
ALPHA_SOFT = True

def color_distance(c1, c2):
    return math.sqrt(
        (c1[0] - c2[0]) ** 2 +
        (c1[1] - c2[1]) ** 2 +
        (c1[2] - c2[2]) ** 2
    )

def average_colors(colors):
    r = sum(c[0] for c in colors) / len(colors)
    g = sum(c[1] for c in colors) / len(colors)
    b = sum(c[2] for c in colors) / len(colors)
    return (r, g, b)

img = Image.open(INPUT_FILE).convert("RGBA")
pixels = img.load()
width, height = img.size

# Tomamos muestras de las esquinas, asumiendo que ahí hay fondo
sample_points = [
    pixels[5, 5][:3],
    pixels[width - 6, 5][:3],
    pixels[5, height - 6][:3],
    pixels[width - 6, height - 6][:3],
    pixels[width // 2, 5][:3],
    pixels[width // 2, height - 6][:3],
]

bg_color = average_colors(sample_points)

new_img = Image.new("RGBA", (width, height))
new_pixels = new_img.load()

for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        dist = color_distance((r, g, b), bg_color)

        if dist < COLOR_TOLERANCE:
            # fondo casi seguro
            new_pixels[x, y] = (r, g, b, 0)
        elif ALPHA_SOFT and dist < COLOR_TOLERANCE + 25:
            # borde suave para evitar recortes bruscos
            alpha = int(255 * (dist - COLOR_TOLERANCE) / 25)
            alpha = max(0, min(255, alpha))
            new_pixels[x, y] = (r, g, b, alpha)
        else:
            new_pixels[x, y] = (r, g, b, 255)

new_img.save(OUTPUT_FILE, "PNG")
print(f"Imagen guardada en: {OUTPUT_FILE}")
print(f"Color de fondo detectado: {bg_color}")