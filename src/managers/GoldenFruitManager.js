import Phaser from "phaser";
import { GameConstants } from "../config/constants.js";

/**
 * GoldenFruitManager - Gestiona la manzana dorada (combo bonus)
 *
 * Cada ~12 segundos aparece una manzana dorada especial que:
 * - Tiene un glow dorado pulsante más grande
 * - Cae igual que las frutas normales
 * - Al tocarla otorga +3 puntos bonus con efectos especiales
 * - Si se escapa, no penaliza (es un bonus, no obligación)
 */
export default class GoldenFruitManager {
	constructor(scene) {
		this.scene = scene;

		// Configuración
		const cfg = GameConstants.GOLDEN;
		this.FRAME = cfg.FRAME;
		this.BONUS_POINTS = cfg.BONUS_POINTS;
		this.SPAWN_INTERVAL = cfg.SPAWN_INTERVAL;
		this.SPAWN_VARIANCE = cfg.SPAWN_VARIANCE;
		this.GLOW_COLOR = cfg.GLOW_COLOR;
		this.PULSE_SPEED = cfg.PULSE_SPEED;

		// Estado
		this.goldenFruit = null;
		this.sparkles = [];
		this.spawnTimer = null;
		this.active = false;
	}

	/**
	 * Inicia el ciclo de spawn de manzanas doradas
	 */
	start() {
		this.scheduleNext();
	}

	/**
	 * Programa la próxima aparición
	 */
	scheduleNext() {
		const delay =
			this.SPAWN_INTERVAL +
			Phaser.Math.Between(-this.SPAWN_VARIANCE, this.SPAWN_VARIANCE);

		this.spawnTimer = this.scene.time.delayedCall(delay, () => {
			this.spawn();
		});
	}

	/**
	 * Crea la manzana dorada con efectos visuales especiales
	 */
	spawn() {
		if (this.active) return;

		const margin = this.scene.scale.width * GameConstants.UI.MARGIN_PERCENT;
		const x = Phaser.Math.Between(margin, this.scene.scale.width - margin);

		// Crear la fruta dorada
		const fpf = GameConstants.GAMEPLAY.FRAMES_PER_FRUIT;
		this.goldenFruit = this.scene.add.sprite(
			x,
			-40,
			"elements",
			this.FRAME * fpf,
		);
		const targetScale = 2.8; // Ligeramente más grande que las normales (2.5)
		this.goldenFruit.setScale(0);
		this.goldenFruit.setData("targetScale", targetScale);
		this.goldenFruit.setData("baseX", x);

		// Wobble primario (balanceo lento)
		this.goldenFruit.setData("wobbleAmp", Phaser.Math.FloatBetween(14, 30));
		this.goldenFruit.setData("wobbleFreq", Phaser.Math.FloatBetween(1.0, 2.0));
		this.goldenFruit.setData("wobblePhase", Math.random() * Math.PI * 2);

		// Wobble secundario (perturbación sutil)
		this.goldenFruit.setData("wobble2Amp", Phaser.Math.FloatBetween(3, 10));
		this.goldenFruit.setData("wobble2Freq", Phaser.Math.FloatBetween(2.5, 3.8));
		this.goldenFruit.setData("wobble2Phase", Math.random() * Math.PI * 2);

		// Drift horizontal
		this.goldenFruit.setData(
			"driftSpeed",
			Phaser.Math.FloatBetween(-0.12, 0.12),
		);

		// Spin 3D
		this.goldenFruit.setData(
			"spinSpeed",
			Phaser.Math.FloatBetween(0.025, 0.05),
		);
		this.goldenFruit.setData("spinPhase", Math.random() * Math.PI * 2);

		// Multiplicador de caída individual
		this.goldenFruit.setData("fallMult", Phaser.Math.FloatBetween(0.9, 1.1));
		this.goldenFruit.setDepth(10); // Por encima de frutas normales

		// Animación de entrada épica
		this.scene.tweens.add({
			targets: this.goldenFruit,
			scaleX: targetScale,
			scaleY: targetScale,
			duration: 500,
			ease: "Back.easeOut",
		});

		// Pulso de respiración (solo en scaleY base, scaleX lo maneja el spin)
		this.goldenFruit.setData("breathPhase", 0);

		// Sparkles: pequeñas estrellas que orbitan
		this.createSparkles(x, -40);

		// Interactividad
		this.goldenFruit.setInteractive();
		this.goldenFruit.on("pointerdown", (pointer) => {
			this.onCatch(pointer);
		});

		// Flash de aparición (destello dorado sutil)
		this.showSpawnFlash(x, -40);

		this.active = true;
	}

	/**
	 * Crea partículas de brillo orbitando la fruta
	 */
	createSparkles(x, y) {
		this.sparkles = [];
		const count = 4;
		for (let i = 0; i < count; i++) {
			const sparkle = this.scene.add.rectangle(0, 0, 4, 4, 0xffffaa, 0.8);
			sparkle.setDepth(11);
			sparkle.setData("angle", (i / count) * Math.PI * 2);
			sparkle.setData("radius", 50);
			sparkle.setData("speed", 0.03);
			this.sparkles.push(sparkle);
		}
	}

	/**
	 * Flash sutil al aparecer la manzana dorada
	 */
	showSpawnFlash(x, y) {
		const flash = this.scene.add.circle(x, y, 60, 0xffcc00, 0.3);
		flash.setDepth(8);
		this.scene.tweens.add({
			targets: flash,
			alpha: 0,
			scaleX: 2.5,
			scaleY: 2.5,
			duration: 600,
			ease: "Power2",
			onComplete: () => flash.destroy(),
		});
	}

	/**
	 * Handler cuando se toca la manzana dorada
	 */
	onCatch(pointer) {
		if (!this.active) return;

		const x = this.goldenFruit.x;
		const y = this.goldenFruit.y;

		// Otorgar puntos bonus
		this.scene.scoreManager.onGoldenCatch(this.BONUS_POINTS);

		// Feedback visual especial
		this.scene.feedbackManager.showGoldenCatch(
			pointer.x,
			pointer.y,
			this.BONUS_POINTS,
		);

		// Explosión de partículas doradas
		this.scene.emitter.setPosition(pointer.x, pointer.y);
		this.scene.emitter.explode(15); // Triple de partículas

		// Reacción del fondo
		this.scene.backgroundManager.onCatch();
		this.scene.backgroundManager.burst(8);

		// Sonido
		if (!this.scene.isMuted) {
			this.scene.sfxBell.play();
		}

		// Limpiar y programar siguiente
		this.cleanup();
		this.scheduleNext();
	}

	/**
	 * Actualiza la posición y efectos de la manzana dorada
	 */
	update(speed) {
		if (!this.active || !this.goldenFruit) return;

		// Caída vertical con velocidad individual
		const fallMult = this.goldenFruit.getData("fallMult") || 1.0;
		this.goldenFruit.y += speed * fallMult;

		// ── Wobble orgánico (doble armónico + drift) ──────────────
		const wPhase = this.goldenFruit.getData("wobblePhase") || 0;
		const wAmp = this.goldenFruit.getData("wobbleAmp") || 20;
		const wFreq = this.goldenFruit.getData("wobbleFreq") || 1.5;
		const w2Phase = this.goldenFruit.getData("wobble2Phase") || 0;
		const w2Amp = this.goldenFruit.getData("wobble2Amp") || 6;
		const w2Freq = this.goldenFruit.getData("wobble2Freq") || 3.0;
		const drift = this.goldenFruit.getData("driftSpeed") || 0;
		let baseX = this.goldenFruit.getData("baseX") || this.goldenFruit.x;

		// Avanzar fases
		this.goldenFruit.setData("wobblePhase", wPhase + wFreq * 0.018);
		this.goldenFruit.setData("wobble2Phase", w2Phase + w2Freq * 0.018);

		// Drift lento con clamp a márgenes
		baseX += drift;
		const mX = this.scene.scale.width * GameConstants.UI.MARGIN_PERCENT;
		baseX = Phaser.Math.Clamp(baseX, mX, this.scene.scale.width - mX);
		this.goldenFruit.setData("baseX", baseX);

		// Posición = base + primario + secundario
		this.goldenFruit.x =
			baseX + Math.sin(wPhase) * wAmp + Math.sin(w2Phase) * w2Amp;

		// Rotación 2.5D multi-frame + respiración dorada
		const spinPhase = this.goldenFruit.getData("spinPhase") || 0;
		const spinSpeed = this.goldenFruit.getData("spinSpeed") || 0.035;
		this.goldenFruit.setData("spinPhase", spinPhase + spinSpeed);
		const ts = this.goldenFruit.getData("targetScale") || 2.8;

		// Fase normalizada
		const TWO_PI = Math.PI * 2;
		const normPhase = ((spinPhase % TWO_PI) + TWO_PI) % TWO_PI;
		const sinPhase = Math.sin(normPhase);
		const edge = Math.abs(sinPhase);

		// Respiración sutil (8% de amplitud)
		const breathPhase = this.goldenFruit.getData("breathPhase") || 0;
		this.goldenFruit.setData("breathPhase", breathPhase + 0.015);
		const breathScale = 1 + Math.sin(breathPhase) * 0.08;

		// [1] Selección de frame (360°: front→side→back→side→front)
		const fpf = GameConstants.GAMEPLAY.FRAMES_PER_FRUIT;
		const halfT = normPhase / Math.PI;
		const frameT = halfT <= 1.0 ? halfT : 2.0 - halfT;
		const rotIdx = Math.min(fpf - 1, Math.floor(frameT * fpf));
		this.goldenFruit.setFrame(this.FRAME * fpf + rotIdx);

		// [2] Compresión horizontal D=0.68
		const D = 0.68;
		const D2 = D * D;
		const gWidth = Math.sqrt(D2 + (1 - D2) * (1 - edge * edge));
		this.goldenFruit.scaleX = ts * gWidth * breathScale;

		// [3] Estiramiento vertical sutil +6%
		this.goldenFruit.scaleY = ts * (1 + edge * edge * 0.06) * breathScale;

		// [4] Tumble Z
		this.goldenFruit.rotation =
			Math.sin(normPhase * 2) * 0.11 + edge * 0.04 * Math.sin(normPhase * 3);

		// [5] Iluminación 4-esquina dorada
		const gBaseB = 150 + (1 - edge) * 105;
		const gHDir = sinPhase * (45 + (1 - edge) * 15);
		const gVDir = 18;
		const gTL = Math.floor(
			Math.min(255, Math.max(100, gBaseB + gHDir + gVDir)),
		);
		const gTR = Math.floor(
			Math.min(255, Math.max(100, gBaseB - gHDir + gVDir)),
		);
		const gBL = Math.floor(
			Math.min(255, Math.max(100, gBaseB + gHDir - gVDir)),
		);
		const gBR = Math.floor(
			Math.min(255, Math.max(100, gBaseB - gHDir - gVDir)),
		);
		// Canal azul más bajo para tono dorado
		const gTLb = Math.floor(gTL * 0.75);
		const gTRb = Math.floor(gTR * 0.75);
		const gBLb = Math.floor(gBL * 0.75);
		const gBRb = Math.floor(gBR * 0.75);
		this.goldenFruit.setTint(
			(gTL << 16) | (gTL << 8) | gTLb,
			(gTR << 16) | (gTR << 8) | gTRb,
			(gBL << 16) | (gBL << 8) | gBLb,
			(gBR << 16) | (gBR << 8) | gBRb,
		);

		// Actualizar sparkles (orbitan)
		for (const sparkle of this.sparkles) {
			const angle = sparkle.getData("angle");
			const radius = sparkle.getData("radius");
			const spd = sparkle.getData("speed");
			sparkle.setData("angle", angle + spd);
			sparkle.x = this.goldenFruit.x + Math.cos(angle) * radius;
			sparkle.y = this.goldenFruit.y + Math.sin(angle) * (radius * 0.5);
			// Parpadeo
			sparkle.alpha = 0.4 + Math.sin(angle * 3) * 0.4;
		}

		// Verificar fuera de pantalla (no penaliza, solo desaparece)
		if (this.goldenFruit.y > this.scene.scale.height + 50) {
			this.cleanup();
			this.scheduleNext();
		}
	}

	/**
	 * Limpia la manzana dorada y sus efectos
	 */
	cleanup() {
		this.active = false;

		if (this.goldenFruit) {
			this.goldenFruit.destroy();
			this.goldenFruit = null;
		}
		for (const sparkle of this.sparkles) {
			sparkle.destroy();
		}
		this.sparkles = [];
	}

	/**
	 * Destruye el manager completamente
	 */
	destroy() {
		if (this.spawnTimer) {
			this.spawnTimer.destroy();
			this.spawnTimer = null;
		}
		this.cleanup();
	}
}
