import { defineConfig } from "vite";

export default defineConfig({
	base: "/puntos/",
	root: "src",
	publicDir: "../public",
	build: {
		outDir: "../dist",
		emptyOutDir: true,
		assetsDir: "assets",
		rollupOptions: {
			output: {
				manualChunks: {
					// Separate Phaser into its own chunk (large dependency)
					phaser: ["phaser"],
				},
			},
		},
		// Increase chunk size warning limit (Phaser is large)
		chunkSizeWarningLimit: 1000,
	},
	server: {
		port: 8080,
		open: true,
	},
});
