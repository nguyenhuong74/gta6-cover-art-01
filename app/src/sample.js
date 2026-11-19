// Procedural sample photos for Vice City Cover Studio.
// Every "photo" the app ships is drawn here, pixel by pixel, on a canvas:
// a sunset boulevard scene and a neon night street. No photograph of a
// real person, no borrowed artwork — just gradients, silhouettes and light.

/** A tiny deterministic random generator, so the same seed draws the same scene. */
export function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Draws one palm tree silhouette at (x, y) with the given height. */
function drawPalm(ctx, x, y, h, lean, rng) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.strokeStyle = '#160a24';
  ctx.lineWidth = Math.max(4, h * 0.035);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(h * 0.06, -h * 0.55, h * 0.02, -h);
  ctx.stroke();
  ctx.translate(h * 0.02, -h);
  ctx.lineWidth = Math.max(3, h * 0.022);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + i * 0.13) - 0.25;
    const len = h * (0.42 - Math.abs(i - 3) * 0.045) * (0.85 + rng() * 0.3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * len * 0.55, Math.sin(a) * len * 0.55 + len * 0.22, Math.cos(a) * len, Math.sin(a) * len + len * 0.34);
    ctx.stroke();
  }
  ctx.restore();
}

/** A row of lit windows on a dark building block. */
function drawBuilding(ctx, x, y, w, h, rng, lit) {
  ctx.fillStyle = '#1b0f2e';
  ctx.fillRect(x, y, w, h);
  const cols = Math.max(2, Math.floor(w / 26));
  const rows = Math.max(3, Math.floor(h / 34));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng() < 0.42) {
        ctx.fillStyle = lit[rng() < 0.5 ? 0 : 1];
        ctx.globalAlpha = 0.55 + rng() * 0.45;
        ctx.fillRect(x + 6 + c * ((w - 12) / cols), y + 8 + r * ((h - 16) / rows), (w - 12) / cols * 0.5, (h - 16) / rows * 0.45);
        ctx.globalAlpha = 1;
      }
    }
  }
  ctx.fillStyle = '#1b0f2e';
}

/** The skyline silhouette along the horizon. */
function drawSkyline(ctx, w, horizon, rng, lit) {
  let x = -10;
  while (x < w + 10) {
    const bw = 60 + rng() * 130;
    const bh = 60 + rng() * 190;
    drawBuilding(ctx, x, horizon - bh, bw, bh, rng, lit);
    x += bw + 4 + rng() * 26;
  }
}

/** A low convertible silhouette, seen from the side, parked on the road. */
function drawConvertible(ctx, x, y, w, rng) {
  const h = w * 0.24;
  ctx.fillStyle = '#12081f';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * 0.06, y - h * 0.55);
  ctx.lineTo(x + w * 0.34, y - h * 0.62);
  ctx.lineTo(x + w * 0.52, y - h * 0.28);
  ctx.lineTo(x + w * 0.86, y - h * 0.3);
  ctx.lineTo(x + w * 0.97, y - h * 0.05);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
  // windshield glint
  ctx.fillStyle = 'rgba(255, 170, 90, 0.55)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.36, y - h * 0.58);
  ctx.lineTo(x + w * 0.5, y - h * 0.28);
  ctx.lineTo(x + w * 0.4, y - h * 0.26);
  ctx.closePath();
  ctx.fill();
  // wheels
  ctx.fillStyle = '#0a0514';
  for (const wx of [x + w * 0.2, x + w * 0.8]) {
    ctx.beginPath();
    ctx.arc(wx, y, h * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2b52';
    ctx.beginPath();
    ctx.arc(wx, y, h * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0514';
  }
  void rng;
}

/**
 * Draws a sample scene onto a fresh canvas and returns it as an image source
 * the cover engine can draw. variant is 'sunset' or 'neon'.
 */
export function makeSamplePhoto(variant, width = 1080, height = 1350) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const rng = makeRng(variant === 'neon' ? 20261119 : 777001);
  const horizon = height * 0.62;
  const w = width;
  const h = height;

  // --- sky ---
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  if (variant === 'neon') {
    sky.addColorStop(0, '#0b1035');
    sky.addColorStop(0.45, '#3b1d5e');
    sky.addColorStop(0.8, '#a12a6e');
    sky.addColorStop(1, '#ff5e7a');
  } else {
    sky.addColorStop(0, '#2a1a5e');
    sky.addColorStop(0.35, '#7a2d7d');
    sky.addColorStop(0.65, '#e85d6a');
    sky.addColorStop(1, '#ffb347');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizon + 2);

  // --- sun with glow ---
  const sunX = w * (variant === 'neon' ? 0.68 : 0.5);
  const sunY = horizon - h * 0.16;
  const sunR = w * 0.11;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3.2);
  glow.addColorStop(0, variant === 'neon' ? 'rgba(255, 120, 160, 0.85)' : 'rgba(255, 220, 140, 0.9)');
  glow.addColorStop(1, 'rgba(255, 120, 140, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, horizon);
  ctx.fillStyle = variant === 'neon' ? '#ffd7e8' : '#fff3c4';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // sun slats, poster style
  ctx.fillStyle = variant === 'neon' ? '#a12a6e' : '#e85d6a';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(sunX - sunR, sunY + sunR * (0.15 + i * 0.28), sunR * 2, sunR * 0.09);
  }

  // --- birds ---
  ctx.strokeStyle = 'rgba(20, 8, 32, 0.85)';
  ctx.lineWidth = Math.max(2, w * 0.004);
  for (let i = 0; i < 5; i++) {
    const bx = w * (0.12 + rng() * 0.6);
    const by = h * (0.08 + rng() * 0.2);
    const s = 10 + rng() * 14;
    ctx.beginPath();
    ctx.moveTo(bx - s, by);
    ctx.quadraticCurveTo(bx - s * 0.4, by - s * 0.7, bx, by);
    ctx.quadraticCurveTo(bx + s * 0.4, by - s * 0.7, bx + s, by);
    ctx.stroke();
  }

  // --- skyline ---
  drawSkyline(ctx, w, horizon, rng, variant === 'neon' ? ['#ff5da2', '#37e6d4'] : ['#ffd166', '#ff9a5c']);

  // --- sea / road ---
  const ground = ctx.createLinearGradient(0, horizon, 0, h);
  if (variant === 'neon') {
    ground.addColorStop(0, '#241238');
    ground.addColorStop(1, '#0d0718');
  } else {
    ground.addColorStop(0, '#5c2a52');
    ground.addColorStop(0.4, '#2e1a44');
    ground.addColorStop(1, '#160a24');
  }
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon, w, h - horizon);
  // sun reflection on the wet ground
  const refl = ctx.createLinearGradient(0, horizon, 0, h);
  refl.addColorStop(0, variant === 'neon' ? 'rgba(255, 93, 162, 0.5)' : 'rgba(255, 179, 71, 0.55)');
  refl.addColorStop(1, 'rgba(255, 93, 162, 0)');
  ctx.fillStyle = refl;
  ctx.beginPath();
  ctx.moveTo(sunX - w * 0.06, horizon);
  ctx.lineTo(sunX + w * 0.06, horizon);
  ctx.lineTo(sunX + w * 0.16, h);
  ctx.lineTo(sunX - w * 0.16, h);
  ctx.closePath();
  ctx.fill();

  // --- palms framing the scene ---
  drawPalm(ctx, w * 0.06, h * 0.98, h * 0.34, -0.12, rng);
  drawPalm(ctx, w * 0.94, h * 0.99, h * 0.3, 0.14, rng);
  drawPalm(ctx, w * 0.86, horizon + h * 0.05, h * 0.16, 0.08, rng);

  // --- hero silhouette: the convertible on the boulevard, high enough to
  // sit above the cover's title band ---
  drawConvertible(ctx, w * 0.25, h * 0.82, w * 0.5, rng);

  // --- neon sign dots for the night variant ---
  if (variant === 'neon') {
    const dots = ['#37e6d4', '#ff5da2', '#ffe066', '#7a5cff'];
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = dots[i % dots.length];
      ctx.globalAlpha = 0.25 + rng() * 0.6;
      ctx.beginPath();
      ctx.arc(rng() * w, horizon + rng() * (h - horizon) * 0.7, 1.5 + rng() * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  return canvas;
}
