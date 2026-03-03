import Phaser from "phaser";
import GameScene from "./scenes/GameScene.js";

/**
 * Configuración de Phaser
 */
const config = {
	type: Phaser.AUTO,
	scale: {
		mode: Phaser.Scale.RESIZE,
		parent: "phaser",
		width: "100%",
		height: "100%",
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	pixelArt: true,
	backgroundColor: Phaser.Display.Color.RandomRGB().color,
	audio: {
		disableWebAudio: true,
	},
	input: {
		activePointers: 3,
	},
	scene: GameScene,
};

// Iniciar juego
new Phaser.Game(config);
