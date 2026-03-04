/**
 * SynthMusic – Generador de música ambient chiptune generativa
 *
 * Produce música de fondo zen/lo-fi 100% programática (0 KB de assets).
 * Usa aleatoriedad controlada en múltiples capas para que NUNCA suene
 * como un loop repetitivo:
 *   - Progresión armónica larga (16 acordes) con reordenamiento aleatorio
 *   - Arpegio con selección de notas por peso probabilístico
 *   - Silencios aleatorios (rests) en bass y arpegio
 *   - Variación de duración, volumen y octava por nota
 *   - Ornamentos esporádicos (ghost notes, ecos)
 *   - Micro-drift de tempo (±3%)
 *
 * BPM: ~72  |  Escala: C pentatónica  |  Estilo: chiptune ambient generativo
 */
export default class SynthMusic {
	constructor() {
		this.ctx = null;
		this.masterGain = null;
		this.isPlaying = false;
		this._schedulerId = null;
		this._step = 0;
		this._nextTime = 0;
		this._cycle = 0; // cuenta ciclos completos para evolución

		// Tempo base (con micro-variación por paso)
		this.bpm = 72;
		this._baseStepDur = 60 / this.bpm / 4;

		// ── Escala pentatónica C (todas las octavas útiles) ──
		this._pentatonic = [261.63, 293.66, 329.63, 392.0, 440.0]; // C4 D4 E4 G4 A4

		// Bass notes (octava 2)
		this._bassPool = [65.41, 73.42, 82.41, 98.0, 110.0]; // C2 D2 E2 G2 A2

		// ── Progresión armónica extendida (16 acordes, ~53s por ciclo) ──
		this._chordPool = [
			[110.0, 130.81, 164.81], // Am
			[130.81, 164.81, 196.0], // C
			[146.83, 196.0, 261.63], // Dm
			[130.81, 164.81, 196.0], // C
			[98.0, 130.81, 164.81], // Am/G (inversión)
			[110.0, 146.83, 196.0], // Dm/A
			[130.81, 196.0, 261.63], // C (abierto)
			[110.0, 164.81, 220.0], // Am (octava)
			[146.83, 174.61, 220.0], // Dm7-ish
			[130.81, 164.81, 220.0], // C añadido
			[110.0, 130.81, 196.0], // Am suspendido
			[130.81, 196.0, 293.66], // C (alto)
			[146.83, 196.0, 246.94], // Dm+
			[110.0, 164.81, 196.0], // Am (inversión 2)
			[130.81, 174.61, 220.0], // Cmaj7-ish
			[110.0, 130.81, 164.81], // Am (resolución)
		];

		// Progresión activa (se baraja parcialmente cada ciclo)
		this._chords = [...this._chordPool];

		// Nodos activos para cleanup
		this._padOscs = [];
		this._padGains = [];
		this._currentChordIdx = -1;

		// Estado generativo
		this._lastArpNote = -1;
		this._restProbability = 0.15; // 15% chance de silencio
		this._ghostProbability = 0.1; // 10% chance de eco/ghost note
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
	 * @param {number} attackTime  Fade-in en segundos (más alto = más zen)
	 */
	_note(
		freq,
		{ type = "sine", vol = 0.1, dur = 0.2, delay = 0, attack = 0.08 } = {},
	) {
		const ctx = this.ctx;
		const t = this._nextTime + delay;

		const osc = ctx.createOscillator();
		const g = ctx.createGain();

		osc.type = type;
		osc.frequency.setValueAtTime(freq, t);

		// Gentle fade in → sustain → smooth fade out
		const att = Math.min(attack, dur * 0.3);
		g.gain.setValueAtTime(0.001, t);
		g.gain.linearRampToValueAtTime(vol, t + att);
		g.gain.setValueAtTime(vol, t + dur * 0.5);
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
	 * Micro-drift de tempo: ±3% por paso — respira como un humano.
	 */
	_stepDuration() {
		return this._baseStepDur * (0.97 + Math.random() * 0.06);
	}

	/**
	 * Genera una frase melódica de 3-4 notas basada en las notas del acorde
	 * actual + notas de paso pentatónicas. Resultado: melodía con sentido
	 * armónico, no aleatoria.
	 */
	_buildPhrase(chord) {
		// Notas del acorde son la base segura
		const chordNotes = [...chord];
		// Añadir 1-2 notas de paso pentatónicas cercanas
		const passing = this._pentatonic.filter(
			(n) => !chordNotes.some((c) => Math.abs(c - n) < 5),
		);
		const pool = [...chordNotes];
		if (passing.length > 0) {
			pool.push(passing[Math.floor(Math.random() * passing.length)]);
		}
		pool.sort((a, b) => a - b);

		// Construir frase de 3-4 notas con movimiento stepwise
		const len = 3 + (Math.random() < 0.4 ? 1 : 0);
		const phrase = [];
		let idx =
			this._lastArpNote >= 0 && this._lastArpNote < pool.length
				? this._lastArpNote
				: Math.floor(Math.random() * pool.length);

		for (let i = 0; i < len; i++) {
			phrase.push(pool[idx]);
			// Moverse 0 o ±1 paso (preferencia ascendente leve)
			const dir = Math.random() < 0.55 ? 1 : Math.random() < 0.7 ? -1 : 0;
			idx = Math.max(0, Math.min(pool.length - 1, idx + dir));
		}
		this._lastArpNote = idx;
		return phrase;
	}

	/**
	 * Baraja parcialmente la progresión de acordes (Fisher-Yates parcial).
	 * Solo mueve ~25% de los acordes para mantener coherencia armónica.
	 */
	_shuffleChords() {
		const arr = [...this._chordPool];
		const swaps = Math.floor(arr.length * 0.25);
		for (let k = 0; k < swaps; k++) {
			const i = Math.floor(Math.random() * arr.length);
			const j = Math.floor(Math.random() * arr.length);
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		// Siempre terminar en Am (resolución)
		arr[arr.length - 1] = this._chordPool[this._chordPool.length - 1];
		this._chords = arr;
	}

	/**
	 * Procesa un paso del secuenciador — generativo, nunca se repite exacto.
	 * 16 acordes × 16 pasos = 256 pasos por ciclo (~53s a 72 BPM).
	 */
	_processStep() {
		const cycleLen = this._chords.length * 16; // 256 pasos
		const s = this._step % cycleLen;
		const beat = s % 16;
		const chordIdx = Math.floor(s / 16);

		// ── Nuevo ciclo: reorganizar acordes para frescura
		if (s === 0 && this._step > 0) {
			this._cycle++;
			this._shuffleChords();
		}

		// ── Pad: cambiar acorde cada 16 pasos con crossfade zen
		this._setPadChord(chordIdx);

		// ── Bass: half notes con silencios aleatorios
		if (beat === 0 || beat === 8) {
			if (Math.random() > this._restProbability) {
				// Elegir nota bass que armonice con el acorde actual
				const chord = this._chords[chordIdx % this._chords.length];
				const bassRoot = chord[0] / 2; // fundamental una octava abajo
				const bassFreq =
					Math.random() < 0.7
						? bassRoot
						: this._bassPool[Math.floor(Math.random() * this._bassPool.length)];
				const volVar = 0.06 + Math.random() * 0.04; // 0.06–0.10
				const durVar = this._baseStepDur * (6 + Math.random() * 4);

				this._note(bassFreq, {
					type: "triangle",
					vol: volVar,
					dur: durVar,
					attack: 0.12,
				});
			}
		}

		// ── Melodía: frase de 3-4 notas una vez por compás (beat 0)
		// Notas suaves (sine), attack lento, volumen bajo = acompaña sin cortar
		if (beat === 0) {
			if (Math.random() > this._restProbability) {
				const chord = this._chords[chordIdx % this._chords.length];
				const phrase = this._buildPhrase(chord);
				const spacing = this._baseStepDur * 4; // quarter-note spacing

				phrase.forEach((freq, i) => {
					// Volumen bajo y variable, notas largas y sostenidas
					const vol = 0.018 + Math.random() * 0.012; // 0.018–0.03
					const dur = this._baseStepDur * (4 + Math.random() * 4); // larga
					this._note(freq, {
						type: "sine",
						vol,
						dur,
						delay: i * spacing,
						attack: 0.15, // fade-in lento = suave
					});
				});
			}
		}

		// ── Nota alta esporádica: ~4% probabilidad, muy suave (brillo lejano)
		if ((beat === 8 || beat === 12) && Math.random() < 0.04) {
			const chord = this._chords[chordIdx % this._chords.length];
			const hiFreq = chord[Math.floor(Math.random() * chord.length)] * 2;
			this._note(hiFreq, {
				type: "sine",
				vol: 0.01 + Math.random() * 0.01,
				dur: this._baseStepDur * (6 + Math.random() * 10),
				attack: 0.3, // muy gradual
			});
		}

		// ── Silencio expresivo: cada ~8 ciclos, dejar un compás sin arpegio
		// (Solo el pad suena, creando "respiro")
		// Se implementa subiendo restProbability temporalmente
		if (s === 0) {
			this._restProbability =
				this._cycle % 8 === 7 ? 0.7 : 0.1 + Math.random() * 0.1;
		}

		this._nextTime += this._stepDuration();
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
		this._cycle = 0;
		this._currentChordIdx = -1;
		this._lastArpNote = -1;
		this._shuffleChords(); // empezar con orden fresco

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
