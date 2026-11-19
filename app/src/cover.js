// The cover engine: turns photos, a caption and a grade into multi-panel
// GTA-style poster art on a 2D canvas. Everything here is original art —
// panel geometry, sunset/neon gradient maps, lettering and grain drawn by
// this code, no borrowed logo, artwork or font.

/** The export sizes the app offers, in pixels. */
export const EXPORT_SIZES = [
  { id: 'square', label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
];

/** The colour grades: each a sky gradient, a panel tint and a title palette. */
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    sky: ['#2a1a5e', '#7a2d7d', '#e85d6a', '#ffb347'],
    tint: 'rgba(232, 93, 106, 0.20)',
    deep: 'rgba(42, 26, 94, 0.34)',
    titleFrom: '#fff3c4',
    titleTo: '#ff8a5c',
    accent: '#ff5da2',
    sub: '#37e6d4',
  },
  neon: {
    label: 'Neon Night',
    sky: ['#0b1035', '#3b1d5e', '#a12a6e', '#ff5e7a'],
    tint: 'rgba(255, 93, 162, 0.22)',
    deep: 'rgba(11, 16, 53, 0.38)',
    titleFrom: '#e8fbff',
    titleTo: '#ff5da2',
    accent: '#37e6d4',
    sub: '#ffe066',
  },
  gold: {
    label: 'Golden Hour',
    sky: ['#3a1c10', '#8a3b1e', '#e07b39', '#ffd166'],
    tint: 'rgba(224, 123, 57, 0.20)',
    deep: 'rgba(58, 28, 16, 0.34)',
    titleFrom: '#fff8e0',
    titleTo: '#ffb347',
    accent: '#ff5d5d',
    sub: '#ffffff',
  },
  noir: {
    label: 'Midnight Noir',
    sky: ['#0a0f1e', '#1c2b4a', '#3d5a80', '#8fa8c8'],
    tint: 'rgba(61, 90, 128, 0.22)',
    deep: 'rgba(10, 15, 30, 0.40)',
    titleFrom: '#f2f5ff',
    titleTo: '#9db4d8',
    accent: '#ff5d5d',
    sub: '#ffd166',
  },
};

/** The panel layouts. Each returns rects in unit space (0..1 of the cover). */
export const LAYOUTS = {
  hero: {
    label: 'Hero + Three',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.34 },
      { x: 0.62, y: 0.34, w: 0.38, h: 0.33 },
      { x: 0.62, y: 0.67, w: 0.38, h: 0.33 },
    ],
  },
  quad: {
    label: 'Four Corners',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  strip: {
    label: 'Big Top + Strip',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.66 },
      { x: 0, y: 0.66, w: 0.34, h: 0.34 },
      { x: 0.34, y: 0.66, w: 0.33, h: 0.34 },
      { x: 0.67, y: 0.66, w: 0.33, h: 0.34 },
    ],
  },
};

/** A fresh, empty cover state. */
export function freshState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    caption: 'VICE SUNSET',
    subtitle: 'Neon Coast Nights',
    lettering: 'sunset',
    size: 'square',
    fillAll: true,
    grain: true,
    photos: [null, null, null, null],
    // Per-panel crop: pan offsets (-1..1) and zoom (>=1).
    crops: [
      { x: 0, y: 0, zoom: 1 },
      { x: 0, y: 0, zoom: 1 },
      { x: 0, y: 0, zoom: 1 },
      { x: 0, y: 0, zoom: 1 },
    ],
  };
}

/** Panel rects in pixels for a cover of W x H, with gutters between panels. */
export function layoutPanels(layoutId, W, H) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.hero;
  const g = Math.round(Math.min(W, H) * 0.012);
  return layout.panels.map((p) => ({
    x: Math.round(p.x * W) + (p.x > 0 ? g / 2 : 0),
    y: Math.round(p.y * H) + (p.y > 0 ? g / 2 : 0),
    w: Math.round(p.w * W) - (p.x > 0 ? g / 2 : 0) - (p.x + p.w < 1 ? g / 2 : 0),
    h: Math.round(p.h * H) - (p.y > 0 ? g / 2 : 0) - (p.y + p.h < 1 ? g / 2 : 0),
  }));
}

/** Draws one photo into a panel rect, cover-fit, with the panel's pan/zoom crop. */
export function drawPanelPhoto(ctx, photo, rect, crop) {
  if (!photo) return false;
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(rect.w / iw, rect.h / ih) * (crop?.zoom ?? 1);
  const pw = iw * base;
  const ph = ih * base;
  const cx = rect.x + rect.w / 2 + (crop?.x ?? 0) * rect.w * 0.25;
  const cy = rect.y + rect.h / 2 + (crop?.y ?? 0) * rect.h * 0.25;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
  return true;
}

/** A photo placeholder: the grade's sky with a sun, for panels with no photo yet. */
function drawPanelPlaceholder(ctx, rect, grade, index) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grade.sky.forEach((c, i) => g.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h * 0.42;
  const r = Math.min(rect.w, rect.h) * 0.16;
  ctx.fillStyle = 'rgba(255, 243, 196, 0.95)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = `900 ${Math.max(14, rect.w * 0.09)}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`PANEL ${index + 1}`, cx, rect.y + rect.h * 0.82);
}

/** The sunset/neon colour grade over one panel: warm tint + deep shadow. */
function gradePanel(ctx, rect, grade) {
  const tint = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w * 0.25, rect.y + rect.h);
  tint.addColorStop(0, 'rgba(255, 179, 71, 0.10)');
  tint.addColorStop(0.55, grade.tint);
  tint.addColorStop(1, grade.deep);
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = Math.max(2, rect.w * 0.006);
  ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
}

/** Film grain: sparse light/dark specks, seeded so a cover is stable. */
function drawGrain(ctx, W, H, seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  ctx.save();
  for (let i = 0; i < W * H / 260; i++) {
    const v = next();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(next() * W, next() * H, 1.6, 1.6);
  }
  ctx.restore();
}

/** A soft vignette darkening the cover's corners. */
function drawVignette(ctx, W, H) {
  const v = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.42, W / 2, H * 0.5, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(10, 5, 20, 0)');
  v.addColorStop(1, 'rgba(10, 5, 20, 0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

/**
 * The bold title block: diagonal accent stripes, the caption in heavy
 * capitals (gradient or solid, by lettering), and the neon subtitle.
 */
export function drawTitleBlock(ctx, W, H, state, grade) {
  const bandH = H * 0.17;
  const bandY = H - bandH;
  const s = Math.min(W, H);
  // dark band with a slanted top edge
  ctx.fillStyle = 'rgba(12, 6, 24, 0.92)';
  ctx.beginPath();
  ctx.moveTo(0, bandY + s * 0.018);
  ctx.lineTo(W, bandY);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  // diagonal accent stripes
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, bandY + s * 0.018);
  ctx.lineTo(W, bandY);
  ctx.lineTo(W, bandY + s * 0.012);
  ctx.lineTo(0, bandY + s * 0.03);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = grade.accent;
  for (let x = -bandH; x < W + bandH; x += s * 0.028) {
    ctx.fillRect(x, bandY - s * 0.01, s * 0.012, bandH);
  }
  ctx.restore();

  const caption = (state.caption || 'VICE SUNSET').trim().toUpperCase();
  let size = bandH * 0.52;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const setFont = (px) => {
    ctx.font = `900 ${px}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  };
  setFont(size);
  while (ctx.measureText(caption).width > W * 0.92 && size > 18) {
    size -= 4;
    setFont(size);
  }
  const cy = bandY + bandH * 0.52;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = size * 0.16;
  ctx.shadowOffsetY = size * 0.05;
  if (state.lettering === 'outline') {
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(caption, W / 2, cy);
    ctx.fillStyle = grade.accent;
    ctx.fillText(caption, W / 2, cy);
  } else if (state.lettering === 'solid') {
    ctx.fillStyle = '#ffffff';
    ctx.fillText(caption, W / 2, cy);
  } else {
    const grad = ctx.createLinearGradient(0, cy - size * 0.5, 0, cy + size * 0.5);
    grad.addColorStop(0, grade.titleFrom);
    grad.addColorStop(1, grade.titleTo);
    ctx.fillStyle = grad;
    ctx.fillText(caption, W / 2, cy);
  }
  ctx.restore();

  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subSize = Math.max(16, bandH * 0.17);
    ctx.font = `italic 800 ${subSize}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = grade.sub;
    ctx.textAlign = 'center';
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = subSize * 0.5;
    ctx.fillText(sub.toUpperCase(), W / 2, bandY + bandH * 0.22);
    ctx.shadowBlur = 0;
  }
}

/**
 * Draws the whole cover onto ctx at W x H from a state. Photos are canvas or
 * image elements; missing panels get a procedural placeholder.
 */
export function drawCover(ctx, W, H, state) {
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const panels = layoutPanels(state.layout, W, H);
  const first = state.photos[0];
  panels.forEach((rect, i) => {
    const photo = state.fillAll ? first ?? state.photos[i] : state.photos[i];
    const drawn = photo ? drawPanelPhoto(ctx, photo, rect, state.crops[i]) : false;
    if (!drawn) drawPanelPlaceholder(ctx, rect, grade, i);
    gradePanel(ctx, rect, grade);
  });

  drawTitleBlock(ctx, W, H, state, grade);
  drawVignette(ctx, W, H);
  // A thin white poster frame around the whole cover.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = Math.max(3, Math.min(W, H) * 0.006);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
  if (state.grain) drawGrain(ctx, W, H, 20261119);
}

/** Renders a state to a fresh canvas at one of the export sizes. */
export function renderCoverCanvas(state, sizeId) {
  const size = EXPORT_SIZES.find((s) => s.id === sizeId) ?? EXPORT_SIZES[0];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas.getContext('2d'), size.w, size.h, state);
  return canvas;
}
