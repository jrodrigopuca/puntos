# Puntos 🍎

> **A stress-free arcade game where you never lose—just flow.**

Tap falling fruits in this zen-like experience with evolving synthwave themes and procedural music that grows with your skill. No game overs, no pressure, just pure flow state.

**[🎮 Play on itch.io](https://yourname.itch.io/puntos)** | **[🚀 Install as PWA](https://yourname.github.io/puntos/)**

---

## ✨ Why Play Puntos?

- **🧘 Zen Mode** — No frustrating game overs. Missed fruits gently reduce your score, but you never lose.
- **🎨 Dynamic Themes** — Unlock 6 stunning synthwave color palettes every 50 points
- **🎵 Evolving Soundtrack** — 100% procedural music that harmonizes with your gameplay
- **🔄 Satisfying Physics** — Watch fruits rotate in 2.5D with 12-frame smooth animations
- **📱 Mobile-Optimized** — Multi-touch support, fullscreen mode, installable as PWA
- **⚡ Golden Fruits** — Catch rare golden apples for bonus points and special effects

---

## 🎮 How to Play

1. **Tap fruits** before they fall off the screen
2. **Build your score** — each fruit is +1 point
3. **Unlock themes** — reach milestones to change the vibe
4. **Catch golden fruits** — rare spawns give +3 bonus points
5. **Find your flow** — difficulty plateaus for endless zen sessions

Perfect for 5-10 minute relaxing breaks.

---

## 🛠️ Tech Stack

- **Engine:** [Phaser 3.90.0](https://phaser.io/) (ES6 modules)
- **Build:** [Vite 7.3.1](https://vitejs.dev/) (Hot Module Replacement)
- **Audio:** 100% Web Audio API (generative music + harmonized SFX)
- **Architecture:** Manager-based pattern with 7 specialized systems
- **Mobile:** PWA-ready with offline support

---

## 🚀 Development

```bash
# Install dependencies
npm install

# Run dev server (http://localhost:8080)
npm run dev

# Build for GitHub Pages
npm run build

# Build for itch.io (creates publish/builds/puntos-itch.zip)
npm run build:itch

# Preview production build
npm run preview
```

### 📁 Project Structure

```
puntos/
├── src/                    # Source code
├── public/                 # Static assets
├── dist/                   # GitHub Pages build (base: /puntos/)
├── dist-itch/             # itch.io build (base: /, relative paths)
├── publish/
│   ├── builds/            # Production artifacts
│   │   ├── puntos-itch.zip         # ⬅️ Upload this to itch.io
│   │   └── fix-itch-paths.sh       # Post-build path fixer
│   ├── cover.png          # Marketing assets
│   └── resized/           # Screenshots
└── tools/                 # Asset generators
```

**Important:** Always use `npm run build:itch` for itch.io deployments. The regular `npm run build` uses absolute paths that will cause 403 errors on itch.io's iframe environment.

---

## 📚 Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)** — Technical structure and component breakdown
- **[Improvement Plan](docs/IMPROVEMENT_PLAN.md)** — 12-week roadmap with retention analysis
- **[Itch.io Publishing Checklist](docs/PUBLISHING.md)** — Step-by-step guide for release

---

## 📄 License

MIT License - Feel free to learn from the code!

---

## 🎯 Made for Players Who...

- Need a break from stressful competitive games
- Love synthwave/vaporwave aesthetics
- Enjoy incremental progression without pressure
- Want a game that respects their time (5-10 min sessions)
- Appreciate procedural audio in games

**Built with ❤️ using PhaserJS**
