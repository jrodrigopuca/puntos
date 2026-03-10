import { defineConfig } from "vite";

// Special build config for itch.io (base path = "/")
export default defineConfig({
	base: "/",
	root: "src",
	publicDir: "../public",
	build: {
		outDir: "../dist-itch",
		emptyOutDir: true,
		assetsDir: "assets",
		rollupOptions: {
			output: {
				manualChunks: {
					phaser: ["phaser"],
				},
			},
		},
		chunkSizeWarningLimit: 1000,
	},
});
