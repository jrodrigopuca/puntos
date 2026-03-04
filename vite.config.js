import { defineConfig } from "vite";

export default defineConfig({
	base: "/puntos/",
	root: "src",
	publicDir: "../public",
	build: {
		outDir: "../dist",
		emptyOutDir: true,
		assetsDir: "assets",
	},
	server: {
		port: 8080,
		open: true,
	},
});
