#!/usr/bin/env python3
"""
Genera spritesheets pixel-art para el juego Puntos.
- elementos.png: 8 frutas de 32x32 en una tira horizontal (256x32)
- files.png: 5 partículas de 8x8 en una tira horizontal (40x8)

Usa solo stdlib (struct + zlib) para escribir PNG.
"""
import struct
import zlib
import os

# --- Minimal PNG writer ---


def write_png(filename, width, height, pixels):
    """
    pixels: list of height rows, each row is list of width (r,g,b,a) tuples
    """
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)

    raw = b''
    for row in pixels:
        raw += b'\x00'  # filter: None
        for r, g, b, a in row:
            raw += struct.pack('BBBB', r, g, b, a)

    with open(filename, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', struct.pack(
            '>IIBBBBB', width, height, 8, 6, 0, 0, 0)))
        f.write(chunk(b'IDAT', zlib.compress(raw, 9)))
        f.write(chunk(b'IEND', b''))
    print(f"  Written: {filename} ({width}x{height})")


# --- Grid helpers ---
T = (0, 0, 0, 0)  # Transparent


def make_grid(size=32):
    return [[T for _ in range(size)] for _ in range(size)]


def fill_rect(grid, x, y, w, h, color):
    for dy in range(h):
        for dx in range(w):
            gy, gx = y + dy, x + dx
            if 0 <= gy < len(grid) and 0 <= gx < len(grid[0]):
                grid[gy][gx] = color


def fill_ellipse(grid, cx, cy, rx, ry, color):
    for y in range(len(grid)):
        for x in range(len(grid[0])):
            dx = (x - cx) / max(rx, 0.1)
            dy = (y - cy) / max(ry, 0.1)
            if dx*dx + dy*dy <= 1.0:
                grid[y][x] = color


def fill_circle(grid, cx, cy, r, color):
    fill_ellipse(grid, cx, cy, r, r, color)


def set_pixel(grid, x, y, color):
    if 0 <= y < len(grid) and 0 <= x < len(grid[0]):
        grid[y][x] = color


# --- Color palette ---
C = {
    # Oranges
    'orange':     (255, 159, 67, 255),
    'orange_dk':  (214, 120, 30, 255),
    'orange_hi':  (255, 200, 100, 255),
    # Reds
    'red':        (235, 64, 52, 255),
    'red_dk':     (180, 40, 30, 255),
    'red_hi':     (255, 120, 110, 255),
    # Yellows
    'yellow':     (255, 220, 50, 255),
    'yellow_dk':  (220, 180, 30, 255),
    'yellow_hi':  (255, 245, 140, 255),
    # Purples
    'purple':     (150, 80, 190, 255),
    'purple_dk':  (110, 50, 150, 255),
    'purple_hi':  (190, 130, 220, 255),
    # Greens
    'green':      (80, 180, 60, 255),
    'green_dk':   (50, 130, 40, 255),
    'green_hi':   (130, 220, 100, 255),
    # Kiwi
    'kiwi_brown':  (140, 100, 60, 255),
    'kiwi_brown_dk': (100, 70, 40, 255),
    'kiwi_green':  (120, 190, 50, 255),
    'kiwi_green_dk': (80, 150, 30, 255),
    'kiwi_green_hi': (170, 220, 100, 255),
    'kiwi_center': (230, 230, 200, 255),
    'kiwi_seed':   (40, 35, 25, 255),
    # Strawberry
    'straw':      (230, 50, 50, 255),
    'straw_dk':   (180, 30, 30, 255),
    'straw_hi':   (255, 100, 90, 255),
    'straw_seed': (255, 220, 80, 255),
    # Cherry
    'cherry':     (200, 30, 40, 255),
    'cherry_hi':  (240, 80, 90, 255),
    # Banana
    'banana':     (255, 225, 70, 255),
    'banana_dk':  (210, 180, 40, 255),
    'banana_hi':  (255, 245, 150, 255),
    # Stems/leaves
    'stem':       (120, 85, 50, 255),
    'stem_dk':    (90, 60, 35, 255),
    'leaf':       (80, 190, 60, 255),
    'leaf_dk':    (55, 140, 40, 255),
    # Pear
    'pear':       (180, 210, 50, 255),
    'pear_dk':    (140, 170, 30, 255),
    'pear_hi':    (220, 240, 120, 255),
    # Blueberry
    'blue':       (70, 90, 200, 255),
    'blue_dk':    (50, 60, 160, 255),
    'blue_hi':    (120, 140, 240, 255),
    # Particles
    'p_red':      (255, 100, 100, 255),
    'p_yellow':   (255, 230, 80, 255),
    'p_green':    (100, 230, 100, 255),
    'p_blue':     (100, 150, 255, 255),
    'p_purple':   (180, 120, 255, 255),
    'white':      (255, 255, 255, 255),
}

# ============================================================
# FRUIT DESIGNS (32x32 each)
# ============================================================


def draw_orange():
    """Naranja - redonda con tallo y hoja"""
    g = make_grid()
    # Stem
    fill_rect(g, 14, 3, 3, 3, C['stem'])
    fill_rect(g, 15, 1, 2, 3, C['stem'])
    # Leaf
    fill_rect(g, 17, 2, 3, 2, C['leaf'])
    fill_rect(g, 19, 1, 2, 2, C['leaf'])
    fill_rect(g, 20, 3, 1, 1, C['leaf_dk'])
    # Body
    fill_ellipse(g, 15, 17, 10, 10, C['orange'])
    # Shading bottom
    fill_ellipse(g, 15, 20, 8, 7, C['orange_dk'])
    # Re-fill center to keep bright
    fill_ellipse(g, 15, 15, 8, 8, C['orange'])
    # Highlight
    fill_rect(g, 10, 11, 4, 3, C['orange_hi'])
    fill_rect(g, 11, 10, 2, 1, C['orange_hi'])
    return g


def draw_apple():
    """Manzana roja con tallo y hoja"""
    g = make_grid()
    # Stem
    fill_rect(g, 15, 2, 2, 4, C['stem'])
    # Leaf
    fill_rect(g, 17, 3, 3, 2, C['leaf'])
    fill_rect(g, 19, 2, 2, 2, C['leaf'])
    fill_rect(g, 20, 4, 1, 1, C['leaf_dk'])
    # Body - slightly wider top (apple shape)
    fill_ellipse(g, 15, 17, 11, 10, C['red'])
    # Indent top
    fill_rect(g, 13, 7, 5, 2, T)
    fill_ellipse(g, 11, 14, 8, 9, C['red'])
    fill_ellipse(g, 19, 14, 8, 9, C['red'])
    # Darker bottom
    fill_ellipse(g, 15, 21, 9, 6, C['red_dk'])
    fill_ellipse(g, 15, 17, 9, 7, C['red'])
    # Highlight
    fill_rect(g, 9, 12, 3, 4, C['red_hi'])
    fill_rect(g, 10, 11, 2, 1, C['red_hi'])
    return g


def draw_lemon():
    """Limón amarillo - forma ovalada"""
    g = make_grid()
    # Stem
    fill_rect(g, 14, 4, 3, 2, C['stem'])
    # Leaf
    fill_rect(g, 17, 3, 3, 2, C['leaf'])
    fill_rect(g, 19, 2, 2, 2, C['leaf'])
    # Body - oval
    fill_ellipse(g, 15, 17, 9, 11, C['yellow'])
    # Tapered ends
    fill_rect(g, 13, 5, 5, 2, C['yellow'])
    fill_rect(g, 14, 27, 3, 2, C['yellow_dk'])
    # Shading
    fill_ellipse(g, 17, 20, 6, 7, C['yellow_dk'])
    fill_ellipse(g, 14, 16, 7, 8, C['yellow'])
    # Highlight
    fill_rect(g, 11, 11, 3, 4, C['yellow_hi'])
    fill_rect(g, 12, 10, 2, 1, C['yellow_hi'])
    return g


def draw_grape():
    """Racimo de uvas"""
    g = make_grid()
    # Stem
    fill_rect(g, 15, 2, 2, 5, C['stem'])
    # Leaf
    fill_rect(g, 17, 3, 4, 2, C['leaf'])
    fill_rect(g, 20, 2, 2, 2, C['leaf'])
    # Grape cluster - overlapping circles
    positions = [
        (12, 10), (18, 10),
        (9, 15), (15, 15), (21, 15),
        (12, 20), (18, 20),
        (15, 25),
    ]
    for px, py in positions:
        fill_circle(g, px, py, 4, C['purple'])
        # Highlight on each grape
        set_pixel(g, px - 1, py - 2, C['purple_hi'])
        set_pixel(g, px - 2, py - 1, C['purple_hi'])
    # Darker overlay for depth on lower grapes
    for px, py in positions[5:]:
        fill_circle(g, px, py + 1, 3, C['purple_dk'])
        fill_circle(g, px, py, 3, C['purple'])
        set_pixel(g, px - 1, py - 2, C['purple_hi'])
    return g


def draw_kiwi():
    """Kiwi cortado - círculo con piel marrón, pulpa verde y centro claro con semillas"""
    g = make_grid()
    cx, cy = 15, 15

    # Piel exterior (marrón)
    fill_circle(g, cx, cy, 13, C['kiwi_brown'])
    fill_circle(g, cx, cy + 1, 12, C['kiwi_brown_dk'])
    fill_circle(g, cx, cy, 12, C['kiwi_brown'])

    # Pulpa verde
    fill_circle(g, cx, cy, 11, C['kiwi_green'])

    # Anillo verde oscuro (ring pattern del kiwi)
    for y in range(32):
        for x in range(32):
            dx = x - cx
            dy = y - cy
            dist_sq = dx*dx + dy*dy
            # Ring between radius 5 and 8
            if dist_sq >= 5*5 and dist_sq <= 8*8:
                if g[y][x] == C['kiwi_green']:
                    g[y][x] = C['kiwi_green_dk']

    # Restaurar pulpa verde clara en anillo medio
    for y in range(32):
        for x in range(32):
            dx = x - cx
            dy = y - cy
            dist_sq = dx*dx + dy*dy
            if dist_sq >= 3*3 and dist_sq <= 5*5:
                if g[y][x] != C['kiwi_brown'] and g[y][x] != C['kiwi_brown_dk']:
                    g[y][x] = C['kiwi_green']

    # Centro blanco/claro
    fill_circle(g, cx, cy, 3, C['kiwi_center'])

    # Semillas en patrón radial (como un reloj)
    import math
    seed_ring_r = 7
    for angle_deg in range(0, 360, 30):
        angle = math.radians(angle_deg)
        sx = int(cx + seed_ring_r * math.cos(angle))
        sy = int(cy + seed_ring_r * math.sin(angle))
        set_pixel(g, sx, sy, C['kiwi_seed'])
        set_pixel(g, sx + 1, sy, C['kiwi_seed'])

    # Líneas radiales sutiles desde el centro (rayas del kiwi)
    for angle_deg in range(0, 360, 45):
        angle = math.radians(angle_deg)
        for r in range(3, 10):
            lx = int(cx + r * math.cos(angle))
            ly = int(cy + r * math.sin(angle))
            if 0 <= lx < 32 and 0 <= ly < 32:
                if g[ly][lx] == C['kiwi_green'] or g[ly][lx] == C['kiwi_green_dk']:
                    g[ly][lx] = C['kiwi_green_hi']

    # Highlight
    fill_rect(g, 10, 7, 3, 3, C['kiwi_green_hi'])

    return g


def draw_strawberry():
    """Frutilla - forma de corazón invertido con semillas y corona"""
    g = make_grid()

    # Cuerpo: ancho arriba, punta abajo (corazón invertido)
    # Construir fila por fila para forma de frutilla clara
    body_rows = [
        # (y, x_start, width)
        (8,  9, 14),
        (9,  8, 16),
        (10, 7, 18),
        (11, 6, 20),
        (12, 5, 22),
        (13, 5, 22),
        (14, 5, 22),   # widest
        (15, 5, 22),
        (16, 6, 20),
        (17, 6, 20),
        (18, 7, 18),
        (19, 7, 18),
        (20, 8, 16),
        (21, 9, 14),
        (22, 9, 14),
        (23, 10, 12),
        (24, 11, 10),
        (25, 12, 8),
        (26, 13, 6),
        (27, 13, 6),
        (28, 14, 4),
        (29, 14, 3),
    ]
    for y, xs, w in body_rows:
        fill_rect(g, xs, y, w, 1, C['straw'])

    # Sombreado inferior
    shade_rows = [
        (22, 10, 12), (23, 11, 10), (24, 12, 8),
        (25, 13, 6), (26, 13, 6), (27, 14, 4),
        (28, 14, 4), (29, 14, 3),
    ]
    for y, xs, w in shade_rows:
        fill_rect(g, xs, y, w, 1, C['straw_dk'])

    # Highlight
    fill_rect(g, 9, 10, 4, 3, C['straw_hi'])
    fill_rect(g, 10, 9, 2, 1, C['straw_hi'])

    # Semillas (puntos amarillos)
    seed_pos = [
        (10, 14), (20, 14),
        (8, 17), (15, 18), (22, 17),
        (10, 21), (20, 21),
        (13, 24), (17, 24),
    ]
    for sx, sy in seed_pos:
        set_pixel(g, sx, sy, C['straw_seed'])
        set_pixel(g, sx+1, sy, C['straw_seed'])

    # Corona verde (hojas)
    fill_rect(g, 10, 6, 12, 3, C['green'])
    fill_rect(g, 12, 4, 8, 3, C['green'])
    # Puntas de hojas
    fill_rect(g, 8, 5, 3, 2, C['leaf'])
    fill_rect(g, 21, 5, 3, 2, C['leaf'])
    fill_rect(g, 10, 4, 3, 2, C['green_hi'])
    fill_rect(g, 19, 4, 3, 2, C['green_hi'])
    # Tallo
    fill_rect(g, 15, 1, 2, 4, C['stem'])
    return g


def draw_cherry():
    """Cerezas - dos frutos con tallo"""
    g = make_grid()
    # Stems (curved)
    fill_rect(g, 14, 2, 2, 3, C['stem'])
    fill_rect(g, 13, 4, 2, 2, C['stem'])
    fill_rect(g, 11, 5, 3, 2, C['stem'])
    fill_rect(g, 9, 7, 3, 2, C['stem'])
    fill_rect(g, 8, 9, 2, 2, C['stem'])
    # Right stem branch
    fill_rect(g, 15, 4, 2, 2, C['stem'])
    fill_rect(g, 17, 5, 2, 2, C['stem'])
    fill_rect(g, 19, 7, 3, 2, C['stem'])
    fill_rect(g, 21, 9, 2, 2, C['stem'])
    # Leaf at junction
    fill_rect(g, 14, 1, 5, 2, C['leaf'])
    fill_rect(g, 17, 0, 3, 2, C['leaf'])
    fill_rect(g, 18, 2, 2, 1, C['leaf_dk'])
    # Left cherry
    fill_circle(g, 9, 17, 7, C['cherry'])
    fill_circle(g, 9, 19, 6, C['red_dk'])
    fill_circle(g, 9, 16, 6, C['cherry'])
    fill_rect(g, 6, 13, 3, 2, C['cherry_hi'])
    set_pixel(g, 6, 12, C['cherry_hi'])
    # Right cherry
    fill_circle(g, 22, 17, 7, C['cherry'])
    fill_circle(g, 22, 19, 6, C['red_dk'])
    fill_circle(g, 22, 16, 6, C['cherry'])
    fill_rect(g, 19, 13, 3, 2, C['cherry_hi'])
    set_pixel(g, 19, 12, C['cherry_hi'])
    return g


def draw_pear():
    """Pera - forma clásica de lágrima: angosta arriba, ancha abajo"""
    g = make_grid()

    # Tallo
    fill_rect(g, 15, 1, 2, 4, C['stem'])
    fill_rect(g, 14, 2, 2, 2, C['stem_dk'])

    # Hoja
    fill_rect(g, 17, 2, 3, 2, C['leaf'])
    fill_rect(g, 19, 1, 2, 2, C['leaf'])
    fill_rect(g, 20, 3, 1, 1, C['leaf_dk'])

    # Cuerpo: fila por fila para forma de pera (angosto arriba, panzón abajo)
    body_rows = [
        (5,  13, 6),
        (6,  12, 8),
        (7,  12, 8),
        (8,  11, 10),
        (9,  11, 10),
        (10, 11, 10),
        (11, 10, 12),
        (12, 10, 12),
        (13, 9,  14),
        (14, 8,  16),
        (15, 7,  18),
        (16, 6,  20),
        (17, 5,  22),
        (18, 4,  24),
        (19, 4,  24),
        (20, 3,  26),
        (21, 3,  26),   # widest
        (22, 3,  26),
        (23, 4,  24),
        (24, 4,  24),
        (25, 5,  22),
        (26, 6,  20),
        (27, 7,  18),
        (28, 9,  14),
        (29, 11, 10),
    ]
    for y, xs, w in body_rows:
        fill_rect(g, xs, y, w, 1, C['pear'])

    # Sombreado derecho/inferior
    shade_rows = [
        (23, 20, 8), (24, 19, 9), (25, 18, 9),
        (26, 17, 9), (27, 16, 9), (28, 15, 8),
        (29, 14, 7),
    ]
    for y, xs, w in shade_rows:
        fill_rect(g, xs, y, w, 1, C['pear_dk'])

    # Highlight (izquierda superior)
    fill_rect(g, 12, 8, 3, 4, C['pear_hi'])
    fill_rect(g, 11, 10, 2, 2, C['pear_hi'])
    fill_rect(g, 9, 14, 3, 3, C['pear_hi'])
    fill_rect(g, 7, 17, 4, 3, C['pear_hi'])

    return g

# ============================================================
# PARTICLE DESIGNS (8x8 each)
# ============================================================


def make_particle(color_hi, color_main):
    """Star/sparkle particle 8x8"""
    g = [[T]*8 for _ in range(8)]
    # Small diamond/star shape
    fill_rect(g, 3, 1, 2, 1, color_hi)
    fill_rect(g, 2, 2, 4, 1, color_main)
    fill_rect(g, 1, 3, 6, 2, color_main)
    fill_rect(g, 2, 5, 4, 1, color_main)
    fill_rect(g, 3, 6, 2, 1, color_hi)
    # Center highlight
    fill_rect(g, 3, 3, 2, 2, color_hi)
    return g

# ============================================================
# ASSEMBLY
# ============================================================


def assemble_spritesheet(grids, frame_size):
    """Combine grids into a horizontal strip"""
    n = len(grids)
    width = frame_size * n
    height = frame_size
    pixels = [[T] * width for _ in range(height)]
    for i, grid in enumerate(grids):
        ox = i * frame_size
        for y in range(min(frame_size, len(grid))):
            for x in range(min(frame_size, len(grid[0]))):
                pixels[y][ox + x] = grid[y][x]
    return pixels, width, height

# ============================================================
# MAIN
# ============================================================


if __name__ == '__main__':
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'img')
    os.makedirs(out_dir, exist_ok=True)

    print("Generating fruit spritesheet (8 fruits, 32x32 each)...")
    fruits = [
        draw_orange(),
        draw_apple(),
        draw_lemon(),
        draw_grape(),
        draw_kiwi(),
        draw_strawberry(),
        draw_cherry(),
        draw_pear(),
    ]
    pixels, w, h = assemble_spritesheet(fruits, 32)
    write_png(os.path.join(out_dir, 'elementos.png'), w, h, pixels)

    print("Generating particle spritesheet (5 particles, 8x8 each)...")
    particles = [
        make_particle(C['white'], C['p_red']),
        make_particle(C['white'], C['p_yellow']),
        make_particle(C['white'], C['p_green']),
        make_particle(C['white'], C['p_blue']),
        make_particle(C['white'], C['p_purple']),
    ]
    pixels_p, w_p, h_p = assemble_spritesheet(particles, 8)
    write_png(os.path.join(out_dir, 'files.png'), w_p, h_p, pixels_p)

    print("Done! Spritesheets generated successfully.")
    print(f"  Fruits: {len(fruits)} types at 32x32 → {w}x{h}")
    print(f"  Particles: {len(particles)} types at 8x8 → {w_p}x{h_p}")
