import { GameConstants } from "../config/constants.js";

/**
 * UIManager - Gestiona toda la interfaz de usuario del juego
 *
 * Crea paneles integrados con aspecto de juego casual,
 * usando sprites en lugar de emojis para consistencia visual.
 */
export default class UIManager {
	constructor(scene) {
		this.scene = scene;

		// Contenedores de UI
		this.scorePanel = null;
		this.controlPanel = null;

		// Elementos individuales
		this.scoreIcon = null;
		this.scoreText = null;
		this.trophyIcon = null;
		this.recordText = null;
		this.btnSound = null;
		this.btnPause = null;
		this.soundIcon = null;
		this.pauseIcon = null;

		// Estado
		this.isMuted = true;

		// Configuración visual (retro arcade 80s / CRT neon)
		this.config = {
			panelColor: 0x05001a,
			panelAlpha: 0.9,
			borderColor: 0xcc66ff,
			borderAlpha: 0.8,
			borderWidth: 2,
			iconSize: 36,
			buttonSize: 48,
			padding: 10,
			margin: 12,
			fontFamily: "tres, monospace",
			accentColor: "#00ffff",
			scoreColor: "#33ff33",
			recordColor: "#ffff00",
		};
	}

	/**
	 * Crea toda la interfaz de usuario
	 */
	create(initialScore = 0, initialRecord = 0) {
		this.createScorePanel(initialScore, initialRecord);
		this.createControlPanel();

		// Escuchar resize
		this.scene.scale.on("resize", this.handleResize, this);
	}

	/**
	 * Crea el panel de puntuación (esquina superior izquierda)
	 */
	createScorePanel(score, record) {
		const {
			padding,
			margin,
			iconSize,
			panelColor,
			panelAlpha,
			borderColor,
			borderAlpha,
			borderWidth,
			fontFamily,
		} = this.config;

		// Calcular dimensiones del panel
		const panelWidth = 170;
		const panelHeight = 84;

		// Container para todo el panel
		this.scorePanel = this.scene.add.container(margin, margin);

		// Fondo del panel (rectángulo con borde pixel)
		const bg = this.scene.add.graphics();
		bg.fillStyle(panelColor, panelAlpha);
		bg.fillRect(0, 0, panelWidth, panelHeight);
		bg.lineStyle(borderWidth, borderColor, borderAlpha);
		bg.strokeRect(0, 0, panelWidth, panelHeight);
		this.scorePanel.add(bg);

		// Fila 1: Score
		this.scoreIcon = this.scene.add
			.image(padding + iconSize / 2, padding + iconSize / 2, "icon-fruit")
			.setDisplaySize(iconSize, iconSize);
		this.scorePanel.add(this.scoreIcon);

		this.scoreText = this.scene.add
			.text(padding + iconSize + 8, padding + iconSize / 2, String(score), {
				fontFamily: fontFamily,
				fontSize: "26px",
				color: this.config.scoreColor,
				stroke: "#000000",
				strokeThickness: 4,
			})
			.setOrigin(0, 0.5);
		this.scorePanel.add(this.scoreText);

		// Fila 2: Record
		this.trophyIcon = this.scene.add
			.image(
				padding + iconSize / 2,
				padding + iconSize + 6 + iconSize / 2,
				"icon-trophy",
			)
			.setDisplaySize(iconSize - 6, iconSize - 6);
		this.scorePanel.add(this.trophyIcon);

		this.recordText = this.scene.add
			.text(
				padding + iconSize + 8,
				padding + iconSize + 6 + iconSize / 2,
				String(record),
				{
					fontFamily: fontFamily,
					fontSize: "20px",
					color: this.config.recordColor,
					stroke: "#000000",
					strokeThickness: 3,
				},
			)
			.setOrigin(0, 0.5);
		this.scorePanel.add(this.recordText);

		// Hacer el panel con profundidad alta para estar sobre el juego
		this.scorePanel.setDepth(100);
	}

	/**
	 * Crea el panel de controles (esquina superior derecha)
	 */
	createControlPanel() {
		const {
			padding,
			margin,
			buttonSize,
			panelColor,
			panelAlpha,
			borderColor,
			borderAlpha,
			borderWidth,
		} = this.config;

		// Calcular dimensiones
		const panelWidth = buttonSize * 2 + padding * 3;
		const panelHeight = buttonSize + padding * 2;
		const panelX = this.scene.scale.width - margin - panelWidth;

		// Container
		this.controlPanel = this.scene.add.container(panelX, margin);

		// Fondo (rectángulo con borde pixel)
		const bg = this.scene.add.graphics();
		bg.fillStyle(panelColor, panelAlpha);
		bg.fillRect(0, 0, panelWidth, panelHeight);
		bg.lineStyle(borderWidth, borderColor, borderAlpha);
		bg.strokeRect(0, 0, panelWidth, panelHeight);
		this.controlPanel.add(bg);

		// Botón de sonido
		const soundBtnX = padding + buttonSize / 2;
		const soundBtnY = padding + buttonSize / 2;

		this.btnSound = this.createButton(soundBtnX, soundBtnY, buttonSize, () =>
			this.toggleSound(),
		);
		this.controlPanel.add(this.btnSound);
		if (this.btnSound._pixelBorder)
			this.controlPanel.add(this.btnSound._pixelBorder);

		this.soundIcon = this.scene.add
			.image(soundBtnX, soundBtnY, "icon-sound-off")
			.setDisplaySize(buttonSize - 16, buttonSize - 16);
		this.controlPanel.add(this.soundIcon);

		// Botón de pausa
		const pauseBtnX = padding * 2 + buttonSize + buttonSize / 2;
		const pauseBtnY = padding + buttonSize / 2;

		this.btnPause = this.createButton(pauseBtnX, pauseBtnY, buttonSize, () =>
			this.scene.togglePause(),
		);
		this.controlPanel.add(this.btnPause);
		if (this.btnPause._pixelBorder)
			this.controlPanel.add(this.btnPause._pixelBorder);

		this.pauseIcon = this.scene.add
			.image(pauseBtnX, pauseBtnY, "icon-pause")
			.setDisplaySize(buttonSize - 16, buttonSize - 16);
		this.controlPanel.add(this.pauseIcon);

		this.controlPanel.setDepth(100);
	}

	/**
	 * Crea un botón cuadrado pixel-art interactivo (estilo arcade neon)
	 */
	createButton(x, y, size, callback) {
		// Botón cuadrado arcade
		const btn = this.scene.add.rectangle(x, y, size, size, 0x05001a, 0.8);
		btn.setInteractive({ useHandCursor: true });

		// Borde neón
		const border = this.scene.add.graphics();
		border.lineStyle(2, 0xcc66ff, 0.6);
		border.strokeRect(x - size / 2, y - size / 2, size, size);

		// Efectos hover/press arcade
		btn.on("pointerover", () => {
			btn.setFillStyle(0xcc66ff, 0.2);
		});

		btn.on("pointerout", () => {
			btn.setFillStyle(0x05001a, 0.8);
		});

		btn.on("pointerdown", () => {
			btn.setFillStyle(0xcc66ff, 0.4);
			this.scene.tweens.add({
				targets: btn,
				scaleX: 0.9,
				scaleY: 0.9,
				duration: 50,
				yoyo: true,
			});
			callback();
		});

		// Almacenar referencia del borde para limpieza
		btn._pixelBorder = border;
		return btn;
	}

	/**
	 * Toggle del sonido
	 */
	toggleSound() {
		this.isMuted = !this.isMuted;

		if (this.isMuted) {
			this.soundIcon.setTexture("icon-sound-off");
			this.scene.music?.pause();
			this.scene.synth?.suspend();
		} else {
			this.soundIcon.setTexture("icon-sound-on");
			if (this.scene.music?.isPlaying) {
				this.scene.music.resume();
			} else {
				this.scene.music?.play();
			}
			this.scene.synth?.resume();
		}

		// Actualizar referencia en scene
		this.scene.isMuted = this.isMuted;
	}

	/**
	 * Actualiza el score mostrado
	 */
	updateScore(score) {
		this.scoreText.setText(String(score));

		// Efecto de pulso
		this.scene.tweens.add({
			targets: [this.scoreText, this.scoreIcon],
			scale: 1.2,
			duration: 100,
			yoyo: true,
			ease: "Power2",
		});
	}

	/**
	 * Actualiza el record mostrado
	 */
	updateRecord(record) {
		this.recordText.setText(String(record));

		// Efecto especial para nuevo récord
		this.scene.tweens.add({
			targets: [this.recordText, this.trophyIcon],
			scale: 1.3,
			duration: 200,
			yoyo: true,
			ease: "Bounce",
		});
	}

	/**
	 * Cambia el icono de pausa a play (cuando está pausado)
	 */
	setPaused(isPaused) {
		if (isPaused) {
			this.pauseIcon.setTexture("icon-play");
		} else {
			this.pauseIcon.setTexture("icon-pause");
		}
	}

	/**
	 * Reposiciona elementos cuando cambia el tamaño de pantalla
	 */
	handleResize(gameSize) {
		const { margin, padding, buttonSize } = this.config;
		const panelWidth = buttonSize * 2 + padding * 3;

		// Reposicionar panel de controles
		if (this.controlPanel) {
			this.controlPanel.x = gameSize.width - margin - panelWidth;
		}
	}

	/**
	 * Destruye todos los elementos de UI
	 */
	destroy() {
		this.scene.scale.off("resize", this.handleResize, this);
		this.scorePanel?.destroy();
		this.controlPanel?.destroy();
	}
}
