/**
 * ZenDifficultyManager - Curva de dificultad logarítmica con plateau
 *
 * La velocidad aumenta rápidamente al inicio pero se estabiliza
 * en un nivel cómodo (plateau), nunca volviéndose imposible.
 *
 * Fórmula: speed = BASE + log(score + 1) * GROWTH_RATE
 * Con tope máximo en MAX_SPEED (plateau)
 */
export default class ZenDifficultyManager {
	constructor() {
		// Configuración de la curva
		this.BASE_SPEED = 1; // Velocidad inicial
		this.GROWTH_RATE = 0.8; // Velocidad del crecimiento logarítmico
		this.MAX_SPEED = 5; // Plateau - velocidad máxima (nunca imposible)
		this.PLATEAU_SCORE = 100; // Puntaje donde se alcanza el plateau

		this._plateauReached = false;
	}

	/**
	 * Calcula la velocidad basada en el puntaje actual
	 * Usa curva logarítmica que se estabiliza en el plateau
	 *
	 * @param {number} score - Puntaje actual
	 * @returns {number} - Velocidad en px/frame
	 */
	getSpeed(score) {
		// Curva logarítmica: crece rápido al inicio, se estabiliza después
		const logSpeed = this.BASE_SPEED + Math.log(score + 1) * this.GROWTH_RATE;

		// Aplicar tope máximo (plateau)
		const speed = Math.min(logSpeed, this.MAX_SPEED);

		// Detectar si alcanzamos el plateau
		if (!this._plateauReached && speed >= this.MAX_SPEED * 0.95) {
			this._plateauReached = true;
		}

		return speed;
	}

	/**
	 * Verifica si se ha alcanzado el plateau
	 */
	hasReachedPlateau() {
		return this._plateauReached;
	}

	/**
	 * Obtiene el progreso hacia el plateau (0-1)
	 */
	getPlateauProgress(score) {
		const currentSpeed = this.getSpeed(score);
		return Math.min(currentSpeed / this.MAX_SPEED, 1);
	}

	/**
	 * Reinicia el estado del manager
	 */
	reset() {
		this._plateauReached = false;
	}
}
