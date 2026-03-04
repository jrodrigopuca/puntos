/**
 * Constantes del juego
 */
export const GameConstants = {
	UI: {
		MARGIN_PERCENT: 0.1,
		AUDIO_BTN_X_PERCENT: 0.8,
		PAUSE_BTN_X_PERCENT: 0.45,
		TEXT_STYLE: {
			font: "5em tres",
			align: "left",
			fontWeight: "bold",
			stroke: "#000000",
			strokeThickness: 9,
		},
	},
	GAMEPLAY: {
		MAX_FRUITS: 5,
		FRUIT_TYPES: 8,
		FRAMES_PER_FRUIT: 12,
		SPAWN_DELAY: 1000,
		BASE_SPEED: 1,
		SPEED_MULTIPLIER: 0.1,
		MAX_SPEED: 15,
	},
	GOLDEN: {
		FRAME: 8,
		BONUS_POINTS: 3,
		SPAWN_INTERVAL: 12000,
		SPAWN_VARIANCE: 3000,
		GLOW_COLOR: 0xffcc00,
		PULSE_SPEED: 600,
	},
	PARTICLES: {
		MAX_ACTIVE: 50,
		SPEED: 300,
		LIFESPAN: 800,
		EMIT_COUNT: 5,
	},
};

/**
 * Estados del juego
 */
export const GameState = {
	LOADING: "loading",
	PLAYING: "playing",
	PAUSED: "paused",
};
