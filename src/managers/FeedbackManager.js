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
	 * Devuelve el color UI del tema activo como tint numérico.
	 */
	_getThemeColor() {
		const themeMap = {
			default: 0xcc66ff,
			sunset: 0xff3366,
			forest: 0x33ff33,
			night: 0x6699ff,
			cosmic: 0xcc66ff,
			fire: 0xff6600,
			gold: 0xffff00,
		};
		return themeMap[this.currentTheme] || 0xcc66ff;
	}

	/**
	 * Devuelve el color UI del tema activo como string CSS hex.
	 */
	_getThemeColorCSS(positive = true) {
		if (positive) {
			const map = {
				default: "#cc66ff",
				sunset: "#ff3366",
				forest: "#33ff33",
				night: "#6699ff",
				cosmic: "#cc66ff",
				fire: "#ff6600",
				gold: "#ffff00",
			};
			return map[this.currentTheme] || "#cc66ff";
		}
		// Negativo: versión oscura / desaturada del tema
		const map = {
			default: "#8844aa",
			sunset: "#993344",
			forest: "#337733",
			night: "#445588",
			cosmic: "#774488",
			fire: "#884400",
			gold: "#998800",
		};
		return map[this.currentTheme] || "#8844aa";
	}

	/**
	 * Muestra texto flotante de puntos ganados
	 * Usa colores del tema activo en vez de hardcoded
	 */
	showFloatingScore(x, y, points, isPositive = true) {
		const color = this._getThemeColorCSS(isPositive);
		const prefix = isPositive ? "+" : "-";

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
	 * Flash suave al perder — zen, no punitivo.
	 * Usa el color del tema en lugar de rojo agresivo.
	 * Viñeta desde los bordes en lugar de pantalla completa.
	 */
	showMissFlash(consecutiveMisses = 1) {
		const w = this.scene.scale.width;
		const h = this.scene.scale.height;

		// Alpha gentil: sube poco con misses, tope bajo
		const alpha = Math.min(0.12 + consecutiveMisses * 0.04, 0.3);
		const duration = 400 + Math.min(consecutiveMisses * 50, 200);

		// Color del tema (fallback: violeta suave en vez de rojo)
		const themeColor = this._getThemeColor();

		const flash = this.scene.add.rectangle(
			w / 2,
			h / 2,
			w,
			h,
			themeColor,
			alpha,
		);

		this.scene.tweens.add({
			targets: flash,
			alpha: 0,
			duration: duration,
			ease: "Sine.easeOut",
			onComplete: () => flash.destroy(),
		});
	}

	/**
	 * Feedback especial al atrapar la manzana dorada
	 */
	showGoldenCatch(x, y, bonus) {
		// Flash dorado en pantalla
		const flash = this.scene.add.rectangle(
			this.scene.scale.width / 2,
			this.scene.scale.height / 2,
			this.scene.scale.width,
			this.scene.scale.height,
			0xffcc00,
			0.2,
		);
		flash.setDepth(100);
		this.scene.tweens.add({
			targets: flash,
			alpha: 0,
			duration: 500,
			onComplete: () => flash.destroy(),
		});

		// Texto "+3 BONUS" grande y dorado
		const bonusText = this.scene.add
			.text(x, y - 20, `+${bonus}`, {
				font: "5em tres",
				color: "#ffcc00",
				stroke: "#000000",
				strokeThickness: 6,
			})
			.setOrigin(0.5)
			.setDepth(101);

		this.scene.tweens.add({
			targets: bonusText,
			y: y - 120,
			scaleX: 1.5,
			scaleY: 1.5,
			alpha: 0,
			duration: 1200,
			ease: "Power2",
			onComplete: () => bonusText.destroy(),
		});

		// Texto "BONUS" debajo
		const labelText = this.scene.add
			.text(x, y + 20, "BONUS", {
				font: "2.5em tres",
				color: "#ffee88",
				stroke: "#000000",
				strokeThickness: 4,
			})
			.setOrigin(0.5)
			.setDepth(101);

		this.scene.tweens.add({
			targets: labelText,
			y: y - 60,
			alpha: 0,
			duration: 1000,
			delay: 200,
			ease: "Power2",
			onComplete: () => labelText.destroy(),
		});

		// Anillo de expansión dorado
		const ring = this.scene.add.circle(x, y, 30, 0xffcc00, 0);
		ring.setStrokeStyle(3, 0xffcc00, 0.8);
		ring.setDepth(100);
		this.scene.tweens.add({
			targets: ring,
			scaleX: 4,
			scaleY: 4,
			alpha: 0,
			duration: 700,
			ease: "Power2",
			onComplete: () => ring.destroy(),
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

		// Texto de NEW RECORD (arcade style, sin emojis)
		const recordText = this.scene.add
			.text(centerX, this.scene.scale.height / 2, "* NEW RECORD *", {
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
		const themeCSS = this._getThemeColorCSS(true);
		const themeTint = this._getThemeColor();

		// Container para el mensaje
		const container = this.scene.add.container(centerX, centerY);

		// Background arcade (dark panel with neon border)
		const bg = this.scene.add
			.rectangle(0, 0, 350, 120, 0x05001a, 0.9)
			.setOrigin(0.5);

		// Borde neón — usa color del tema
		const border = this.scene.add.graphics();
		border.lineStyle(2, themeTint, 0.7);
		border.strokeRect(-175, -60, 350, 120);
		container.add(border);

		// Título del milestone (color del tema)
		const titleText = this.scene.add
			.text(0, -25, title, {
				font: "2.5em tres",
				color: themeCSS,
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
		const themeCSS = this._getThemeColorCSS(true);
		const text = this.scene.add
			.text(
				this.scene.scale.width / 2,
				this.scene.scale.height * 0.7,
				"MAX SPEED\nZEN MODE ACTIVE",
				{
					font: "2em tres",
					color: themeCSS,
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
