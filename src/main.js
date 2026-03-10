import Phaser from "phaser";
import GameScene from "./scenes/GameScene.js";

/**
 * Show arcade-style error overlay
 */
function showErrorOverlay(message, details) {
	const container = document.getElementById("phaser");
	if (!container) return;

	container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: #05001a;
      color: #cc66ff;
      font-family: 'tres', monospace;
      text-align: center;
      padding: 20px;
      box-sizing: border-box;
    ">
      <div style="
        border: 4px solid #cc66ff;
        padding: 40px;
        max-width: 600px;
        background: rgba(204, 102, 255, 0.05);
        box-shadow: 0 0 20px rgba(204, 102, 255, 0.3);
      ">
        <div style="font-size: 48px; margin-bottom: 20px; animation: pulse 2s ease-in-out infinite;">
          ⚠️ ERROR
        </div>
        <div style="font-size: 20px; margin-bottom: 30px; line-height: 1.5;">
          ${message}
        </div>
        <div style="font-size: 14px; color: #ff66aa; margin-bottom: 30px; opacity: 0.8;">
          ${details}
        </div>
        <button onclick="location.reload()" style="
          background: #cc66ff;
          color: #05001a;
          border: none;
          padding: 15px 40px;
          font-family: 'tres', monospace;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(204, 102, 255, 0.5);
          transition: all 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          RELOAD GAME
        </button>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    </div>
  `;
}

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

// Initialize game with error boundary
try {
	const game = new Phaser.Game(config);

	// Listen for critical Phaser errors
	game.events.on("error", (error) => {
		console.error("Phaser critical error:", error);
		showErrorOverlay(
			"Game initialization failed",
			"Unable to start the game engine. Please reload or try a different browser.",
		);
	});
} catch (error) {
	console.error("Failed to initialize game:", error);
	showErrorOverlay(
		"Failed to load PUNTOS",
		error.message || "An unexpected error occurred. Please reload the page.",
	);
}

// Global error handler for unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
	console.error("Unhandled promise rejection:", event.reason);
	showErrorOverlay(
		"Something went wrong",
		"An unexpected error occurred. Please reload the page.",
	);
});

// Disable context menu (right-click) to prevent interrupting gameplay
document.addEventListener("contextmenu", (event) => {
	event.preventDefault();
});
