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
import math

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
    # Golden Apple
    'gold':       (255, 200, 50, 255),
    'gold_dk':    (200, 155, 25, 255),
    'gold_hi':    (255, 240, 130, 255),
    'gold_shine': (255, 255, 200, 255),
    'gold_stem':  (160, 110, 50, 255),
    'gold_leaf':  (255, 220, 80, 255),
    'gold_leaf_dk': (200, 170, 40, 255),
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


def draw_golden_apple():
    """Manzana dorada - forma de manzana pero dorada con brillo y estrella"""
    g = make_grid()
    # Stem (dorado oscuro)
    fill_rect(g, 15, 2, 2, 4, C['gold_stem'])
    # Leaf (dorada)
    fill_rect(g, 17, 3, 3, 2, C['gold_leaf'])
    fill_rect(g, 19, 2, 2, 2, C['gold_leaf'])
    fill_rect(g, 20, 4, 1, 1, C['gold_leaf_dk'])
    # Body - apple shape in gold
    fill_ellipse(g, 15, 17, 11, 10, C['gold'])
    # Indent top
    fill_rect(g, 13, 7, 5, 2, T)
    fill_ellipse(g, 11, 14, 8, 9, C['gold'])
    fill_ellipse(g, 19, 14, 8, 9, C['gold'])
    # Darker bottom
    fill_ellipse(g, 15, 21, 9, 6, C['gold_dk'])
    fill_ellipse(g, 15, 17, 9, 7, C['gold'])
    # Big highlight (brillo intenso, más grande que la manzana normal)
    fill_rect(g, 8, 11, 5, 5, C['gold_hi'])
    fill_rect(g, 9, 10, 3, 1, C['gold_hi'])
    fill_rect(g, 9, 16, 2, 2, C['gold_hi'])
    # Shine spot (punto de brillo blanco)
    fill_rect(g, 10, 12, 2, 2, C['gold_shine'])
    set_pixel(g, 9, 11, C['gold_shine'])
    # Small star sparkle (top right - marca distintiva)
    set_pixel(g, 22, 8, C['gold_shine'])
    set_pixel(g, 21, 9, C['gold_shine'])
    set_pixel(g, 22, 9, C['gold_hi'])
    set_pixel(g, 23, 9, C['gold_shine'])
    set_pixel(g, 22, 10, C['gold_shine'])
    # Second sparkle (bottom left)
    set_pixel(g, 6, 22, C['gold_shine'])
    set_pixel(g, 7, 21, C['gold_shine'])
    set_pixel(g, 7, 23, C['gold_shine'])
    set_pixel(g, 8, 22, C['gold_shine'])
    return g

# ============================================================
# BACK VIEW DESIGNS (32x32 each)
# Vista trasera de cada fruta para rotación completa 360°
# ============================================================


def draw_orange_back():
    """Naranja vista desde atrás - sin tallo/hoja, highlight opuesto"""
    g = make_grid()
    fill_ellipse(g, 15, 17, 10, 10, C['orange'])
    fill_ellipse(g, 15, 20, 8, 7, C['orange_dk'])
    fill_ellipse(g, 15, 15, 8, 8, C['orange'])
    # Highlight derecho (opuesto al frente)
    fill_rect(g, 18, 11, 4, 3, C['orange_hi'])
    fill_rect(g, 19, 10, 2, 1, C['orange_hi'])
    # Ombligo donde estaba el tallo
    set_pixel(g, 15, 8, C['orange_dk'])
    set_pixel(g, 16, 8, C['orange_dk'])
    return g


def draw_apple_back():
    """Manzana por detrás - roja sin tallo, hendidura inferior"""
    g = make_grid()
    fill_ellipse(g, 15, 17, 11, 10, C['red'])
    fill_rect(g, 13, 7, 5, 2, T)
    fill_ellipse(g, 11, 14, 8, 9, C['red'])
    fill_ellipse(g, 19, 14, 8, 9, C['red'])
    fill_ellipse(g, 15, 21, 9, 6, C['red_dk'])
    fill_ellipse(g, 15, 17, 9, 7, C['red'])
    # Highlight derecho
    fill_rect(g, 19, 12, 3, 4, C['red_hi'])
    fill_rect(g, 20, 11, 2, 1, C['red_hi'])
    # Hendidura inferior
    set_pixel(g, 15, 26, C['red_dk'])
    set_pixel(g, 16, 26, C['red_dk'])
    return g


def draw_lemon_back():
    """Limón por detrás - ovalado amarillo sin tallo"""
    g = make_grid()
    fill_ellipse(g, 15, 17, 9, 11, C['yellow'])
    fill_rect(g, 13, 5, 5, 2, C['yellow'])
    fill_rect(g, 14, 27, 3, 2, C['yellow_dk'])
    fill_ellipse(g, 13, 20, 6, 7, C['yellow_dk'])
    fill_ellipse(g, 16, 16, 7, 8, C['yellow'])
    # Highlight derecho
    fill_rect(g, 19, 11, 3, 4, C['yellow_hi'])
    fill_rect(g, 20, 10, 2, 1, C['yellow_hi'])
    return g


def draw_grape_back():
    """Uvas por detrás - racimo similar, highlights opuestos"""
    g = make_grid()
    fill_rect(g, 15, 2, 2, 5, C['stem'])
    positions = [
        (12, 10), (18, 10),
        (9, 15), (15, 15), (21, 15),
        (12, 20), (18, 20),
        (15, 25),
    ]
    for px, py in positions:
        fill_circle(g, px, py, 4, C['purple'])
        set_pixel(g, px + 1, py - 2, C['purple_hi'])
        set_pixel(g, px + 2, py - 1, C['purple_hi'])
    for px, py in positions[5:]:
        fill_circle(g, px, py + 1, 3, C['purple_dk'])
        fill_circle(g, px, py, 3, C['purple'])
        set_pixel(g, px + 1, py - 2, C['purple_hi'])
    return g


def draw_kiwi_back():
    """Kiwi por detrás - exterior marrón peludo COMPLETO"""
    g = make_grid()
    cx, cy = 15, 15
    # Piel exterior marrón
    fill_circle(g, cx, cy, 13, C['kiwi_brown'])
    fill_circle(g, cx, cy + 1, 12, C['kiwi_brown_dk'])
    fill_circle(g, cx, cy, 12, C['kiwi_brown'])
    # Textura peluda (motas oscuras distribuidas)
    fuzzy = [
        (10, 9), (19, 10), (8, 14), (21, 15), (11, 19),
        (18, 20), (14, 23), (20, 12), (12, 12), (16, 18),
        (9, 17), (22, 18), (13, 8), (17, 22), (7, 12),
    ]
    for fx, fy in fuzzy:
        set_pixel(g, fx, fy, C['kiwi_brown_dk'])
        set_pixel(g, fx + 1, fy, C['kiwi_brown_dk'])
    # Highlight derecho
    fill_rect(g, 19, 9, 3, 3, (170, 130, 80, 255))
    fill_rect(g, 20, 8, 2, 1, (170, 130, 80, 255))
    # Ombligo superior
    set_pixel(g, 15, 4, C['kiwi_brown_dk'])
    set_pixel(g, 16, 4, C['kiwi_brown_dk'])
    return g


def draw_strawberry_back():
    """Frutilla por detrás - cuerpo rojo, semillas, corona reducida"""
    g = make_grid()
    body_rows = [
        (8,  9, 14), (9,  8, 16), (10, 7, 18), (11, 6, 20),
        (12, 5, 22), (13, 5, 22), (14, 5, 22), (15, 5, 22),
        (16, 6, 20), (17, 6, 20), (18, 7, 18), (19, 7, 18),
        (20, 8, 16), (21, 9, 14), (22, 9, 14), (23, 10, 12),
        (24, 11, 10), (25, 12, 8), (26, 13, 6), (27, 13, 6),
        (28, 14, 4), (29, 14, 3),
    ]
    for y, xs, w in body_rows:
        fill_rect(g, xs, y, w, 1, C['straw'])
    shade_rows = [
        (22, 10, 12), (23, 11, 10), (24, 12, 8),
        (25, 13, 6), (26, 13, 6), (27, 14, 4),
        (28, 14, 4), (29, 14, 3),
    ]
    for y, xs, w in shade_rows:
        fill_rect(g, xs, y, w, 1, C['straw_dk'])
    # Highlight derecho
    fill_rect(g, 19, 10, 4, 3, C['straw_hi'])
    fill_rect(g, 20, 9, 2, 1, C['straw_hi'])
    # Semillas
    seed_pos = [
        (10, 14), (20, 14), (8, 17), (15, 18),
        (22, 17), (10, 21), (20, 21), (13, 24), (17, 24),
    ]
    for sx, sy in seed_pos:
        set_pixel(g, sx, sy, C['straw_seed'])
        set_pixel(g, sx + 1, sy, C['straw_seed'])
    # Corona reducida desde atrás
    fill_rect(g, 11, 6, 10, 3, C['green'])
    fill_rect(g, 13, 4, 6, 3, C['green'])
    fill_rect(g, 15, 1, 2, 4, C['stem'])
    return g


def draw_cherry_back():
    """Cerezas por detrás - dos frutas, tallos, sin hoja"""
    g = make_grid()
    # Tallos (misma estructura)
    fill_rect(g, 14, 2, 2, 3, C['stem'])
    fill_rect(g, 13, 4, 2, 2, C['stem'])
    fill_rect(g, 11, 5, 3, 2, C['stem'])
    fill_rect(g, 9, 7, 3, 2, C['stem'])
    fill_rect(g, 8, 9, 2, 2, C['stem'])
    fill_rect(g, 15, 4, 2, 2, C['stem'])
    fill_rect(g, 17, 5, 2, 2, C['stem'])
    fill_rect(g, 19, 7, 3, 2, C['stem'])
    fill_rect(g, 21, 9, 2, 2, C['stem'])
    # Cereza izquierda
    fill_circle(g, 9, 17, 7, C['cherry'])
    fill_circle(g, 9, 19, 6, C['red_dk'])
    fill_circle(g, 9, 16, 6, C['cherry'])
    fill_rect(g, 11, 13, 3, 2, C['cherry_hi'])
    set_pixel(g, 12, 12, C['cherry_hi'])
    # Cereza derecha
    fill_circle(g, 22, 17, 7, C['cherry'])
    fill_circle(g, 22, 19, 6, C['red_dk'])
    fill_circle(g, 22, 16, 6, C['cherry'])
    fill_rect(g, 24, 13, 3, 2, C['cherry_hi'])
    set_pixel(g, 25, 12, C['cherry_hi'])
    return g


def draw_pear_back():
    """Pera por detrás - forma de pera sin tallo, highlight opuesto"""
    g = make_grid()
    body_rows = [
        (5,  13, 6), (6,  12, 8), (7,  12, 8), (8,  11, 10),
        (9,  11, 10), (10, 11, 10), (11, 10, 12), (12, 10, 12),
        (13, 9,  14), (14, 8,  16), (15, 7,  18), (16, 6,  20),
        (17, 5,  22), (18, 4,  24), (19, 4,  24), (20, 3,  26),
        (21, 3,  26), (22, 3,  26), (23, 4,  24), (24, 4,  24),
        (25, 5,  22), (26, 6,  20), (27, 7,  18), (28, 9,  14),
        (29, 11, 10),
    ]
    for y, xs, w in body_rows:
        fill_rect(g, xs, y, w, 1, C['pear'])
    shade_rows = [
        (23, 4, 8), (24, 4, 9), (25, 5, 9),
        (26, 6, 9), (27, 7, 9), (28, 9, 8), (29, 11, 7),
    ]
    for y, xs, w in shade_rows:
        fill_rect(g, xs, y, w, 1, C['pear_dk'])
    # Highlight derecho
    fill_rect(g, 18, 8, 3, 4, C['pear_hi'])
    fill_rect(g, 19, 10, 2, 2, C['pear_hi'])
    fill_rect(g, 20, 14, 3, 3, C['pear_hi'])
    fill_rect(g, 21, 17, 4, 3, C['pear_hi'])
    # Ombligo superior
    set_pixel(g, 15, 4, C['pear_dk'])
    set_pixel(g, 16, 4, C['pear_dk'])
    return g


def draw_golden_apple_back():
    """Manzana dorada por detrás - dorada sin sparkles ni tallo"""
    g = make_grid()
    fill_ellipse(g, 15, 17, 11, 10, C['gold'])
    fill_rect(g, 13, 7, 5, 2, T)
    fill_ellipse(g, 11, 14, 8, 9, C['gold'])
    fill_ellipse(g, 19, 14, 8, 9, C['gold'])
    fill_ellipse(g, 15, 21, 9, 6, C['gold_dk'])
    fill_ellipse(g, 15, 17, 9, 7, C['gold'])
    # Highlight derecho
    fill_rect(g, 20, 11, 5, 5, C['gold_hi'])
    fill_rect(g, 21, 10, 3, 1, C['gold_hi'])
    # Hendidura inferior
    set_pixel(g, 15, 26, C['gold_dk'])
    set_pixel(g, 16, 26, C['gold_dk'])
    return g


# ============================================================
# ROTATION FRAME GENERATOR  —  Cylindrical inverse-mapping
#
# Genera N frames de rotación (0° → 180°) usando DOS texturas:
#   front_grid  = vista frontal  (0°)
#   back_grid   = vista trasera  (180°)
#
# Proyección cilíndrica inversa por fila:
#   Para cada pixel DESTINO (x_dst):
#     1. α_dst = asin(norm)              → ángulo en cilindro
#     2. α_src = α_dst − θ              → ángulo fuente
#     3. Si α_src ∈ [−π/2, π/2]  → muestrear front
#        sino                      → muestrear back
#     4. Lambert shading: brillo = cos(α_dst)
#
# Frame 0 = front, Frame n-1 = back.
# El motor recorre frames 0→n-1→0 para un giro completo de 360°.
# ============================================================

NUM_ROTATION_FRAMES = 12  # 0°..180° en pasos de ~16°


def darken(color, amount):
    """Oscurece un color RGBA en 'amount' (0-1)."""
    r, g, b, a = color
    return (
        max(0, int(r * (1 - amount))),
        max(0, int(g * (1 - amount))),
        max(0, int(b * (1 - amount))),
        a,
    )


def lerp_color(c1, c2, t):
    """Interpola linealmente entre dos colores RGBA."""
    t = max(0.0, min(1.0, t))
    return (
        int(c1[0] + (c2[0] - c1[0]) * t),
        int(c1[1] + (c2[1] - c1[1]) * t),
        int(c1[2] + (c2[2] - c1[2]) * t),
        int(c1[3] + (c2[3] - c1[3]) * t),
    )


def _row_bounds(grid, y):
    """Retorna (x_min, x_max) de píxeles no-transparentes, o (None, None)."""
    x_min = x_max = None
    for x in range(len(grid[y])):
        if grid[y][x] != T:
            if x_min is None:
                x_min = x
            x_max = x
    return x_min, x_max


def _row_dominant_color(grid, y, x_min, x_max):
    """Color más frecuente (no-transparente) en una fila de la silueta."""
    if x_min is None:
        return T
    counts = {}
    for x in range(x_min, x_max + 1):
        c = grid[y][x]
        if c != T:
            counts[c] = counts.get(c, 0) + 1
    return max(counts, key=counts.get) if counts else T


def _bilinear_sample(grid, y, src_x, x_min, x_max, fallback):
    """Muestrea con interpolación bilineal entre dos pixels vecinos."""
    if x_min is None or x_max is None:
        return fallback
    sx0 = int(math.floor(src_x))
    sx1 = sx0 + 1
    frac = src_x - sx0
    sx0 = max(x_min, min(x_max, sx0))
    sx1 = max(x_min, min(x_max, sx1))
    c0 = grid[y][sx0]
    c1 = grid[y][sx1]
    if c0 == T and c1 == T:
        return fallback
    elif c0 == T:
        return c1
    elif c1 == T:
        return c0
    else:
        return lerp_color(c0, c1, frac)


def generate_rotation_frames(front_grid, back_grid, n_frames=NUM_ROTATION_FRAMES):
    """
    Proyección cilíndrica front→back.

    Frame 0 = front original (0°).
    Frame n-1 = back original (180°).
    Frames intermedios: proyección cilíndrica que muestrea
    front o back según el ángulo, con shading Lambert.
    """
    size = len(front_grid)
    frames = [front_grid]  # frame 0 = front

    half_pi = math.pi / 2

    for fi in range(1, n_frames - 1):
        t = fi / (n_frames - 1)    # 0.0 → 1.0
        theta = t * math.pi        # 0 → π

        g = make_grid(size)

        for y in range(size):
            # Silueta: unión de front y back
            fmin, fmax = _row_bounds(front_grid, y)
            bmin, bmax = _row_bounds(back_grid, y)
            if fmin is None and bmin is None:
                continue

            mins = [v for v in [fmin, bmin] if v is not None]
            maxs = [v for v in [fmax, bmax] if v is not None]
            x_min = min(mins)
            x_max = max(maxs)

            cx = (x_min + x_max) / 2.0
            R = (x_max - x_min) / 2.0
            if R < 0.5:
                g[y][x_min] = front_grid[y][x_min] if t < 0.5 else back_grid[y][x_min]
                continue

            # Colores fallback por fila
            body_f = _row_dominant_color(front_grid, y, fmin, fmax)
            body_b = _row_dominant_color(back_grid, y, bmin, bmax)

            for x_dst in range(x_min, x_max + 1):
                norm_val = (x_dst - cx) / R
                norm_val = max(-1.0, min(1.0, norm_val))
                dst_angle = math.asin(norm_val)

                src_angle = dst_angle - theta
                # Normalizar a [-π, π]
                src_angle = ((src_angle + math.pi) % (2 * math.pi)) - math.pi

                # Lambert
                facing = math.cos(dst_angle)

                if abs(src_angle) <= half_pi:
                    # Muestrear textura frontal
                    src_norm = math.sin(src_angle)
                    src_x = cx + R * src_norm
                    color = _bilinear_sample(
                        front_grid, y, src_x, fmin, fmax, body_f)
                else:
                    # Muestrear textura trasera
                    back_norm = math.sin(src_angle - math.pi)
                    src_x = cx + R * back_norm
                    color = _bilinear_sample(
                        back_grid, y, src_x, bmin, bmax, body_b)

                # Sombreado Lambert
                if facing < 0.95:
                    shade = (1.0 - facing) * 0.45
                    color = darken(color, shade)

                g[y][x_dst] = color

        frames.append(g)

    # Último frame = back original
    frames.append(back_grid)

    return frames

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

    # Generar pares front/back para cada fruta
    fruit_views = [
        ("orange",     draw_orange(),       draw_orange_back()),
        ("apple",      draw_apple(),        draw_apple_back()),
        ("lemon",      draw_lemon(),        draw_lemon_back()),
        ("grape",      draw_grape(),        draw_grape_back()),
        ("kiwi",       draw_kiwi(),         draw_kiwi_back()),
        ("strawberry", draw_strawberry(),   draw_strawberry_back()),
        ("cherry",     draw_cherry(),       draw_cherry_back()),
        ("pear",       draw_pear(),         draw_pear_back()),
        ("golden",     draw_golden_apple(), draw_golden_apple_back()),
    ]

    n = NUM_ROTATION_FRAMES
    total = len(fruit_views) * n
    print(f"Generating fruit spritesheet "
          f"({len(fruit_views)} fruits × {n} rotation frames "
          f"= {total} frames, 32x32 each)...")

    # Generar frames de rotación front→back para cada fruta
    all_frames = []
    for name, front, back in fruit_views:
        rot_frames = generate_rotation_frames(front, back, n)
        all_frames.extend(rot_frames)
        print(f"  {name}: {len(rot_frames)} frames (front→back)")

    pixels, w, h = assemble_spritesheet(all_frames, 32)
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
    print(f"  Fruits: {total} frames at 32x32 → {w}x{h}")
    print(f"  Layout: fruit_type * {n} + rotation_idx")
    print(f"  Particles: {len(particles)} types at 8x8 → {w_p}x{h_p}")
