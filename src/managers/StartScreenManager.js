/**
 * StartScreenManager - Pantalla de inicio con onboarding
 * 
 * Muestra logo "PUNTOS", botón START y hint de gameplay
 * Estética: arcade synthwave 80s CRT
 */
export default class StartScreenManager {
	constructor(scene) {
		this.scene = scene;
		this.container = null;
		this.isVisible = false;
		
		// Configuración visual
		this.config = {
			overlayColor: 0x05001a,
			overlayAlpha: 0.95,
			accentColor: 0xcc66ff,
			textColor: "#cc66ff",
			subtitleColor: "#ffffff",
			hintColor: "#33ff33",
			fontFamily: "tres, monospace",
		};
	}

	/**
	 * Crea y muestra la pantalla de inicio
	 */
	show() {
		if (this.isVisible) return;
		
		const { width, height } = this.scene.scale;
		const centerX = width / 2;
		const centerY = height / 2;
		
		// Container principal
		this.container = this.scene.add.container(0, 0);
		this.container.setDepth(300); // Sobre todo
		
		// Overlay oscuro (fondo CRT)
		const overlay = this.scene.add.rectangle(
			centerX,
			centerY,
			width,
			height,
			this.config.overlayColor,
			this.config.overlayAlpha
		);
		this.container.add(overlay);
		
		// ═══════════════════════════════════════════════════
		// LOGO "PUNTOS" - ASCII art style
		// ═══════════════════════════════════════════════════
		const logoY = centerY - 140;
		
		const logoText = this.scene.add.text(
			centerX,
			logoY,
			"PUNTOS",
			{
				fontFamily: this.config.fontFamily,
				fontSize: "72px",
				color: this.config.textColor,
				stroke: "#000000",
				strokeThickness: 8,
				align: "center",
			}
		).setOrigin(0.5);
		this.container.add(logoText);
		
		// Efecto de glow pulsante (simulado con doble texto)
		const logoGlow = this.scene.add.text(
			centerX,
			logoY,
			"PUNTOS",
			{
				fontFamily: this.config.fontFamily,
				fontSize: "72px",
				color: this.config.textColor,
				align: "center",
			}
		).setOrigin(0.5).setAlpha(0.3);
		this.container.add(logoGlow);
		
		// Animación de pulso en el glow
		this.scene.tweens.add({
			targets: logoGlow,
			alpha: 0.6,
			scale: 1.05,
			duration: 1500,
			yoyo: true,
			repeat: -1,
			ease: "Sine.easeInOut",
		});
		
		// ═══════════════════════════════════════════════════
		// SUBTÍTULO
		// ═══════════════════════════════════════════════════
		const subtitle = this.scene.add.text(
			centerX,
			logoY + 60,
			"Zen Fruit Catcher",
			{
				fontFamily: this.config.fontFamily,
				fontSize: "24px",
				color: this.config.subtitleColor,
				stroke: "#000000",
				strokeThickness: 3,
			}
		).setOrigin(0.5);
		this.container.add(subtitle);
		
		// ═══════════════════════════════════════════════════
		// BOTÓN START (arcade style)
		// ═══════════════════════════════════════════════════
		const btnY = centerY + 20;
		const btnWidth = 240;
		const btnHeight = 80;
		
		// Fondo del botón
		const btnBg = this.scene.add.rectangle(
			centerX,
			btnY,
			btnWidth,
			btnHeight,
			0x05001a,
			0.9
		);
		btnBg.setInteractive({ useHandCursor: true });
		this.container.add(btnBg);
		
		// Borde neón del botón (doble para efecto CRT)
		const border1 = this.scene.add.graphics();
		border1.lineStyle(3, this.config.accentColor, 0.8);
		border1.strokeRect(
			centerX - btnWidth / 2,
			btnY - btnHeight / 2,
			btnWidth,
			btnHeight
		);
		this.container.add(border1);
		
		const border2 = this.scene.add.graphics();
		border2.lineStyle(1, this.config.accentColor, 0.4);
		border2.strokeRect(
			centerX - btnWidth / 2 - 2,
			btnY - btnHeight / 2 - 2,
			btnWidth + 4,
			btnHeight + 4
		);
		this.container.add(border2);
		
		// Texto del botón
		const btnText = this.scene.add.text(
			centerX,
			btnY,
			"START",
			{
				fontFamily: this.config.fontFamily,
				fontSize: "42px",
				color: this.config.textColor,
				stroke: "#000000",
				strokeThickness: 5,
			}
		).setOrigin(0.5);
		this.container.add(btnText);
		
		// Animación de parpadeo del texto
		this.scene.tweens.add({
			targets: btnText,
			alpha: 0.6,
			duration: 800,
			yoyo: true,
			repeat: -1,
			ease: "Sine.easeInOut",
		});
		
		// ═══════════════════════════════════════════════════
		// EFECTOS INTERACTIVOS DEL BOTÓN
		// ═══════════════════════════════════════════════════
		btnBg.on("pointerover", () => {
			btnBg.setFillStyle(this.config.accentColor, 0.2);
			this.scene.tweens.add({
				targets: [btnBg, btnText, border1, border2],
				scaleX: 1.05,
				scaleY: 1.05,
				duration: 100,
				ease: "Power2",
			});
		});
		
		btnBg.on("pointerout", () => {
			btnBg.setFillStyle(0x05001a, 0.9);
			this.scene.tweens.add({
				targets: [btnBg, btnText, border1, border2],
				scaleX: 1.0,
				scaleY: 1.0,
				duration: 100,
				ease: "Power2",
			});
		});
		
		btnBg.on("pointerdown", () => {
			// Efecto de click arcade
			this.scene.tweens.add({
				targets: [btnBg, btnText],
				scaleX: 0.95,
				scaleY: 0.95,
				duration: 50,
				yoyo: true,
				onComplete: () => {
					this.hide();
				},
			});
			
			// Sonido de inicio (si el audio está disponible)
			if (!this.scene.isMuted && this.scene.synth) {
				this.scene.synth.playMilestone();
			}
		});
		
		// ═══════════════════════════════════════════════════
		// HINT DE GAMEPLAY (abajo)
		// ═══════════════════════════════════════════════════
		const hint = this.scene.add.text(
			centerX,
			btnY + 90,
			"Tap fruits • Find your flow",
			{
				fontFamily: this.config.fontFamily,
				fontSize: "20px",
				color: this.config.hintColor,
				stroke: "#000000",
				strokeThickness: 3,
			}
		).setOrigin(0.5).setAlpha(0.7);
		this.container.add(hint);
		
		// ═══════════════════════════════════════════════════
		// ANIMACIÓN DE ENTRADA
		// ═══════════════════════════════════════════════════
		this.container.setAlpha(0);
		this.scene.tweens.add({
			targets: this.container,
			alpha: 1,
			duration: 500,
			ease: "Power2",
		});
		
		this.isVisible = true;
	}

	/**
	 * Oculta y destruye la pantalla de inicio con animación
	 */
	hide() {
		if (!this.isVisible || !this.container) return;
		
		// Animación de salida (fade out + slide up)
		this.scene.tweens.add({
			targets: this.container,
			alpha: 0,
			y: -50,
			duration: 400,
			ease: "Power2",
			onComplete: () => {
				this.container?.destroy();
				this.container = null;
				this.isVisible = false;
				
				// Notificar a la escena que se completó el onboarding
				this.scene.events.emit("startScreenComplete");
				
				// Mostrar tutorial interactivo después de 1 segundo
				this.scene.time.delayedCall(1000, () => {
					this.showTutorialHint();
				});
			},
		});
	}

	/**
	 * Muestra hint visual sobre la primera fruta (tutorial interactivo)
	 */
	showTutorialHint() {
		// Esperar a que aparezca la primera fruta
		const checkFruit = () => {
			const fruits = this.scene.fruits.getChildren();
			if (fruits.length === 0) {
				// Reintentar en 200ms
				this.scene.time.delayedCall(200, checkFruit);
				return;
			}

			// Tomar la primera fruta
			const targetFruit = fruits[0];
			if (!targetFruit) return;

			const centerX = this.scene.scale.width / 2;
			
			// Container para el tutorial
			const tutorialContainer = this.scene.add.container(0, 0);
			tutorialContainer.setDepth(250);

			// Texto "TAP HERE!" con flecha
			const hintText = this.scene.add.text(
				centerX,
				targetFruit.y - 100,
				"↓ TAP HERE! ↓",
				{
					fontFamily: this.config.fontFamily,
					fontSize: "32px",
					color: this.config.hintColor,
					stroke: "#000000",
					strokeThickness: 5,
					align: "center",
				}
			).setOrigin(0.5).setAlpha(0);
			tutorialContainer.add(hintText);

			// Animación de fade in
			this.scene.tweens.add({
				targets: hintText,
				alpha: 1,
				duration: 400,
				ease: "Power2",
			});

			// Animación de bounce (arriba y abajo)
			this.scene.tweens.add({
				targets: hintText,
				y: targetFruit.y - 120,
				duration: 600,
				yoyo: true,
				repeat: -1,
				ease: "Sine.easeInOut",
			});

			// Círculo pulsante alrededor de la fruta
			const circle = this.scene.add.circle(
				targetFruit.x,
				targetFruit.y,
				50,
				this.config.accentColor,
				0
			);
			circle.setStrokeStyle(4, this.config.accentColor, 0.6);
			circle.setDepth(targetFruit.depth - 1);
			tutorialContainer.add(circle);

			// Animación de pulso
			this.scene.tweens.add({
				targets: circle,
				scaleX: 1.3,
				scaleY: 1.3,
				alpha: 0,
				duration: 1200,
				repeat: -1,
				ease: "Power2",
			});

			// Actualizar posición del círculo mientras la fruta cae
			const updateCircle = () => {
				if (!targetFruit.active || !circle.active) {
					tutorialContainer.destroy();
					return;
				}
				circle.setPosition(targetFruit.x, targetFruit.y);
			};

			// Listener para destruir el tutorial cuando se toca la fruta
			const onFirstTap = () => {
				this.scene.tweens.add({
					targets: tutorialContainer,
					alpha: 0,
					duration: 300,
					ease: "Power2",
					onComplete: () => {
						tutorialContainer.destroy();
						this.scene.events.off("update", updateCircle);
					},
				});
			};

			// Escuchar el primer tap en cualquier fruta
			targetFruit.once("pointerdown", onFirstTap);

			// Actualizar posición del círculo cada frame
			this.scene.events.on("update", updateCircle);

			// Auto-destruir después de 8 segundos si no se toca
			this.scene.time.delayedCall(8000, () => {
				if (tutorialContainer.active) {
					this.scene.tweens.add({
						targets: tutorialContainer,
						alpha: 0,
						duration: 500,
						onComplete: () => {
							tutorialContainer.destroy();
							this.scene.events.off("update", updateCircle);
						},
					});
				}
			});
		};

		checkFruit();
	}

	/**
	 * Reposiciona elementos al cambiar tamaño (responsive)
	 */
	handleResize(gameSize) {
		if (!this.isVisible || !this.container) return;
		
		// Recrear pantalla con nuevo tamaño
		this.container?.destroy();
		this.isVisible = false;
		this.show();
	}

	/**
	 * Destruye completamente el manager
	 */
	destroy() {
		this.container?.destroy();
		this.container = null;
		this.isVisible = false;
	}
}
