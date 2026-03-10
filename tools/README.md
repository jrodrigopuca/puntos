# 🎨 PUNTOS Asset Generators

This directory contains standalone HTML tools to generate visual assets for PUNTOS with synthwave aesthetics.

## 📁 Files

- `cover-generator.html` - Generates itch.io cover image (630x500px)
- `icon-generator.html` - Generates PWA icons with neon glow (192x192, 512x512)

## 🚀 Usage

### 1. Cover Image Generator

**Purpose:** Create the cover image for itch.io game page

**Steps:**
1. Open `cover-generator.html` in your browser
2. Wait for the image to render (should be instant)
3. **Option A:** Right-click on canvas → "Save image as..." → `cover.png`
4. **Option B:** Click the "DOWNLOAD COVER IMAGE" button
5. Upload to itch.io when creating/editing your game page

**Output:**
- **Filename:** `puntos-cover.png`
- **Size:** 630x500px
- **Format:** PNG
- **Features:** 
  - Synthwave gradient background
  - Retro grid lines
  - Double neon border (#cc66ff)
  - Pixelated apple icon
  - "PUNTOS" logo with glow effect
  - Tagline and subtitle

---

### 2. Icon Generator

**Purpose:** Create PWA icons with synthwave neon glow effect

**Steps:**
1. Open `icon-generator.html` in your browser
2. Wait for all three icons to render
3. Click the download buttons for each size:
   - `icons-192.png` (192x192px, maskable)
   - `icons-512.png` (512x512px, maskable)  
   - `icon-pure.png` (192x192px, pure icon)
4. Replace the existing files in `/public/img/`
5. Clear browser cache and reinstall PWA to see changes

**Output:**
- **Features:**
  - Dark background (#05001a)
  - Purple neon glow (#cc66ff)
  - Pixelated apple with enhanced colors
  - Radial gradient glow from center
  - Neon border effect

---

## 🎯 What YOU Need to Create

These generators handle the logo/icon assets. You still need to capture:

### Screenshots (3-5 images)
- **Size:** 1920x1080px (16:9 landscape)
- **Format:** PNG or JPG (quality 90%)
- **Suggestions:**
  1. Active gameplay with multiple fruits falling
  2. Zen mode activated ("MAX SPEED / ZEN MODE ACTIVE")
  3. New record moment ("★ NEW RECORD ★" with confetti)
  4. Start screen with "PUNTOS" logo
  5. Pause menu showing SHARE SCORE

**How to capture:**
1. Run the game: `npm run dev`
2. Press F11 for fullscreen
3. Play until you have a good moment
4. Press F12 → Screenshot tool, or use OS screenshot (Cmd+Shift+4 on Mac)
5. Save to `/public/img/` as `screenshot-1.png`, etc.

### Animated GIF (5-10 seconds)
- **Size:** 800x450px or 1000x562px (16:9)
- **Duration:** 5-10 seconds
- **FPS:** 30
- **Format:** GIF (<5MB for README)
- **Loop:** Infinite

**What to show:**
- 3-5 seconds of fluid gameplay
- 3-4 fruits being captured
- Feedback messages ("Nice!", "Great!")
- Score increasing
- Optional: End with "NEW RECORD" moment

**Tools:**
- **LICEcap** (Mac/Win) - https://www.cockos.com/licecap/
- **Gifski** (Mac, best quality) - https://gif.ski/
- **ScreenToGif** (Windows) - https://www.screentogif.com/

---

## 📦 Manifest Update

After generating new icons, the manifest is already configured at `/public/manifest.json`:

\`\`\`json
{
  "icons": [
    { "src": "/img/icons-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/img/icons-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" },
    { "src": "/img/icon-pure.png", "sizes": "192x192", "type": "image/png" }
  ]
}
\`\`\`

No need to modify - just replace the image files.

---

## 🎨 Design System

All generators follow PUNTOS design system:

**Colors:**
- Background: `#05001a` (dark purple)
- Primary accent: `#cc66ff` (neon purple)
- Secondary accent: `#ff66aa` (pink)
- Text: `#ffffff` (white)

**Typography:**
- Font: "tres" (monospace, loaded from `/public/font/tres.otf`)
- Style: Bold, arcade-inspired

**Effects:**
- Neon glow: `box-shadow: 0 0 20px rgba(204, 102, 255, 0.5)`
- Double borders
- Scanlines (subtle)
- Radial gradients
- CRT aesthetic

---

## 🔧 Troubleshooting

**Font not loading:**
- Make sure `/public/font/tres.otf` exists
- Generators use relative paths: `../public/font/tres.otf`
- If font fails, browsers will fallback to monospace

**Icons look different on device:**
- Different browsers/OSs apply masks to PWA icons
- Clear cache: Settings → Storage → Clear site data
- Uninstall and reinstall PWA

**Canvas looks blurry:**
- This is normal in the generator preview
- Downloaded PNG files will be sharp
- The `image-rendering: pixelated` CSS helps with preview

---

## ✅ Checklist for Publication

- [ ] Generate cover image with `cover-generator.html`
- [ ] Generate 3 PWA icons with `icon-generator.html`
- [ ] Replace icons in `/public/img/`
- [ ] Capture 3-5 screenshots (1920x1080)
- [ ] Record animated GIF (5-10s loop)
- [ ] Update `/public/manifest.json` screenshots array
- [ ] Test PWA installation on mobile
- [ ] Upload cover + screenshots to itch.io
- [ ] Add GIF to README.md

---

Made with 💜 for PUNTOS - Zen Fruit Catcher
