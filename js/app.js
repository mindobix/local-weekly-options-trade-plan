/* ── app.js ─────────────────────────────────────────────── */

// ── Global state ──────────────────────────────────────────
window.APP_STATE = {
  view:          'monthly',   // 'monthly' | 'weekly' | 'daily'
  year:          new Date().getFullYear(),
  month:         new Date().getMonth() + 1,
  weekOf:        getMondayOf(todayStr()),
  dailyDate:     todayStr(),
  filterType:    'all',       // 'all' | 'call' | 'put'
  filterStatus:  'all',       // 'all' | 'active' | 'triggered' | 'hit' | 'stopped'
  filterSearch:  '',
};

// ── Main render dispatcher ─────────────────────────────────
function renderView() {
  const ideas = load();
  const { view, year, month, weekOf, dailyDate } = APP_STATE;

  updateNavLabel();

  if (view === 'monthly') {
    renderMonthlyView(year, month, ideas);
  } else if (view === 'weekly') {
    renderWeeklyView(weekOf, ideas);
  } else {
    renderDailyView(weekOf, ideas);
  }
}

// ── Navigation label ───────────────────────────────────────
function updateNavLabel() {
  const el  = document.getElementById('nav-label');
  const nav = document.getElementById('nav-controls');
  nav.classList.remove('nav-hidden');
  if (APP_STATE.view === 'monthly') {
    el.textContent = fmtMonthLabel(APP_STATE.year, APP_STATE.month);
  } else if (APP_STATE.view === 'weekly') {
    el.textContent = fmtWeekRange(APP_STATE.weekOf);
  } else {
    el.textContent = fmtWeekRange(APP_STATE.weekOf);
  }
}

// ── View toggle ────────────────────────────────────────────
function switchView(v) {
  APP_STATE.view = v;
  localStorage.setItem('wotp-last-view', v);
  document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  if (v === 'monthly') {
    const d = new Date(APP_STATE.weekOf + 'T12:00:00');
    APP_STATE.year  = d.getFullYear();
    APP_STATE.month = d.getMonth() + 1;
  }
  renderView();
}

// ── Navigation prev/next ───────────────────────────────────
function navPrev() {
  if (APP_STATE.view === 'monthly') {
    APP_STATE.month--;
    if (APP_STATE.month < 1) { APP_STATE.month = 12; APP_STATE.year--; }
  } else if (APP_STATE.view === 'weekly') {
    const d = new Date(APP_STATE.weekOf + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    APP_STATE.weekOf = d.toISOString().slice(0, 10);
  } else {
    const d = new Date(APP_STATE.weekOf + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    APP_STATE.weekOf = d.toISOString().slice(0, 10);
  }
  renderView();
}

function navNext() {
  if (APP_STATE.view === 'monthly') {
    APP_STATE.month++;
    if (APP_STATE.month > 12) { APP_STATE.month = 1; APP_STATE.year++; }
  } else if (APP_STATE.view === 'weekly') {
    const d = new Date(APP_STATE.weekOf + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    APP_STATE.weekOf = d.toISOString().slice(0, 10);
  } else {
    const d = new Date(APP_STATE.weekOf + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    APP_STATE.weekOf = d.toISOString().slice(0, 10);
  }
  renderView();
}

function navToday() {
  const now = new Date();
  APP_STATE.year      = now.getFullYear();
  APP_STATE.month     = now.getMonth() + 1;
  APP_STATE.weekOf    = getMondayOf(todayStr());
  APP_STATE.dailyDate = todayStr();
  renderView();
}

// ── Filters ────────────────────────────────────────────────
function setFilterType(v) {
  APP_STATE.filterType = v;
  document.querySelectorAll('.filter-type-btn').forEach(b => b.classList.toggle('active', b.dataset.val === v));
  renderView();
}

function setFilterStatus(v) {
  APP_STATE.filterStatus = v;
  renderView();
}

function setFilterSearch(v) {
  APP_STATE.filterSearch = v;
  renderView();
}

// ── Backup / Restore ───────────────────────────────────────
function exportBackup() {
  const data = { version: 1, exportedAt: new Date().toISOString(), ideas: load() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `wotp-backup-${todayStr()}.json`;
  a.click();
}

function importBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result);
        const incoming = data.ideas || (Array.isArray(data) ? data : []);
        if (!incoming.length) { alert('No ideas found in backup.'); return; }
        const existing = load();
        const existingIds = new Set(existing.map(i => i.id));
        const merged = [...existing, ...incoming.filter(i => !existingIds.has(i.id))];
        save(merged);
        renderView();
        alert(`Imported ${incoming.length} ideas (${merged.length - existing.length} new).`);
      } catch { alert('Invalid backup file.'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ── Seed demo data on first load ───────────────────────────
function maybeSeedDemo() {
  if (load().length > 0) return;
  const mon = getMondayOf(todayStr());
  // Shift back one week for "last week" examples, keep this week too
  const lastMon = (() => {
    const d = new Date(mon + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  })();
  const nextFri = (() => {
    const d = new Date(mon + 'T12:00:00');
    d.setDate(d.getDate() + 4);
    return d.toISOString().slice(0, 10);
  })();
  const lastFri = (() => {
    const d = new Date(lastMon + 'T12:00:00');
    d.setDate(d.getDate() + 4);
    return d.toISOString().slice(0, 10);
  })();

  const demo = [
    { id: uid(), symbol:'TSLA', optionType:'call', strikePrice:380, expiryDate:nextFri, triggerPrice:369, targets:[383,390], stopPrice:360, weekOf:mon,     status:'active',    notes:'Breakout above 370 resistance.', customColor:'#f43f5e', createdAt:mon },
    { id: uid(), symbol:'META', optionType:'call', strikePrice:610, expiryDate:nextFri, triggerPrice:600, targets:[613,627], stopPrice:590, weekOf:mon,     status:'triggered', notes:'Earnings momentum play.',          customColor:'#3b82f6', createdAt:mon },
    { id: uid(), symbol:'SPX',  optionType:'call', strikePrice:6600,expiryDate:nextFri, triggerPrice:6521,targets:[6650],   stopPrice:6470,weekOf:mon,     status:'active',    notes:'Weekly call above 6521.',           customColor:'#a855f7', createdAt:mon },
    { id: uid(), symbol:'SPX',  optionType:'put',  strikePrice:6430,expiryDate:nextFri, triggerPrice:6500,targets:[6427],   stopPrice:6521,weekOf:mon,     status:'active',    notes:'Weekly put hedge.',                 customColor:'#a855f7', createdAt:mon },
    { id: uid(), symbol:'NVDA', optionType:'call', strikePrice:900, expiryDate:lastFri, triggerPrice:890, targets:[910,930],stopPrice:875, weekOf:lastMon,  status:'hit',       notes:'AI semis momentum.',                customColor:'#22c55e', createdAt:lastMon },
    { id: uid(), symbol:'AAPL', optionType:'put',  strikePrice:220, expiryDate:lastFri, triggerPrice:225, targets:[215,210],stopPrice:230, weekOf:lastMon,  status:'stopped',   notes:'Breakdown below 225 support.',      customColor:'#64748b', createdAt:lastMon },
  ];
  save(demo);
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  maybeSeedDemo();
  initModal();

  // Restore last view from localStorage
  const savedView = localStorage.getItem('wotp-last-view');
  if (savedView && ['monthly', 'weekly', 'daily'].includes(savedView)) {
    APP_STATE.view = savedView;
  }

  // View buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
    btn.classList.toggle('active', btn.dataset.view === APP_STATE.view);
  });

  // Nav buttons
  document.getElementById('nav-prev').addEventListener('click', navPrev);
  document.getElementById('nav-next').addEventListener('click', navNext);
  document.getElementById('nav-today').addEventListener('click', navToday);

  // Filters
  document.querySelectorAll('.filter-type-btn').forEach(btn => {
    btn.addEventListener('click', () => setFilterType(btn.dataset.val));
  });
  document.getElementById('filter-status').addEventListener('change', e => setFilterStatus(e.target.value));
  document.getElementById('filter-search').addEventListener('input', e => setFilterSearch(e.target.value));

  // Util buttons
  document.getElementById('btn-export').addEventListener('click', exportBackup);
  document.getElementById('btn-import').addEventListener('click', importBackup);
  document.getElementById('btn-add').addEventListener('click', () => openAddModal());

  // Modal save/cancel
  document.getElementById('modal-save').addEventListener('click', saveIdea);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);

  // Close modal on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  renderView();
});
