// Wires the Vice City Cover Studio page: photo uploads, panel picking and
// cropping, layout/grade/caption controls, live preview and PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (shots.js).
import { drawCover, freshState, layoutPanels, EXPORT_SIZES, GRADES, LAYOUTS } from './cover.js';
import { makeSamplePhoto } from './sample.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const state = freshState();
let selectedPanel = 0;
let dragging = null;

const preview = $('preview');
const status = $('status');

/** Redraws the live preview canvas from the current state. */
export function redraw() {
  const ctx = preview.getContext('2d');
  drawCover(ctx, preview.width, preview.height, state);
  $('panelLabel').textContent = `Panel ${selectedPanel + 1} of 4 — drag the preview to pan, use Zoom to crop`;
  $('zoom').value = String(state.crops[selectedPanel].zoom);
}

/** Loads an image file the user picked, resolving once it can be drawn. */
export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as a photo.'));
    };
    img.src = url;
  });
}

/** Builds the layout and grade buttons from the engine's tables. */
function buildOptionButtons() {
  const layoutBox = $('layouts');
  Object.entries(LAYOUTS).forEach(([id, layout]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = layout.label;
    b.dataset.layout = id;
    b.addEventListener('click', () => {
      state.layout = id;
      layoutBox.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === b));
      redraw();
    });
    if (id === state.layout) b.classList.add('on');
    layoutBox.appendChild(b);
  });

  const gradeBox = $('grades');
  Object.entries(GRADES).forEach(([id, grade]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = grade.label;
    b.dataset.grade = id;
    b.style.setProperty('--swatch', grade.sky[2]);
    b.addEventListener('click', () => {
      state.grade = id;
      gradeBox.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === b));
      redraw();
    });
    if (id === state.grade) b.classList.add('on');
    gradeBox.appendChild(b);
  });

  const sizeBox = $('sizes');
  EXPORT_SIZES.forEach((size) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = size.label;
    b.addEventListener('click', () => {
      state.size = size.id;
      sizeBox.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === b));
      syncPreviewSize();
    });
    if (size.id === state.size) b.classList.add('on');
    sizeBox.appendChild(b);
  });
}

/** Sizes the preview canvas to the chosen export ratio, capped for the page. */
function syncPreviewSize() {
  const size = EXPORT_SIZES.find((s) => s.id === state.size) ?? EXPORT_SIZES[0];
  const scale = Math.min(560 / size.w, 560 / size.h);
  preview.width = Math.round(size.w * scale);
  preview.height = Math.round(size.h * scale);
  preview.style.aspectRatio = `${size.w} / ${size.h}`;
  redraw();
}

/** The four photo slots: one file input each, plus fill-all and sample buttons. */
function buildPhotoSlots() {
  const slots = $('slots');
  for (let i = 0; i < 4; i++) {
    const wrap = document.createElement('label');
    wrap.className = 'slot';
    wrap.innerHTML = `<span>Photo ${i + 1}</span><input type="file" accept="image/*">`;
    const input = wrap.querySelector('input');
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        state.photos[i] = await loadImageFile(file);
        state.crops[i] = { x: 0, y: 0, zoom: 1 };
        status.textContent = `Photo ${i + 1} loaded — ${file.name}`;
        redraw();
      } catch (err) {
        status.textContent = err.message;
      }
    });
    wrap.addEventListener('click', (e) => {
      if (e.target === input) return;
      selectedPanel = i;
      redraw();
    });
    slots.appendChild(wrap);
  }
}

/** Exports the cover at the chosen size as a PNG download. */
function exportCover() {
  const size = EXPORT_SIZES.find((s) => s.id === state.size) ?? EXPORT_SIZES[0];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas.getContext('2d'), size.w, size.h, state);
  canvas.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-city-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
}

/** Preview pointer: click picks a panel, drag pans its photo. */
function bindPreview() {
  const toCanvas = (e) => {
    const r = preview.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * preview.width,
      y: ((e.clientY - r.top) / r.height) * preview.height,
    };
  };
  preview.addEventListener('pointerdown', (e) => {
    const p = toCanvas(e);
    const panels = layoutPanels(state.layout, preview.width, preview.height);
    const hit = panels.findIndex((r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h);
    if (hit >= 0) {
      selectedPanel = hit;
      dragging = { start: p, crop: { ...state.crops[hit] } };
      preview.setPointerCapture(e.pointerId);
      redraw();
    }
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = toCanvas(e);
    const panels = layoutPanels(state.layout, preview.width, preview.height);
    const rect = panels[selectedPanel];
    const crop = state.crops[selectedPanel];
    crop.x = Math.max(-1, Math.min(1, dragging.crop.x + ((p.x - dragging.start.x) / rect.w) * 2));
    crop.y = Math.max(-1, Math.min(1, dragging.crop.y + ((p.y - dragging.start.y) / rect.h) * 2));
    redraw();
  });
  preview.addEventListener('pointerup', () => {
    dragging = null;
  });
}

/** Binds the remaining controls: caption, subtitle, lettering, zoom, export. */
function bindControls() {
  $('caption').addEventListener('input', (e) => {
    state.caption = e.target.value;
    redraw();
  });
  $('subtitle').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    redraw();
  });
  $('lettering').addEventListener('change', (e) => {
    state.lettering = e.target.value;
    redraw();
  });
  $('grain').addEventListener('change', (e) => {
    state.grain = e.target.checked;
    redraw();
  });
  $('fillAll').addEventListener('change', (e) => {
    state.fillAll = e.target.checked;
    redraw();
  });
  $('zoom').addEventListener('input', (e) => {
    state.crops[selectedPanel].zoom = Number(e.target.value);
    redraw();
  });
  $('resetCrop').addEventListener('click', () => {
    state.crops[selectedPanel] = { x: 0, y: 0, zoom: 1 };
    redraw();
  });
  $('sample').addEventListener('click', () => {
    state.photos[0] = makeSamplePhoto('sunset');
    state.photos[1] = makeSamplePhoto('neon');
    state.photos[2] = makeSamplePhoto('sunset');
    state.photos[3] = makeSamplePhoto('neon');
    state.fillAll = false;
    $('fillAll').checked = false;
    status.textContent = 'Sample photos loaded — two procedurally drawn scenes. Replace any panel with your own photo.';
    redraw();
  });
  $('fillOne').addEventListener('click', () => {
    if (!state.photos[0]) {
      status.textContent = 'Load Photo 1 first, then fill all panels with it.';
      return;
    }
    state.fillAll = true;
    $('fillAll').checked = true;
    status.textContent = 'All panels now use Photo 1.';
    redraw();
  });
  $('export').addEventListener('click', exportCover);
}

buildOptionButtons();
buildPhotoSlots();
bindPreview();
bindControls();
syncPreviewSize();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, state, redraw, preview);
} else {
  redraw();
}
