#!/usr/bin/env python3
"""Quick ASCII preview of the spritesheet"""
import struct
import zlib


def read_png(path):
    with open(path, 'rb') as f:
        f.read(8)
        idat = b''
        w = h = 0
        while True:
            raw = f.read(8)
            if len(raw) < 8:
                break
            length, ctype = struct.unpack('>I4s', raw)
            data = f.read(length)
            f.read(4)
            if ctype == b'IHDR':
                w, h = struct.unpack('>II', data[:8])
            elif ctype == b'IDAT':
                idat += data
            elif ctype == b'IEND':
                break
    raw = zlib.decompress(idat)
    pixels = []
    off = 0
    for y in range(h):
        off += 1
        row = []
        for x in range(w):
            r, g, b, a = raw[off], raw[off+1], raw[off+2], raw[off+3]
            off += 4
            row.append((r, g, b, a))
        pixels.append(row)
    return w, h, pixels


w, h, px = read_png('public/img/elementos.png')
names = ['Naranja', 'Manzana', 'Limon', 'Uvas',
         'Sandia', 'Frutilla', 'Cerezas', 'Banana']
for i in range(8):
    print(f'=== {names[i]} (frame {i}) ===')
    ox = i * 32
    for y in range(0, 32, 2):
        line = ''
        for x in range(32):
            r, g, b, a = px[y][ox+x]
            if a < 50:
                line += '.'
            elif g > 150 and r < 100:
                line += 'G'
            elif r > 200 and g < 100:
                line += 'R'
            elif r > 200 and g > 180:
                line += 'O'
            elif b > 150 and r < 100:
                line += 'B'
            elif r > 120 and g < 100 and b > 120:
                line += 'P'
            elif r > 100 and g > 60 and b < 60:
                line += 's'
            else:
                line += '#'
        print(line)
    print()
