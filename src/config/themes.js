/**
 * Temas de color para el juego
 * Paleta retro arcade 80s: fondos oscuros CRT + acentos neón
 * Cada milestone desbloquea un nuevo tema
 */
export const Themes = {
	default: {
		name: "Arcade",
		background: 0x0a0a2e,
		fruits: [0x00ffff, 0xff00ff, 0x33ff33, 0xffff00],
		particles: [0x00ffff, 0xff00ff, 0x33ff33, 0xffff00],
		ui: 0x00ffff,
	},
	sunset: {
		name: "Neon City",
		background: 0x1a0a1a,
		fruits: [0xff3366, 0xff6600, 0xffcc00, 0xff00ff],
		particles: [0xff3366, 0xff6600, 0xffcc00, 0xff0099],
		ui: 0xff3366,
	},
	forest: {
		name: "Matrix",
		background: 0x0a1a0a,
		fruits: [0x33ff33, 0x00ff66, 0x66ff99, 0x00ffaa],
		particles: [0x33ff33, 0x00ff66, 0x66ff99, 0x00ff00],
		ui: 0x33ff33,
	},
	night: {
		name: "Midnight",
		background: 0x05051a,
		fruits: [0x6666ff, 0x00ccff, 0xaaaaff, 0xffffff],
		particles: [0x6666ff, 0x00ccff, 0xaaaaff, 0x3399ff],
		ui: 0x6699ff,
	},
	cosmic: {
		name: "Cosmic",
		background: 0x150a2e,
		fruits: [0xcc66ff, 0xff00ff, 0x9933ff, 0xff66cc],
		particles: [0xcc66ff, 0xff00ff, 0x9933ff, 0xff33cc],
		ui: 0xcc66ff,
	},
	fire: {
		name: "Blaze",
		background: 0x1a0505,
		fruits: [0xff3300, 0xff6600, 0xffcc00, 0xff0000],
		particles: [0xff3300, 0xff6600, 0xffcc00, 0xff0000],
		ui: 0xff6600,
	},
	gold: {
		name: "Legendario",
		background: 0x1a1a05,
		fruits: [0xffff00, 0xffcc00, 0xff9900, 0xffffff],
		particles: [0xffff00, 0xffcc00, 0xff9900, 0xffffff],
		ui: 0xffff00,
	},
};

/**
 * Obtiene el tema actual basado en el nombre
 */
export function getTheme(themeName) {
	return Themes[themeName] || Themes.default;
}
