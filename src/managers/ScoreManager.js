/**
 * ScoreManager - Gestiona puntuación con penalización suave (Zen Mode)
 *
 * En lugar de resetear a 0 cuando se pierde una fruta,
 * aplica una penalización porcentual que aumenta con misses consecutivos.
 */
export default class ScoreManager {
	constructor(scene) {
		this.scene = scene;
		this.score = 0;
		this.record = this.loadRecord();
		this.consecutiveMisses = 0;

		// Configuración Zen Mode
		this.PENALTY_BASE = 0.1; // 10% por miss
		this.MAX_PENALTY = 0.5; // Máximo 50% de penalización
	}

	/**
	 * Carga el record desde localStorage
	 */
	loadRecord() {
		const saved = localStorage.getItem("record");
		return saved ? parseInt(saved) : 0;
	}

	/**
	 * Guarda el record en localStorage
	 */
	saveRecord() {
		localStorage.setItem("record", this.record);
	}

	/**
	 * Incrementa el puntaje al atrapar una fruta
	 */
	onCatch() {
		this.consecutiveMisses = 0;
		this.score += 1;

		if (this.score > this.record) {
			this.record = this.score;
			this.saveRecord();
		}

		this.scene.events.emit("scoreChanged", this.score, this.record);
		return this.score;
	}

	/**
	 * Aplica penalización suave al perder una fruta (Zen Mode)
	 * Penalización = score * consecutiveMisses * PENALTY_BASE
	 * Con tope máximo de MAX_PENALTY
	 */
	onMiss() {
		this.consecutiveMisses++;

		// Calcular penalización porcentual
		const penaltyPercent = Math.min(
			this.consecutiveMisses * this.PENALTY_BASE,
			this.MAX_PENALTY,
		);

		const penalty = Math.floor(this.score * penaltyPercent);
		this.score = Math.max(0, this.score - penalty);

		this.scene.events.emit("scoreChanged", this.score, this.record);
		this.scene.events.emit("scorePenalty", penalty, this.consecutiveMisses);

		return {
			score: this.score,
			penalty,
			consecutiveMisses: this.consecutiveMisses,
		};
	}

	/**
	 * Obtiene el puntaje actual
	 */
	getScore() {
		return this.score;
	}

	/**
	 * Obtiene el record
	 */
	getRecord() {
		return this.record;
	}

	/**
	 * Reinicia el puntaje (para nueva partida)
	 */
	reset() {
		this.score = 0;
		this.consecutiveMisses = 0;
		this.scene.events.emit("scoreChanged", this.score, this.record);
	}
}
