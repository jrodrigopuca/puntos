import Phaser from "phaser";
import { GameConstants, GameState } from "../config/constants.js";
import { getTheme } from "../config/themes.js";
import ScoreManager from "../managers/ScoreManager.js";
import ZenDifficultyManager from "../managers/ZenDifficultyManager.js";
import MilestoneManager from "../managers/MilestoneManager.js";
import FeedbackManager from "../managers/FeedbackManager.js";
import UIManager from "../managers/UIManager.js";
import BackgroundManager from "../managers/BackgroundManager.js";

/**
 * Escena principal del juego - Zen Mode
 */
export default class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: "gameScene", active: true });

		// Estado del juego
		this.currentState = GameState.LOADING;

		// Managers (se inicializan en create)
		this.scoreManager = null;
		this.difficultyManager = null;
		this.milestoneManager = null;
		this.feedbackManager = null;
		this.uiManager = null;
		this.backgroundManager = null;

		// Tracking
		this.plateauMessageShown = false;
		this.lastRecord = 0;

		// Referencias de UI (overlay de pausa)
		this.pauseOverlay = null;
		this.pauseContainer = null;

		// Elementos del juego
		this.fruits = null;
		this.emitter = null;

		// Audio
		this.isMuted = true;
		this.music = null;
		this.sfxBell = null;
	}

	/**
	 * Carga assets y muestra barra de progreso arcade
	 */
	preload() {
		const barHeight = 8;
		const barY = this.scale.height / 2;

		// Borde de la barra (neon cyan)
		const progressBorder = this.add.graphics();
		progressBorder.lineStyle(2, 0x00ffff, 0.8);
		progressBorder.strokeRect(
			this.scale.width * 0.1,
			barY - barHeight / 2,
			this.scale.width * 0.8,
			barHeight,
		);

		// Texto LOADING
		const loadText = this.add
			.text(this.scale.width / 2, barY - 30, "LOADING", {
				fontFamily: "tres, monospace",
				fontSize: "18px",
				color: "#00ffff",
			})
			.setOrigin(0.5);

		const progressBar = this.add.graphics();
		this.load.on("progress", (value) => {
			progressBar.clear();
			progressBar.fillStyle(0x00ffff, 1);
			progressBar.fillRect(
				this.scale.width * 0.1,
				barY - barHeight / 2,
				this.scale.width * 0.8 * value,
				barHeight,
			);
		});

		this.load.on("complete", () => {
			progressBar.destroy();
			progressBorder.destroy();
			loadText.destroy();
		});

		// Cargar assets desde public/
		this.load.audio("song", ["audio/tema.mp3"]);
		this.load.audio("bell", ["audio/accept.mp3"]);
		this.load.spritesheet("elements", "img/elementos.png", {
			frameWidth: 32,
			frameHeight: 32,
		});
		this.load.spritesheet("particles", "img/files.png", {
			frameWidth: 8,
			frameHeight: 8,
		});

		// Cargar iconos de UI
		this.load.svg("icon-pause", "img/ui/icon-pause.svg");
		this.load.svg("icon-play", "img/ui/icon-play.svg");
		this.load.svg("icon-sound-on", "img/ui/icon-sound-on.svg");
		this.load.svg("icon-sound-off", "img/ui/icon-sound-off.svg");
		this.load.svg("icon-fruit", "img/ui/icon-fruit.svg");
		this.load.svg("icon-trophy", "img/ui/icon-trophy.svg");
	}

	/**
	 * Crea la escena del juego
	 */
	create() {
		// Inicializar managers
		this.scoreManager = new ScoreManager(this);
		this.difficultyManager = new ZenDifficultyManager();
		this.milestoneManager = new MilestoneManager(this);
		this.feedbackManager = new FeedbackManager(this);
		this.uiManager = new UIManager(this);
		this.backgroundManager = new BackgroundManager(this);

		// Guardar record inicial para detectar nuevo récord
		this.lastRecord = this.scoreManager.getRecord();

		// Suscribirse a eventos de los managers
		this.events.on("scoreChanged", this.onScoreChanged, this);
		this.events.on("scorePenalty", this.onScorePenalty, this);
		this.events.on("milestoneReached", this.onMilestoneReached, this);

		// Crear fondo dinámico starfield
		this.backgroundManager.create();

		// Crear UI con paneles integrados
		this.uiManager.create(
			this.scoreManager.getScore(),
			this.scoreManager.getRecord(),
		);

		// Audio
		this.music = this.sound.add("song");
		this.music.loop = true;
		this.music.stop();
		this.sfxBell = this.sound.add("bell");
		this.sfxBell.stop();

		// Sistema de partículas (API Phaser 3.60+)
		this.emitter = this.add.particles(0, 0, "particles", {
			frame: [0, 1, 2, 3, 4],
			speed: GameConstants.PARTICLES.SPEED,
			lifespan: GameConstants.PARTICLES.LIFESPAN,
			scale: { start: 3, end: 0 },
			emitting: false,
		});

		// Grupo de frutas
		this.fruits = this.add.group({
			defaultKey: "elements",
			maxSize: GameConstants.GAMEPLAY.MAX_FRUITS,
			runChildUpdate: false,
		});

		// Spawn inicial de frutas
		this.time.addEvent({
			delay: GameConstants.GAMEPLAY.SPAWN_DELAY,
			repeat: GameConstants.GAMEPLAY.MAX_FRUITS - 1,
			loop: false,
			callback: () => {
				this.spawnFruit();
			},
		});

		// Escuchar cambios de tamaño
		this.scale.on("resize", this.handleResize, this);

		// Cambiar estado a jugando
		this.setState(GameState.PLAYING);
	}

	/**
	 * Cambia el estado del juego
	 */
	setState(newState) {
		this.currentState = newState;
		this.events.emit("stateChanged", newState);
	}

	/**
	 * Toggle del estado de pausa
	 */
	togglePause() {
		if (this.currentState === GameState.PLAYING) {
			this.setState(GameState.PAUSED);
			this.uiManager.setPaused(true);
			this.showPauseOverlay();
		} else if (this.currentState === GameState.PAUSED) {
			this.setState(GameState.PLAYING);
			this.uiManager.setPaused(false);
			this.hidePauseOverlay();
		}
	}

	/**
	 * Muestra overlay de pausa con botón de continuar (estilo arcade neon)
	 */
	showPauseOverlay() {
		const centerX = this.scale.width / 2;
		const centerY = this.scale.height / 2;
		const pixelFont = "tres, monospace";

		// Fondo oscuro CRT
		this.pauseOverlay = this.add.rectangle(
			centerX,
			centerY,
			this.scale.width,
			this.scale.height,
			0x000000,
			0.8,
		);
		this.pauseOverlay.setDepth(200);

		// Container para botón de continuar
		this.pauseContainer = this.add.container(centerX, centerY);
		this.pauseContainer.setDepth(201);

		// Texto "PAUSA" arriba (neon cyan)
		const pauseTitle = this.add
			.text(0, -80, "PAUSA", {
				fontFamily: pixelFont,
				fontSize: "36px",
				color: "#00ffff",
				stroke: "#000000",
				strokeThickness: 4,
			})
			.setOrigin(0.5);
		this.pauseContainer.add(pauseTitle);

		// Botón cuadrado arcade neon
		const btnSize = 80;
		const btnBg = this.add.rectangle(0, 0, btnSize, btnSize, 0x0a0a2e, 0.9);
		btnBg.setInteractive({ useHandCursor: true });
		this.pauseContainer.add(btnBg);

		// Borde neón del botón
		const border = this.add.graphics();
		border.lineStyle(3, 0x00ffff, 0.8);
		border.strokeRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize);
		this.pauseContainer.add(border);

		// Icono de play
		const playIcon = this.add.image(0, 0, "icon-play").setDisplaySize(48, 48);
		this.pauseContainer.add(playIcon);

		// Texto "CONTINUAR" (neon)
		const continueText = this.add
			.text(0, 70, "CONTINUAR", {
				fontFamily: pixelFont,
				fontSize: "22px",
				color: "#33ff33",
				stroke: "#000000",
				strokeThickness: 3,
			})
			.setOrigin(0.5);
		this.pauseContainer.add(continueText);

		// Efectos hover arcade
		btnBg.on("pointerover", () => btnBg.setFillStyle(0x00ffff, 0.2));
		btnBg.on("pointerout", () => btnBg.setFillStyle(0x0a0a2e, 0.9));
		btnBg.on("pointerdown", () => this.togglePause());
	}

	/**
	 * Oculta overlay de pausa
	 */
	hidePauseOverlay() {
		if (this.pauseOverlay) {
			this.pauseOverlay.destroy();
			this.pauseOverlay = null;
		}
		if (this.pauseContainer) {
			this.pauseContainer.destroy();
			this.pauseContainer = null;
		}
	}

	/**
	 * Reposiciona UI al cambiar tamaño
	 */
	handleResize(gameSize) {
		const { width, height } = gameSize;

		// Reposicionar overlay de pausa si existe
		if (this.pauseOverlay) {
			this.pauseOverlay.setSize(width, height);
			this.pauseOverlay.setPosition(width / 2, height / 2);
		}

		if (this.pauseContainer) {
			this.pauseContainer.setPosition(width / 2, height / 2);
		}
	}

	/**
	 * Handler: Actualiza UI cuando cambia el puntaje
	 */
	onScoreChanged(score, record) {
		// Actualizar UI con UIManager
		this.uiManager.updateScore(score);

		// Verificar nuevo récord
		if (record > this.lastRecord) {
			this.lastRecord = record;
			this.uiManager.updateRecord(record);
			this.feedbackManager.showNewRecord();
		}

		// Verificar milestones
		this.milestoneManager.checkMilestone(score);

		// Actualizar tema según milestone con transición suave
		const theme = this.milestoneManager.getCurrentTheme(score);
		this.feedbackManager.setTheme(theme.name);
		this.feedbackManager.transitionBackground(theme.color);
		this.backgroundManager.setTheme(theme.name);

		// Verificar plateau
		if (
			this.difficultyManager.hasReachedPlateau() &&
			!this.plateauMessageShown
		) {
			this.plateauMessageShown = true;
			this.feedbackManager.showPlateauMessage();
		}
	}

	/**
	 * Handler: Muestra feedback visual cuando hay penalización
	 */
	onScorePenalty(penalty, consecutiveMisses) {
		if (penalty > 0) {
			// Vibrar suavemente
			window.navigator.vibrate?.(200 * consecutiveMisses);

			// Flash rojo en pantalla
			this.feedbackManager.showMissFlash();

			// Camera shake proporcional a misses consecutivos
			this.feedbackManager.shakeCamera(0.005 * consecutiveMisses, 150);

			// Mostrar texto de penalización flotante
			this.feedbackManager.showFloatingScore(
				this.scale.width / 2,
				this.scale.height / 2,
				penalty,
				false,
			);
		}
	}

	/**
	 * Handler: Celebra cuando se alcanza un milestone
	 */
	onMilestoneReached(milestone) {
		// Mostrar mensaje de milestone con animación mejorada
		this.feedbackManager.showMilestoneMessage(
			milestone.title,
			milestone.message,
		);

		// Efecto de partículas celebración
		this.emitter.setPosition(this.scale.width / 2, this.scale.height / 2);
		this.emitter.explode(30);

		// Burst de estrellas en el fondo
		this.backgroundManager.burst(12);

		// Sonido si no está silenciado
		if (!this.isMuted) {
			this.sfxBell.play();
		}
	}

	/**
	 * Reposiciona una fruta al inicio de la pantalla
	 */
	resetFruit(fruit) {
		const margin = this.scale.width * GameConstants.UI.MARGIN_PERCENT;
		fruit.x = Phaser.Math.Between(margin, this.scale.width - margin);
		fruit.y = -40;

		// Nuevos parámetros aleatorios de movimiento
		fruit.setData("baseX", fruit.x);
		fruit.setData("wobbleAmp", Phaser.Math.Between(15, 35));
		fruit.setData("wobbleSpeed", Phaser.Math.FloatBetween(0.015, 0.03));
		fruit.setData("wobblePhase", Math.random() * Math.PI * 2);
		fruit.setData("rotSpeed", Phaser.Math.FloatBetween(-0.02, 0.02));

		// Animación de entrada
		fruit.setScale(0);
		this.tweens.add({
			targets: fruit,
			scaleX: fruit.getData("targetScale") || 2.5,
			scaleY: fruit.getData("targetScale") || 2.5,
			duration: 300,
			ease: "Back.easeOut",
		});

		// Reposicionar glow
		if (fruit.getData("glow")) {
			const glow = fruit.getData("glow");
			glow.setPosition(fruit.x, fruit.y + 40);
			glow.setAlpha(0.25);
		}
	}

	/**
	 * Crea una nueva fruta con animaciones y glow
	 */
	spawnFruit() {
		if (this.fruits.isFull()) return;

		const margin = this.scale.width * GameConstants.UI.MARGIN_PERCENT;
		const x = Phaser.Math.Between(margin, this.scale.width - margin);
		const fruit = this.fruits.create(
			x,
			-40,
			"elements",
			Phaser.Math.Between(0, GameConstants.GAMEPLAY.FRUIT_TYPES - 1),
		);
		fruit.setName("fruit" + this.fruits.getLength());

		// Escalar sprite pixel-art (32px → 80px display, 2.5x crisp)
		const targetScale = 2.5;
		fruit.setScale(0);
		fruit.setData("targetScale", targetScale);

		// Animación de entrada (pop-in con bounce)
		this.tweens.add({
			targets: fruit,
			scaleX: targetScale,
			scaleY: targetScale,
			duration: 350,
			ease: "Back.easeOut",
		});

		// Datos de movimiento (wobble + rotación)
		fruit.setData("baseX", x);
		fruit.setData("wobbleAmp", Phaser.Math.Between(15, 35));
		fruit.setData("wobbleSpeed", Phaser.Math.FloatBetween(0.015, 0.03));
		fruit.setData("wobblePhase", Math.random() * Math.PI * 2);
		fruit.setData("rotSpeed", Phaser.Math.FloatBetween(-0.02, 0.02));

		// Resplandor neón debajo de la fruta
		const glow = this.add.ellipse(x, -40 + 40, 50, 16, 0x00ffff, 0.25);
		glow.setDepth(-1);
		fruit.setData("glow", glow);

		// Detectar click - usar ScoreManager
		fruit.setInteractive();
		fruit.setVisible(true);
		fruit.on("pointerdown", (pointer) => {
			this.scoreManager.onCatch();
			this.resetFruit(fruit);

			// Feedback positivo con texto flotante
			this.feedbackManager.showFloatingScore(pointer.x, pointer.y, 1, true);

			// Sonido
			if (!this.isMuted) {
				this.sfxBell.play();
			}

			// Emitir partículas en posición del tap
			this.emitter.setPosition(pointer.x, pointer.y);
			this.emitter.explode(GameConstants.PARTICLES.EMIT_COUNT);
		});
	}

	/**
	 * Revisa frutas fuera de límites - penalización Zen Mode
	 */
	checkFruitsOutOfBounds() {
		this.fruits.children.iterate((fruit) => {
			if (fruit && fruit.y > this.scale.height) {
				// Penalización suave en lugar de reset a 0
				this.scoreManager.onMiss();
				this.resetFruit(fruit);
			}
		});
	}

	/**
	 * Loop principal del juego - usa ZenDifficultyManager
	 */
	update(time, delta) {
		// El fondo siempre se anima (incluso en pausa)
		this.backgroundManager.update();

		if (this.currentState !== GameState.PLAYING) {
			return;
		}

		// Obtener velocidad del ZenDifficultyManager (curva logarítmica con plateau)
		const speed = this.difficultyManager.getSpeed(this.scoreManager.getScore());

		// Mover frutas con wobble y rotación
		this.fruits.children.iterate((fruit) => {
			if (!fruit) return;

			// Caída vertical
			fruit.y += speed;

			// Wobble horizontal (onda seno)
			const phase = fruit.getData("wobblePhase") || 0;
			const amp = fruit.getData("wobbleAmp") || 20;
			const wobbleSpeed = fruit.getData("wobbleSpeed") || 0.02;
			const baseX = fruit.getData("baseX") || fruit.x;
			fruit.setData("wobblePhase", phase + wobbleSpeed);
			fruit.x = baseX + Math.sin(phase) * amp;

			// Rotación suave
			const rotSpeed = fruit.getData("rotSpeed") || 0;
			fruit.rotation += rotSpeed;

			// Actualizar glow
			const glow = fruit.getData("glow");
			if (glow) {
				glow.x = fruit.x;
				glow.y = fruit.y + 40;
				// Pulso sutil de opacidad
				glow.alpha = 0.15 + Math.sin(phase * 2) * 0.1;
			}
		});

		this.checkFruitsOutOfBounds();
	}
}
