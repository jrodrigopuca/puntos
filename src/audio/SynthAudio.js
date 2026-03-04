/**
 * SynthAudio – Mini sintetizador chiptune con Web Audio API
 *
 * Genera SFX programáticos estilo 8-bit (0 KB de assets):
 *   playCatch()     → nota aleatoria de escala pentatónica (onda cuadrada)
 *   playMilestone() → arpegio ascendente mayor + nota aguda cálida
 *   playGolden()    → barrido brillante con armónicos tipo shimmer
 */
export default class SynthAudio {
	constructor() {
		this.ctx = null;
		this.masterGain = null;

		// Escala pentatónica C4-C5 (siempre suena bien)
		this.pentatonic = [
			261.63, // C4
			293.66, // D4
			329.63, // E4
			392.0, // G4
			440.0, // A4
			523.25, // C5
		];

		// Acorde mayor para arpegio de milestone (C5 E5 G5)
		this.milestoneNotes = [523.25, 659.25, 783.99];

		this._lastCatchIdx = -1;
	}

	/* ── Context ────────────────────────────────────── */

	/**
	 * Lazy-init del AudioContext (debe ocurrir tras gesto de usuario).
	 */
	_ensureContext() {
		if (!this.ctx) {
			this.ctx = new (window.AudioContext || window.webkitAudioContext)();
			this.masterGain = this.ctx.createGain();
			this.masterGain.gain.value = 0.8;
			this.masterGain.connect(this.ctx.destination);
		}
		if (this.ctx.state === "suspended") {
			this.ctx.resume();
		}
		return this.ctx;
	}

	/* ── Primitiva ──────────────────────────────────── */

	/**
	 * Toca una nota chiptune individual.
	 * @param {number} freq  Frecuencia en Hz
	 * @param {object} opts  { type, duration, volume, delay }
	 */
	_playNote(
		freq,
		{ type = "square", duration = 0.1, volume = 0.3, delay = 0 } = {},
	) {
		const ctx = this._ensureContext();
		const t = ctx.currentTime + delay;

		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = type;
		osc.frequency.setValueAtTime(freq, t);

		gain.gain.setValueAtTime(volume, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

		osc.connect(gain);
		gain.connect(this.masterGain);

		osc.start(t);
		osc.stop(t + duration + 0.02);
	}

	/* ── SFX públicos ───────────────────────────────── */

	/**
	 * Catch normal – nota pentatónica aleatoria, onda cuadrada, decay corto.
	 * Evita repetir la misma nota dos veces seguidas.
	 */
	playCatch() {
		let idx;
		do {
			idx = Math.floor(Math.random() * this.pentatonic.length);
		} while (idx === this._lastCatchIdx && this.pentatonic.length > 1);
		this._lastCatchIdx = idx;

		this._playNote(this.pentatonic[idx], {
			type: "square",
			duration: 0.12,
			volume: 0.55,
		});
	}

	/**
	 * Milestone – arpegio ascendente C5→E5→G5 + nota aguda C6 (triangle).
	 */
	playMilestone() {
		this.milestoneNotes.forEach((freq, i) => {
			this._playNote(freq, {
				type: "square",
				duration: 0.15,
				volume: 0.6,
				delay: i * 0.08,
			});
		});

		// Nota final cálida más alta
		this._playNote(1046.5, {
			// C6
			type: "triangle",
			duration: 0.3,
			volume: 0.45,
			delay: 0.24,
		});
	}

	/**
	 * Golden fruit – barrido ascendente + sparkle de armónicos agudos.
	 */
	playGolden() {
		const ctx = this._ensureContext();
		const t = ctx.currentTime;

		// Barrido ascendente (triangle A4 → A6)
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "triangle";
		osc.frequency.setValueAtTime(440, t);
		osc.frequency.exponentialRampToValueAtTime(1760, t + 0.2);
		gain.gain.setValueAtTime(0.55, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
		osc.connect(gain);
		gain.connect(this.masterGain);
		osc.start(t);
		osc.stop(t + 0.4);

		// Sparkle de armónicos (E6, G6, C7)
		[1318.51, 1567.98, 2093.0].forEach((freq, i) => {
			this._playNote(freq, {
				type: "sine",
				duration: 0.18,
				volume: 0.35,
				delay: 0.05 + i * 0.06,
			});
		});
	}

	/* ── Control ────────────────────────────────────── */

	/**
	 * Volumen master (0–1).
	 */
	setVolume(v) {
		if (this.masterGain) {
			this.masterGain.gain.value = Math.max(0, Math.min(1, v));
		}
	}

	/**
	 * Suspender contexto (mute completo, ahorra CPU).
	 */
	suspend() {
		if (this.ctx && this.ctx.state === "running") {
			this.ctx.suspend();
		}
	}

	/**
	 * Reanudar contexto.
	 */
	resume() {
		if (this.ctx && this.ctx.state === "suspended") {
			this.ctx.resume();
		}
	}
}
