import Phaser from "phaser";
import { getTheme } from "../config/themes.js";

/**
 * BackgroundManager - Grid neón flotante estilo synthwave / Tron
 *
 * Dibuja líneas horizontales y verticales que se desplazan suavemente,
 * creando la ilusión de una cuadrícula infinita en perspectiva.
 * Los colores del grid cambian con cada tema/milestone.
 */
export default class BackgroundManager {
	constructor(scene) {
		this.scene = scene;

		// Configuración del grid (spacing fijo — adaptativo a cualquier pantalla)
		this.CELL_SIZE = 64; // px — tamaño de celda constante
		this.SCROLL_SPEED = 1.2; // px/frame
		this.LINE_ALPHA = 0.18;
		this.LINE_WIDTH = 1;

		// Glow config
		this.GLOW_SPAWN_INTERVAL = 1800; // ms entre glow lines
		this.GLOW_ALPHA_START = 0.8;
		this.GLOW_FADE = 0.003;
		this.GLOW_COLOR = 0xffffff; // blanco para contrastar con el grid

		// Estado
		this.graphics = null;
		this.scrollOffset = 0;
		this.currentTheme = "default";
		this.lineColor = 0x00ffff;
		this.glowLines = [];
		this.glowTimer = null;
	}

	/**
	 * Inicializa el grid
	 */
	create() {
		const theme = getTheme(this.currentTheme);
		this.lineColor = theme.ui;

		this.graphics = this.scene.add.graphics();
		this.graphics.setDepth(-10);

		// Spawn glow lines periódicamente
		this.glowTimer = this.scene.time.addEvent({
			delay: this.GLOW_SPAWN_INTERVAL,
			loop: true,
			callback: () => this.spawnGlowLine(),
		});

		// Lanzar una glow inicial para que se vea de entrada
		this.spawnGlowLine();
	}

	/**
	 * Dibuja y anima el grid (llamar desde update)
	 */
	update() {
		if (!this.graphics) return;

		const w = this.scene.scale.width;
		const h = this.scene.scale.height;

		this.scrollOffset += this.SCROLL_SPEED;

		const cellSize = this.CELL_SIZE;

		// Reciclar offset cuando se desplaza una celda completa
		if (this.scrollOffset >= cellSize) {
			this.scrollOffset -= cellSize;
		}

		this.graphics.clear();

		// --- Líneas horizontales (se desplazan hacia abajo) ---
		const hCount = Math.ceil(h / cellSize) + 1;
		for (let i = -1; i <= hCount; i++) {
			const y = i * cellSize + this.scrollOffset;

			// Fade: más transparente arriba, más visible abajo
			const progress = Math.max(0, Math.min(y / h, 1));
			const alpha = this.LINE_ALPHA * (0.3 + progress * 0.7);

			this.graphics.lineStyle(this.LINE_WIDTH, this.lineColor, alpha);
			this.graphics.beginPath();
			this.graphics.moveTo(0, y);
			this.graphics.lineTo(w, y);
			this.graphics.strokePath();
		}

		// --- Líneas verticales (estáticas, adaptativas al ancho) ---
		const vCount = Math.ceil(w / cellSize);
		const vOffset = (w % cellSize) / 2; // centrar la grilla
		for (let i = 0; i <= vCount; i++) {
			const x = i * cellSize + vOffset;

			// Fade: más visible en el centro, fade hacia los bordes
			const centerDist = Math.abs(x - w / 2) / (w / 2);
			const alpha = this.LINE_ALPHA * (1 - centerDist * 0.5);

			this.graphics.lineStyle(this.LINE_WIDTH, this.lineColor, alpha);
			this.graphics.beginPath();
			this.graphics.moveTo(x, 0);
			this.graphics.lineTo(x, h);
			this.graphics.strokePath();
		}

		// --- Glow lines (highlights temporales que suben) ---
		this.updateGlowLines(w, h);
	}

	/**
	 * Actualiza líneas de brillo que suben por el grid
	 */
	updateGlowLines(w, h) {
		for (let i = this.glowLines.length - 1; i >= 0; i--) {
			const glow = this.glowLines[i];
			glow.y -= glow.speed;
			glow.alpha -= this.GLOW_FADE;

			if (glow.alpha <= 0 || glow.y < -10) {
				this.glowLines.splice(i, 1);
				continue;
			}

			// Halo ancho difuso (glow CRT)
			this.graphics.lineStyle(14, this.GLOW_COLOR, glow.alpha * 0.08);
			this.graphics.beginPath();
			this.graphics.moveTo(0, glow.y);
			this.graphics.lineTo(w, glow.y);
			this.graphics.strokePath();

			// Línea central brillante
			this.graphics.lineStyle(3, this.GLOW_COLOR, glow.alpha);
			this.graphics.beginPath();
			this.graphics.moveTo(0, glow.y);
			this.graphics.lineTo(w, glow.y);
			this.graphics.strokePath();
		}
	}

	/**
	 * Genera una línea de brillo ocasional (se llama internamente o en burst)
	 */
	spawnGlowLine() {
		const h = this.scene.scale.height;
		this.glowLines.push({
			y: Phaser.Math.Between(Math.floor(h * 0.4), h),
			speed: Phaser.Math.FloatBetween(0.5, 1.2),
			alpha: this.GLOW_ALPHA_START,
		});
	}

	/**
	 * Cambia el tema — transiciona el color del grid
	 */
	setTheme(themeName) {
		if (themeName === this.currentTheme) return;
		this.currentTheme = themeName;

		const theme = getTheme(themeName);
		this.lineColor = theme.ui;
	}

	/**
	 * Efecto especial: ráfaga de líneas brillantes (para milestones/records)
	 */
	burst(count = 10) {
		for (let i = 0; i < count; i++) {
			this.scene.time.delayedCall(i * 60, () => {
				this.spawnGlowLine();
			});
		}
	}

	/**
	 * Maneja resize de pantalla
	 */
	handleResize(gameSize) {
		// El grid se redibuia cada frame, se adapta automáticamente
	}

	/**
	 * Limpieza
	 */
	destroy() {
		this.glowTimer?.remove();
		this.graphics?.destroy();
		this.glowLines = [];
	}
}
