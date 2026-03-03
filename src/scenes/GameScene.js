import Phaser from "phaser";
import { GameConstants, GameState } from "../config/constants.js";
import ScoreManager from "../managers/ScoreManager.js";
import ZenDifficultyManager from "../managers/ZenDifficultyManager.js";
import MilestoneManager from "../managers/MilestoneManager.js";

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

		// Referencias de UI
		this.scoreText = null;
		this.btnAudio = null;
		this.btnPause = null;
		this.pauseOverlay = null;
		this.continueBtn = null;
		this.feedbackText = null;
		this.milestoneText = null;

		// Elementos del juego
		this.fruits = null;
		this.emitter = null;

		// Audio
		this.isMuted = true;
		this.music = null;
		this.sfxBell = null;
	}

	/**
	 * Carga assets y muestra barra de progreso
	 */
	preload() {
		const progressBar = this.add.graphics();
		this.load.on("progress", (value) => {
			progressBar.clear();
			progressBar.fillStyle(0xffffff, 1);
			progressBar.fillRect(
				0,
				this.scale.height / 2,
				this.scale.width * value,
				60,
			);
		});

		this.load.on("complete", () => {
			progressBar.destroy();
		});

		// Cargar assets desde public/
		this.load.audio("song", ["audio/tema.mp3"]);
		this.load.audio("bell", ["audio/accept.mp3"]);
		this.load.spritesheet("elements", "img/elementos.png", {
			frameWidth: 75,
			frameHeight: 75,
		});
		this.load.spritesheet("particles", "img/files.png", {
			frameWidth: 25,
			frameHeight: 25,
		});
	}

	/**
	 * Crea la escena del juego
	 */
	create() {
		// Inicializar managers
		this.scoreManager = new ScoreManager(this);
		this.difficultyManager = new ZenDifficultyManager();
		this.milestoneManager = new MilestoneManager(this);

		// Suscribirse a eventos de los managers
		this.events.on("scoreChanged", this.onScoreChanged, this);
		this.events.on("scorePenalty", this.onScorePenalty, this);
		this.events.on("milestoneReached", this.onMilestoneReached, this);

		// UI: Texto de puntuación
		this.scoreText = this.add.text(
			GameConstants.UI.MARGIN_PERCENT * this.scale.width,
			10,
			`🍊  ${this.scoreManager.getScore()}\n 🏆 ${this.scoreManager.getRecord()}`,
			GameConstants.UI.TEXT_STYLE,
		);

		// UI: Texto flotante para feedback (oculto inicialmente)
		this.feedbackText = this.add
			.text(this.scale.width / 2, this.scale.height / 2, "", {
				font: "4em tres",
				align: "center",
				stroke: "#000000",
				strokeThickness: 6,
			})
			.setOrigin(0.5)
			.setAlpha(0);

		// UI: Texto de milestone (oculto inicialmente)
		this.milestoneText = this.add
			.text(this.scale.width / 2, this.scale.height * 0.3, "", {
				font: "3em tres",
				align: "center",
				stroke: "#000000",
				strokeThickness: 4,
			})
			.setOrigin(0.5)
			.setAlpha(0);

		// Audio
		this.music = this.sound.add("song");
		this.music.loop = true;
		this.music.stop();
		this.sfxBell = this.sound.add("bell");
		this.sfxBell.stop();

		// UI: Botón de audio
		this.btnAudio = this.add.text(
			this.scale.width * GameConstants.UI.AUDIO_BTN_X_PERCENT,
			10,
			"🔇",
			GameConstants.UI.TEXT_STYLE,
		);
		this.btnAudio.setInteractive().on("pointerdown", () => {
			this.toggleAudio();
		});

		// UI: Botón de pausa
		this.btnPause = this.add.text(
			this.scale.width * GameConstants.UI.PAUSE_BTN_X_PERCENT,
			10,
			"⏸️",
			GameConstants.UI.TEXT_STYLE,
		);
		this.btnPause.setInteractive().on("pointerdown", () => {
			this.togglePause();
		});

		// Sistema de partículas (API Phaser 3.60+)
		this.emitter = this.add.particles(0, 0, "particles", {
			frame: [0, 1, 2, 3, 4],
			speed: GameConstants.PARTICLES.SPEED,
			lifespan: GameConstants.PARTICLES.LIFESPAN,
			scale: { start: 1, end: 0 },
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
	 * Toggle del audio
	 */
	toggleAudio() {
		if (this.isMuted) {
			this.btnAudio.text = "🔊";
			this.music.play();
			this.isMuted = false;
		} else {
			this.btnAudio.text = "🔇";
			this.music.pause();
			this.isMuted = true;
		}
	}

	/**
	 * Toggle del estado de pausa
	 */
	togglePause() {
		if (this.currentState === GameState.PLAYING) {
			this.setState(GameState.PAUSED);
			this.showPauseOverlay();
		} else if (this.currentState === GameState.PAUSED) {
			this.setState(GameState.PLAYING);
			this.hidePauseOverlay();
		}
	}

	/**
	 * Muestra overlay de pausa
	 */
	showPauseOverlay() {
		this.pauseOverlay = this.add.rectangle(
			this.scale.width / 2,
			this.scale.height / 2,
			this.scale.width,
			this.scale.height,
			0x000000,
			0.7,
		);

		this.continueBtn = this.add
			.text(this.scale.width / 2, this.scale.height / 2, "▶️ CONTINUAR", {
				font: "3em tres",
				align: "center",
			})
			.setOrigin(0.5);

		this.continueBtn.setInteractive();
		this.continueBtn.on("pointerdown", () => this.togglePause());
	}

	/**
	 * Oculta overlay de pausa
	 */
	hidePauseOverlay() {
		if (this.pauseOverlay) this.pauseOverlay.destroy();
		if (this.continueBtn) this.continueBtn.destroy();
	}

	/**
	 * Reposiciona UI al cambiar tamaño
	 */
	handleResize(gameSize) {
		const { width, height } = gameSize;

		if (this.scoreText) {
			this.scoreText.x = GameConstants.UI.MARGIN_PERCENT * width;
		}

		if (this.btnAudio) {
			this.btnAudio.x = width * GameConstants.UI.AUDIO_BTN_X_PERCENT;
		}

		if (this.btnPause) {
			this.btnPause.x = width * GameConstants.UI.PAUSE_BTN_X_PERCENT;
		}

		if (this.pauseOverlay) {
			this.pauseOverlay.setSize(width, height);
			this.pauseOverlay.setPosition(width / 2, height / 2);
		}

		if (this.continueBtn) {
			this.continueBtn.setPosition(width / 2, height / 2);
		}

		if (this.feedbackText) {
			this.feedbackText.setPosition(width / 2, height / 2);
		}

		if (this.milestoneText) {
			this.milestoneText.setPosition(width / 2, height * 0.3);
		}
	}

	/**
	 * Handler: Actualiza UI cuando cambia el puntaje
	 */
	onScoreChanged(score, record) {
		this.scoreText.text = `🍊  ${score}\n 🏆 ${record}`;

		// Verificar milestones
		this.milestoneManager.checkMilestone(score);

		// Actualizar tema según milestone
		const theme = this.milestoneManager.getCurrentTheme(score);
		this.cameras.main.setBackgroundColor(theme.color);
	}

	/**
	 * Handler: Muestra feedback visual cuando hay penalización
	 */
	onScorePenalty(penalty, consecutiveMisses) {
		if (penalty > 0) {
			// Vibrar suavemente
			window.navigator.vibrate?.(200 * consecutiveMisses);

			// Mostrar texto de penalización
			this.showFeedback(`-${penalty}`, 0xff6b6b);
		}
	}

	/**
	 * Handler: Celebra cuando se alcanza un milestone
	 */
	onMilestoneReached(milestone) {
		// Mostrar mensaje de milestone
		this.milestoneText.setText(`${milestone.title}\n${milestone.message}`);
		this.milestoneText.setAlpha(1);

		// Animación de entrada y salida
		this.tweens.add({
			targets: this.milestoneText,
			y: this.scale.height * 0.25,
			alpha: { from: 1, to: 0 },
			duration: 2000,
			ease: "Power2",
			onComplete: () => {
				this.milestoneText.y = this.scale.height * 0.3;
			},
		});

		// Efecto de partículas celebración
		this.emitter.setPosition(this.scale.width / 2, this.scale.height / 2);
		this.emitter.explode(20);

		// Sonido si no está silenciado
		if (!this.isMuted) {
			this.sfxBell.play();
		}
	}

	/**
	 * Muestra texto flotante de feedback
	 */
	showFeedback(text, color = 0xffffff) {
		this.feedbackText.setText(text);
		this.feedbackText.setTint(color);
		this.feedbackText.setAlpha(1);
		this.feedbackText.y = this.scale.height / 2;

		this.tweens.add({
			targets: this.feedbackText,
			y: this.scale.height / 2 - 50,
			alpha: 0,
			duration: 800,
			ease: "Power2",
		});
	}

	/**
	 * Reposiciona una fruta al inicio de la pantalla
	 */
	resetFruit(fruit) {
		const margin = this.scale.width * GameConstants.UI.MARGIN_PERCENT;
		fruit.x = Phaser.Math.Between(margin, this.scale.width - margin);
		fruit.y = 0;
	}

	/**
	 * Crea una nueva fruta
	 */
	spawnFruit() {
		if (this.fruits.isFull()) return;

		const margin = this.scale.width * GameConstants.UI.MARGIN_PERCENT;
		const fruit = this.fruits.create(
			Phaser.Math.Between(margin, this.scale.width - margin),
			0,
			"elements",
			Phaser.Math.Between(0, 3),
		);
		fruit.setName("fruit" + this.fruits.getLength());

		// Color aleatorio
		const randomColor = Phaser.Utils.Array.GetRandom(GameConstants.COLORS);
		fruit.setTint(randomColor);

		// Detectar click - usar ScoreManager
		fruit.setInteractive();
		fruit.setVisible(true);
		fruit.on("pointerdown", (pointer) => {
			this.scoreManager.onCatch();
			this.resetFruit(fruit);

			// Feedback positivo
			this.showFeedback("+1", 0x2ecc71);

			// Sonido
			if (!this.isMuted) {
				this.sfxBell.play();
			}

			// Emitir partículas
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
		if (this.currentState !== GameState.PLAYING) {
			return;
		}

		// Obtener velocidad del ZenDifficultyManager (curva logarítmica con plateau)
		const speed = this.difficultyManager.getSpeed(this.scoreManager.getScore());

		Phaser.Actions.IncY(this.fruits.getChildren(), speed);
		this.checkFruitsOutOfBounds();
	}
}
