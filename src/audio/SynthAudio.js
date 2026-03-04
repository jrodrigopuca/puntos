/**
 * SynthAudio – SFX que armonizan con la música de fondo
 *
 * Cada sonido usa notas del acorde actual de SynthMusic,
 * integrando los efectos como parte de la experiencia musical:
 *   playCatch()     → nota suave del acorde (sine), el jugador "toca" la música
 *   playMilestone() → cascada de campanas ascendentes (triangle)
 *   playGolden()    → bloom cálido con armónicos del acorde
 *   playMiss()      → nota descendente sutil (feedback negativo gentil)
 */
export default class SynthAudio {
	/**
	 * @param {import('./SynthMusic.js').default} [synthMusic] Referencia a la música
	 */
	constructor(synthMusic = null) {
		this.ctx = null;
		this.masterGain = null;
		this.music = synthMusic;

		// Escala pentatónica fallback (cuando la música no está activa)
		this._fallbackChord = [261.63, 329.63, 392.0]; // C4, E4, G4

		// Índice ascendente para catch — sube por el acorde como un arpegio
		this._catchStep = 0;
	}

	/* ── Context ────────────────────────────────────── */

	_ensureContext() {
		// Reusar el AudioContext de la música si existe (misma salida = mezcla limpia)
		if (!this.ctx) {
			if (this.music?.ctx) {
				this.ctx = this.music.ctx;
			} else {
				this.ctx = new (window.AudioContext || window.webkitAudioContext)();
			}
			this.masterGain = this.ctx.createGain();
			this.masterGain.gain.value = 0.6;
			this.masterGain.connect(this.ctx.destination);
		}
		if (this.ctx.state === "suspended") {
			this.ctx.resume();
		}
		return this.ctx;
	}

	/**
	 * Obtiene las notas del acorde actual de la música, o fallback.
	 */
	_currentChord() {
		if (this.music && this.music._currentChordIdx >= 0) {
			return this.music._chords[
				this.music._currentChordIdx % this.music._chords.length
			];
		}
		return this._fallbackChord;
	}

	/* ── Primitiva ──────────────────────────────────── */

	/**
	 * Nota con envelope suave — diseñada para sentirse zen.
	 */
	_playNote(
		freq,
		{
			type = "sine",
			duration = 0.2,
			volume = 0.25,
			delay = 0,
			attack = 0.015,
		} = {},
	) {
		const ctx = this._ensureContext();
		const t = ctx.currentTime + delay;
		const att = Math.min(attack, duration * 0.3);

		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = type;
		osc.frequency.setValueAtTime(freq, t);

		// Gentle attack → hold → smooth decay
		gain.gain.setValueAtTime(0.001, t);
		gain.gain.linearRampToValueAtTime(volume, t + att);
		gain.gain.setValueAtTime(volume, t + duration * 0.4);
		gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

		osc.connect(gain);
		gain.connect(this.masterGain);

		osc.start(t);
		osc.stop(t + duration + 0.02);
	}

	/* ── SFX públicos ───────────────────────────────── */

	/**
	 * Catch normal – sube por las notas del acorde actual.
	 * Cada catch sucesivo toca la siguiente nota, creando un arpegio
	 * ascendente que hace sentir progreso. Timbre cálido (triangle).
	 */
	playCatch() {
		const chord = this._currentChord();

		// Expandir acorde a 2 octavas para tener más recorrido
		const extended = [...chord, ...chord.map((f) => f * 2)];
		const idx = this._catchStep % extended.length;
		const freq = extended[idx];
		this._catchStep++;

		// Nota principal — triangle suave con decay medio
		this._playNote(freq, {
			type: "triangle",
			duration: 0.18,
			volume: 0.3,
			attack: 0.01,
		});

		// Eco sutil una octava arriba (sparkle retro)
		this._playNote(freq * 2, {
			type: "sine",
			duration: 0.12,
			volume: 0.06,
			delay: 0.04,
			attack: 0.02,
		});
	}

	/**
	 * Milestone – cascada de campanas ascendentes del acorde.
	 * Sensación de logro zen: no estridente, sino "luminoso".
	 */
	playMilestone() {
		const chord = this._currentChord();
		// 5 notas: acorde + octava arriba de las 2 primeras
		const cascade = [...chord, chord[0] * 2, chord[1] * 2];

		cascade.forEach((freq, i) => {
			// Triangle = campanita retro
			this._playNote(freq, {
				type: "triangle",
				duration: 0.25 + i * 0.05,
				volume: 0.25 - i * 0.02,
				delay: i * 0.09,
				attack: 0.02,
			});
			// Armónico sine detrás (profundidad)
			this._playNote(freq * 2, {
				type: "sine",
				duration: 0.3,
				volume: 0.05,
				delay: i * 0.09 + 0.03,
				attack: 0.05,
			});
		});

		// Nota final sostenida — resolución cálida
		this._playNote(chord[0] * 4, {
			type: "sine",
			duration: 0.6,
			volume: 0.08,
			delay: 0.5,
			attack: 0.1,
		});
	}

	/**
	 * Golden fruit – bloom cálido: el acorde se abre desde el grave
	 * al agudo como una flor, con armónicos suaves.
	 */
	playGolden() {
		const chord = this._currentChord();
		const ctx = this._ensureContext();
		const t = ctx.currentTime;

		// Bloom: cada nota del acorde entra escalonada,
		// en 3 octavas (grave → medio → agudo)
		const layers = [0.5, 1, 2, 4]; // octavas relativas
		layers.forEach((oct, li) => {
			chord.forEach((freq, ci) => {
				const d = (li * 3 + ci) * 0.04; // stagger
				this._playNote(freq * oct, {
					type: li < 2 ? "triangle" : "sine",
					duration: 0.4 - li * 0.05,
					volume: 0.12 - li * 0.02,
					delay: d,
					attack: 0.03 + li * 0.02,
				});
			});
		});

		// Shimmer final agudo
		this._playNote(chord[chord.length - 1] * 8, {
			type: "sine",
			duration: 0.5,
			volume: 0.04,
			delay: 0.35,
			attack: 0.15,
		});
	}

	/**
	 * Miss – nota descendente suave. Feedback negativo gentil,
	 * no punitivo. Un suspiro musical.
	 */
	playMiss() {
		const chord = this._currentChord();
		const ctx = this._ensureContext();
		const t = ctx.currentTime;

		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "sine";
		// Desciende desde la nota más alta del acorde
		const startFreq = chord[chord.length - 1];
		osc.frequency.setValueAtTime(startFreq, t);
		osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, t + 0.3);

		gain.gain.setValueAtTime(0.12, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

		osc.connect(gain);
		gain.connect(this.masterGain);
		osc.start(t);
		osc.stop(t + 0.4);

		// Reset catch step — el arpegio vuelve a empezar
		this._catchStep = 0;
	}

	/* ── Control ────────────────────────────────────── */

	setVolume(v) {
		if (this.masterGain) {
			this.masterGain.gain.value = Math.max(0, Math.min(1, v));
		}
	}

	suspend() {
		// Solo suspender si usamos nuestro propio contexto
		if (
			this.ctx &&
			this.ctx !== this.music?.ctx &&
			this.ctx.state === "running"
		) {
			this.ctx.suspend();
		}
	}

	resume() {
		if (this.ctx && this.ctx.state === "suspended") {
			this.ctx.resume();
		}
	}
}
