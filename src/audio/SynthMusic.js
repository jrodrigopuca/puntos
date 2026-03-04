/**
 * SynthMusic – Generador de loop ambient chiptune con Web Audio API
 *
 * Produce música de fondo zen/lo-fi 100% programática (0 KB de assets):
 *   - Drone pad: acorde sostenido suave (triangle)
 *   - Bass: pulso grave lento (triangle, octava baja)
 *   - Arpeggio: notas pentatónicas lentas (square, volumen bajo)
 *
 * BPM: 72  |  Escala: C pentatónica  |  Estilo: chiptune ambient
 *
 * API: play(), pause(), resume(), stop(), setVolume(v)
 */
export default class SynthMusic {
	constructor() {
		this.ctx = null;
		this.masterGain = null;
		this.isPlaying = false;
		this._schedulerId = null;
		this._step = 0;
		this._nextTime = 0;

		// Tempo
		this.bpm = 72;
		this._stepDur = 60 / this.bpm / 4; // 16th-note duration

		// ── Escala pentatónica C ────────────────────
		// Octava 3 (bass)
		this._bassNotes = [
			65.41, // C2
			73.42, // D2
			82.41, // E2
			98.0, // G2
			110.0, // A2
		];

		// Octava 4 (arpeggio)
		this._arpNotes = [
			261.63, // C4
			293.66, // D4
			329.63, // E4
			392.0, // G4
			440.0, // A4
			523.25, // C5
			440.0, // A4
			392.0, // G4
		];

		// Progresión de acordes (pad) – 2 acordes que se alternan cada 2 compases
		// Am: A2 + C3 + E3    |   C: C3 + E3 + G3
		this._chords = [
			[110.0, 130.81, 164.81], // Am
			[130.81, 164.81, 196.0], // C
			[146.83, 196.0, 261.63], // Dm (paso)
			[130.81, 164.81, 196.0], // C (vuelta)
		];

		// Nodos activos para cleanup
		this._padOscs = [];
		this._padGains = [];
		this._currentChordIdx = -1;
	}

	/* ── Context ─────────────────────────────────── */

	_ensureContext() {
		if (!this.ctx) {
			this.ctx = new (window.AudioContext || window.webkitAudioContext)();
			this.masterGain = this.ctx.createGain();
			this.masterGain.gain.value = 0.5;
			this.masterGain.connect(this.ctx.destination);
		}
		if (this.ctx.state === "suspended") {
			this.ctx.resume();
		}
		return this.ctx;
	}

	/* ── Primitivas de sonido ────────────────────── */

	/**
	 * Nota única con attack/decay suave.
	 */
	_note(freq, { type = "square", vol = 0.1, dur = 0.2, delay = 0 } = {}) {
		const ctx = this.ctx;
		const t = this._nextTime + delay;

		const osc = ctx.createOscillator();
		const g = ctx.createGain();

		osc.type = type;
		osc.frequency.setValueAtTime(freq, t);

		// Soft attack → sustain → decay
		g.gain.setValueAtTime(0.001, t);
		g.gain.linearRampToValueAtTime(vol, t + 0.02);
		g.gain.setValueAtTime(vol, t + dur * 0.6);
		g.gain.exponentialRampToValueAtTime(0.001, t + dur);

		osc.connect(g);
		g.connect(this.masterGain);

		osc.start(t);
		osc.stop(t + dur + 0.05);
	}

	/**
	 * Crossfade al siguiente acorde de pad (drone sustain).
	 */
	_setPadChord(chordIdx) {
		if (chordIdx === this._currentChordIdx) return;
		this._currentChordIdx = chordIdx;

		const ctx = this.ctx;
		const t = ctx.currentTime;
		const fadeDur = 1.5; // crossfade lento = zen

		// Fade out osciladores anteriores
		for (const g of this._padGains) {
			g.gain.setValueAtTime(g.gain.value, t);
			g.gain.exponentialRampToValueAtTime(0.001, t + fadeDur);
		}
		// Schedule cleanup de nodos viejos
		const oldOscs = [...this._padOscs];
		setTimeout(
			() => {
				for (const o of oldOscs) {
					try {
						o.stop();
					} catch (_) {
						/* already stopped */
					}
				}
			},
			(fadeDur + 0.5) * 1000,
		);

		// Nuevos osciladores para el acorde
		this._padOscs = [];
		this._padGains = [];
		const chord = this._chords[chordIdx % this._chords.length];

		for (const freq of chord) {
			const osc = ctx.createOscillator();
			const g = ctx.createGain();
			osc.type = "triangle";
			osc.frequency.setValueAtTime(freq, t);
			g.gain.setValueAtTime(0.001, t);
			g.gain.linearRampToValueAtTime(0.06, t + fadeDur);
			osc.connect(g);
			g.connect(this.masterGain);
			osc.start(t);
			this._padOscs.push(osc);
			this._padGains.push(g);
		}
	}

	/* ── Sequencer ───────────────────────────────── */

	/**
	 * Procesa un paso del secuenciador (16 pasos = 1 compás).
	 */
	_processStep() {
		const s = this._step % 64; // 4 compases de 16 pasos
		const beat = s % 16;

		// ── Pad: cambiar acorde cada 16 pasos (1 compás)
		const chordIdx = Math.floor(s / 16);
		this._setPadChord(chordIdx);

		// ── Bass: pulsa en beat 0 y 8 (half notes) – grave y suave
		if (beat === 0 || beat === 8) {
			const bassIdx = Math.floor(s / 16) % this._bassNotes.length;
			this._note(this._bassNotes[bassIdx], {
				type: "triangle",
				vol: 0.12,
				dur: this._stepDur * 7,
			});
		}

		// ── Arpegio: cada 4 pasos (quarter notes) – delicado
		if (beat % 4 === 0) {
			const arpIdx = (this._step / 4) % this._arpNotes.length;
			this._note(this._arpNotes[Math.floor(arpIdx)], {
				type: "square",
				vol: 0.045,
				dur: this._stepDur * 3,
			});
		}

		// ── Nota alta esporádica: cada 2 compases en beat 12 – brillo
		if (beat === 12 && s % 32 === 28) {
			const hiFreq =
				this._arpNotes[Math.floor(Math.random() * this._arpNotes.length)] * 2;
			this._note(hiFreq, {
				type: "sine",
				vol: 0.03,
				dur: this._stepDur * 6,
			});
		}

		this._nextTime += this._stepDur;
		this._step++;
	}

	/**
	 * Scheduler: programa notas con lookahead para evitar gaps.
	 */
	_schedule() {
		const lookAhead = 0.15; // schedule 150ms ahead
		while (this._nextTime < this.ctx.currentTime + lookAhead) {
			this._processStep();
		}
	}

	/* ── API pública ─────────────────────────────── */

	/**
	 * Iniciar la música.
	 */
	play() {
		if (this.isPlaying) return;
		this._ensureContext();
		this.isPlaying = true;
		this._nextTime = this.ctx.currentTime + 0.05;
		this._step = 0;
		this._currentChordIdx = -1;

		this._schedulerId = setInterval(() => this._schedule(), 50);
	}

	/**
	 * Pausar (mantiene estado para resume).
	 */
	pause() {
		if (!this.isPlaying) return;
		this.isPlaying = false;
		if (this._schedulerId) {
			clearInterval(this._schedulerId);
			this._schedulerId = null;
		}
		// Silenciar pad gradualmente
		if (this.ctx) {
			const t = this.ctx.currentTime;
			for (const g of this._padGains) {
				g.gain.setValueAtTime(g.gain.value, t);
				g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
			}
			this.ctx.suspend();
		}
	}

	/**
	 * Reanudar tras pausa.
	 */
	resume() {
		if (this.isPlaying) return;
		this._ensureContext();
		this.isPlaying = true;
		this._nextTime = this.ctx.currentTime + 0.05;
		this._currentChordIdx = -1; // forzar re-creación del pad

		this._schedulerId = setInterval(() => this._schedule(), 50);
	}

	/**
	 * Detener completamente.
	 */
	stop() {
		this.isPlaying = false;
		if (this._schedulerId) {
			clearInterval(this._schedulerId);
			this._schedulerId = null;
		}
		// Limpiar pad
		for (const o of this._padOscs) {
			try {
				o.stop();
			} catch (_) {
				/* ok */
			}
		}
		this._padOscs = [];
		this._padGains = [];
		this._currentChordIdx = -1;
		this._step = 0;
	}

	/**
	 * Volumen master (0–1).
	 */
	setVolume(v) {
		if (this.masterGain) {
			this.masterGain.gain.value = Math.max(0, Math.min(1, v));
		}
	}
}
