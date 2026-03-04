# Plan de Mejora - Puntos

## Resumen Ejecutivo

Plan estructurado de mejoras para el proyecto Puntos. Las fases 1-5 están completadas. La fase 6 (testing/CI) queda pendiente.

---

## Estado de Progreso

| Fase | Descripción               | Estado                           |
| ---- | ------------------------- | -------------------------------- |
| 1    | Mejoras Críticas          | ✅ Completada                    |
| 2    | Arquitectura              | ✅ Completada (dentro de Fase 3) |
| 3    | Actualización Tecnológica | ✅ Completada                    |
| 4    | Gameplay (Zen Mode)       | ✅ Completada                    |
| 5    | UI/UX Polish              | ✅ Completada                    |
| 6    | Testing y CI/CD           | ❌ Pendiente                     |

---

## ✅ Fase 1: Mejoras Críticas (completada)

### 1.1 Variables Globales → `this.scale` API

- ✅ Eliminadas `realWidth`/`realHeight` globales
- ✅ Todo el código usa `this.scale.width`/`this.scale.height`
- ✅ Configurado `Phaser.Scale.RESIZE` para responsive automático
- ✅ UI se reposiciona dinámicamente en resize

### 1.2 Estados de Juego

- ✅ Implementado `GameState` enum (`LOADING`, `PLAYING`, `PAUSED`)
- ✅ `currentState` controla el flujo en `update()`

### 1.3 Pausa

- ✅ Botón de pausa táctil (icono SVG)
- ✅ Overlay semi-transparente con texto "PAUSA"
- ✅ Tap en overlay para reanudar

### 1.4 Constantes Centralizadas

- ✅ `GameConstants` en `src/config/constants.js`
- ✅ Configuración de UI, gameplay, golden fruit, partículas

---

## ✅ Fase 2+3: Arquitectura + Tecnología (completada)

### Migración a Vite + ES Modules

- ✅ Vite 7.3.1 configurado (`root: "src"`, `publicDir: "../public"`)
- ✅ ES6 modules en toda la codebase
- ✅ Hot Module Replacement funcional
- ✅ Build de producción con minificación

### Actualización de Phaser

- ✅ Migrado de Phaser 3.x (pre-3.60) a **Phaser 3.90.0**
- ✅ API de partículas migrada a 3.60+ (`this.add.particles()` directo)
- ✅ Clases ES6 nativas (eliminado `Phaser.Class`)
- ✅ `emitting: false` en lugar de `on: false`

### Modularización

- ✅ Estructura `src/` con carpetas `config/`, `scenes/`, `managers/`
- ✅ 7 managers especializados extraídos de GameScene
- ✅ Cada manager encapsula una responsabilidad única

---

## ✅ Fase 4: Gameplay - Zen Mode (completada)

### Decisión de Diseño

Se eligió **Zen Mode** sobre "Perfect Timing" y "Endless Ascent" por: mejor fit con el código existente, facilidad de implementación, y diferenciación clara como juego anti-estrés.

### Implementaciones

- ✅ `ScoreManager`: penalización suave (-10% × consecutiveMisses, nunca game over)
- ✅ `ZenDifficultyManager`: curva logarítmica `1 + log(score+1) × 0.8`, plateau a 5 px/frame
- ✅ `MilestoneManager`: hitos cada 50 puntos con cambio de paleta de colores
- ✅ Mensaje de plateau alcanzado
- ✅ Pool de 5 frutas con spawn secuencial (delay 1s)

### Manzana Dorada (Golden Apple)

- ✅ `GoldenFruitManager`: spawn cada ~12s (±3s varianza)
- ✅ Frame 8 del spritesheet (exclusivo)
- ✅ +3 puntos bonus, sin penalización si escapa
- ✅ Breathing scale (±8%), 4 sparkles orbitantes
- ✅ Efectos en `FeedbackManager.showGoldenCatch()` (flash, "+3 BONUS", anillo)

---

## ✅ Fase 5: UI/UX Polish (completada)

### Estética Retro Synthwave 80s

- ✅ Paleta púrpura neón completa (acento `#cc66ff`, fondo `#05001a`)
- ✅ Todas las referencias cyan/azul eliminadas, reemplazadas por púrpura
- ✅ Fuente pixel "tres" (8BitArtSansNeue.ttf) en toda la UI
- ✅ Emojis reemplazados por iconos SVG pixel-art

### FeedbackManager

- ✅ Texto flotante "+N" al atrapar fruta (tween up + fade)
- ✅ Flash rojo en miss (duración/alpha escala con misses consecutivos)
- ✅ Efectos especiales para golden apple catch
- ✅ Confetti/celebración en nuevo récord

### UIManager

- ✅ Paneles con borde pixel neón para score y record
- ✅ Botones audio y pausa con iconos SVG
- ✅ Layout responsive, reposicionamiento en resize

### BackgroundManager

- ✅ Grid vertical neón con breathing
- ✅ Partículas flotantes
- ✅ Speed burst visual al atrapar fruta
- ✅ 8 gradientes púrpura para cambio de fondo en nuevo récord
- ✅ Glow lines decorativas

### Sistema Visual 2.5D (Rotación de Frutas)

Implementación completa de pseudo-3D para las frutas:

- ✅ **Proyección elipsoidal**: `width = √(D² + (1-D²)·cos²(θ))` con D=0.55
  - Curva C∞ sin quiebres — ancho nunca colapsa a cero
  - Frente: 100% ancho, canto: 55% ancho
- ✅ **Sprites dual-view**: 9 vistas frontales + 9 vistas laterales (18 frames total)
  - Laterales: ~70% ancho frontal con sombreado de profundidad
  - Generados con `tools/generate_sprites.py` (Python puro, zero deps)
- ✅ **Frame swap con alpha dip**: cambio de sprite en `absCos < 0.38`
  - Alpha baja suave a 0.82 en zona ±0.10 del umbral (motion blur)
- ✅ **Squash Y cuadrático**: `scaleY × (1 + edge²·0.12)` de canto
- ✅ **Tumble Z**: `rotation = sin(phase×2) × 0.08` (±4.5° de cabeceo)
- ✅ **Iluminación direccional por esquina**: tint per-corner según ángulo del giro
- ✅ **Wobble horizontal**: onda seno independiente por fruta (amp 15-35px)

### Sprites Pixel-Art

- ✅ 8 frutas: naranja, manzana, limón, uvas, kiwi, frutilla, cerezas, pera
- ✅ 1 fruta especial: manzana dorada
- ✅ Cada fruta con vista frontal + vista lateral
- ✅ Spritesheet 576×32 (18 frames de 32×32)
- ✅ 5 partículas de colores (40×8)
- ✅ Generación reproducible via script Python

---

## ❌ Fase 6: Testing y CI/CD (pendiente)

### 6.1 Setup de Testing

```bash
npm install vitest --save-dev
```

**Tests prioritarios:**

```javascript
// tests/ScoreManager.test.js
describe("ScoreManager", () => {
	it("incrementa score en onHit()");
	it("resta porcentaje en onMiss()");
	it("escala penalización con consecutiveMisses");
	it("persiste récord en localStorage");
	it("resetea consecutiveMisses en onHit()");
});

// tests/ZenDifficultyManager.test.js
describe("ZenDifficultyManager", () => {
	it("retorna velocidad base para score 0");
	it("crece logarítmicamente");
	it("no excede plateau de 5 px/frame");
});

// tests/MilestoneManager.test.js
describe("MilestoneManager", () => {
	it("detecta milestone en múltiplos de 50");
	it("no repite milestones ya alcanzados");
});
```

### 6.2 GitHub Actions CI

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm test
      - run: npm run build
```

### 6.3 Checklist Fase 6

- [ ] Configurar Vitest
- [ ] Tests unitarios para ScoreManager
- [ ] Tests unitarios para ZenDifficultyManager
- [ ] Tests unitarios para MilestoneManager
- [ ] Tests de integración para GameConstants
- [ ] Configurar GitHub Actions CI
- [ ] Automatizar build check en PRs

---

## Mejoras Futuras (backlog)

Ideas evaluadas pero no priorizadas:

| Idea                      | Complejidad | Notas                              |
| ------------------------- | ----------- | ---------------------------------- |
| Música adaptativa (tempo) | Media       | Ajustar `setRate()` según score    |
| Tracks desbloqueables     | Alta        | Requiere más assets de audio       |
| Leaderboard online        | Alta        | Requiere backend                   |
| Haptic feedback           | Baja        | `navigator.vibrate()` ya soportado |
| Sistema de combo          | Media       | Se evaluó, se eligió golden apple  |
| Power-ups                 | Alta        | Imanes, slow-mo, etc.              |
| Modo oscuro/claro         | Baja        | Paleta alternativa en themes.js    |

---

## Métricas del Proyecto

| Métrica               | Valor Actual             |
| --------------------- | ------------------------ |
| Phaser version        | 3.90.0                   |
| Vite version          | 7.3.1                    |
| Módulos JS            | 17                       |
| Managers              | 7                        |
| Sprite frames         | 18 (9 front + 9 side)    |
| Particle types        | 5                        |
| Bundle size (prod)    | ~1.2MB (Phaser incluido) |
| Test coverage         | 0% (pendiente Fase 6)    |
| External dependencies | 2 (phaser, vite)         |

---

_Plan actualizado — Puntos v2.0 (marzo 2026)_
