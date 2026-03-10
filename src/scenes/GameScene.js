import Phaser from "phaser";
import { GameConstants, GameState } from "../config/constants.js";
import { getTheme } from "../config/themes.js";
import ScoreManager from "../managers/ScoreManager.js";
import ZenDifficultyManager from "../managers/ZenDifficultyManager.js";
import MilestoneManager from "../managers/MilestoneManager.js";
import FeedbackManager from "../managers/FeedbackManager.js";
import UIManager from "../managers/UIManager.js";
import BackgroundManager from "../managers/BackgroundManager.js";
import GoldenFruitManager from "../managers/GoldenFruitManager.js";
import StartScreenManager from "../managers/StartScreenManager.js";
import ShareManager from "../managers/ShareManager.js";
import SynthAudio from "../audio/SynthAudio.js";
import SynthMusic from "../audio/SynthMusic.js";

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
		this.goldenFruitManager = null;
		this.startScreenManager = null;
		this.shareManager = null;

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
		this.synth = null;
	}

	/**
	 * Carga assets y muestra barra de progreso arcade mejorada
	 */
	preload() {
		const { width, height } = this.scale;
		const centerX = width / 2;
		const centerY = height / 2;
		const barHeight = 12;
		const barWidth = width * 0.7;
		const barX = centerX - barWidth / 2;
		const barY = centerY;

		// ═══════════════════════════════════════════════════
		// LOGO "PUNTOS" en loading
		// ═══════════════════════════════════════════════════
		const logo = this.add
			.text(centerX, centerY - 80, "PUNTOS", {
				fontFamily: "tres, monospace",
				fontSize: "64px",
				color: "#cc66ff",
				stroke: "#000000",
				strokeThickness: 6,
			})
			.setOrigin(0.5);

		// ═══════════════════════════════════════════════════
		// TEXTO "LOADING..."
		// ═══════════════════════════════════════════════════
		const loadText = this.add
			.text(centerX, centerY - 30, "LOADING...", {
				fontFamily: "tres, monospace",
				fontSize: "20px",
				color: "#ffffff",
			})
			.setOrigin(0.5);

		// Animación de parpadeo
		this.tweens.add({
			targets: loadText,
			alpha: 0.4,
			duration: 600,
			yoyo: true,
			repeat: -1,
		});

		// ═══════════════════════════════════════════════════
		// BARRA DE PROGRESO
		// ═══════════════════════════════════════════════════
		// Borde exterior (doble para efecto CRT)
		const progressBorder = this.add.graphics();
		progressBorder.lineStyle(3, 0xcc66ff, 0.8);
		progressBorder.strokeRect(barX - 2, barY - barHeight / 2 - 2, barWidth + 4, barHeight + 4);

		const progressBorder2 = this.add.graphics();
		progressBorder2.lineStyle(1, 0xcc66ff, 0.4);
		progressBorder2.strokeRect(barX - 4, barY - barHeight / 2 - 4, barWidth + 8, barHeight + 8);

		// Fondo oscuro de la barra
		const progressBg = this.add.graphics();
		progressBg.fillStyle(0x05001a, 0.8);
		progressBg.fillRect(barX, barY - barHeight / 2, barWidth, barHeight);

		// Barra de progreso (relleno)
		const progressBar = this.add.graphics();

		// Texto de porcentaje
		const percentText = this.add
			.text(centerX, centerY + 35, "0%", {
				fontFamily: "tres, monospace",
				fontSize: "18px",
				color: "#33ff33",
			})
			.setOrigin(0.5);

		// ═══════════════════════════════════════════════════
		// LISTENERS DE PROGRESO
		// ═══════════════════════════════════════════════════
		this.load.on("progress", (value) => {
			// Actualizar barra
			progressBar.clear();
			progressBar.fillStyle(0xcc66ff, 1);
			progressBar.fillRect(barX, barY - barHeight / 2, barWidth * value, barHeight);

			// Actualizar porcentaje
			const percent = Math.floor(value * 100);
			percentText.setText(`${percent}%`);
		});

		this.load.on("complete", () => {
			// Fade out de todos los elementos
			this.tweens.add({
				targets: [
					logo,
					loadText,
					progressBorder,
					progressBorder2,
					progressBg,
					progressBar,
					percentText,
				],
				alpha: 0,
				duration: 400,
				ease: "Power2",
				onComplete: () => {
					progressBar.destroy();
					progressBorder.destroy();
					progressBorder2.destroy();
					progressBg.destroy();
					loadText.destroy();
					percentText.destroy();
					logo.destroy();
				},
			});
		});

		// ═══════════════════════════════════════════════════
		// CARGAR ASSETS
		// ═══════════════════════════════════════════════════
		// Cargar assets desde public/
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
		this.load.svg("icon-fullscreen", "img/ui/icon-fullscreen.svg");
		this.load.svg("icon-exitfullscreen", "img/ui/icon-exitfullscreen.svg");
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
		this.goldenFruitManager = new GoldenFruitManager(this);
		this.startScreenManager = new StartScreenManager(this);
		this.shareManager = new ShareManager(this);

		// Guardar record inicial para detectar nuevo récord
		this.lastRecord = this.scoreManager.getRecord();

		// Suscribirse a eventos de los managers
		this.events.on("scoreChanged", this.onScoreChanged, this);
		this.events.on("scorePenalty", this.onScorePenalty, this);
		this.events.on("milestoneReached", this.onMilestoneReached, this);
		this.events.on("startScreenComplete", this.onStartGame, this);

		// Crear fondo dinámico starfield
		this.backgroundManager.create();

		// Crear UI con paneles integrados
		this.uiManager.create(
			this.scoreManager.getScore(),
			this.scoreManager.getRecord(),
		);

		// Audio — synth recibe referencia a la música para armonizar
		this.music = new SynthMusic();
		this.synth = new SynthAudio(this.music);

		// Sistema de partículas (API Phaser 3.60+)
		this.emitter = this.add.particles(0, 0, "particles", {
			frame: [0, 1, 2, 3, 4],
			speed: GameConstants.PARTICLES.SPEED,
			lifespan: GameConstants.PARTICLES.LIFESPAN,
			scale: { start: 3, end: 0 },
			emitting: false,
		});

		// Grupo de frutas (creado pero sin spawn hasta START)
		this.fruits = this.add.group({
			defaultKey: "elements",
			maxSize: GameConstants.GAMEPLAY.MAX_FRUITS,
			runChildUpdate: false,
		});

		// Escuchar cambios de tamaño
		this.scale.on("resize", this.handleResize, this);

		// Mostrar pantalla de inicio
		this.startScreenManager.show();

		// NO iniciar juego hasta que el usuario presione START
		this.setState(GameState.PAUSED);
	}

	/**
	 * Handler: Se ejecuta cuando el usuario presiona START
	 */
	onStartGame() {
		// Spawn inicial de frutas
		this.time.addEvent({
			delay: GameConstants.GAMEPLAY.SPAWN_DELAY,
			repeat: GameConstants.GAMEPLAY.MAX_FRUITS - 1,
			loop: false,
			callback: () => {
				this.spawnFruit();
			},
		});

		// Iniciar ciclo de manzana dorada
		this.goldenFruitManager.start();

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
	 * Muestra overlay de pausa con botón de continuar y share (estilo arcade neon)
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

		// Container para botones y contenido
		this.pauseContainer = this.add.container(centerX, centerY);
		this.pauseContainer.setDepth(201);

		// Texto "PAUSE" arriba (neon cyan)
		const pauseTitle = this.add
			.text(0, -140, "PAUSE", {
				fontFamily: pixelFont,
				fontSize: "36px",
				color: "#cc66ff",
				stroke: "#000000",
				strokeThickness: 4,
			})
			.setOrigin(0.5);
		this.pauseContainer.add(pauseTitle);

		// ═══════════════════════════════════════════════════
		// MOSTRAR SCORE Y RECORD
		// ═══════════════════════════════════════════════════
		const currentScore = this.scoreManager.getScore();
		const currentRecord = this.scoreManager.getRecord();

		const scoreText = this.add
			.text(0, -90, `Score: ${currentScore}`, {
				fontFamily: pixelFont,
				fontSize: "28px",
				color: "#33ff33",
				stroke: "#000000",
				strokeThickness: 3,
			})
			.setOrigin(0.5);
		this.pauseContainer.add(scoreText);

		const recordText = this.add
			.text(0, -55, `Best: ${currentRecord}`, {
				fontFamily: pixelFont,
				fontSize: "24px",
				color: "#ffff00",
				stroke: "#000000",
				strokeThickness: 3,
			})
			.setOrigin(0.5);
		this.pauseContainer.add(recordText);

		// ═══════════════════════════════════════════════════
		// BOTÓN CONTINUE (centrado)
		// ═══════════════════════════════════════════════════
		const btnSize = 80;
		const btnBg = this.add.rectangle(0, 10, btnSize, btnSize, 0x05001a, 0.9);
		btnBg.setInteractive({ useHandCursor: true });
		this.pauseContainer.add(btnBg);

		// Borde neón del botón
		const border = this.add.graphics();
		border.lineStyle(3, 0xcc66ff, 0.8);
		border.strokeRect(-btnSize / 2, 10 - btnSize / 2, btnSize, btnSize);
		this.pauseContainer.add(border);

		// Icono de play
		const playIcon = this.add.image(0, 10, "icon-play").setDisplaySize(48, 48);
		this.pauseContainer.add(playIcon);

		// Texto "CONTINUE" (neon)
		const continueText = this.add
			.text(0, 80, "CONTINUE", {
				fontFamily: pixelFont,
				fontSize: "22px",
				color: "#33ff33",
				stroke: "#000000",
				strokeThickness: 3,
			})
			.setOrigin(0.5);
		this.pauseContainer.add(continueText);

		// Efectos hover arcade
		btnBg.on("pointerover", () => btnBg.setFillStyle(0xcc66ff, 0.2));
		btnBg.on("pointerout", () => btnBg.setFillStyle(0x05001a, 0.9));
		btnBg.on("pointerdown", () => this.togglePause());

		// ═══════════════════════════════════════════════════
		// BOTÓN SHARE SCORE (abajo)
		// ═══════════════════════════════════════════════════
		const shareBtnY = 140;
		const shareBtnWidth = 200;
		const shareBtnHeight = 50;

		const shareBg = this.add.rectangle(
			0,
			shareBtnY,
			shareBtnWidth,
			shareBtnHeight,
			0x05001a,
			0.85,
		);
		shareBg.setInteractive({ useHandCursor: true });
		this.pauseContainer.add(shareBg);

		// Borde del botón share
		const shareBorder = this.add.graphics();
		shareBorder.lineStyle(2, 0xffff00, 0.6);
		shareBorder.strokeRect(
			-shareBtnWidth / 2,
			shareBtnY - shareBtnHeight / 2,
			shareBtnWidth,
			shareBtnHeight,
		);
		this.pauseContainer.add(shareBorder);

		// Texto del botón share
		const shareText = this.add
			.text(0, shareBtnY, "SHARE SCORE", {
				fontFamily: pixelFont,
				fontSize: "20px",
				color: "#ffff00",
				stroke: "#000000",
				strokeThickness: 3,
			})
			.setOrigin(0.5);
		this.pauseContainer.add(shareText);

		// Efectos hover share button
		shareBg.on("pointerover", () => {
			shareBg.setFillStyle(0xffff00, 0.2);
		});
		shareBg.on("pointerout", () => {
			shareBg.setFillStyle(0x05001a, 0.85);
		});
		shareBg.on("pointerdown", async () => {
			// Animar click
			this.tweens.add({
				targets: [shareBg, shareText],
				scaleX: 0.95,
				scaleY: 0.95,
				duration: 50,
				yoyo: true,
			});

			// Compartir score
			const result = await this.shareManager.shareScore(
				currentScore,
				currentRecord,
			);

			// Mostrar feedback
			if (result.success) {
				const feedbackMsg =
					result.method === "web-share"
						? "Shared!"
						: result.method === "download"
							? "Downloaded!"
							: "Copied to clipboard!";

				const feedback = this.add
					.text(0, shareBtnY - 40, feedbackMsg, {
						fontFamily: pixelFont,
						fontSize: "18px",
						color: "#33ff33",
					})
					.setOrigin(0.5)
					.setAlpha(0);

				this.pauseContainer.add(feedback);

				this.tweens.add({
					targets: feedback,
					alpha: 1,
					duration: 200,
					hold: 1500,
					yoyo: true,
					onComplete: () => feedback.destroy(),
				});
			}
		});
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

		// Reposicionar start screen si existe
		if (this.startScreenManager) {
			this.startScreenManager.handleResize(gameSize);
		}

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
			this.backgroundManager.onNewRecord();
		}

		// Verificar milestones
		this.milestoneManager.checkMilestone(score);

		// Actualizar tema según milestone con transición suave
		const theme = this.milestoneManager.getCurrentTheme(score);
		this.feedbackManager.setTheme(theme.name);
		this.feedbackManager.transitionBackground(theme.color);
		this.backgroundManager.setTheme(theme.name);

		// Actualizar tint de partículas con paleta del tema
		const themeData = getTheme(theme.name);
		if (this.emitter && themeData.ui) {
			this._particleTint = themeData.ui;
		}

		// Evolucionar la música sutilmente con el progreso
		// 0 puntos = 0.0, 500 puntos (legendario) = 1.0
		if (this.music) {
			const intensity = Math.min(score / 500, 1.0);
			this.music.setIntensity(intensity);
		}

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
	 * Zen mode: feedback gentil, sin vibrate ni shake agresivo
	 */
	onScorePenalty(penalty, consecutiveMisses) {
		if (penalty > 0) {
			// Flash suave con color del tema (no rojo)
			this.feedbackManager.showMissFlash(consecutiveMisses);

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

		// Efecto de partículas celebración (con tint del tema)
		this.emitThemedParticles(this.scale.width / 2, this.scale.height / 2, 30);

		// Burst de estrellas en el fondo
		this.backgroundManager.burst(12);

		// Sonido milestone (arpegio ascendente chiptune)
		if (!this.isMuted) {
			this.synth.playMilestone();
		}
	}

	/**
	 * Inicializa parámetros de movimiento orgánico para una fruta.
	 * Doble armónico de wobble + drift horizontal + velocidad de caída
	 * individual = trayectorias únicas y naturales.
	 */
	initFruitMotion(fruit, x) {
		fruit.setData("baseX", x);

		// Wobble primario: balanceo lento de hoja
		fruit.setData("wobbleAmp", Phaser.Math.FloatBetween(18, 45));
		fruit.setData("wobbleFreq", Phaser.Math.FloatBetween(1.0, 2.2));
		fruit.setData("wobblePhase", Math.random() * Math.PI * 2);

		// Wobble secundario: perturbación rápida asimétrica
		fruit.setData("wobble2Amp", Phaser.Math.FloatBetween(4, 14));
		fruit.setData("wobble2Freq", Phaser.Math.FloatBetween(2.5, 4.0));
		fruit.setData("wobble2Phase", Math.random() * Math.PI * 2);

		// Drift horizontal lento (cada fruta se desplaza un poco)
		fruit.setData("driftSpeed", Phaser.Math.FloatBetween(-0.15, 0.15));

		// Spin 3D
		fruit.setData("spinSpeed", Phaser.Math.FloatBetween(0.018, 0.048));
		fruit.setData("spinPhase", Math.random() * Math.PI * 2);

		// Multiplicador de caída individual (±12%)
		fruit.setData("fallMult", Phaser.Math.FloatBetween(0.88, 1.12));
	}

	/**
	 * Emite partículas con el tint del tema activo.
	 * Aplica tint individual a cada partícula emitida.
	 */
	emitThemedParticles(x, y, count) {
		this.emitter.setPosition(x, y);
		this.emitter.explode(count);

		// Aplicar tint del tema a partículas recién emitidas
		if (this._particleTint) {
			const tint = this._particleTint;
			this.emitter.forEachAlive((p) => {
				p.tint = tint;
			});
		}
	}

	/**
	 * Reposiciona una fruta al inicio de la pantalla
	 */
	resetFruit(fruit) {
		const margin = this.scale.width * GameConstants.UI.MARGIN_PERCENT;
		fruit.x = Phaser.Math.Between(margin, this.scale.width - margin);
		fruit.y = -40;

		// Parámetros orgánicos de movimiento
		this.initFruitMotion(fruit, fruit.x);

		// Nuevo tipo de fruta aleatorio al resetear
		const fpf = GameConstants.GAMEPLAY.FRAMES_PER_FRUIT;
		const newType = Phaser.Math.Between(
			0,
			GameConstants.GAMEPLAY.FRUIT_TYPES - 1,
		);
		fruit.setFrame(newType * fpf); // frame 0 de rotación (front)
		fruit.setData("fruitType", newType);

		// Animación de entrada
		const ts = fruit.getData("targetScale") || 2.5;
		fruit.rotation = 0;
		this.tweens.add({
			targets: fruit,
			scaleX: ts,
			scaleY: ts,
			duration: 300,
			ease: "Back.easeOut",
		});
	}

	/**
	 * Crea una nueva fruta con animaciones y glow
	 */
	spawnFruit() {
		if (this.fruits.isFull()) return;

		const margin = this.scale.width * GameConstants.UI.MARGIN_PERCENT;
		const x = Phaser.Math.Between(margin, this.scale.width - margin);
		const fpf = GameConstants.GAMEPLAY.FRAMES_PER_FRUIT;
		const fruitType = Phaser.Math.Between(
			0,
			GameConstants.GAMEPLAY.FRUIT_TYPES - 1,
		);
		const fruit = this.fruits.create(x, -40, "elements", fruitType * fpf);
		fruit.setName("fruit" + this.fruits.getLength());
		fruit.setData("fruitType", fruitType);

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

		// Parámetros orgánicos de movimiento
		this.initFruitMotion(fruit, x);

		// Detectar click - usar ScoreManager
		fruit.setInteractive();
		fruit.setVisible(true);
		fruit.on("pointerdown", (pointer) => {
			this.scoreManager.onCatch();

			// Reacción del fondo al tap
			this.backgroundManager.onCatch();

			// Feedback positivo con texto flotante
			this.feedbackManager.showFloatingScore(pointer.x, pointer.y, 1, true);

			// Sonido chiptune – nota pentatónica aleatoria
			if (!this.isMuted) {
				this.synth.playCatch();
			}

			// Emitir partículas en posición del tap (con tint del tema)
			this.emitThemedParticles(
				pointer.x,
				pointer.y,
				GameConstants.PARTICLES.EMIT_COUNT,
			);

			// Pop satisfactorio: escalar → desaparecer → renacer arriba
			fruit.disableInteractive();
			this.tweens.add({
				targets: fruit,
				scaleX: 0,
				scaleY: 0,
				alpha: 0.3,
				duration: 150,
				ease: "Back.easeIn",
				onComplete: () => {
					fruit.setAlpha(1);
					fruit.setInteractive();
					this.resetFruit(fruit);
				},
			});
		});
	}

	/**
	 * Revisa frutas fuera de límites - penalización Zen Mode
	 * Fade-out suave en vez de desaparición abrupta
	 */
	checkFruitsOutOfBounds() {
		const threshold = this.scale.height + 20;
		this.fruits.children.iterate((fruit) => {
			if (!fruit || fruit.getData("exiting")) return;

			if (fruit.y > threshold) {
				// Marcar como saliente para no re-procesar
				fruit.setData("exiting", true);
				fruit.disableInteractive();

				// Penalización suave
				this.scoreManager.onMiss();

				// Suspiro musical suave
				if (!this.isMuted) {
					this.synth.playMiss();
				}

				// Fade out breve, luego reciclar
				this.tweens.add({
					targets: fruit,
					alpha: 0,
					scaleX: fruit.scaleX * 0.5,
					scaleY: fruit.scaleY * 0.5,
					duration: 200,
					ease: "Sine.easeOut",
					onComplete: () => {
						fruit.setAlpha(1);
						fruit.setData("exiting", false);
						fruit.setInteractive();
						this.resetFruit(fruit);
					},
				});
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

			// Caída vertical con velocidad individual
			const fallMult = fruit.getData("fallMult") || 1.0;
			fruit.y += speed * fallMult;

			// ── Wobble orgánico (doble armónico + drift) ──────────────
			const wPhase = fruit.getData("wobblePhase") || 0;
			const wAmp = fruit.getData("wobbleAmp") || 25;
			const wFreq = fruit.getData("wobbleFreq") || 1.5;
			const w2Phase = fruit.getData("wobble2Phase") || 0;
			const w2Amp = fruit.getData("wobble2Amp") || 8;
			const w2Freq = fruit.getData("wobble2Freq") || 3.0;
			const drift = fruit.getData("driftSpeed") || 0;
			let baseX = fruit.getData("baseX") || fruit.x;

			// Avanzar fases (por frame, consistente con el motor)
			fruit.setData("wobblePhase", wPhase + wFreq * 0.018);
			fruit.setData("wobble2Phase", w2Phase + w2Freq * 0.018);

			// Drift lento — clamp a márgenes de pantalla
			baseX += drift;
			const mX = this.scale.width * GameConstants.UI.MARGIN_PERCENT;
			baseX = Phaser.Math.Clamp(baseX, mX, this.scale.width - mX);
			fruit.setData("baseX", baseX);

			// Posición X = base + seno primario + seno secundario
			fruit.x = baseX + Math.sin(wPhase) * wAmp + Math.sin(w2Phase) * w2Amp;

			// ── Rotación 2.5D con multi-frame ─────────────────────────────
			// 12 frames cubren 0°→180°; el motor los recorre ida y vuelta
			// para completar 360°. Pipeline de volumen 3D:
			//
			//  1. frame    ← selección por fase normalizada
			//  2. scaleX   ← compresión elipsoidal en canto
			//  3. scaleY   ← estiramiento cuadrático de canto
			//  4. rotation ← tumble Z (cabeceo + micro-wobble)
			//  5. tint     ← iluminación 4-esquina (horizontal + vertical)

			const spinPhase = fruit.getData("spinPhase") || 0;
			const spinSpeed = fruit.getData("spinSpeed") || 0.03;
			fruit.setData("spinPhase", spinPhase + spinSpeed);
			const ts = fruit.getData("targetScale") || 2.5;

			// Fase normalizada [0, 2π)
			const TWO_PI = Math.PI * 2;
			const normPhase = ((spinPhase % TWO_PI) + TWO_PI) % TWO_PI;
			const sinPhase = Math.sin(normPhase);

			// edge: 0 = front/back (ancho), 1 = canto (fino)
			const edge = Math.abs(sinPhase);

			// [1] Selección de frame (front→side→back→side→front)
			const fpf = GameConstants.GAMEPLAY.FRAMES_PER_FRUIT;
			const fruitType = fruit.getData("fruitType") || 0;
			const halfT = normPhase / Math.PI; // 0→2
			const frameT = halfT <= 1.0 ? halfT : 2.0 - halfT; // 0→1→0
			const rotIdx = Math.min(fpf - 1, Math.floor(frameT * fpf));
			fruit.setFrame(fruitType * fpf + rotIdx);

			// [2] Compresión horizontal: D=0.68 → de frente:1.0, canto:0.68
			//     Fruta esférica mantiene volumen, no es un disco.
			const D = 0.68;
			const D2 = D * D;
			const width = Math.sqrt(D2 + (1 - D2) * (1 - edge * edge));
			fruit.scaleX = ts * width;

			// [3] Estiramiento vertical sutil: +6% en canto
			fruit.scaleY = ts * (1 + edge * edge * 0.06);

			// [4] Tumble Z: cabeceo ±6.5° + micro-wobble en canto
			fruit.rotation =
				Math.sin(normPhase * 2) * 0.11 + edge * 0.04 * Math.sin(normPhase * 3);

			// [5] Iluminación 4-esquina: horizontal (dirección giro) + vertical (cenital)
			const baseB = 130 + (1 - edge) * 125; // 130 canto → 255 frente
			const hDir = sinPhase * (55 + (1 - edge) * 20); // lateral fuerte
			const vDir = 22; // sesgo top-light constante
			const TL = Math.floor(Math.min(255, Math.max(75, baseB + hDir + vDir)));
			const TR = Math.floor(Math.min(255, Math.max(75, baseB - hDir + vDir)));
			const BL = Math.floor(Math.min(255, Math.max(75, baseB + hDir - vDir)));
			const BR = Math.floor(Math.min(255, Math.max(75, baseB - hDir - vDir)));
			fruit.setTint(
				(TL << 16) | (TL << 8) | TL,
				(TR << 16) | (TR << 8) | TR,
				(BL << 16) | (BL << 8) | BL,
				(BR << 16) | (BR << 8) | BR,
			);
		});

		// Actualizar manzana dorada
		this.goldenFruitManager.update(speed);

		this.checkFruitsOutOfBounds();
	}
}
