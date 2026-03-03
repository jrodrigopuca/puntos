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

		// Definición de milestones (arcade style — sin emojis)
		this.milestones = [
			{
				score: 50,
				title: "- NEON CITY -",
				theme: "sunset",
				message: "BUEN COMIENZO",
			},
			{
				score: 100,
				title: "- MATRIX -",
				theme: "forest",
				message: "SIGUE ASI",
			},
			{
				score: 150,
				title: "- MIDNIGHT -",
				theme: "night",
				message: "INCREIBLE",
			},
			{
				score: 200,
				title: "- COSMIC -",
				theme: "cosmic",
				message: "ASOMBROSO",
			},
			{
				score: 300,
				title: "- BLAZE -",
				theme: "fire",
				message: "IMPARABLE",
			},
			{
				score: 500,
				title: "* LEGENDARIO *",
				theme: "gold",
				message: "LEGENDARY",
			},
		];

		// Temas de color (background colors — CRT dark neon)
		this.themes = {
			default: 0x0a0a2e,
			sunset: 0x1a0a1a,
			forest: 0x0a1a0a,
			night: 0x05051a,
			cosmic: 0x150a2e,
			fire: 0x1a0505,
			gold: 0x1a1a05,
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
