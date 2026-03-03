/**
 * MilestoneManager - Sistema de hitos y celebraciones
 *
 * Define milestones cada 50 puntos con recompensas:
 * - Cambio de tema visual
 * - Sonido de celebración
 * - Mensaje de logro
 */
export default class MilestoneManager {
	constructor(scene) {
		this.scene = scene;
		this.achievedMilestones = new Set();

		// Definición de milestones
		this.milestones = [
			{
				score: 50,
				title: "🌅 Amanecer",
				theme: "sunset",
				message: "¡Buen comienzo!",
			},
			{
				score: 100,
				title: "🌿 Bosque",
				theme: "forest",
				message: "¡Sigue así!",
			},
			{
				score: 150,
				title: "🌙 Noche",
				theme: "night",
				message: "¡Increíble!",
			},
			{
				score: 200,
				title: "💫 Estelar",
				theme: "cosmic",
				message: "¡Asombroso!",
			},
			{
				score: 300,
				title: "🔥 Fuego",
				theme: "fire",
				message: "¡Imparable!",
			},
			{
				score: 500,
				title: "👑 Leyenda",
				theme: "gold",
				message: "¡LEGENDARIO!",
			},
		];

		// Temas de color (background colors)
		this.themes = {
			default: 0x2c3e50,
			sunset: 0xff6b6b,
			forest: 0x2ecc71,
			night: 0x34495e,
			cosmic: 0x9b59b6,
			fire: 0xe74c3c,
			gold: 0xf1c40f,
		};
	}

	/**
	 * Verifica si hay un nuevo milestone alcanzado
	 * @param {number} score - Puntaje actual
	 * @returns {Object|null} - Milestone alcanzado o null
	 */
	checkMilestone(score) {
		for (const milestone of this.milestones) {
			if (
				score >= milestone.score &&
				!this.achievedMilestones.has(milestone.score)
			) {
				this.achievedMilestones.add(milestone.score);
				this.scene.events.emit("milestoneReached", milestone);
				return milestone;
			}
		}
		return null;
	}

	/**
	 * Obtiene el color del tema actual basado en el puntaje
	 */
	getCurrentTheme(score) {
		let currentTheme = "default";

		for (const milestone of this.milestones) {
			if (score >= milestone.score) {
				currentTheme = milestone.theme;
			}
		}

		return {
			name: currentTheme,
			color: this.themes[currentTheme],
		};
	}

	/**
	 * Obtiene el próximo milestone
	 */
	getNextMilestone(score) {
		for (const milestone of this.milestones) {
			if (score < milestone.score) {
				return {
					...milestone,
					remaining: milestone.score - score,
				};
			}
		}
		return null; // Todos los milestones alcanzados
	}

	/**
	 * Obtiene el progreso hacia el próximo milestone (0-1)
	 */
	getProgress(score) {
		const next = this.getNextMilestone(score);
		if (!next) return 1;

		// Encontrar milestone anterior
		let prevScore = 0;
		for (const milestone of this.milestones) {
			if (milestone.score === next.score) break;
			prevScore = milestone.score;
		}

		const range = next.score - prevScore;
		const progress = score - prevScore;
		return Math.min(progress / range, 1);
	}

	/**
	 * Reinicia los milestones alcanzados
	 */
	reset() {
		this.achievedMilestones.clear();
	}
}
