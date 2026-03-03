/**
 * FeedbackManager - Maneja todos los efectos visuales de feedback
 *
 * Inspirado en:
 * - Fruit Ninja: texto flotante "+N"
 * - Piano Tiles: flash rojo en miss
 * - Candy Crush: confetti en récord
 * - Flappy Bird: camera shake
 */
export default class FeedbackManager {
	constructor(scene) {
		this.scene = scene;
		this.currentTheme = "default";
	}

	/**
	 * Muestra texto flotante de puntos ganados (estilo Fruit Ninja)
	 */
	showFloatingScore(x, y, points, isPositive = true) {
		const color = isPositive ? "#33ff33" : "#ff3366";
		const prefix = isPositive ? "+" : "";

		const text = this.scene.add
			.text(x, y, `${prefix}${points}`, {
				font: "3em tres",
				color: color,
				stroke: "#000000",
				strokeThickness: 4,
			})
			.setOrigin(0.5);

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

	/**
	 * Flash rojo en la pantalla al perder (estilo Piano Tiles)
	 */
	showMissFlash() {
		const flash = this.scene.add.rectangle(
			this.scene.scale.width / 2,
			this.scene.scale.height / 2,
			this.scene.scale.width,
			this.scene.scale.height,
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

	/**
	 * Camera shake suave al perder racha
	 */
	shakeCamera(intensity = 0.01, duration = 200) {
		this.scene.cameras.main.shake(duration, intensity);
	}

	/**
	 * Celebración de nuevo récord con confetti
	 */
	showNewRecord() {
		const centerX = this.scene.scale.width / 2;

		// Crear emisor de confetti usando sprites de partículas
		const emitter = this.scene.add.particles(centerX, -50, "particles", {
			frame: [0, 1, 2, 3, 4],
			x: { min: -this.scene.scale.width / 2, max: this.scene.scale.width / 2 },
			speed: { min: 100, max: 200 },
			angle: { min: 80, max: 100 },
			lifespan: 3000,
			quantity: 2,
			frequency: 50,
			gravityY: 100,
			emitting: true,
		});

		// Detener después de 2 segundos
		this.scene.time.delayedCall(2000, () => {
			emitter.stop();
			this.scene.time.delayedCall(3000, () => emitter.destroy());
		});

		// Texto de NUEVO RECORD (arcade style, sin emojis)
		const recordText = this.scene.add
			.text(centerX, this.scene.scale.height / 2, "* NUEVO RECORD *", {
				font: "4em tres",
				color: "#ffff00",
				stroke: "#000000",
				strokeThickness: 6,
			})
			.setOrigin(0.5)
			.setScale(0);

		this.scene.tweens.add({
			targets: recordText,
			scale: 1,
			duration: 500,
			ease: "Back.easeOut",
			yoyo: true,
			hold: 1500,
			onComplete: () => recordText.destroy(),
		});
	}

	/**
	 * Muestra mensaje de milestone alcanzado
	 */
	showMilestoneMessage(title, message) {
		const centerX = this.scene.scale.width / 2;
		const centerY = this.scene.scale.height * 0.3;

		// Container para el mensaje
		const container = this.scene.add.container(centerX, centerY);

		// Background arcade (dark panel with neon border)
		const bg = this.scene.add
			.rectangle(0, 0, 350, 120, 0x0a0a2e, 0.9)
			.setOrigin(0.5);

		// Borde neón
		const border = this.scene.add.graphics();
		border.lineStyle(2, 0x00ffff, 0.7);
		border.strokeRect(-175, -60, 350, 120);
		container.add(border);

		// Título del milestone (neon arcade)
		const titleText = this.scene.add
			.text(0, -25, title, {
				font: "2.5em tres",
				color: "#00ffff",
				stroke: "#000000",
				strokeThickness: 4,
			})
			.setOrigin(0.5);

		// Mensaje
		const msgText = this.scene.add
			.text(0, 20, message, {
				font: "1.5em tres",
				color: "#ffffff",
			})
			.setOrigin(0.5);

		container.add([bg, titleText, msgText]);
		container.setAlpha(0);
		container.setScale(0.5);

		// Animación de entrada
		this.scene.tweens.add({
			targets: container,
			alpha: 1,
			scale: 1,
			duration: 400,
			ease: "Back.easeOut",
		});

		// Animación de salida
		this.scene.time.delayedCall(2500, () => {
			this.scene.tweens.add({
				targets: container,
				alpha: 0,
				y: centerY - 50,
				duration: 400,
				ease: "Power2",
				onComplete: () => container.destroy(),
			});
		});
	}

	/**
	 * Efecto de pulso en el score cuando aumenta
	 */
	pulseScore(scoreText) {
		this.scene.tweens.add({
			targets: scoreText,
			scale: 1.2,
			duration: 100,
			yoyo: true,
			ease: "Power2",
		});
	}

	/**
	 * Transición suave de fondo al cambiar tema
	 */
	transitionBackground(newColor) {
		const currentColor = this.scene.cameras.main.backgroundColor;

		// Crear overlay con el nuevo color
		const overlay = this.scene.add
			.rectangle(
				this.scene.scale.width / 2,
				this.scene.scale.height / 2,
				this.scene.scale.width,
				this.scene.scale.height,
				newColor,
				0,
			)
			.setDepth(-1);

		this.scene.tweens.add({
			targets: overlay,
			alpha: 1,
			duration: 500,
			ease: "Linear",
			onComplete: () => {
				this.scene.cameras.main.setBackgroundColor(newColor);
				overlay.destroy();
			},
		});
	}

	/**
	 * Actualiza el tema actual
	 */
	setTheme(themeName) {
		this.currentTheme = themeName;
	}

	/**
	 * Muestra mensaje de plateau alcanzado
	 */
	showPlateauMessage() {
		const text = this.scene.add
			.text(
				this.scene.scale.width / 2,
				this.scene.scale.height * 0.7,
				"VELOCIDAD MAXIMA\nMODO ZEN ACTIVADO",
				{
					font: "2em tres",
					color: "#ff00ff",
					stroke: "#000000",
					strokeThickness: 4,
					align: "center",
				},
			)
			.setOrigin(0.5)
			.setAlpha(0);

		this.scene.tweens.add({
			targets: text,
			alpha: 1,
			duration: 500,
			hold: 2000,
			yoyo: true,
			onComplete: () => text.destroy(),
		});
	}
}
