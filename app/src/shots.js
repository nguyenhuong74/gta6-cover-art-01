// Fixed scenes for screenshots, driven by the page's query string.
// ?shot=editor shows the editor with sample photos loaded in its panels.
// ?shot=cover hides the controls and draws one exported cover full-frame.
// `layout`, `grade`, `size`, `caption`, `subtitle` pick the scene; `photo`
// picks the sample scene (sunset or neon). window.__shotReady is set once
// the scene is painted, so a screenshot knows the frame is done.
import { EXPORT_SIZES } from './cover.js';
import { makeSamplePhoto } from './sample.js';

export function runShot(shot, query, state, redraw, preview) {
  const layout = query.get('layout');
  if (layout) state.layout = layout;
  const grade = query.get('grade');
  if (grade) state.grade = grade;
  const caption = query.get('caption');
  if (caption !== null) state.caption = caption;
  const subtitle = query.get('subtitle');
  if (subtitle !== null) state.subtitle = subtitle;
  const sizeId = query.get('size');
  if (sizeId) state.size = sizeId;

  // Two procedurally drawn sample scenes, alternating across the panels.
  const variant = query.get('photo') ?? 'sunset';
  const other = variant === 'neon' ? 'sunset' : 'neon';
  state.photos = [
    makeSamplePhoto(variant),
    makeSamplePhoto(other),
    makeSamplePhoto(variant),
    makeSamplePhoto(other),
  ];
  state.fillAll = false;
  const fillAll = document.getElementById('fillAll');
  if (fillAll) fillAll.checked = false;
  const captionInput = document.getElementById('caption');
  if (captionInput) captionInput.value = state.caption;
  const subtitleInput = document.getElementById('subtitle');
  if (subtitleInput) subtitleInput.value = state.subtitle;
  // Keep the option chips in step with the scene's layout, grade and size.
  document.querySelectorAll('#layouts .chip').forEach((c) => c.classList.toggle('on', c.dataset.layout === state.layout));
  document.querySelectorAll('#grades .chip').forEach((c) => c.classList.toggle('on', c.dataset.grade === state.grade));
  const sizeIndex = EXPORT_SIZES.findIndex((s) => s.id === state.size);
  document.querySelectorAll('#sizes .chip').forEach((c, i) => c.classList.toggle('on', i === sizeIndex));

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = EXPORT_SIZES.find((s) => s.id === state.size) ?? EXPORT_SIZES[0];
    preview.width = size.w;
    preview.height = size.h;
    // Fit the export-size canvas into the screenshot window.
    preview.style.width = '100vw';
    preview.style.height = '100vh';
    preview.style.maxWidth = 'none';
    preview.style.maxHeight = 'none';
  }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
