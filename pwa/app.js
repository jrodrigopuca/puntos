// ==================== CONSTANTES ====================
const GameConstants = {
	UI: {
		MARGIN_PERCENT: 0.1,
		AUDIO_BTN_X_PERCENT: 0.8,
		PAUSE_BTN_X_PERCENT: 0.45,
		TEXT_STYLE: {
			font: "5em tres",
			align: "left",
			fontWeight: "bold",
			stroke: "#000000",
			strokeThickness: 9,
		},
	},
	GAMEPLAY: {
		MAX_FRUITS: 5,
		SPAWN_DELAY: 1000,
		BASE_SPEED: 1,
		SPEED_MULTIPLIER: 0.1,
		MAX_SPEED: 15,
	},
	PARTICLES: {
		MAX_ACTIVE: 50,
		SPEED: 300,
		LIFESPAN: 800,
		EMIT_COUNT: 5,
	},
	COLORS: [0xffaaaa, 0xac93de, 0xffdd55, 0xffffff],
};

const GameState = {
	LOADING: "loading",
	PLAYING: "playing",
	PAUSED: "paused",
};

// ==================== GAME SCENE ====================
let GameScene = new Phaser.Class({
	Extends: Phaser.Scene,

	/**
	 * Inicializa el estado del juego
	 */
	initialize: function GameScene() {
		Phaser.Scene.call(this, { key: "gameScene", active: true });

		// Estado del juego
		this.currentState = GameState.LOADING;

		// Puntuación
		this.score = 0;
		this.record = localStorage.getItem("record")
			? parseInt(localStorage.getItem("record"))
			: 0;

		// Referencias de UI
		this.scoreText = null;
		this.btnAudio = null;
		this.btnPause = null;
		this.pauseOverlay = null;
		this.continueBtn = null;

		// Elementos del juego
		this.fruits = null;
		this.particles = null;
		this.emitter = null;

		// Audio
		this.isMuted = true;
		this.music = null;
		this.sfxBell = null;
	},

	/**
	 * Carga assets y muestra barra de progreso
	 */
	preload: function () {
		// Barra de progreso de carga
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

		// Cargar assets
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
	},
	/**
	 * Crea la escena del juego: UI, audio, partículas y frutas
	 */
	create: function () {
		// UI: Texto de puntuación
		this.scoreText = this.add.text(
			GameConstants.UI.MARGIN_PERCENT * this.scale.width,
			10,
			`🍊  ${this.score}\n 🏆 ${this.record}`,
			GameConstants.UI.TEXT_STYLE,
		);

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

		// Sistema de partículas simplificado - un solo emitter con límite
		this.particles = this.add.particles("particles");
		this.emitter = this.particles.createEmitter({
			frame: [0, 1, 2, 3, 4],
			x: 0,
			y: 0,
			speed: GameConstants.PARTICLES.SPEED,
			lifespan: GameConstants.PARTICLES.LIFESPAN,
			on: false,
			maxParticles: GameConstants.PARTICLES.MAX_ACTIVE,
		});

		// Grupo de frutas
		this.fruits = this.add.group({
			defaultKey: "elements",
			maxSize: GameConstants.GAMEPLAY.MAX_FRUITS,
			setCollideWorldBounds: true,
			runChildUpdate: false,
			createCallback: function (el) {},
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

		// Escuchar cambios de tamaño para reposicionar UI
		this.scale.on("resize", this.handleResize, this);

		// Cambiar estado a jugando
		this.setState(GameState.PLAYING);
	},
	/**
	 * Cambia el estado del juego
	 */
	setState: function (newState) {
		this.currentState = newState;
		this.events.emit("stateChanged", newState);
	},

	/**
	 * Toggle del audio (música de fondo)
	 */
	toggleAudio: function () {
		if (this.isMuted) {
			this.btnAudio.text = "🔊";
			this.music.play();
			this.isMuted = false;
		} else {
			this.btnAudio.text = "🔇";
			this.music.pause();
			this.isMuted = true;
		}
		this.btnAudio.updateText();
	},

	/**
	 * Toggle del estado de pausa
	 */
	togglePause: function () {
		if (this.currentState === GameState.PLAYING) {
			this.physics.pause();
			this.setState(GameState.PAUSED);
			this.showPauseOverlay();
		} else if (this.currentState === GameState.PAUSED) {
			this.physics.resume();
			this.setState(GameState.PLAYING);
			this.hidePauseOverlay();
		}
	},

	/**
	 * Muestra overlay de pausa con botón de continuar
	 */
	showPauseOverlay: function () {
		// Overlay semi-transparente
		this.pauseOverlay = this.add.rectangle(
			this.scale.width / 2,
			this.scale.height / 2,
			this.scale.width,
			this.scale.height,
			0x000000,
			0.7,
		);

		// Botón "Continuar" centrado
		this.continueBtn = this.add
			.text(this.scale.width / 2, this.scale.height / 2, "▶️ CONTINUAR", {
				font: "3em tres",
				align: "center",
			})
			.setOrigin(0.5);

		this.continueBtn.setInteractive();
		this.continueBtn.on("pointerdown", () => this.togglePause());
	},

	/**
	 * Oculta overlay de pausa
	 */
	hidePauseOverlay: function () {
		if (this.pauseOverlay) this.pauseOverlay.destroy();
		if (this.continueBtn) this.continueBtn.destroy();
	},

	/**
	 * Reposiciona UI cuando cambia el tamaño de pantalla
	 */
	handleResize: function (gameSize) {
		const width = gameSize.width;
		const height = gameSize.height;

		// Reposicionar texto de puntos
		if (this.scoreText) {
			this.scoreText.x = GameConstants.UI.MARGIN_PERCENT * width;
		}

		// Reposicionar botón de audio
		if (this.btnAudio) {
			this.btnAudio.x = width * GameConstants.UI.AUDIO_BTN_X_PERCENT;
		}

		// Reposicionar botón de pausa
		if (this.btnPause) {
			this.btnPause.x = width * GameConstants.UI.PAUSE_BTN_X_PERCENT;
		}

		// Reposicionar overlay de pausa si existe
		if (this.pauseOverlay) {
			this.pauseOverlay.setSize(width, height);
			this.pauseOverlay.setPosition(width / 2, height / 2);
		}

		if (this.continueBtn) {
			this.continueBtn.setPosition(width / 2, height / 2);
		}
	},
	/**
	 * Actualiza la puntuación y record
	 */
	setScore: function (newScore, fruit) {
		// Actualizar record si es necesario
		if (newScore > this.record) {
			this.record = newScore;
			localStorage.setItem("record", newScore);
		}

		// Vibrar si regresa a 0
		if (newScore === 0 && newScore !== this.score) {
			window.navigator.vibrate(1000);
		}

		// Reproducir sonido si suma puntos
		if (!this.isMuted && newScore >= 1) {
			this.sfxBell.play();
		}

		// Actualizar puntuación
		this.score = newScore;
		this.scoreText.text = `🍊  ${this.score}\n 🏆 ${this.record}`;
		this.scoreText.updateText();

		// Reposicionar fruta al inicio
		const margin = this.scale.width * GameConstants.UI.MARGIN_PERCENT;
		fruit.x = Phaser.Math.Between(margin, this.scale.width - margin);
		fruit.y = 0;
	},
	/**
	 * Crea una nueva fruta en la parte superior de la pantalla
	 */
	spawnFruit: function () {
		if (!this.fruits.isFull()) {
			const margin = this.scale.width * GameConstants.UI.MARGIN_PERCENT;
			let fruit = this.fruits.create(
				Phaser.Math.Between(margin, this.scale.width - margin),
				0,
				"elements",
				Phaser.Math.Between(0, 3),
			);
			fruit.setName("fruit" + this.fruits.getLength());

			// Color aleatorio
			const randomColor = Phaser.Utils.Array.GetRandom(GameConstants.COLORS);
			fruit.setTint(randomColor);

			// Detectar click
			fruit.setInteractive();
			fruit.setVisible(true);
			fruit.on("pointerdown", (pointer) => {
				this.setScore(this.score + 1, fruit);
				// Emitir partículas
				this.emitter.setPosition(pointer.x, pointer.y);
				this.emitter.explode(GameConstants.PARTICLES.EMIT_COUNT);
			});
		}
	},
	/**
	 * Revisa si alguna fruta escapó de los límites de la pantalla
	 */
	checkFruitsOutOfBounds: function () {
		this.fruits.children.iterate((fruit) => {
			if (fruit.y > this.scale.height) {
				this.setScore(0, fruit);
			}
		});
	},
	/**
	 * Actualiza el juego cada frame
	 */
	update: function (time, delta) {
		// Solo actualizar si está jugando
		if (this.currentState !== GameState.PLAYING) {
			return;
		}

		// Calcular velocidad con límite máximo
		const speed =
			GameConstants.GAMEPLAY.BASE_SPEED +
			this.score * GameConstants.GAMEPLAY.SPEED_MULTIPLIER;
		const cappedSpeed = Math.min(speed, GameConstants.GAMEPLAY.MAX_SPEED);

		// Mover frutas hacia abajo
		Phaser.Actions.IncY(this.fruits.getChildren(), cappedSpeed);

		// Revisar si alguna fruta se escapó
		this.checkFruitsOutOfBounds();
	},
});

let config = {
	type: Phaser.AUTO,
	scale: {
		mode: Phaser.Scale.RESIZE,
		parent: "phaser",
		width: "100%",
		height: "100%",
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	pixelArt: true,
	backgroundColor: Phaser.Display.Color.RandomRGB().color,
	audio: {
		disableWebAudio: true,
	},
	input: {
		activePointers: 3,
	},
	physics: {
		default: "arcade",
		arcade: {},
	},
	scene: GameScene,
};

const game = new Phaser.Game(config);
