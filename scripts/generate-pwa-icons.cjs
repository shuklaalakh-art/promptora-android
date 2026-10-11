const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function createPromptoraIcon(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const radius = size * (isMaskable ? 0.38 : 0.44); // Maskable has safe zone padding

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Base background: Deep cosmic purple-black
      let r = 12;
      let g = 5;
      let b = 28;
      let a = 255;

      // Squircle distance check
      const dx = Math.abs(x - center) / radius;
      const dy = Math.abs(y - center) / radius;
      // Superellipse squircle formula: x^4 + y^4 <= 1
      const squircleDist = Math.pow(dx, 4) + Math.pow(dy, 4);

      if (squircleDist <= 1.0) {
        // Inside squircle: Dark purple gradient with cyan/magenta rim
        const borderGlow = squircleDist > 0.85 && squircleDist <= 1.0;
        
        // Base tile gradient
        const t = (x + y) / (size * 2);
        r = Math.floor(40 * (1 - t) + 18 * t);
        g = Math.floor(14 * (1 - t) + 7 * t);
        b = Math.floor(75 * (1 - t) + 38 * t);

        if (borderGlow) {
          // Rim border: gradient from violet to cyan
          const rimT = x / size;
          r = Math.floor(192 * (1 - rimT) + 56 * rimT);
          g = Math.floor(132 * (1 - rimT) + 189 * rimT);
          b = Math.floor(252 * (1 - rimT) + 248 * rimT);
        }

        // Relative coordinates inside the tile (-1 to 1)
        const nx = (x - center) / radius;
        const ny = (y - center) / radius;

        // Draw "P" stem: x between -0.42 and -0.15, y between -0.45 and 0.50
        const inStem = (nx >= -0.40 && nx <= -0.18 && ny >= -0.45 && ny <= 0.50);

        // Draw "P" bowl: outer arc (nx: -0.18 to 0.45, ny: -0.45 to 0.05)
        const bowlCenterX = -0.10;
        const bowlCenterY = -0.20;
        const bowlDist = Math.hypot((nx - bowlCenterX) * 1.0, (ny - bowlCenterY) * 1.5);
        const inBowlOuter = (bowlDist <= 0.45 && nx >= -0.30);
        const inBowlInner = (bowlDist <= 0.22 && nx >= -0.18);

        // Camera nozzle triangle: right side of bowl
        const inNozzle = (nx >= 0.28 && nx <= 0.52 && Math.abs(ny - (-0.20)) <= (0.52 - nx) * 0.8);

        // Teleprompter lines inside bowl: ny around -0.30, -0.20, -0.10
        const inPromptLine1 = (nx >= -0.12 && nx <= 0.15 && Math.abs(ny - (-0.28)) <= 0.025);
        const inPromptLine2 = (nx >= -0.12 && nx <= 0.20 && Math.abs(ny - (-0.20)) <= 0.025);
        const inPromptLine3 = (nx >= -0.12 && nx <= 0.10 && Math.abs(ny - (-0.12)) <= 0.025);

        // Recording dot: circle at nx = 0.25, ny = 0.32, radius = 0.16
        const recDist = Math.hypot(nx - 0.28, ny - 0.32);
        const inRecRing = (recDist >= 0.13 && recDist <= 0.17);
        const inRecDot = (recDist <= 0.11);

        if (inPromptLine1 || inPromptLine2 || inPromptLine3) {
          // Bright cyan teleprompter lines
          r = 56;
          g = 189;
          b = 248;
        } else if (inBowlInner) {
          // Hollow bowl cavity (deep violet)
          r = 16;
          g = 5;
          b = 34;
        } else if (inStem || inBowlOuter) {
          // Glossy white-to-light-indigo letter P body
          const pShade = (ny + 0.45) / 0.95;
          r = Math.floor(255 - pShade * 40);
          g = Math.floor(255 - pShade * 30);
          b = Math.floor(255);
        } else if (inNozzle) {
          // Violet camera nozzle
          r = 168;
          g = 85;
          b = 247;
        }

        if (inRecRing) {
          // White outer ring for recording indicator
          r = 255;
          g = 255;
          b = 255;
        } else if (inRecDot) {
          // Glowing red recording button
          r = 239;
          g = 68;
          b = 68;
        }
      } else if (!isMaskable) {
        // Outside squircle (ambient glow or transparent)
        if (squircleDist <= 1.25) {
          // Subtle neon edge halo
          const halo = (1.25 - squircleDist) / 0.25;
          r = Math.floor(99 * halo);
          g = Math.floor(102 * halo * 0.5);
          b = Math.floor(241 * halo);
          a = Math.floor(180 * halo);
        } else {
          a = 0;
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return png;
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate 192x192
const pwa192 = createPromptoraIcon(192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), PNG.sync.write(pwa192));

// 2. Generate 512x512
const pwa512 = createPromptoraIcon(512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), PNG.sync.write(pwa512));

// 3. Generate 512x512 Maskable (safe zone padding, full bleed background)
const pwaMaskable = createPromptoraIcon(512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), PNG.sync.write(pwaMaskable));

// 4. Generate Apple Touch Icon 180x180
const appleIcon = createPromptoraIcon(180, true);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), PNG.sync.write(appleIcon));

console.log('Successfully generated all PWA icons: 192x192, 512x512, maskable, apple-touch-icon.png');
