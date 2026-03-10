# 🚀 PUNTOS - Publication Guide for itch.io

This guide contains everything you need to publish PUNTOS on itch.io and GitHub Pages.

## ✅ Pre-Publication Checklist

### Assets Ready
- [x] Cover image (630x500px) → `public/img/cover.png`
- [x] 3 screenshots (1920x1080px) → `public/img/screenshot-1.png`, `screenshot-2.png`, `screenshot-3.png`
- [x] PWA icons with synthwave glow → `public/img/icons-192.png`, `icons-512.png`, `icon-pure.png`
- [ ] Animated GIF (optional but recommended, 5-10 seconds)

### Code & Build
- [x] All text translated to English
- [x] PWA manifest configured
- [x] Start screen + tutorial implemented
- [x] Share score feature working
- [x] Error boundaries added
- [x] Code splitting (Phaser separated)
- [x] Context menu disabled
- [x] Production build successful

---

## 📦 Step 1: Build for Production

```bash
npm run build
```

This creates the `/dist` folder with:
- Optimized HTML, CSS, JS (15.57 KB + 330 KB Phaser)
- All assets (images, audio, fonts)
- PWA manifest and service worker ready

---

## 🌐 Step 2: Deploy to GitHub Pages

### Option A: Automatic (Recommended)

Push your changes to GitHub:

```bash
git add .
git commit -m "feat: prepare for publication - assets, icons, screenshots ready"
git push origin main
```

GitHub Actions will automatically deploy to: `https://jrodrigopuca.github.io/puntos/`

### Option B: Manual

```bash
npm run build
# Then manually upload /dist folder to GitHub Pages
```

---

## 🎮 Step 3: Publish on itch.io

### Create New Project

1. Go to https://itch.io/game/new
2. Fill in the basic info:

**Title:** Puntos - Zen Fruit Catcher

**Short description:**
```
A stress-free arcade game with synthwave vibes. Tap falling fruits before they escape. No game overs, just zen flow.
```

**Project URL:** `puntos` (or `puntos-zen-catcher` if taken)

**Classification:** Games

**Kind of project:** HTML

---

### Upload Game Files

**Option A: Upload ZIP (Recommended for itch.io iframe)**

1. Build the project: `npm run build`
2. Compress the `/dist` folder → `puntos-v1.0.zip`
3. Upload to itch.io
4. Check "This file will be played in the browser"
5. Set viewport dimensions: **1280 x 720** (or fullscreen if available)

**Option B: External URL (Recommended for better PWA experience)**

1. Use GitHub Pages URL: `https://jrodrigopuca.github.io/puntos/`
2. This allows users to install the PWA properly

**Best Strategy:** Do BOTH
- Upload ZIP for embedded iframe on itch.io
- Also add external link for PWA installation

---

### Upload Cover Image

1. Go to "Edit game" → "Cover image"
2. Upload: `public/img/cover.png` (630x500px)
3. This appears in game listings and social shares

---

### Upload Screenshots

1. Go to "Edit game" → "Screenshots"
2. Upload in order:
   - `public/img/screenshot-3.png` (Start screen - FIRST impression)
   - `public/img/screenshot-1.png` (Gameplay)
   - `public/img/screenshot-2.png` (Pause menu with features)
3. Add captions if desired

---

### Game Details

**Genre/Tags:** (Select relevant ones)
- Arcade
- Casual
- Action
- Pixel Art
- Synthwave
- No Ads
- Singleplayer
- HTML5

**Pricing:** Free (or pay-what-you-want if you prefer)

**License:** MIT License (as specified in package.json)

---

### Description (Long)

Use this formatted description:

```markdown
# 🍎 PUNTOS - Zen Fruit Catcher

A stress-free arcade game where you tap falling fruits before they escape. No game overs, no timers—just pure zen flow with synthwave vibes.

## ✨ Features

- **No Game Overs**: Fruits escape? No problem. Keep playing, find your rhythm
- **Zen Mode**: Hit max speed and enter the flow state with relaxing audio feedback
- **Progressive Difficulty**: Speed increases naturally as you improve
- **Synthwave Aesthetic**: Dark purple backgrounds, neon borders, retro pixel art
- **Share Your Score**: Generate a score card image and share with friends
- **PWA Support**: Install on mobile for offline play and fullscreen experience

## 🎮 How to Play

- **Tap/Click** on falling fruits before they reach the bottom
- Each fruit caught increases your score
- Speed increases over time
- Hit max speed to activate **ZEN MODE**
- No penalties, no pressure—just flow

## 🎨 Credits

- **Design & Development**: Juan Rodrigo Puca
- **Font**: "Tres" by Juan Rodrigo Puca
- **Music & SFX**: Procedural audio synthesis
- **Built with**: Phaser 3.90, Vite

## 🔗 Links

- Play on GitHub Pages (PWA): https://jrodrigopuca.github.io/puntos/
- Source Code: https://github.com/jrodrigopuca/puntos
- License: MIT

---

Made with 💜 in 2026
```

---

### Accessibility

**Controls:**
- Mouse (desktop)
- Touch (mobile)

**Languages:** English

**Inputs:** Mouse, Touchscreen

---

### Community Settings

- **Comments:** Enable (to get feedback)
- **Ratings:** Enable
- **Allow donations:** Optional (if you want pay-what-you-want)

---

## 🎬 Step 4: Create Animated GIF (Optional)

If you want to add a GIF to your itch.io page and README:

### Tools:
- **LICEcap** (Mac/Win): https://www.cockos.com/licecap/
- **Gifski** (Mac): https://gif.ski/
- **ScreenToGif** (Windows): https://www.screentogif.com/

### Recording:
1. Run `npm run dev`
2. Start recording tool
3. Set dimensions: 800x450px or 1000x562px (16:9)
4. Play for 5-10 seconds showing:
   - Several fruits being caught
   - Feedback messages appearing
   - Score increasing
   - Optional: end with "NEW RECORD" moment
5. Save as `gameplay.gif` (<5MB)

### Usage:
- Add to itch.io description: `![Gameplay](url-to-gif)`
- Add to README.md

---

## 📱 Step 5: Test PWA Installation

### On Mobile (iPhone/Android):

1. Visit: `https://jrodrigopuca.github.io/puntos/`
2. Tap browser menu → "Add to Home Screen"
3. App should install with:
   - Custom icon (with neon glow)
   - Fullscreen mode
   - Dark splash screen (#05001a)
4. Test gameplay, share score feature

### On Desktop:

1. Visit in Chrome: `https://jrodrigopuca.github.io/puntos/`
2. Look for install icon in address bar
3. Click "Install PUNTOS"
4. App opens in standalone window
5. Test all features

---

## 📊 Post-Publication

### Monitor Analytics

- Check itch.io analytics for views, downloads, ratings
- Monitor GitHub Pages traffic
- Read comments for feedback

### Share on Social Media

Sample tweet:
```
🍎 Just launched PUNTOS - a zen fruit catcher game!

No game overs, no stress—just tap fruits and find your flow 🌊

Play now (free): [itch.io link]

Features:
✨ Synthwave aesthetic
✨ Progressive difficulty  
✨ PWA support
✨ Share your score

#gamedev #indiegames #HTML5games
```

### Consider Submitting To:

- Reddit: r/WebGames, r/incremental_games, r/playmygame
- Hacker News: Show HN
- Game jams on itch.io (add to relevant jams)
- IndieDB

---

## 🐛 Troubleshooting

**Icons not showing on mobile:**
- Clear browser cache
- Uninstall PWA and reinstall
- Check manifest paths are correct

**Game not loading on itch.io:**
- Verify ZIP contains all files from /dist
- Check viewport dimensions in itch.io settings
- Try increasing iframe size

**Share score not working:**
- On mobile: Web Share API requires HTTPS (GitHub Pages ✓)
- On desktop: Downloads PNG instead (expected behavior)

---

## 📝 Version History

**v1.0.0** (March 2026)
- Initial public release
- English translation complete
- PWA support with synthwave icons
- Start screen + tutorial
- Share score feature
- Professional loading screen
- Error boundaries
- Code splitting optimization

---

## 🎯 Future Ideas

- Leaderboards (Firebase or Supabase)
- Multiple game modes (Time Attack, Survival, etc.)
- Unlockable fruit skins
- Daily challenges
- Localization (Spanish, Portuguese, etc.)
- Music selection
- Achievements

---

**Good luck with your launch! 🚀**

If you need any adjustments or have questions, check the `/tools/` directory for asset generators.
