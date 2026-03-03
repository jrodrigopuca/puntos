let realWidth = window.innerWidth; // *window.devicePixelRatio;
let realHeight = window.innerHeight; // window.devicePixelRatio;

let GameScene = new Phaser.Class({
	Extends: Phaser.Scene,

	/**
	 *  cargar todo lo necesario sobre 'this',
	 *  de este modo será más fácil para acceder
	 *  en los otros métodos.
	 */
	initialize: function GameScene() {
		Phaser.Scene.call(this, { key: "gameScene", active: true });

		this.points = 0;
		this.record = !!localStorage.getItem("record")
			? parseInt(localStorage.getItem("record"))
			: 0;

		this.myText = "";
		this.elements = null;
		this.btnAudio = null;
		this.particles = null;
		this.emitter = null; // Un solo emitter controlado
		this.music = null;
		this.bell = null;

		this.silence = true;
		this.btnAudio = null;
	},

	/**
	 *  crear una barra de progreso para mostrar
	 * mientras se cargan los datos
	 */
	preload: function () {
		let progress = this.add.graphics();
		this.load.on("progress", function (value) {
			progress.clear();
			progress.fillStyle(0xffffff, 1);
			progress.fillRect(0, realHeight / 2, realWidth * value, 60);
		});

		this.load.on("complete", function () {
			progress.destroy();
		});

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
	 * @function create
	 * - cargar texto para mostrar los puntos y record
	 * - cargar los audio pero no reproducirlos hasta tener una confirmación del usuario (click en botón o pointerdown)
	 * - cargar las particulas
	 * - definir elements (frutas)
	 * - cargar 5 elements con un temporizador (this.time)
	 */
	create: function () {
		let styleText = {
			font: "5em tres",
			align: "left",
			fontWeight: "bold",
			stroke: "#000000",
			strokeThickness: 9,
		};
		this.myText = this.add.text(
			0.1 * realWidth,
			10,
			`🍊  ${this.points}\n 🏆 ${this.record}`,
			styleText,
		);

		this.music = this.sound.add("song");
		this.music.loop = true;
		this.music.stop();
		this.bell = this.sound.add("bell");
		this.bell.stop();

		this.btnAudio = this.add.text(
			realWidth - 0.2 * realWidth,
			10,
			"🔇",
			styleText,
		);
		this.btnAudio.setInteractive().on("pointerdown", () => {
			if (this.silence) {
				this.btnAudio.text = "🔊";
				this.music.play();
				this.silence = false;
			} else {
				this.btnAudio.text = "🔇";
				this.music.pause();
				this.silence = true;
			}
			this.btnAudio.updateText();
		});

		// Sistema de partículas simplificado - un solo emitter con límite de partículas
		this.particles = this.add.particles("particles");
		this.emitter = this.particles.createEmitter({
			frame: [0, 1, 2, 3, 4],
			x: 0,
			y: 0,
			speed: 300,
			lifespan: 800,
			on: false,
			maxParticles: 50, // Limitar partículas activas
		});

		this.elements = this.add.group({
			defaultKey: "elements",
			maxSize: 5,
			setCollideWorldBounds: true,
			runChildUpdate: false, // Los sprites no tienen update(), evitar llamadas innecesarias
			createCallback: function (el) {},
		});

		this.time.addEvent({
			delay: 1000,
			repeat: 4,
			loop: false,
			callback: () => {
				this.createElement();
			},
		});
	},
	/**
	 * @function setPoints: cambiar puntuación (puntos y record)
	 * - actualizar record (si el nuevo valor es mayor al récord actual)
	 * - vibrar si el puntaje se mantiene en cero (solo una vez consecutiva)
	 * - si suma puntos reproducir sonido
	 * - actualizar texto donde muestra puntuación
	 * - mover sprite al inicio de la pantalla
	 * @param {Integer} val
	 * @param {Sprite} el
	 */
	setPoints(val, el) {
		if (val > this.record) {
			this.record = val;
			localStorage.setItem("record", val);
			//this.cameras.main.setBackgroundColor(Phaser.Display.Color.RandomRGB().color);
		}
		if (val === 0 && val != this.points) {
			window.navigator.vibrate(1000);
		}

		if (!this.silence && val >= 1) {
			this.bell.play();
		}

		this.points = val;
		this.myText.text = `🍊  ${this.points}\n 🏆 ${this.record}`;
		this.myText.updateText();

		el.x = Phaser.Math.Between(0.1 * realWidth, realWidth - 0.1 * realWidth);
		el.y = 0;
	},
	/**
	 * @function createElement: crea un nuevo elemento (fruta) al inicio
	 * - revisar si ya hay 5 frutas (lo máximo permitido)
	 * - crear una fruta (en la parte superior)
	 * - cambiar el color de la fruta (setTint)
	 * - agregar evento pointerdown (click) para sumar puntos
	 * - hacer aparecer las partículas
	 */
	createElement: function () {
		if (!this.elements.isFull()) {
			let el = this.elements.create(
				Phaser.Math.Between(0.1 * realWidth, realWidth - 0.1 * realWidth),
				0,
				"elements",
				Phaser.Math.Between(0, 3),
			);
			el.setName("e" + this.elements.getLength());

			const colores = [0xffaaaa, 0xac93de, 0xffdd55, 0xffffff];
			const randomColor = colores[Math.floor(Math.random() * colores.length)];
			el.setTint(randomColor);

			el.setInteractive();
			el.setVisible(true);
			el.on("pointerdown", (pointer, localX, localY, event) => {
				this.setPoints(this.points + 1, el);
				// Emitir partículas de forma controlada
				this.emitter.setPosition(pointer.x, pointer.y);
				this.emitter.explode(5); // Solo 5 partículas por click
			});
		} else {
			return;
		}
	},
	/**
	 * @function interactElements: revisa si hay un elemento que esta
	 * pasando los límites de la pantalla, si lo hay debería cambiar el puntaje a 0
	 */
	interactElements: function () {
		this.elements.children.iterate((el) => {
			if (el.y > realHeight) {
				this.setPoints(0, el);
			}
		});
	},
	/**
	 * @function update:
	 * @param {number} time
	 * @param {number} delta
	 * @description: actualiza la velocidad y revisar si alguna fruta se escapa por los límites de la pantalla.
	 */
	update: function (time, delta) {
		// Velocidad con límite máximo para evitar problemas de rendimiento
		let velocidad = Math.min(1 + this.points * 0.1, 15); // Max 15 px/frame
		Phaser.Actions.IncY(this.elements.getChildren(), velocidad);
		this.interactElements();
	},
});

let config = {
	type: Phaser.AUTO,
	width: realWidth,
	height: realHeight,
	pixelArt: true,
	backgroundColor: Phaser.Display.Color.RandomRGB().color,
	zoom: 1,
	audio: {
		disableWebAudio: true,
	},
	input: {
		activePointers: 3,
	},
	pixelArt: true,
	physics: {
		default: "arcade",
		arcade: {},
	},
	scene: GameScene,
};

const game = new Phaser.Game(config);

/**
 * @function resize: adaptar las variables de realWidth y realHeight ante un cambio de dimensiones de pantalla
 */
window.addEventListener(
	"resize",
	(evt) => {
		realWidth = window.innerWidth;
		realHeight = window.innerHeight;
		game.scale.resize(realWidth, realHeight);
	},
	false,
);
