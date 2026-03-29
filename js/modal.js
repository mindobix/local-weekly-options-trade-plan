/* ── modal.js ───────────────────────────────────────────── */

let _editId = null;
let _defaultWeekOf = null;

// ── 24 preset colors ──────────────────────────────────────
const PRESET_COLORS = [
  // Reds / Pinks
  '#ef4444', '#f43f5e', '#ec4899', '#db2777',
  // Purples / Violets
  '#c026d3', '#a855f7', '#8b5cf6', '#6366f1',
  // Blues / Cyans
  '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6',
  // Greens
  '#10b981', '#22c55e', '#84cc16', '#65a30d',
  // Yellows / Ambers / Oranges
  '#eab308', '#f59e0b', '#f97316', '#ea580c',
  // Neutrals / Misc
  '#64748b', '#94a3b8', '#e2e8f0', '#78716c',
];

// ── Swatch grid ───────────────────────────────────────────
function _buildSwatches() {
  const grid = document.getElementById('swatch-grid');
  let html = '';

  // Auto swatch (no custom color)
  html += `<div class="swatch swatch-auto selected" data-color="" title="Auto (from ticker)" onclick="_selectSwatch(this, '')">✦</div>`;

  // Preset swatches
  PRESET_COLORS.forEach(c => {
    html += `<div class="swatch" data-color="${c}" title="${c}" style="background:${c}" onclick="_selectSwatch(this, '${c}')"></div>`;
  });

  // "Other" swatch — opens native color picker
  html += `<div class="swatch swatch-other" data-color="other" title="Custom color" onclick="_openOtherPicker()"></div>`;

  grid.innerHTML = html;
}

function _selectSwatch(el, color) {
  document.querySelectorAll('#swatch-grid .swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('f-color').value = color;
  _updateColorHint(color);
}

function _openOtherPicker() {
  const picker = document.getElementById('f-color-picker');
  // Pre-fill picker with current color if any
  const cur = document.getElementById('f-color').value;
  if (/^#[0-9a-fA-F]{6}$/.test(cur)) picker.value = cur;
  picker.click();
}

function _syncSwatchToColor(color) {
  const grid = document.getElementById('swatch-grid');
  const swatches = grid.querySelectorAll('.swatch');
  swatches.forEach(s => s.classList.remove('selected'));

  if (!color) {
    // Select auto
    grid.querySelector('[data-color=""]')?.classList.add('selected');
    return;
  }
  // Find matching preset
  const match = grid.querySelector(`[data-color="${color}"]`);
  if (match && match.dataset.color !== 'other') {
    match.classList.add('selected');
  } else {
    // It's a custom color — highlight "Other" swatch and update its bg
    const otherSwatch = grid.querySelector('.swatch-other');
    if (otherSwatch) {
      otherSwatch.style.background = color;
      otherSwatch.classList.add('selected');
    }
  }
}

function _updateColorHint(color) {
  const hint = document.getElementById('color-label-hint');
  hint.textContent = color ? color : '(auto from ticker)';
}

// ── Core form logic ───────────────────────────────────────
function openAddModal(weekOf) {
  _editId = null;
  _defaultWeekOf = weekOf || getMondayOf(todayStr());
  _populateForm(null);
  _openOverlay();
}

function openEditModal(id) {
  const ideas = load();
  const idea = ideas.find(i => i.id === id);
  if (!idea) return;
  _editId = id;
  _defaultWeekOf = idea.weekOf;
  _populateForm(idea);
  _openOverlay();
}

function closeModal() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('modal').classList.remove('open');
}

function _openOverlay() {
  document.getElementById('overlay').classList.add('open');
  document.getElementById('modal').classList.add('open');
  document.getElementById('f-symbol').focus();
}

function _setOptType(val) {
  document.querySelectorAll('input[name="opt-type"]').forEach(r => { r.checked = r.value === val; });
}

function _getOptType() {
  const r = document.querySelector('input[name="opt-type"]:checked');
  return r ? r.value : 'call';
}

function _populateForm(idea) {
  document.getElementById('modal-title').textContent = idea ? 'Edit Idea' : 'Add Idea';
  document.getElementById('f-symbol').value   = idea?.symbol      || '';
  _setOptType(idea?.optionType || 'call');
  document.getElementById('f-strike').value   = idea?.strikePrice ?? '';
  document.getElementById('f-expiry').value   = idea?.expiryDate  || '';
  document.getElementById('f-trigger').value  = idea?.triggerPrice ?? '';
  document.getElementById('f-stop').value     = idea?.stopPrice   ?? '';
  document.getElementById('f-week').value     = idea?.weekOf      || _defaultWeekOf || getMondayOf(todayStr());
  document.getElementById('f-created').value  = idea?.createdAt   || todayStr();
  document.getElementById('f-status').value   = idea?.status      || 'active';
  document.getElementById('f-notes').value    = idea?.notes       || '';
  // Color
  const color = idea?.customColor || '';
  document.getElementById('f-color').value = color;
  _syncSwatchToColor(color);
  _updateColorHint(color);
  // Targets
  const targets = idea?.targets || [];
  document.getElementById('f-t1').value = targets[0] ?? '';
  document.getElementById('f-t2').value = targets[1] ?? '';
  document.getElementById('f-t3').value = targets[2] ?? '';
}

function saveIdea() {
  const symbol = document.getElementById('f-symbol').value.trim().toUpperCase();
  if (!symbol) { alert('Symbol is required.'); return; }

  const strikeRaw  = document.getElementById('f-strike').value;
  const triggerRaw = document.getElementById('f-trigger').value;
  const stopRaw    = document.getElementById('f-stop').value;
  const t1 = document.getElementById('f-t1').value;
  const t2 = document.getElementById('f-t2').value;
  const t3 = document.getElementById('f-t3').value;

  const targets = [t1, t2, t3]
    .map(v => v.trim() === '' ? null : parseFloat(v))
    .filter(v => v !== null && !isNaN(v));

  const rawColor = document.getElementById('f-color').value.trim();
  const customColor = /^#[0-9a-fA-F]{3,6}$/.test(rawColor) ? rawColor : null;

  const idea = {
    id:           _editId || uid(),
    symbol,
    optionType:   _getOptType(),
    strikePrice:  strikeRaw  !== '' ? parseFloat(strikeRaw)  : null,
    expiryDate:   document.getElementById('f-expiry').value || null,
    triggerPrice: triggerRaw !== '' ? parseFloat(triggerRaw) : null,
    targets,
    stopPrice:    stopRaw    !== '' ? parseFloat(stopRaw)    : null,
    weekOf:       document.getElementById('f-week').value || getMondayOf(todayStr()),
    createdAt:    document.getElementById('f-created').value || todayStr(),
    status:       document.getElementById('f-status').value,
    notes:        document.getElementById('f-notes').value.trim(),
    customColor,
  };

  let ideas = load();
  if (_editId) {
    const idx = ideas.findIndex(i => i.id === _editId);
    if (idx !== -1) {
      idea.createdAt = ideas[idx].createdAt;
      ideas[idx] = idea;
    }
  } else {
    ideas.push(idea);
  }
  save(ideas);
  closeModal();
  renderView();
}

function deleteIdea(id) {
  if (!confirm('Delete this options idea?')) return;
  const ideas = load().filter(i => i.id !== id);
  save(ideas);
  renderView();
}

// ── Init ──────────────────────────────────────────────────
function initModal() {
  _buildSwatches();

  document.getElementById('overlay').addEventListener('click', closeModal);

  // Symbol change → update hint if on auto
  document.getElementById('f-symbol').addEventListener('input', () => {
    if (!document.getElementById('f-color').value) {
      // auto — no hint update needed, card will derive from ticker
    }
  });

  // Native color picker → update hidden input + sync swatch
  document.getElementById('f-color-picker').addEventListener('input', e => {
    const color = e.target.value;
    document.getElementById('f-color').value = color;
    _syncSwatchToColor(color);
    _updateColorHint(color);
  });
}
