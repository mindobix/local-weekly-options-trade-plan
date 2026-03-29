/* ── storage.js ─────────────────────────────────────────── */
const STORAGE_KEY = 'ow-ideas-v1';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function save(ideas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
