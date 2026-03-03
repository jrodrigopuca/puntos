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

### 1.1 Refactorización de Variables Globales y Manejo de Dimensiones

**Problema actual:**

```javascript
// Variables en scope global - mal práctica
let realWidth = window.innerWidth;
let realHeight = window.innerHeight;

// Se usan en múltiples lugares como valores "fijos":
el.x = Phaser.Math.Between(0.1 * realWidth, realWidth - (0.1 * realWidth));
if (el.y > realHeight) { ... }
this.add.text(realWidth - (0.2 * realWidth), 10, '🔇', styleText);
```

**Problemas identificados:**

1. ❌ Variables globales - difícil testear y mantener
2. ❌ Valores capturados al inicio - no responden a rotación de pantalla
3. ❌ UI posicionada con valores absolutos - no se reposiciona al rotar
4. ❌ Límites de detección estáticos - frutas pueden "escapar" tras rotación

**Solución propuesta - Usar `this.scale` de Phaser:**

```javascript
// ✅ CORRECTO: Usar siempre this.scale para dimensiones dinámicas
// Phaser mantiene estos valores actualizados automáticamente

class GameScene extends Phaser.Scene {
	// En lugar de realWidth/realHeight, usar:
	get gameWidth() {
		return this.scale.width;
	}
	get gameHeight() {
		return this.scale.height;
	}

	createElement() {
		// Usar this.scale.width en lugar de realWidth
		const margin = this.scale.width * 0.1;
		const x = Phaser.Math.Between(margin, this.scale.width - margin);
		let el = this.elements.create(x, 0, "elements");
	}

	interactElements() {
		this.elements.children.iterate((el) => {
			// Usar this.scale.height para límite dinámico
			if (el.y > this.scale.height) {
				this.setPoints(0, el);
			}
		});
	}
}
```

**Configuración de Phaser para resize automático:**

```javascript
const config = {
	type: Phaser.AUTO,
	scale: {
		mode: Phaser.Scale.RESIZE, // ← Clave: modo responsive
		parent: "phaser",
		width: "100%",
		height: "100%",
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	// ... resto de config
};
```

**Reposicionar UI al cambiar tamaño:**

```javascript
create() {
    // Escuchar evento de resize de Phaser
    this.scale.on('resize', this.handleResize, this);

    // Crear UI
    this.setupUI();
}

handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    // Reposicionar elementos de UI
    this.myText.setPosition(width * 0.1, 10);
    this.btnAudio.setPosition(width * 0.8, 10);

    // Opcional: reposicionar frutas que estén fuera de límites
    this.elements.children.iterate((el) => {
        if (el.x > width) el.x = width * 0.9;
        if (el.x < 0) el.x = width * 0.1;
    });
}

shutdown() {
    // Limpiar listener al destruir escena
    this.scale.off('resize', this.handleResize, this);
}
```

**Constantes de configuración (separadas):**

```javascript
// src/config/constants.js
export const GameConstants = {
	UI: {
		MARGIN_PERCENT: 0.1, // 10% margen lateral
		AUDIO_BTN_X_PERCENT: 0.8, // Botón audio al 80% del ancho
	},
	GAMEPLAY: {
		MAX_ELEMENTS: 5,
		BASE_SPEED: 1,
		SPEED_MULTIPLIER: 0.1,
		MAX_SPEED: 15,
	},
};
```

**Beneficios:**

- ✅ Responde automáticamente a rotación de pantalla
- ✅ Sin variables globales
- ✅ UI siempre correctamente posicionada
- ✅ Límites de juego siempre precisos
- ✅ Código más testeable y mantenible

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

> **NOTA:** El juego está diseñado para dispositivos móviles (tablets, phones). No se implementarán controles de teclado.

**Implementación con controles táctiles:**

```javascript
// En create()
setupPauseButton() {
    // Botón de pausa en esquina superior (junto al botón de audio)
    const pauseBtn = this.add.text(
        this.scale.width * 0.5,
        10,
        '⏸️',
        this.uiStyle
    );
    pauseBtn.setInteractive();
    pauseBtn.on('pointerdown', () => this.togglePause());

    return pauseBtn;
}

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

showPauseOverlay() {
    // Overlay semi-transparente
    this.pauseOverlay = this.add.rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x000000, 0.7
    );

    // Botón "Continuar" centrado
    this.continueBtn = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2,
        '▶️ CONTINUAR',
        { font: '3em tres', align: 'center' }
    ).setOrigin(0.5);

    this.continueBtn.setInteractive();
    this.continueBtn.on('pointerdown', () => this.togglePause());
}

hidePauseOverlay() {
    if (this.pauseOverlay) this.pauseOverlay.destroy();
    if (this.continueBtn) this.continueBtn.destroy();
}
```

**Consideraciones para móvil:**

- ✅ Botones grandes (mínimo 44x44px) para fácil tap
- ✅ Feedback visual al tocar (scale tween)
- ✅ No depender de gestos complejos
- ✅ Evitar elementos cerca de los bordes (notch, navigation bar)

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

---

### 3.2 ⚠️ Compatibilidad con Phaser 3.60+ (CRÍTICO)

> **IMPORTANTE:** A partir de Phaser 3.60 (lanzado en 2023), hubo cambios significativos (breaking changes) en varias APIs. El código actual y algunas propuestas de este plan usan APIs antiguas que **NO funcionarán** en versiones 3.60+.

#### Breaking Changes Principales

| API Antigua (pre-3.60)                     | API Nueva (3.60+)                              | Impacto                                   |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------- |
| `this.add.particles(textureKey)`           | `this.add.particles(x, y, textureKey, config)` | **ALTO**                                  |
| `particles.createEmitter(config)`          | Ya no existe, el emitter ES el GameObject      | **ALTO**                                  |
| `Phaser.Class({...})`                      | Clases ES6 nativas                             | Medio (sigue funcionando pero deprecated) |
| `emitter.setPosition(x, y).explode(count)` | `emitter.explode(count, x, y)`                 | Bajo                                      |

#### Código Actual (NO compatible con 3.60+)

```javascript
// ❌ API ANTIGUA - NO FUNCIONA EN 3.60+
this.particles = this.add.particles("particles");
this.emitter = this.particles.createEmitter({
	frame: [0, 1, 2, 3, 4],
	speed: 300,
	lifespan: 800,
	on: false,
	maxParticles: 50,
});

// Uso
this.emitter.setPosition(x, y);
this.emitter.explode(5);
```

#### Código Compatible con Phaser 3.60+

```javascript
// ✅ API NUEVA - Phaser 3.60+
// El emitter ahora ES el GameObject directamente
this.emitter = this.add.particles(0, 0, "particles", {
	frame: [0, 1, 2, 3, 4],
	speed: 300,
	lifespan: 800,
	emitting: false, // 'on' cambió a 'emitting'
	maxParticles: 50,
});

// Uso - explode ahora acepta posición directamente
this.emitter.explode(5, x, y);
```

#### Migración de Clases

```javascript
// ❌ ANTIGUA - Phaser.Class (aún funciona pero deprecated)
let GameScene = new Phaser.Class({
	Extends: Phaser.Scene,
	initialize: function GameScene() {
		Phaser.Scene.call(this, { key: "gameScene" });
	},
	preload: function () {},
	create: function () {},
	update: function () {},
});

// ✅ NUEVA - ES6 Class (recomendado)
class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: "gameScene" });
	}

	preload() {}
	create() {}
	update() {}
}
```

#### Tabla de Decisión

| Escenario                        | Recomendación                             |
| -------------------------------- | ----------------------------------------- |
| Proyecto nuevo                   | Usar Phaser 3.80+ con API nueva           |
| Actualizar proyecto existente    | Migrar APIs antes de actualizar           |
| Mantener compatibilidad temporal | Quedarse en Phaser 3.55 mientras se migra |

#### Checklist de Migración a 3.60+

- [ ] Convertir `Phaser.Class` a clases ES6
- [ ] Migrar sistema de partículas a nueva API
- [ ] Cambiar `on: false` por `emitting: false` en emitters
- [ ] Actualizar llamadas a `explode()` con posición
- [ ] Revisar uso de `ParticleEmitterManager` (eliminado)
- [ ] Testear en múltiples navegadores tras migración

#### Recursos de Migración

- [Phaser 3.60 Release Notes](https://phaser.io/news/2023/02/phaser-3.60-release)
- [Particle System Migration Guide](https://newdocs.phaser.io/docs/3.60.0/Phaser.GameObjects.Particles.ParticleEmitter)
- [Phaser 3 Examples (actualizado)](https://phaser.io/examples)

---

## 🟢 Fase 4: Mejoras de Gameplay (Semana 7-8)

### 4.0 Análisis: Diferenciadores y Estrategias de Retención

> ⚠️ **Pregunta crítica:** ¿Qué hace que "Puntos" sea diferente de otros juegos similares? ¿Por qué un jugador volvería?

#### Estado Actual vs Competencia

| Juego               | Hook Principal                       | Tiempo de Sesión | Retención                |
| ------------------- | ------------------------------------ | ---------------- | ------------------------ |
| **Fruit Ninja**     | Slice satisfactorio + explosiones    | 3-5 min          | Modos de juego, combos   |
| **Piano Tiles**     | Sincronización musical perfecta      | 2-3 min          | Canciones desbloqueables |
| **Flappy Bird**     | Loop "una más", frustración adictiva | 30 seg - 2 min   | Récord entre amigos      |
| **2048**            | Pensamiento estratégico              | 5-15 min         | Satisfacción de merge    |
| **Puntos (actual)** | ❓ Ninguno claro                     | Variable         | Solo récord              |

#### Problemas de Retención Actuales

| Problema              | Impacto     | Evidencia                           |
| --------------------- | ----------- | ----------------------------------- |
| Sin feedback "juice"  | ⭐⭐⭐ Alto | Tap fruta = solo texto cambia       |
| Dificultad sin techo  | ⭐⭐⭐ Alto | Se hace imposible, jugador abandona |
| Sin progreso visible  | ⭐⭐ Medio  | Solo un número (récord)             |
| Sin motivación social | ⭐ Bajo     | No hay compartir/competir           |
| Sin variedad          | ⭐⭐ Medio  | Siempre lo mismo                    |

#### 3 Diferenciales Propuestos (Elige 1)

##### Opción A: "Zen Mode" - El anti-stress game

**Concepto:** En lugar de acelerar hasta la frustración, el juego se mantiene relajante y satisfactorio.

| Mecánica                | Implementación                                     |
| ----------------------- | -------------------------------------------------- |
| **Sin game over**       | Las frutas perdidas restan puntos pero no resetean |
| **Velocidad cap**       | Máximo 5 px/frame, nunca imposible                 |
| **Música adaptativa**   | Tempo cambia con puntuación                        |
| **Efectos juice**       | Partículas, sonidos, tweens satisfactorios         |
| **Milestones visuales** | Cada 50 puntos cambia tema/fondo                   |

**Referencia:** Cookie Clicker, Bejeweled Blitz
**Gancho:** "5 minutos de relajación garantizada"

##### Opción B: "Perfect Timing" - El rhythm game

**Concepto:** Las frutas aparecen al ritmo de la música, requieren timing perfecto.

| Mecánica                  | Implementación                       |
| ------------------------- | ------------------------------------ |
| **Spawn sincronizado**    | Frutas en beats de la música         |
| **Zones de timing**       | Perfect/Good/Miss (como Guitar Hero) |
| **Multiplicador**         | Cadena de "Perfect" aumenta puntos   |
| **Tracks desbloqueables** | Cada récord desbloquea nueva canción |
| **Visual feedback**       | Anillos de timing, flash en beat     |

**Referencia:** Piano Tiles, osu!, Cytus
**Gancho:** "Tu sentido del ritmo decidirá tu récord"

##### Opción C: "Endless Ascent" - El incremental game

**Concepto:** Nunca pierdes, siempre progresas. Números grandes satisfactorios.

| Mecánica               | Implementación                               |
| ---------------------- | -------------------------------------------- |
| **Moneda persistente** | Frutas dan "coins" que persisten tras perder |
| **Upgrades**           | Comprar: más tiempo, slow-mo, imanes         |
| **Prestige system**    | Reiniciar por multiplicador permanente       |
| **Idle earnings**      | Ganas coins aunque no juegues                |
| **Meta-progression**   | Desbloquear frutas especiales                |

**Referencia:** Cookie Clicker, Adventure Capitalist
**Gancho:** "Siempre estás mejorando, siempre hay siguiente objetivo"

#### Matriz de Decisión

| Criterio                 | Zen Mode   | Perfect Timing | Endless Ascent | Peso |
| ------------------------ | ---------- | -------------- | -------------- | ---- |
| Facilidad implementación | ⭐⭐⭐⭐   | ⭐⭐           | ⭐⭐⭐         | 30%  |
| Originalidad             | ⭐⭐⭐     | ⭐⭐           | ⭐⭐           | 25%  |
| Retención esperada       | ⭐⭐⭐     | ⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐     | 35%  |
| Match con código actual  | ⭐⭐⭐⭐⭐ | ⭐⭐           | ⭐⭐⭐         | 10%  |
| **TOTAL**                | **3.45**   | **2.65**       | **3.45**       | 100% |

#### Recomendación

**Corto plazo:** Implementar elementos de "Zen Mode" (más fácil, mejor fit con código actual)

- Agregar feedback juice (Fase 5)
- Cap de velocidad máxima
- Milestones cada 50 puntos

**Largo plazo:** Evaluar agregar elementos de "Endless Ascent"

- Sistema de monedas
- Upgrades simples
- Persistencia de progreso

---

### 4.1 ✅ Implementación Zen Mode (Elegido)

> **Decisión:** Se eligió Zen Mode por mejor fit con código actual y facilidad de implementación.

#### Principios de Diseño

| Principio                 | Implementación                                  |
| ------------------------- | ----------------------------------------------- |
| **Nunca frustrar**        | No hay game over abrupto, caída gradual         |
| **Siempre satisfactorio** | Feedback jugoso en cada acción                  |
| **Flow constante**        | Velocidad alcanza plateau, mantiene desafío     |
| **Progreso visible**      | Milestones cada 50 puntos con recompensa visual |

---

### 4.2 Sistema de Penalización Suave

```javascript
// src/managers/ScoreManager.js
export class ScoreManager {
	constructor() {
		this.score = 0;
		this.record = parseInt(localStorage.getItem("record")) || 0;
		this.consecutiveMisses = 0;
	}

	// En lugar de resetear a 0, restar porcentual
	onMiss() {
		this.consecutiveMisses++;

		// Penalización gradual: -10% por primera miss, -20% segunda, etc
		const penalty = Math.floor(this.score * (this.consecutiveMisses * 0.1));
		this.score = Math.max(0, this.score - penalty);

		return penalty; // Para mostrar "-X" al usuario
	}

	onHit() {
		this.consecutiveMisses = 0; // Reset al atrapar
		this.score++;
	}
}
```

**Ejemplo de penalización:**

```
Puntuación: 100
Miss 1: -10 → 90 puntos
Miss 2: -18 → 72 puntos
Hit: consecutiveMisses reset
Miss 1: -7 → 65 puntos
```

---

### 4.3 Velocidad con Plateau (Cap Dinámico)

```javascript
// src/managers/ZenDifficultyManager.js
export class ZenDifficultyManager {
	constructor() {
		this.plateauSpeed = 5; // Velocidad máxima confortable
		this.plateauReached = false;
	}

	getSpeed(score) {
		// Curva logarítmica: crece rápido al inicio, se estabiliza
		const baseSpeed = 1;
		const growth = Math.log(score + 1) * 0.8;

		const speed = Math.min(baseSpeed + growth, this.plateauSpeed);

		if (speed >= this.plateauSpeed && !this.plateauReached) {
			this.plateauReached = true;
			// Trigger evento "Has alcanzado velocidad máxima"
		}

		return speed;
	}

	// Cantidad de frutas aumenta ligeramente
	getFruitCount(score) {
		return Math.min(5 + Math.floor(score / 100), 8); // Max 8 frutas
	}
}
```

**Gráfica de velocidad:**

```
Velocidad (px/frame)
5 |                    --------  Plateau
4 |              ------
3 |        ------
2 |   ----
1 | --
  +--------------------------------
    0   20   40   60   80   100  Puntos
```

---

### 4.4 Sistema de Milestones

```javascript
// src/managers/MilestoneManager.js
export const Milestones = [
	{ at: 50, reward: "theme", value: "SUNSET", message: "🌅 ¡Tema Atardecer!" },
	{ at: 100, reward: "theme", value: "NEON", message: "🌃 ¡Tema Neón!" },
	{
		at: 150,
		reward: "music",
		value: "theme_chill",
		message: "🎵 Nueva música",
	},
	{ at: 200, reward: "theme", value: "FOREST", message: "🌲 ¡Tema Bosque!" },
	{ at: 300, reward: "celebration", value: null, message: "🎉 ¡300 Puntos!" },
	{
		at: 500,
		reward: "god_mode",
		value: 10000,
		message: "⚡ ¡Modo Zen Supremo!",
	},
];

export class MilestoneManager {
	constructor(scene) {
		this.scene = scene;
		this.achieved = new Set();
	}

	check(score) {
		for (const milestone of Milestones) {
			if (score >= milestone.at && !this.achieved.has(milestone.at)) {
				this.achieved.add(milestone.at);
				this.trigger(milestone);
				return milestone;
			}
		}
		return null;
	}

	trigger(milestone) {
		// Mostrar mensaje grande
		this.scene.events.emit("milestone-reached", milestone);

		// Aplicar recompensa
		switch (milestone.reward) {
			case "theme":
				this.scene.changeTheme(milestone.value);
				break;
			case "music":
				this.scene.audioManager.changeTrack(milestone.value);
				break;
			case "celebration":
				this.scene.feedbackManager.showNewRecord();
				break;
			case "god_mode":
				this.scene.startGodMode(milestone.value);
				break;
		}
	}
}
```

---

### 4.5 Música Adaptativa

```javascript
// src/managers/AudioManager.js (expandido)
export class AudioManager {
	constructor(scene) {
		this.scene = scene;
		this.currentTrack = null;
		this.tracks = {
			theme_classic: { file: "tema.mp3", bpm: 120 },
			theme_chill: { file: "tema_chill.mp3", bpm: 90 },
			theme_intense: { file: "tema_intense.mp3", bpm: 140 },
		};
	}

	// Cambiar tempo según puntuación (sin cambiar canción)
	adjustTempo(score) {
		if (!this.currentTrack) return;

		// Rango: 0.8x a 1.2x
		const rate = 0.8 + (Math.min(score, 100) / 100) * 0.4;
		this.currentTrack.setRate(rate);
	}

	// O cambiar canción completa en milestone
	changeTrack(trackKey) {
		if (this.currentTrack) {
			this.scene.tweens.add({
				targets: this.currentTrack,
				volume: 0,
				duration: 1000,
				onComplete: () => {
					this.currentTrack.stop();
					this.playTrack(trackKey);
				},
			});
		}
	}
}
```

---

### 4.6 Checklist de Implementación Zen Mode

- [ ] Implementar `ScoreManager` con penalización suave (-10% por miss)
- [ ] `ZenDifficultyManager` con velocidad plateau a 5 px/frame
- [ ] `MilestoneManager` con 6 milestones (50, 100, 150, 200, 300, 500)
- [ ] Crear 3 temas de color adicionales (ver Fase 5)
- [ ] Música adaptativa: ajustar tempo según score
- [ ] Mensaje flotante al alcanzar plateau "¡Velocidad máxima!"
- [ ] Animación especial en cada milestone
- [ ] Configurar spawning gradual de frutas (5 → 8 máximo)

---

## 🎨 Fase 5: Mejoras de UI/UX (Semana 9-10)

Esta fase se enfoca en crear una experiencia visual y de usuario comparable a juegos casuales exitosos del mercado.

### 5.1 Juegos de Inspiración

#### 🍉 Fruit Ninja (Halfbrick Studios)

**Por qué estudiarlo:** Referente absoluto en juegos de tap/swipe con objetos que caen.

| Elemento         | Qué aprender                      | Aplicación en Puntos              |
| ---------------- | --------------------------------- | --------------------------------- |
| Slice effects    | Trails visuales al cortar         | Efecto de estela al tocar fruta   |
| Juice explosions | Partículas específicas por fruta  | Colores de partículas según fruta |
| Combo system     | "+3" texto flotante con animación | Mostrar puntos ganados flotando   |
| Critical hit     | Slow-motion al cortar múltiples   | Pequeño freeze frame al combo     |
| Background       | Fondos temáticos que cambian      | Fondo dinámico según puntuación   |

**Link:** [Fruit Ninja Classic](https://fruitninja.com/)

---

#### 🎹 Piano Tiles (Cheetah Games)

**Por qué estudiarlo:** Maestro en dificultad progresiva y feedback táctil.

| Elemento         | Qué aprender                      | Aplicación en Puntos            |
| ---------------- | --------------------------------- | ------------------------------- |
| Speed ramp       | Incremento suave de velocidad     | Curva de dificultad más gradual |
| Miss feedback    | Pantalla roja + sonido distintivo | Flash rojo al perder puntos     |
| Score animation  | Números que "saltan" al aumentar  | Tween en contador de puntos     |
| Streak indicator | Barra de progreso de combo        | Mostrar racha actual            |

**Link:** [Piano Tiles 2](https://www.pianotiles2.io/)

---

#### 🐦 Flappy Bird (dotGears)

**Por qué estudiarlo:** Simplicidad extrema, loop de retry adictivo.

| Elemento        | Qué aprender                     | Aplicación en Puntos     |
| --------------- | -------------------------------- | ------------------------ |
| One-tap restart | Reinicio inmediato sin menús     | Tap anywhere to restart  |
| Medal system    | Bronce/Plata/Oro por récords     | Badges por milestones    |
| Death animation | Caída dramática al morir         | Animación de "game over" |
| Minimalist UI   | Solo score visible durante juego | Ocultar UI innecesaria   |

---

#### 🚗 Crossy Road (Hipster Whale)

**Por qué estudiarlo:** Monetización elegante, personalización, estética pixel art.

| Elemento         | Qué aprender                    | Aplicación en Puntos             |
| ---------------- | ------------------------------- | -------------------------------- |
| Character unlock | Personajes desbloqueables       | Diferentes tipos de frutas/skins |
| Coin collection  | Moneda secundaria durante juego | Recolectar items especiales      |
| Daily rewards    | Incentivo para volver           | Sistema de racha diaria          |
| Voxel aesthetic  | Estilo visual distintivo        | Mantener estética pixel art      |

**Link:** [Crossy Road](https://www.crossyroad.com/)

---

#### 💎 Candy Crush (King)

**Por qué estudiarlo:** Feedback sensorial excepcional, celebraciones.

| Elemento        | Qué aprender                      | Aplicación en Puntos                 |
| --------------- | --------------------------------- | ------------------------------------ |
| Cascade effects | Reacciones en cadena visuales     | Combo de múltiples frutas            |
| Sweet sounds    | Sonidos satisfactorios por acción | Audio design variado                 |
| Level complete  | Celebración exagerada al ganar    | Confetti/celebración en nuevo récord |
| Haptic feedback | Vibración contextual              | Patrones de vibración diferentes     |

---

#### 🔺 Geometry Dash (RobTop Games)

**Por qué estudiarlo:** Sincronización con música, colores vibrantes.

| Elemento      | Qué aprender                    | Aplicación en Puntos      |
| ------------- | ------------------------------- | ------------------------- |
| Music sync    | Eventos visuales al ritmo       | Frutas aparecen al beat   |
| Color schemes | Paletas vibrantes cambiantes    | Temas de color por nivel  |
| Practice mode | Modo para practicar sin penalty | Modo "zen" sin puntuación |

---

### 5.2 Implementación de UI Dinámica

#### Sistema de Feedback Visual

```javascript
// src/ui/FeedbackManager.js
export class FeedbackManager {
	constructor(scene) {
		this.scene = scene;
	}

	// Texto flotante "+1" estilo Fruit Ninja
	showFloatingScore(x, y, points) {
		const text = this.scene.add.text(x, y, `+${points}`, {
			font: "32px tres",
			fill: "#FFD700",
			stroke: "#000",
			strokeThickness: 4,
		});

		this.scene.tweens.add({
			targets: text,
			y: y - 80,
			alpha: 0,
			scale: 1.5,
			duration: 800,
			ease: "Power2",
			onComplete: () => text.destroy(),
		});
	}

	// Flash rojo al perder (Piano Tiles)
	showMissFlash() {
		const flash = this.scene.add.rectangle(
			0,
			0,
			this.scene.scale.width * 2,
			this.scene.scale.height * 2,
			0xff0000,
			0.3,
		);

		this.scene.tweens.add({
			targets: flash,
			alpha: 0,
			duration: 300,
			onComplete: () => flash.destroy(),
		});
	}

	// Celebración de nuevo récord (Candy Crush)
	// ⚠️ API compatible con Phaser 3.60+
	showNewRecord() {
		// Confetti particles - Nueva API 3.60+
		const emitter = this.scene.add.particles(
			this.scene.scale.width / 2, // x inicial
			-50, // y inicial
			"particles", // texture key
			{
				frame: [0, 1, 2, 3, 4],
				x: {
					min: -this.scene.scale.width / 2,
					max: this.scene.scale.width / 2,
				},
				speed: { min: 100, max: 200 },
				angle: { min: 80, max: 100 },
				lifespan: 3000,
				quantity: 3,
				frequency: 50,
				maxParticles: 100,
				emitting: true,
			},
		);

		this.scene.time.delayedCall(2000, () => {
			emitter.stop();
			this.scene.time.delayedCall(3000, () => emitter.destroy());
		});
	}

	// Camera shake al perder racha (Flappy Bird)
	shakeOnMiss() {
		this.scene.cameras.main.shake(200, 0.01);
	}
}
```

#### Sistema de Combo

```javascript
// src/managers/ComboManager.js
export class ComboManager {
	constructor(scene) {
		this.scene = scene;
		this.combo = 0;
		this.lastHitTime = 0;
		this.comboWindow = 2000; // 2 segundos para mantener combo
	}

	hit() {
		const now = Date.now();
		if (now - this.lastHitTime < this.comboWindow) {
			this.combo++;
		} else {
			this.combo = 1;
		}
		this.lastHitTime = now;
		return this.getMultiplier();
	}

	getMultiplier() {
		if (this.combo >= 10) return 3; // 🔥 FIRE!
		if (this.combo >= 5) return 2; // ⚡ GREAT!
		if (this.combo >= 3) return 1.5; // ✨ NICE!
		return 1;
	}

	reset() {
		this.combo = 0;
	}
}
```

---

### 5.3 Paleta de Colores y Temas

```javascript
// src/config/themes.js
export const Themes = {
	CLASSIC: {
		name: "Classic",
		background: 0x87ceeb,
		fruits: [0xffaaaa, 0xac93de, 0xffdd55, 0xffffff],
		particles: [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3],
	},
	SUNSET: {
		name: "Sunset",
		background: 0xff6b6b,
		fruits: [0xffeaa7, 0xdfe6e9, 0xfd79a8, 0x00cec9],
		particles: [0xfdcb6e, 0xe17055, 0xd63031, 0xe84393],
	},
	NEON: {
		name: "Neon",
		background: 0x1a1a2e,
		fruits: [0x00ff88, 0xff0080, 0x00d4ff, 0xffff00],
		particles: [0x00ff88, 0xff0080, 0x00d4ff, 0xffff00],
	},
	FOREST: {
		name: "Forest",
		background: 0x2d5016,
		fruits: [0x8bc34a, 0xcddc39, 0xffeb3b, 0xff9800],
		particles: [0x689f38, 0x9e9d24, 0xf9a825, 0xef6c00],
	},
};
```

---

### 5.4 Transiciones de Escena

```javascript
// Fade out suave entre escenas
this.cameras.main.fadeOut(500, 0, 0, 0);
this.cameras.main.once('camerafadeoutcomplete', () => {
    this.scene.start('GameOverScene');
});

// Fade in al entrar
create() {
    this.cameras.main.fadeIn(500, 0, 0, 0);
}
```

---

### 5.5 Checklist UI/UX

- [ ] Texto flotante "+N" al ganar puntos
- [ ] Flash rojo al perder puntos
- [ ] Camera shake en miss
- [ ] Confetti en nuevo récord
- [ ] Sistema de combo con multiplicador
- [ ] Indicador visual de racha
- [ ] Transiciones fade entre escenas
- [ ] Al menos 3 temas de color
- [ ] Sonidos diferenciados por acción
- [ ] Haptic feedback contextual

---

### 5.6 ⚠️ Revisión de Assets (REQUERIDO)

> **NOTA IMPORTANTE:** Antes de implementar las mejoras de UI/UX, se requiere una revisión completa de los assets existentes y definir los nuevos necesarios.

#### Assets Actuales a Evaluar

| Asset                 | Ubicación | Estado            | Acción                     |
| --------------------- | --------- | ----------------- | -------------------------- |
| `elementos.png`       | `img/`    | Spritesheet 75x75 | ¿Rediseñar? ¿Más variedad? |
| `files.png`           | `img/`    | Partículas 25x25  | Evaluar para nuevos temas  |
| `favicon.svg`         | `img/`    | OK                | Mantener                   |
| `tema.mp3`            | `audio/`  | Música de fondo   | ¿Agregar más tracks?       |
| `accept.mp3`          | `audio/`  | SFX punto         | Necesita variantes         |
| `8BitArtSansNeue.ttf` | `font/`   | Fuente retro      | Evaluar legibilidad        |

> **Nota:** Los archivos `icons-192.png`, `icons-512.png`, `manifest.json` y `service-worker.js` pueden eliminarse (eran para PWA, ya deprecado).

#### Assets Nuevos Requeridos

```
img/
├── fruits/
│   ├── apple.png         # Frutas individuales (más detalle)
│   ├── orange.png
│   ├── grape.png
│   ├── watermelon.png
│   └── banana.png
├── particles/
│   ├── confetti.png      # Para celebraciones
│   ├── sparkle.png       # Para combos
│   └── splash.png        # Efecto juice (Fruit Ninja style)
├── ui/
│   ├── button_play.png
│   ├── button_pause.png
│   ├── button_restart.png
│   ├── medal_bronze.png
│   ├── medal_silver.png
│   └── medal_gold.png
└── backgrounds/
    ├── bg_classic.png
    ├── bg_sunset.png
    ├── bg_neon.png
    └── bg_forest.png

audio/
├── sfx/
│   ├── collect_1.mp3     # Variantes de sonido
│   ├── collect_2.mp3
│   ├── collect_3.mp3
│   ├── combo.mp3         # Sonido de combo
│   ├── miss.mp3          # Sonido al fallar
│   ├── record.mp3        # Nuevo récord
│   └── button_click.mp3
└── music/
    ├── theme_classic.mp3
    ├── theme_intense.mp3  # Para alta dificultad
    └── theme_menu.mp3
```

#### Especificaciones Técnicas

| Tipo         | Formato            | Tamaño Recomendado                 | Notas                  |
| ------------ | ------------------ | ---------------------------------- | ---------------------- |
| Sprites      | PNG (transparente) | 128x128 o 256x256                  | Múltiplo de 2 para GPU |
| Spritesheets | PNG                | Potencia de 2 (512x512, 1024x1024) | Texture packing        |
| Fondos       | PNG/WebP           | 1920x1080                          | Considerar tiling      |
| Audio SFX    | MP3/OGG            | <100KB cada uno                    | Cortos, punchy         |
| Audio Música | MP3/OGG            | <2MB                               | Loopeable              |

#### Herramientas Sugeridas

- **Sprites:** Aseprite, Piskel (pixel art), Figma
- **Spritesheets:** TexturePacker, ShoeBox
- **Audio:** Audacity, BFXR (SFX retro), Freesound.org
- **Compresión:** TinyPNG, Squoosh

#### Checklist de Assets

- [ ] Auditar assets actuales (calidad, tamaño, formato)
- [ ] Definir style guide visual (paleta, estilo pixel art vs vector)
- [ ] Crear/obtener nuevas frutas con más detalle
- [ ] Diseñar partículas para cada tema
- [ ] Crear elementos de UI (botones, medallas)
- [ ] Grabar/obtener SFX variados
- [ ] Considerar música adicional o dinámica
- [ ] Optimizar todos los assets para web (compresión)
- [ ] Generar spritesheets optimizados

---

## 🟢 Fase 6: Testing y CI/CD (Semana 11-12)

### 6.1 Setup de Testing

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

### 6.2 GitHub Actions CI

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
Semana   1    2    3    4    5    6    7    8    9    10   11   12
         ├────┴────┼────┴────┼────┴────┼────┴────┼────┴────┼────┴────┤
Fase 1   ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Crítico
Fase 2   ░░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Arquitectura
Fase 3   ░░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Tecnología
Fase 4   ░░░░░░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░  Gameplay
Fase 5   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░░  UI/UX
Fase 6   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░░░  Testing/CI
```

---

## 📦 Dependencias Sugeridas

```json
{
	"devDependencies": {
		"vite": "^5.0.0",
		"vitest": "^1.0.0"
	},
	"dependencies": {
		"phaser": "^3.80.0"
	}
}
```

> ⚠️ **Nota:** Phaser 3.80+ requiere migrar el código a la nueva API de partículas y usar clases ES6. Ver sección 3.2 para guía de migración.

---

## ✅ Checklist de Implementación

### Fase 1 - Crítico

- [ ] Eliminar variables globales `realWidth`/`realHeight`
- [ ] Usar `this.scale.width`/`this.scale.height` en todo el código
- [ ] Configurar `Phaser.Scale.RESIZE` para responsive automático
- [ ] Implementar `handleResize()` para reposicionar UI
- [ ] Extraer constantes a `GameConstants` (márgenes, velocidades)
- [ ] Implementar máquina de estados
- [ ] Agregar botón de pausa (control táctil, NO teclado)
- [ ] Agregar botón de reinicio (control táctil)

### Fase 2 - Arquitectura

- [ ] Crear estructura de carpetas modular
- [ ] Extraer clase `Fruit`
- [ ] Crear `AudioManager`
- [ ] Crear `ScoreManager`
- [ ] Implementar sistema de eventos

### Fase 3 - Tecnología

- [ ] Configurar Vite
- [ ] Migrar a ES Modules
- [ ] **Migrar `Phaser.Class` a clases ES6**
- [ ] **Migrar sistema de partículas a API 3.60+**
- [ ] **Actualizar Phaser a versión 3.80+**

### Fase 4 - Gameplay (Zen Mode ✅)

- [x] **DECISIÓN:** Zen Mode elegido
- [ ] Implementar `ScoreManager` con penalización suave (-10% por miss)
- [ ] Implementar `ZenDifficultyManager` (velocidad plateau 5 px/frame)
- [ ] Implementar `MilestoneManager` (6 milestones: 50, 100, 150, 200, 300, 500)
- [ ] Música adaptativa: ajustar tempo según puntuación
- [ ] Crear assets para 3 temas adicionales (Sunset, Neon, Forest)
- [ ] Mensaje flotante al alcanzar plateau "¡Velocidad máxima!"
- [ ] Animaciones especiales en cada milestone
- [ ] Configurar spawning gradual (5 → 8 frutas máximo)

### Fase 5 - UI/UX (Zen Mode)

- [ ] Implementar FeedbackManager (texto flotante "+N", flash rojo)
- [ ] Camera shake suave en miss (feedback sin frustrar)
- [ ] Celebración en milestones (confetti, mensaje grande)
- [ ] Crear 4 temas de color completos (Classic, Sunset, Neon, Forest)
- [ ] Transiciones fade suaves entre temas
- [ ] Haptic feedback diferenciado (hit vs miss)
- [ ] Animaciones de frutas "juice" (squash & stretch, partículas)
- [ ] Mensaje de "plateau alcanzado" con efecto especial

### Fase 6 - Testing/CI

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
