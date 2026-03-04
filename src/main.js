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
	backgroundColor: 0x05001a, // dark purple — synthwave
	audio: {
		noAudio: true, // Audio 100% programático via SynthAudio/SynthMusic
	},
	input: {
		activePointers: 6,
	},
	scene: GameScene,
};

// Iniciar juego
new Phaser.Game(config);
