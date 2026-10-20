#!/usr/bin/env python3
"""
scripts/remove_mascot_bg.py
Processes the 4 Pixar mascot sprites in assets/mascot/ to convert the outer dark slate
background (#0F172A) into true alpha transparency (RGBA, Alpha = 0).

Uses a 4-corner seed flood-fill with color-distance tolerance and edge feathering,
preserving interior dark elements (like the robot's dark eye visor and screens).
"""

import os
from collections import deque
from PIL import Image

MASCOT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "mascot")
FILES = [
    "mascot_idle.png",
    "mascot_speaking.png",
    "mascot_streak.png",
    "mascot_error.png"
]

def remove_background(image_path, tolerance=32, feather_radius=2):
    print(f"Processing {os.path.basename(image_path)}...")
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # Sample background color from 4 corners
    corners = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    corner_colors = [pixels[x, y][:3] for x, y in corners]
    avg_bg = tuple(sum(c[i] for c in corner_colors) // 4 for i in range(3))
    print(f"  Sampled background color (RGB): {avg_bg}")

    # Color distance function
    def color_dist(c1, c2):
        return ((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2) ** 0.5

    # BFS Flood-Fill from corners to mark outer background
    visited = bytearray(width * height)
    is_bg = bytearray(width * height)
    queue = deque()

    for cx, cy in corners:
        idx = cy * width + cx
        if not visited[idx]:
            visited[idx] = 1
            queue.append((cx, cy))

    while queue:
        x, y = queue.popleft()
        idx = y * width + x
        cur_rgb = pixels[x, y][:3]
        dist = color_dist(cur_rgb, avg_bg)

        # Also compare to corner colors if gradient exists
        min_corner_dist = min(color_dist(cur_rgb, cc) for cc in corner_colors)
        effective_dist = min(dist, min_corner_dist)

        if effective_dist <= tolerance:
            is_bg[idx] = 1
            # Add 4-directional neighbors
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < width and 0 <= ny < height:
                    nidx = ny * width + nx
                    if not visited[nidx]:
                        visited[nidx] = 1
                        queue.append((nx, ny))

    # Apply transparency and soft edge feathering
    for y in range(height):
        for x in range(width):
            idx = y * width + x
            if is_bg[idx]:
                r, g, b, _ = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)
            else:
                # Check for feathering if adjacent to background
                has_bg_neighbor = False
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height and is_bg[ny * width + nx]:
                        has_bg_neighbor = True
                        break
                if has_bg_neighbor:
                    cur_rgb = pixels[x, y][:3]
                    dist = min(color_dist(cur_rgb, cc) for cc in corner_colors)
                    if dist < tolerance * 1.5:
                        # Soft alpha transition
                        alpha = int(255 * max(0.1, min(1.0, (dist - tolerance * 0.5) / tolerance)))
                        r, g, b, _ = pixels[x, y]
                        pixels[x, y] = (r, g, b, alpha)

    # Save as PNG RGBA
    img.save(image_path, "PNG", optimize=True)
    print(f"  Saved {image_path} with Alpha channel.")

def main():
    for filename in FILES:
        full_path = os.path.join(MASCOT_DIR, filename)
        if os.path.exists(full_path):
            remove_background(full_path)
        else:
            print(f"Warning: {filename} not found at {full_path}")

if __name__ == "__main__":
    main()
