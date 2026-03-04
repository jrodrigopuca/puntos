import Phaser from "phaser";
import { getTheme } from "../config/themes.js";

/**
 * BackgroundManager – Neon vertical grid
 *
 * Grid plano que scrollea hacia abajo (misma dirección que las frutas),
 * con glow lines, breathing y speed burst reactivos al gameplay.
 * Sin horizonte, sin sol, sin perspectiva — fondo atmosférico que
 * no compite con los objetos de juego.
 */
export default class BackgroundManager {
	constructor(scene) {
		this.scene = scene;

		/* ---------- Grid ---------- */
		this.CELL_SIZE = 56;
		this.SCROLL_SPEED = 0.8;
		this.LINE_ALPHA = 0.14;
		this.LINE_WIDTH = 1;

		/* ---------- Sky gradient ---------- */
		this.SKY_TOP = 0x05001a;
		this.SKY_BOTTOM = 0x120630;

		/* ---------- Breathing ---------- */
		this.breathPhase = 0;
		this.BREATH_SPEED = 0.02;
		this.BREATH_AMPLITUDE = 0.04;

		/* ---------- Speed burst ---------- */
		this.speedMultiplier = 1;

		/* ---------- Scroll offset (px) ---------- */
		this.scrollOffset = 0;

		/* ---------- Glow lines (caen) ---------- */
		this.GLOW_SPAWN_INTERVAL = 2400;
		this.GLOW_ALPHA_START = 0.5;
		this.GLOW_FADE = 0.003;
		this.GLOW_COLOR = 0xffffff;
		this.glowLines = [];
		this.glowTimer = null;

		/* ---------- Floating particles ---------- */
		this.PARTICLE_COUNT = 12;
		this.floatingParticles = [];

		/* ---------- State ---------- */
		this.graphics = null;
		this.currentTheme = "default";
		this.lineColor = 0xcc66ff;

		/* ---------- Record background colors ---------- */
		// Progresión de fondos oscuros neón al superar récords
		this.RECORD_GRADIENTS = [
			{ top: 0x05001a, bottom: 0x120630 }, // default — deep purple
			{ top: 0x06001f, bottom: 0x1a0840 }, // intense purple
			{ top: 0x080025, bottom: 0x200a4a }, // vivid purple
			{ top: 0x0a0030, bottom: 0x280c55 }, // royal purple
			{ top: 0x0c0038, bottom: 0x300e60 }, // deep violet
			{ top: 0x0e0040, bottom: 0x3a1070 }, // neon violet
			{ top: 0x100048, bottom: 0x441280 }, // bright violet
			{ top: 0x120050, bottom: 0x4e1490 }, // electric
		];
		this.recordColorIndex = 0;
	}

	/* ================================================================= */

	create() {
		const theme = getTheme(this.currentTheme);
		this.lineColor = theme.ui;

		this.graphics = this.scene.add.graphics();
		this.graphics.setDepth(-10);

		this.glowTimer = this.scene.time.addEvent({
			delay: this.GLOW_SPAWN_INTERVAL,
			loop: true,
			callback: () => this.spawnGlowLine(),
		});

		this.spawnGlowLine();
		this.initFloatingParticles();
	}

	/* ================================================================= */

	update() {
		if (!this.graphics) return;

		const w = this.scene.scale.width;
		const h = this.scene.scale.height;

		// Breathing
		this.breathPhase += this.BREATH_SPEED;
		const breath = Math.sin(this.breathPhase);
		const breathAlpha = this.LINE_ALPHA + breath * this.BREATH_AMPLITUDE;

		// Speed burst decay
		this.speedMultiplier += (1 - this.speedMultiplier) * 0.03;

		// Scroll (hacia abajo, como las frutas)
		this.scrollOffset += this.SCROLL_SPEED * this.speedMultiplier;
		if (this.scrollOffset >= this.CELL_SIZE) {
			this.scrollOffset -= this.CELL_SIZE;
		}

		this.graphics.clear();

		// 1. Degradado sutil de fondo
		this.drawSkyGradient(w, h);

		// 2. Grid neón vertical
		this.drawGrid(w, h, breathAlpha);

		// 3. Glow lines que caen
		this.updateGlowLines(w, h);

		// 4. Partículas flotantes
		this.updateFloatingParticles(w, h);
	}

	/* ================================================================= */

	drawSkyGradient(w, h) {
		this.graphics.fillGradientStyle(
			this.SKY_TOP,
			this.SKY_TOP,
			this.SKY_BOTTOM,
			this.SKY_BOTTOM,
			1,
			1,
			1,
			1,
		);
		this.graphics.fillRect(0, 0, w, h);
	}

	drawGrid(w, h, breathAlpha) {
		const cell = this.CELL_SIZE;

		// --- Líneas horizontales (scrollean hacia abajo) ---
		const hCount = Math.ceil(h / cell) + 1;
		for (let i = -1; i <= hCount; i++) {
			const y = i * cell + this.scrollOffset;

			// Fade: más tenue en extremos verticales
			const progress = y / h;
			const edgeFade = 1 - 0.4 * Math.abs(progress - 0.5) * 2; // Centro=1, bordes=0.6
			const alpha = breathAlpha * Math.max(0.3, edgeFade);

			this.graphics.lineStyle(this.LINE_WIDTH, this.lineColor, alpha);
			this.graphics.beginPath();
			this.graphics.moveTo(0, y);
			this.graphics.lineTo(w, y);
			this.graphics.strokePath();
		}

		// --- Líneas verticales (estáticas, centradas) ---
		const vCount = Math.ceil(w / cell);
		const vOffset = (w % cell) / 2;
		for (let i = 0; i <= vCount; i++) {
			const x = i * cell + vOffset;

			// Fade: más visible al centro, sutil en bordes laterales
			const centerDist = Math.abs(x - w / 2) / (w / 2);
			const alpha = breathAlpha * (1 - centerDist * 0.45);

			this.graphics.lineStyle(this.LINE_WIDTH, this.lineColor, alpha);
			this.graphics.beginPath();
			this.graphics.moveTo(x, 0);
			this.graphics.lineTo(x, h);
			this.graphics.strokePath();
		}
	}

	/* ================================================================= */

	updateGlowLines(w, h) {
		for (let i = this.glowLines.length - 1; i >= 0; i--) {
			const glow = this.glowLines[i];
			glow.y += glow.speed;
			glow.alpha -= this.GLOW_FADE;

			if (glow.alpha <= 0 || glow.y > h + 20) {
				this.glowLines.splice(i, 1);
				continue;
			}

			// Halo difuso
			this.graphics.lineStyle(10, this.GLOW_COLOR, glow.alpha * 0.06);
			this.graphics.beginPath();
			this.graphics.moveTo(0, glow.y);
			this.graphics.lineTo(w, glow.y);
			this.graphics.strokePath();

			// Core brillante
			this.graphics.lineStyle(2, this.GLOW_COLOR, glow.alpha);
			this.graphics.beginPath();
			this.graphics.moveTo(0, glow.y);
			this.graphics.lineTo(w, glow.y);
			this.graphics.strokePath();
		}
	}

	spawnGlowLine() {
		this.glowLines.push({
			y: Phaser.Math.Between(-20, 0),
			speed: Phaser.Math.FloatBetween(0.6, 1.4),
			alpha: this.GLOW_ALPHA_START,
		});
	}

	/* ================================================================= */

	initFloatingParticles() {
		const w = this.scene.scale.width;
		const h = this.scene.scale.height;
		const theme = getTheme(this.currentTheme);

		for (let i = 0; i < this.PARTICLE_COUNT; i++) {
			this.floatingParticles.push({
				x: Phaser.Math.Between(0, w),
				y: Phaser.Math.Between(0, h),
				size: Phaser.Math.Between(1, 3),
				speedX: Phaser.Math.FloatBetween(-0.15, 0.15),
				speedY: Phaser.Math.FloatBetween(0.05, 0.3),
				alpha: Phaser.Math.FloatBetween(0.06, 0.22),
				color: Phaser.Utils.Array.GetRandom(theme.particles),
				phase: Math.random() * Math.PI * 2,
			});
		}
	}

	updateFloatingParticles(w, h) {
		for (const p of this.floatingParticles) {
			p.x += p.speedX;
			p.y += p.speedY;
			p.phase += 0.02;

			const a = p.alpha + Math.sin(p.phase) * 0.06;

			// Wrap: reaparece arriba si sale abajo
			if (p.y > h + 10) {
				p.y = -5;
				p.x = Phaser.Math.Between(0, w);
			}
			if (p.x < -10) p.x = w + 5;
			if (p.x > w + 10) p.x = -5;

			this.graphics.fillStyle(p.color, Math.max(0.03, a));
			this.graphics.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
		}
	}

	/* ================================================================= */

	setTheme(themeName) {
		if (themeName === this.currentTheme) return;
		this.currentTheme = themeName;

		const theme = getTheme(themeName);
		this.lineColor = theme.ui;

		for (const p of this.floatingParticles) {
			p.color = Phaser.Utils.Array.GetRandom(theme.particles);
		}
	}

	burst(count = 10) {
		for (let i = 0; i < count; i++) {
			this.scene.time.delayedCall(i * 60, () => this.spawnGlowLine());
		}
	}

	onCatch() {
		this.speedMultiplier = 3.0;
	}

	/**
	 * Cambia el degradado de fondo al superar el récord
	 */
	onNewRecord() {
		this.recordColorIndex =
			(this.recordColorIndex + 1) % this.RECORD_GRADIENTS.length;
		const grad = this.RECORD_GRADIENTS[this.recordColorIndex];

		// Transición suave
		const oldTop = this.SKY_TOP;
		const oldBottom = this.SKY_BOTTOM;
		const obj = { t: 0 };

		this.scene.tweens.add({
			targets: obj,
			t: 1,
			duration: 600,
			ease: "Sine.easeInOut",
			onUpdate: () => {
				this.SKY_TOP = this.lerpColor(oldTop, grad.top, obj.t);
				this.SKY_BOTTOM = this.lerpColor(oldBottom, grad.bottom, obj.t);
			},
		});
	}

	handleResize() {
		// Se adapta automáticamente cada frame
	}

	/**
	 * Interpola linealmente entre dos colores hex
	 */
	lerpColor(c1, c2, t) {
		const r1 = (c1 >> 16) & 0xff;
		const g1 = (c1 >> 8) & 0xff;
		const b1 = c1 & 0xff;
		const r2 = (c2 >> 16) & 0xff;
		const g2 = (c2 >> 8) & 0xff;
		const b2 = c2 & 0xff;
		return (
			(Math.round(r1 + (r2 - r1) * t) << 16) |
			(Math.round(g1 + (g2 - g1) * t) << 8) |
			Math.round(b1 + (b2 - b1) * t)
		);
	}

	destroy() {
		this.glowTimer?.remove();
		this.graphics?.destroy();
		this.glowLines = [];
		this.floatingParticles = [];
	}
}
