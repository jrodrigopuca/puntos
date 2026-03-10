/**
 * ShareManager - Sistema para compartir scores con imagen generada
 * 
 * Genera una imagen de score card en canvas y permite compartir via:
 * - Web Share API (móvil)
 * - Download (desktop)
 * - Clipboard fallback
 */
export default class ShareManager {
	constructor(scene) {
		this.scene = scene;
		
		// Configuración visual (synthwave theme)
		this.config = {
			width: 600,
			height: 400,
			bgColor: "#05001a",
			accentColor: "#cc66ff",
			textColor: "#ffffff",
			scoreColor: "#33ff33",
			recordColor: "#ffff00",
			fontFamily: "tres, monospace",
		};
		
		// Cache del canvas
		this.canvas = null;
		this.ctx = null;
	}

	/**
	 * Crea el canvas para renderizar la imagen
	 */
	createCanvas() {
		if (this.canvas) return;
		
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.config.width;
		this.canvas.height = this.config.height;
		this.ctx = this.canvas.getContext("2d");
	}

	/**
	 * Genera la imagen de score card
	 * @param {number} score - Puntaje actual
	 * @param {number} record - Record histórico
	 * @returns {Promise<Blob>} - Imagen como blob
	 */
	async generateScoreImage(score, record) {
		this.createCanvas();
		const ctx = this.ctx;
		const { width, height } = this.config;
		
		// ═══════════════════════════════════════════════════
		// FONDO CON GRADIENTE SYNTHWAVE
		// ═══════════════════════════════════════════════════
		const gradient = ctx.createLinearGradient(0, 0, 0, height);
		gradient.addColorStop(0, "#05001a");
		gradient.addColorStop(1, "#150a2e");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);
		
		// Borde neón
		ctx.strokeStyle = this.config.accentColor;
		ctx.lineWidth = 4;
		ctx.strokeRect(10, 10, width - 20, height - 20);
		
		// ═══════════════════════════════════════════════════
		// LOGO "PUNTOS" (ASCII art style)
		// ═══════════════════════════════════════════════════
		ctx.font = `bold 52px ${this.config.fontFamily}`;
		ctx.fillStyle = this.config.accentColor;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		
		// Efecto de sombra/glow
		ctx.shadowColor = this.config.accentColor;
		ctx.shadowBlur = 20;
		ctx.fillText("PUNTOS", width / 2, 80);
		ctx.shadowBlur = 0;
		
		// ═══════════════════════════════════════════════════
		// SCORE PRINCIPAL
		// ═══════════════════════════════════════════════════
		ctx.font = `32px ${this.config.fontFamily}`;
		ctx.fillStyle = this.config.textColor;
		ctx.fillText("MY SCORE", width / 2, 160);
		
		ctx.font = `bold 72px ${this.config.fontFamily}`;
		ctx.fillStyle = this.config.scoreColor;
		ctx.shadowColor = this.config.scoreColor;
		ctx.shadowBlur = 15;
		ctx.fillText(score.toString(), width / 2, 220);
		ctx.shadowBlur = 0;
		
		// ═══════════════════════════════════════════════════
		// RECORD
		// ═══════════════════════════════════════════════════
		if (record > 0) {
			ctx.font = `28px ${this.config.fontFamily}`;
			ctx.fillStyle = this.config.recordColor;
			ctx.fillText(`🏆 BEST: ${record}`, width / 2, 290);
		}
		
		// ═══════════════════════════════════════════════════
		// FOOTER
		// ═══════════════════════════════════════════════════
		ctx.font = `24px ${this.config.fontFamily}`;
		ctx.fillStyle = this.config.textColor;
		ctx.fillText("Zen Fruit Catcher", width / 2, 340);
		
		ctx.font = `20px ${this.config.fontFamily}`;
		ctx.fillStyle = this.config.accentColor;
		ctx.fillText("jrodrigopuca.github.io/puntos", width / 2, 370);
		
		// Convertir canvas a blob
		return new Promise((resolve) => {
			this.canvas.toBlob((blob) => {
				resolve(blob);
			}, "image/png");
		});
	}

	/**
	 * Comparte el score usando Web Share API o fallback
	 * @param {number} score - Puntaje actual
	 * @param {number} record - Record histórico
	 */
	async shareScore(score, record) {
		try {
			const imageBlob = await this.generateScoreImage(score, record);
			
			// Intentar Web Share API (móvil)
			if (navigator.share && navigator.canShare) {
				const file = new File([imageBlob], "puntos-score.png", {
					type: "image/png",
				});
				
				const shareData = {
					title: "Puntos - My Score",
					text: `I scored ${score} points in Puntos! 🍎✨`,
					url: "https://jrodrigopuca.github.io/puntos/",
					files: [file],
				};
				
				// Verificar si se puede compartir con archivos
				if (navigator.canShare(shareData)) {
					await navigator.share(shareData);
					return { success: true, method: "web-share" };
				}
			}
			
			// Fallback 1: Download de la imagen (desktop)
			this.downloadImage(imageBlob, `puntos-score-${score}.png`);
			return { success: true, method: "download" };
			
		} catch (error) {
			console.error("Error sharing score:", error);
			
			// Fallback 2: Copiar texto al clipboard
			try {
				const text = `I scored ${score} points in Puntos! 🍎✨\nPlay now: https://jrodrigopuca.github.io/puntos/`;
				await navigator.clipboard.writeText(text);
				return { success: true, method: "clipboard" };
			} catch (clipboardError) {
				console.error("Clipboard fallback failed:", clipboardError);
				return { success: false, error: clipboardError.message };
			}
		}
	}

	/**
	 * Descarga la imagen al dispositivo
	 * @param {Blob} blob - Imagen como blob
	 * @param {string} filename - Nombre del archivo
	 */
	downloadImage(blob, filename) {
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	}

	/**
	 * Copia el link del juego al clipboard
	 */
	async copyLinkToClipboard() {
		try {
			await navigator.clipboard.writeText(
				"https://jrodrigopuca.github.io/puntos/"
			);
			return true;
		} catch (error) {
			console.error("Failed to copy link:", error);
			return false;
		}
	}

	/**
	 * Limpia recursos
	 */
	destroy() {
		this.canvas = null;
		this.ctx = null;
	}
}
