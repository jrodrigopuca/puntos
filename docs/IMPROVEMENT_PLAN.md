# Plan de Mejora - Puntos

## Resumen Ejecutivo

Este documento presenta un plan estructurado para modernizar, optimizar y escalar el proyecto Puntos. Las mejoras están organizadas por prioridad y esfuerzo estimado.

---

## 📊 Matriz de Priorización

| Prioridad | Impacto                | Esfuerzo   | Categoría  |
| --------- | ---------------------- | ---------- | ---------- |
| 🔴 Alta   | Usuario/Estabilidad    | Bajo-Medio | Crítico    |
| 🟡 Media  | Calidad/Mantenibilidad | Medio      | Importante |
| 🟢 Baja   | Nice-to-have           | Variable   | Opcional   |

---

## 🔴 Fase 1: Mejoras Críticas (Semana 1-2)

### 1.1 Refactorización de Variables Globales

**Problema actual:**

```javascript
// Variables en scope global - mal práctica
let realWidth = window.innerWidth;
let realHeight = window.innerHeight;
```

**Solución propuesta:**

```javascript
// Encapsular en objeto de configuración
const GameConfig = {
	get width() {
		return window.innerWidth;
	},
	get height() {
		return window.innerHeight;
	},
	maxElements: 5,
	baseSpeed: 1,
	speedMultiplier: 0.1,
};
```

**Beneficio:** Mejor encapsulamiento, código más testeable.

---

### 1.2 Implementar Estados de Juego

**Problema actual:** No existe manejo de estados (inicio, pausa, game over).

**Solución propuesta:**

```javascript
const GameState = {
	LOADING: "loading",
	MENU: "menu",
	PLAYING: "playing",
	PAUSED: "paused",
	GAME_OVER: "gameOver",
};

class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: "gameScene" });
		this.currentState = GameState.LOADING;
	}

	setState(newState) {
		this.currentState = newState;
		this.events.emit("stateChanged", newState);
	}
}
```

**Nueva estructura de escenas:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  BootScene  │ ──▶ │  MenuScene  │ ──▶ │  GameScene  │
└─────────────┘     └─────────────┘     └─────────────┘
                           ▲                   │
                           │                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Paused    │ ◀── │ Game Over   │
                    └─────────────┘     └─────────────┘
```

---

### 1.3 Agregar Funcionalidad de Pausa

**Implementación:**

```javascript
// En create()
this.input.keyboard.on('keydown-ESC', () => this.togglePause());
this.input.keyboard.on('keydown-X', () => this.togglePause());

togglePause() {
    if (this.currentState === GameState.PLAYING) {
        this.physics.pause();
        this.setState(GameState.PAUSED);
        this.showPauseOverlay();
    } else if (this.currentState === GameState.PAUSED) {
        this.physics.resume();
        this.setState(GameState.PLAYING);
        this.hidePauseOverlay();
    }
}
```

---

## 🟡 Fase 2: Mejoras de Arquitectura (Semana 3-4)

### 2.1 Modularización del Código

**Estructura propuesta:**

```
pwa/
├── src/
│   ├── main.js              # Punto de entrada
│   ├── config/
│   │   ├── game.config.js   # Configuración de Phaser
│   │   └── constants.js     # Constantes del juego
│   ├── scenes/
│   │   ├── BootScene.js     # Carga inicial
│   │   ├── MenuScene.js     # Menú principal
│   │   ├── GameScene.js     # Juego principal
│   │   └── GameOverScene.js # Pantalla final
│   ├── objects/
│   │   ├── Fruit.js         # Clase Fruta
│   │   └── ScoreManager.js  # Gestión de puntuación
│   ├── managers/
│   │   ├── AudioManager.js  # Control de audio
│   │   └── StorageManager.js# Persistencia
│   └── utils/
│       └── helpers.js       # Funciones auxiliares
├── dist/                    # Build de producción
└── index.html
```

---

### 2.2 Clase Fruit Dedicada

**Implementación:**

```javascript
// src/objects/Fruit.js
export class Fruit extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y) {
		super(scene, x, y, "elements", Phaser.Math.Between(0, 3));

		this.scene = scene;
		this.setInteractive();
		this.applyRandomTint();

		this.on("pointerdown", this.handleClick, this);
	}

	applyRandomTint() {
		const colors = [0xffaaaa, 0xac93de, 0xffdd55, 0xffffff];
		this.setTint(Phaser.Utils.Array.GetRandom(colors));
	}

	handleClick(pointer) {
		this.scene.events.emit("fruitClicked", { fruit: this, pointer });
	}

	reset() {
		this.x = Phaser.Math.Between(
			0.1 * this.scene.scale.width,
			0.9 * this.scene.scale.width,
		);
		this.y = 0;
		this.applyRandomTint();
	}

	isOutOfBounds() {
		return this.y > this.scene.scale.height;
	}
}
```

---

### 2.3 Sistema de Eventos Desacoplado

**Patrón Observer para comunicación:**

```javascript
// src/managers/EventBus.js
export const GameEvents = {
	FRUIT_CLICKED: "fruitClicked",
	FRUIT_ESCAPED: "fruitEscaped",
	SCORE_CHANGED: "scoreChanged",
	NEW_RECORD: "newRecord",
	GAME_OVER: "gameOver",
	AUDIO_TOGGLE: "audioToggle",
};

// Uso en GameScene
this.events.on(GameEvents.FRUIT_CLICKED, this.handleFruitClick, this);
this.events.on(GameEvents.FRUIT_ESCAPED, this.handleFruitEscaped, this);
```

---

### 2.4 Manager de Audio Dedicado

```javascript
// src/managers/AudioManager.js
export class AudioManager {
	constructor(scene) {
		this.scene = scene;
		this.isMuted = true;
		this.music = null;
		this.sfx = {};
	}

	init() {
		this.music = this.scene.sound.add("song", { loop: true });
		this.sfx.bell = this.scene.sound.add("bell");
	}

	toggle() {
		this.isMuted = !this.isMuted;
		this.isMuted ? this.music.pause() : this.music.play();
		return this.isMuted;
	}

	playSfx(key) {
		if (!this.isMuted && this.sfx[key]) {
			this.sfx[key].play();
		}
	}
}
```

---

## 🟡 Fase 3: Actualizaciones Tecnológicas (Semana 5-6)

### 3.1 Migrar a ES Modules + Build System

**Setup con Vite:**

```bash
npm init -y
npm install vite phaser --save-dev
```

**vite.config.js:**

```javascript
import { defineConfig } from "vite";

export default defineConfig({
	base: "./",
	build: {
		outDir: "dist",
		assetsDir: "assets",
	},
	server: {
		port: 8080,
	},
});
```

**Beneficios:**

- Hot Module Replacement (HMR)
- Minificación automática
- Tree shaking
- Soporte TypeScript futuro

---

### 3.2 Actualizar Service Worker

**Usar Workbox para mejor gestión:**

```javascript
// service-worker.js con Workbox
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";

precacheAndRoute(self.__WB_MANIFEST);

// Assets estáticos: Cache First
registerRoute(
	({ request }) =>
		request.destination === "image" || request.destination === "audio",
	new CacheFirst({ cacheName: "assets-cache" }),
);

// HTML: Network First
registerRoute(
	({ request }) => request.mode === "navigate",
	new NetworkFirst({ cacheName: "pages-cache" }),
);
```

---

### 3.3 Agregar TypeScript (Opcional)

**tsconfig.json:**

```json
{
	"compilerOptions": {
		"target": "ES2020",
		"module": "ESNext",
		"strict": true,
		"esModuleInterop": true,
		"skipLibCheck": true,
		"forceConsistentCasingInFileNames": true,
		"outDir": "./dist",
		"rootDir": "./src"
	},
	"include": ["src/**/*"]
}
```

**Ejemplo tipado:**

```typescript
// src/objects/Fruit.ts
interface FruitConfig {
	x: number;
	y: number;
	frame?: number;
}

export class Fruit extends Phaser.GameObjects.Sprite {
	private readonly colors: number[] = [0xffaaaa, 0xac93de, 0xffdd55, 0xffffff];

	constructor(scene: Phaser.Scene, config: FruitConfig) {
		super(scene, config.x, config.y, "elements", config.frame ?? 0);
	}
}
```

---

## 🟢 Fase 4: Mejoras de Gameplay (Semana 7-8)

### 4.1 Sistema de Dificultad Progresiva

```javascript
// src/managers/DifficultyManager.js
export class DifficultyManager {
	constructor() {
		this.level = 1;
		this.thresholds = [0, 10, 25, 50, 100, 200];
	}

	getConfig(score) {
		const level =
			this.thresholds.findIndex((t) => score < t) || this.thresholds.length;

		return {
			level,
			speed: 1 + level * 0.5,
			maxFruits: Math.min(5 + level, 10),
			spawnRate: Math.max(1000 - level * 100, 400),
		};
	}
}
```

### 4.2 Power-ups

```javascript
// src/objects/PowerUp.js
export const PowerUpTypes = {
	SLOW_TIME: { color: 0x00ffff, duration: 5000, effect: "slowTime" },
	DOUBLE_POINTS: { color: 0xffff00, duration: 10000, effect: "doublePoints" },
	SHIELD: { color: 0x00ff00, duration: 3000, effect: "shield" },
};
```

### 4.3 Animaciones y Polish

```javascript
// Animación al hacer click en fruta
this.tweens.add({
	targets: fruit,
	scale: { from: 1, to: 1.5 },
	alpha: { from: 1, to: 0 },
	duration: 200,
	ease: "Power2",
	onComplete: () => fruit.reset(),
});

// Shake de cámara al perder
this.cameras.main.shake(300, 0.01);
```

---

## 🟢 Fase 5: Testing y CI/CD (Semana 9-10)

### 5.1 Setup de Testing

```bash
npm install vitest @testing-library/dom --save-dev
```

**Ejemplo de test:**

```javascript
// tests/ScoreManager.test.js
import { describe, it, expect } from "vitest";
import { ScoreManager } from "../src/managers/ScoreManager";

describe("ScoreManager", () => {
	it("should increment score", () => {
		const manager = new ScoreManager();
		manager.add(1);
		expect(manager.current).toBe(1);
	});

	it("should update record when score exceeds it", () => {
		const manager = new ScoreManager();
		manager.add(100);
		expect(manager.record).toBe(100);
	});

	it("should reset score but keep record", () => {
		const manager = new ScoreManager();
		manager.add(50);
		manager.reset();
		expect(manager.current).toBe(0);
		expect(manager.record).toBe(50);
	});
});
```

### 5.2 GitHub Actions CI

```yaml
# .github/workflows/ci.yml
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

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 📅 Roadmap Visual

```
Semana   1    2    3    4    5    6    7    8    9    10
         ├────┴────┼────┴────┼────┴────┼────┴────┼────┴────┤
Fase 1   ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Crítico
Fase 2   ░░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Arquitectura
Fase 3   ░░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░  Tecnología
Fase 4   ░░░░░░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░  Gameplay
Fase 5   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░  Testing/CI
```

---

## 📦 Dependencias Sugeridas

```json
{
	"devDependencies": {
		"vite": "^5.0.0",
		"vitest": "^1.0.0",
		"workbox-cli": "^7.0.0",
		"typescript": "^5.3.0"
	},
	"dependencies": {
		"phaser": "^3.70.0"
	}
}
```

---

## ✅ Checklist de Implementación

### Fase 1 - Crítico

- [ ] Encapsular variables globales en `GameConfig`
- [ ] Implementar máquina de estados
- [ ] Agregar pausa con tecla ESC/X
- [ ] Agregar botón de reinicio

### Fase 2 - Arquitectura

- [ ] Crear estructura de carpetas modular
- [ ] Extraer clase `Fruit`
- [ ] Crear `AudioManager`
- [ ] Crear `ScoreManager`
- [ ] Implementar sistema de eventos

### Fase 3 - Tecnología

- [ ] Configurar Vite
- [ ] Migrar a ES Modules
- [ ] Actualizar Service Worker con Workbox
- [ ] (Opcional) Migrar a TypeScript

### Fase 4 - Gameplay

- [ ] Sistema de dificultad progresiva
- [ ] Agregar power-ups
- [ ] Mejorar animaciones
- [ ] Agregar efectos visuales

### Fase 5 - Testing/CI

- [ ] Configurar Vitest
- [ ] Escribir tests unitarios
- [ ] Configurar GitHub Actions
- [ ] Automatizar deploy a GitHub Pages

---

## 🎯 Métricas de Éxito

| Métrica                | Actual        | Objetivo              |
| ---------------------- | ------------- | --------------------- |
| Lighthouse Performance | ~70           | 95+                   |
| Bundle Size            | ~1MB (Phaser) | <800KB (tree-shaking) |
| Test Coverage          | 0%            | 70%+                  |
| Tiempo de carga        | ~2s           | <1s                   |

---

_Plan creado para Puntos v1.3.9 → v2.0.0_
