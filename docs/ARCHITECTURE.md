# Puntos - Documentación Técnica

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura de Archivos](#estructura-de-archivos)
- [Componentes](#componentes)
- [Sistema Visual 2.5D](#sistema-visual-25d)
- [Sistema de Sprites](#sistema-de-sprites)
- [Ciclo de Vida del Juego](#ciclo-de-vida-del-juego)
- [Mecánicas de Gameplay](#mecánicas-de-gameplay)
- [Cómo Ejecutar](#cómo-ejecutar)

---

## Descripción General

**Puntos** es un juego casual web tipo "Zen Mode" desarrollado con PhaserJS 3.90. El objetivo es hacer tap en las frutas pixel-art que caen con rotación pseudo-3D antes de que escapen por el fondo. Diseñado como experiencia anti-estrés: sin game over abrupto, velocidad con plateau, y penalización gradual.

### Características principales

- 🧘 Zen Mode: sin game over frustrante, penalización porcentual suave
- 🍎 8 frutas pixel-art + manzana dorada bonus (cada ~12s, +3 pts)
- 🔄 Rotación 2.5D con proyección físicamente correcta y sprites dual-view
- 🎨 Estética retro synthwave 80s (paleta púrpura neón)
- 📱 Mobile-first (touch-only, 3 pointers simultáneos)
- 🏆 Sistema de récord persistente (localStorage) con gradientes de fondo
- 🎯 Milestones cada 50 puntos con cambio de tema

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      src/index.html                         │
│              (Punto de entrada de la aplicación)            │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
          ┌─────────────────┐  ┌─────────────────┐
          │  Phaser 3.90.0  │  │    main.js       │
          │  (ES Module)    │  │  (Config + init) │
          └─────────────────┘  └─────────────────┘
                                        │
                              ┌─────────┴─────────┐
                              ▼                   ▼
                    ┌─────────────────┐  ┌─────────────────┐
                    │   GameScene.js  │  │  config/         │
                    │ (Escena única)  │  │  constants.js    │
                    └─────────────────┘  │  themes.js       │
                              │          └─────────────────┘
     ┌──────────┬─────────┬───┴───┬──────────┬──────────┬──────────┐
     ▼          ▼         ▼       ▼          ▼          ▼          ▼
┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│  Score   ││  ZenDiff ││Milestone ││Feedback  ││   UI     ││Background││  Golden  │
│ Manager  ││ Manager  ││ Manager  ││ Manager  ││ Manager  ││ Manager  ││  Fruit   │
│          ││          ││          ││          ││          ││          ││ Manager  │
└──────────┘└──────────┘└──────────┘└──────────┘└──────────┘└──────────┘└──────────┘
```

### Patrón de Diseño

La arquitectura sigue un patrón **Scene + Managers**: una única escena (`GameScene`) orquesta 7 managers especializados. Cada manager encapsula una responsabilidad:

| Manager                | Responsabilidad                                        |
| ---------------------- | ------------------------------------------------------ |
| `ScoreManager`         | Puntuación, récord, penalización suave (-10% por miss) |
| `ZenDifficultyManager` | Curva de velocidad logarítmica con plateau             |
| `MilestoneManager`     | Hitos cada 50 pts, cambio de tema                      |
| `FeedbackManager`      | Texto flotante "+N", flash rojo, efectos dorados       |
| `UIManager`            | Paneles de score/record, botones audio/pausa           |
| `BackgroundManager`    | Grid neón, floating particles, gradientes de récord    |
| `GoldenFruitManager`   | Manzana dorada bonus (spawn, rotación, sparkles)       |

---

## Stack Tecnológico

| Tecnología   | Versión | Propósito                       |
| ------------ | ------- | ------------------------------- |
| PhaserJS     | 3.90.0  | Motor de juegos 2D              |
| Vite         | 7.3.1   | Build system + dev server (HMR) |
| ES Modules   | ES6+    | Modularización nativa           |
| Python 3     | -       | Generación de spritesheets      |
| localStorage | -       | Persistencia del récord         |

### Configuración de Phaser

```javascript
{
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.RESIZE },  // Responsive automático
    pixelArt: true,                         // Nearest-neighbor sampling
    backgroundColor: 0x05001a,              // Dark purple synthwave
    input: { activePointers: 3 },           // Multi-touch
}
```

---

## Estructura de Archivos

```
puntos/
├── docs/                           # Documentación
│   ├── ARCHITECTURE.md             # Este documento
│   └── IMPROVEMENT_PLAN.md         # Plan de mejoras y roadmap
├── src/                            # Código fuente (Vite root)
│   ├── index.html                  # Punto de entrada HTML
│   ├── main.js                     # Config Phaser + bootstrap
│   ├── config/
│   │   ├── constants.js            # GameConstants, GameState
│   │   └── themes.js               # Paletas de color por milestone
│   ├── scenes/
│   │   └── GameScene.js            # Escena principal (~580 líneas)
│   └── managers/
│       ├── ScoreManager.js         # Puntuación zen (penalización suave)
│       ├── ZenDifficultyManager.js # Velocidad logarítmica + plateau
│       ├── MilestoneManager.js     # Hitos cada 50 pts
│       ├── FeedbackManager.js      # Efectos visuales de feedback
│       ├── UIManager.js            # Paneles, botones, layout
│       ├── BackgroundManager.js    # Grid neón + partículas flotantes
│       └── GoldenFruitManager.js   # Manzana dorada bonus
├── public/                         # Assets estáticos (Vite publicDir)
│   ├── audio/
│   │   ├── accept.mp3              # SFX al atrapar fruta
│   │   └── tema.mp3                # Música de fondo
│   ├── font/
│   │   └── 8BitArtSansNeue.ttf     # Fuente pixel "tres"
│   ├── img/
│   │   ├── elementos.png           # Spritesheet 576×32 (18 frames)
│   │   ├── files.png               # Spritesheet partículas 40×8 (5 frames)
│   │   ├── favicon.svg             # Icono del sitio
│   │   └── ui/                     # Iconos SVG de UI
│   └── styles.css                  # @font-face + estilos base
├── tools/
│   └── generate_sprites.py         # Generador de spritesheets (Python puro)
├── vite.config.js                  # Config Vite (root:src, port:8080)
├── package.json                    # Dependencias npm
└── README.md                       # Documentación básica
```

---

## Componentes

### GameScene (`src/scenes/GameScene.js`)

Escena principal (~580 líneas). Orquesta todos los managers y contiene el game loop.

#### Ciclo de Métodos

| Método                     | Responsabilidad                                            |
| -------------------------- | ---------------------------------------------------------- |
| `preload()`                | Carga assets + barra de progreso arcade                    |
| `create()`                 | Inicializa managers, frutas, audio, partículas, input      |
| `update()`                 | Game loop: movimiento, rotación 2.5D, colisiones           |
| `handleTap()`              | Detección de tap en frutas (hit-test manual por distancia) |
| `resetFruit()`             | Reposiciona fruta arriba con nuevo tipo aleatorio          |
| `checkFruitsOutOfBounds()` | Detecta frutas que escaparon → penalización                |

#### Pool de Frutas

Las frutas usan un pool fijo de 5 sprites (no se crean/destruyen en runtime):

```javascript
this.fruits = this.add.group();
for (let i = 0; i < GameConstants.GAMEPLAY.MAX_FRUITS; i++) {
	const fruit = this.add.sprite(x, 0, "elements", frame);
	fruit.setData("frontFrame", frame);
	// ... wobble, spin, scale data
}
```

### GoldenFruitManager (`src/managers/GoldenFruitManager.js`)

Manzana dorada que aparece cada ~12s (±3s varianza):

- Frame 8 del spritesheet (front) / frame 17 (side)
- Otorga +3 puntos bonus al tocarla
- Tiene breathing scale (±8%), 4 sparkles orbitantes
- Misma rotación 2.5D que frutas normales
- Si escapa, no penaliza (es bonus puro)

---

## Sistema Visual 2.5D

Las frutas simulan rotación tridimensional usando un stack de transformaciones 2D aplicadas cada frame. El sistema combina proyección geométrica real con trucos visuales para lograr una ilusión convincente de profundidad.

### 1. Proyección de Ancho (Ellipsoid Projection)

En lugar de usar `cos(θ)` directamente como ancho (que colapsa a cero de canto), se usa la fórmula de proyección de un elipsoide rotante:

```
width(θ) = √(D² + (1 − D²) · cos²(θ))
```

Donde **D = 0.55** es la razón profundidad/ancho de la fruta. Esto produce:

- **De frente** (θ = 0): width = 1.0 (ancho completo)
- **De canto** (θ = π/2): width = 0.55 (55% del ancho, nunca colapsa)

La curva es C∞ (infinitamente diferenciable): sin quiebres, sin empalmes, transición perfectamente suave en todo el arco de rotación.

```javascript
const D = 0.55;
const D2 = D * D;
const width = Math.sqrt(D2 + (1 - D2) * absCos * absCos);
fruit.scaleX = targetScale * width * Math.sign(cosVal);
```

**¿Por qué no simplemente `cos(θ)`?**

- `cos` llega a 0 → fruta desaparece de canto
- Aún con side sprites, `scaleX ≈ 0` aplasta cualquier sprite
- La fórmula elipsoidal mantiene volumen visible en todo ángulo

### 2. Squash Y Cuadrático

Cuando la fruta pasa de canto, se estira levemente en Y (12% max) simulando perspectiva de un disco visto de perfil:

```javascript
const edge = 1 - absCos;
fruit.scaleY = targetScale * (1 + edge * edge * 0.12);
```

El término cuadrático (`edge²`) concentra el efecto cerca del borde, evitando distorsión de frente.

### 3. Frame Swap con Alpha Dip

Dos conjuntos de sprites (frontal y lateral) se intercambian suavemente:

- **Umbral**: `absCos < 0.38` → muestra sprite side-view
- **Alpha dip**: en la zona ±0.10 del umbral, el alpha baja suavemente a 0.82 para enmascarar el cambio instantáneo de sprite (simula motion blur)

```javascript
const SWAP_TH = 0.38;
const BLEND = 0.1;
fruit.setFrame(absCos < SWAP_TH ? sideFrame : frontFrame);
const distSwap = Math.abs(absCos - SWAP_TH);
fruit.alpha = distSwap < BLEND ? 0.82 + 0.18 * (distSwap / BLEND) : 1.0;
```

**¿Por qué 0.38?** Es el punto donde el front sprite ya está suficientemente comprimido horizontalmente para que el swap sea visualmente imperceptible.

### 4. Tumble Z

Rotación sutil en eje Z sincronizada al doble de frecuencia del spin. Simula un eje de giro imperfecto (como una fruta real cayendo):

```javascript
fruit.rotation = Math.sin(spinPhase * 2) * 0.08; // ±4.5°
```

### 5. Iluminación Direccional por Esquina

Tint per-corner de Phaser para simular una fuente de luz lateral. Las esquinas izquierda y derecha reciben tints opuestos que se modulan con la rotación:

```javascript
const base = 155 + absCos * 100; // más brillante de frente (155..255)
const dir = sinVal * (35 + absCos * 25); // dirección de luz varía con giro
const lB = clamp(base + dir, 110, 255); // brillo esquina izquierda
const rB = clamp(base - dir, 110, 255); // brillo esquina derecha
fruit.setTint(lTint, rTint, lTint, rTint);
```

### 6. Wobble Horizontal

Movimiento ondulatorio horizontal independiente por fruta (frecuencia y amplitud aleatorias):

```javascript
fruit.x = baseX + Math.sin(wobblePhase) * wobbleAmp;
// wobbleAmp: 15-35px, wobbleSpeed: 0.015-0.03
```

### Stack Completo por Frame

```
Para cada fruta, cada frame de update():
 1. Avanzar spinPhase += spinSpeed          (0.02-0.045 rad/frame)
 2. Calcular cosVal, sinVal, absCos
 3. scaleX ← ts × √(D² + (1-D²)·cos²) × sign(cos)     [proyección]
 4. scaleY ← ts × (1 + edge²·0.12)                      [squash]
 5. setFrame(side si absCos < 0.38, front si no)         [frame swap]
 6. alpha ← dip suave ±0.10 del umbral de swap           [blend]
 7. rotation ← sin(spinPhase×2) × 0.08                   [tumble Z]
 8. setTint(left, right, left, right)                     [iluminación]
 9. x ← baseX + sin(wobblePhase) × wobbleAmp             [wobble]
10. y += speed                                            [caída]
```

---

## Sistema de Sprites

### Spritesheet de Frutas (`public/img/elementos.png`)

**Dimensiones:** 576×32 pixels (18 frames de 32×32)

| Frames | Tipo           | Vista   |
| ------ | -------------- | ------- |
| 0      | Naranja        | Frontal |
| 1      | Manzana        | Frontal |
| 2      | Limón          | Frontal |
| 3      | Uvas           | Frontal |
| 4      | Kiwi           | Frontal |
| 5      | Frutilla       | Frontal |
| 6      | Cerezas        | Frontal |
| 7      | Pera           | Frontal |
| 8      | Manzana dorada | Frontal |
| 9-17   | (mismas 9)     | Lateral |

**Relación front→side:** `sideFrame = frontFrame + SIDE_FRAME_OFFSET` (offset = 9)

### Sprites Laterales (Side Views)

Los sprites laterales representan la fruta vista de perfil (~70% del ancho frontal) con:

- **Sombreado de profundidad:** mitad derecha en color oscuro (simula curvatura alejándose)
- **Highlight lateral:** borde izquierdo más brillante (cara hacia la luz)
- **Línea central de borde:** marca visual del meridiano del objeto

### Spritesheet de Partículas (`public/img/files.png`)

**Dimensiones:** 40×8 pixels (5 partículas de 8×8)

| Frame | Color    |
| ----- | -------- |
| 0     | Rojo     |
| 1     | Amarillo |
| 2     | Verde    |
| 3     | Azul     |
| 4     | Púrpura  |

### Generación de Sprites

```bash
python3 tools/generate_sprites.py
# → public/img/elementos.png  (576×32, 18 frames)
# → public/img/files.png      (40×8, 5 frames)
```

El script usa solo `struct` y `zlib` de la stdlib de Python — zero dependencias externas. Dibuja pixel a pixel con funciones como `fill_ellipse`, `fill_circle`, `fill_rect` y escribe PNG directamente byte a byte.

---

## Ciclo de Vida del Juego

### Fase 1: Preload

```
1. Mostrar barra de progreso arcade (píxel border, texto "LOADING")
2. Cargar audio (tema.mp3, accept.mp3)
3. Cargar spritesheet frutas (576×32, 18 frames de 32×32)
4. Cargar spritesheet partículas (40×8, 5 frames de 8×8)
```

### Fase 2: Create

```
1. Inicializar 7 managers
2. Crear pool de 5 frutas (sprites, con datos de rotación/wobble)
3. Configurar emitter de partículas (pool de 50, burst on demand)
4. Crear audio (música loop + SFX bell)
5. Registrar input táctil (pointerdown → handleTap)
6. Escuchar resize para reposicionar UI
7. Programar spawn secuencial (delay 1s entre frutas)
8. Iniciar timer de manzana dorada
```

### Fase 3: Update (cada frame)

```
1. Animar fondo (siempre, incluso en pausa)
2. Si no está PLAYING → return
3. Obtener velocidad de ZenDifficultyManager(score)
4. Para cada fruta:
   a. Avanzar posición vertical (y += speed)
   b. Wobble horizontal (onda seno)
   c. Rotación 2.5D completa (10 pasos del stack)
5. Actualizar manzana dorada (movimiento + rotación + sparkles)
6. Verificar frutas fuera de pantalla → penalización
```

---

## Mecánicas de Gameplay

### Zen Mode

| Mecánica               | Implementación                                                 |
| ---------------------- | -------------------------------------------------------------- |
| **Penalización suave** | Miss resta -10% × consecutiveMisses (nunca game over)          |
| **Velocidad plateau**  | Curva logarítmica: `1 + log(score+1) × 0.8`, cap en 5 px       |
| **Milestones**         | Cada 50 pts → cambio de tema (paleta de colores)               |
| **Manzana dorada**     | Cada ~12s, +3 pts bonus, sin penalización si escapa            |
| **Récord persistente** | localStorage, fondo cambia a gradiente púrpura en nuevo récord |

### Penalización Escalonada

```
Score: 100, primera miss  → -10% = -10 → 90 pts
Score: 90,  segunda miss  → -20% = -18 → 72 pts
Score: 72,  hit!          → consecutiveMisses reset
Score: 73,  miss          → -10% = -7  → 66 pts
```

### Curva de Dificultad

```
Velocidad (px/frame)
5.0 |                    ━━━━━━━━  Plateau
4.0 |              ━━━━━━
3.0 |        ━━━━━━
2.0 |   ━━━━
1.0 | ━━
    +────────────────────────────
      0   20   40   60   80   100  Puntos
```

### Controles

| Acción                | Resultado                                          |
| --------------------- | -------------------------------------------------- |
| Tap en fruta          | +1 pt, partículas, sonido bell                     |
| Tap en manzana dorada | +3 pts bonus, flash dorado, anillo expandible      |
| Fruta escapa          | -N% score, flash rojo (escala con misses seguidos) |
| Tap icono audio       | Toggle música y efectos                            |
| Tap icono pausa       | Pausar/reanudar juego                              |

---

## Paleta Visual

Estética **retro synthwave 80s**:

| Elemento         | Color       | Hex/Valor              |
| ---------------- | ----------- | ---------------------- |
| Fondo            | Deep purple | `#05001a`              |
| Fondo gradiente  | Dark purple | `#120630`              |
| Acento principal | Neon purple | `#cc66ff`              |
| Grid del fondo   | Purple dim  | `0x1a0040` (15% alpha) |
| Texto UI         | White       | `#ffffff`              |
| Borde paneles    | Neon purple | `#cc66ff`              |
| Miss flash       | Red         | `0xff0000`             |
| Golden fruit     | Gold        | `0xffcc00`             |

### Fuente

**"tres"** = 8BitArtSansNeue.ttf — fuente pixel-art cargada via CSS `@font-face`.

---

## Cómo Ejecutar

### Desarrollo

```bash
npm install
npm run dev
# Abre http://localhost:8080
```

### Build de Producción

```bash
npm run build
# Output en dist/
```

### Regenerar Sprites

```bash
python3 tools/generate_sprites.py
# → public/img/elementos.png (576×32)
# → public/img/files.png     (40×8)
```

---

_Documentación actualizada — Puntos v2.0 (marzo 2026)_
