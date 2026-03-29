/* ── cards.js ───────────────────────────────────────────── */

// ── Status config ──────────────────────────────────────────
const STATUS_CFG = {
  active:    { label: 'Active',    cls: 'status-active'   },
  triggered: { label: 'Triggered', cls: 'status-triggered'},
  hit:       { label: 'Target Hit',cls: 'status-hit'      },
  stopped:   { label: 'Stopped',   cls: 'status-stopped'  },
};

// ── Render a single option card ────────────────────────────
function renderCard(idea) {
  const color    = idea.customColor || tickerColor(idea.symbol);
  const expiry   = idea.expiryDate  ? fmtShortDate(idea.expiryDate) : '—';
  const typeTag  = idea.optionType === 'put' ? 'P' : 'C';
  const strike   = fmtPrice(idea.strikePrice);
  const trigger  = fmtPrice(idea.triggerPrice);
  const stop     = fmtPrice(idea.stopPrice);
  const letter   = (idea.symbol || '?')[0].toUpperCase();
  const status   = STATUS_CFG[idea.status] || STATUS_CFG.active;

  const targetsHtml = idea.targets && idea.targets.length
    ? idea.targets.map(t => `<span class="target-val">${fmtPrice(t)}</span>`).join('')
    : '<span class="target-val muted">—</span>';

  const infoLine = `${expiry}&nbsp;&nbsp;<span class="badge-strike ${idea.optionType === 'put' ? 'put' : 'call'}">${strike}${typeTag}</span>&nbsp;&nbsp;<span class="at-label">AT</span>&nbsp;&nbsp;<span class="trigger-val">${trigger}</span>`;

  const notesHtml = idea.notes
    ? `<div class="card-notes">${esc(idea.notes)}</div>`
    : '';

  return `
<div class="option-card ${idea.status || 'active'}" data-id="${esc(idea.id)}" style="--card-clr:${color}" onclick="openEditModal('${esc(idea.id)}')">
  <div class="card-glow"></div>
  <div class="card-header">
    <div class="card-logo" style="background:${color}22;color:${color}">${letter}</div>
    <div class="card-ticker" style="color:${color}">$${esc(idea.symbol)}</div>
    <div class="card-actions">
      <button class="icon-btn" title="Edit" onclick="event.stopPropagation();openEditModal('${esc(idea.id)}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="icon-btn del" title="Delete" onclick="event.stopPropagation();deleteIdea('${esc(idea.id)}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>
  </div>
  <div class="card-divider" style="background:${color}33"></div>
  <div class="card-info">${infoLine}</div>
  <div class="card-divider" style="background:${color}22"></div>
  <div class="card-levels">
    <div class="card-targets">
      <div class="levels-icon target-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
      </div>
      <div class="target-prices">${targetsHtml}</div>
    </div>
    <div class="card-stop">
      <div class="levels-icon stop-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>
      <span class="stop-val">${stop}</span>
    </div>
  </div>
  ${notesHtml}
  <div class="card-footer">
    <span class="card-status ${status.cls}">${status.label}</span>
    <span class="card-date muted">${fmtShortDate(idea.weekOf)} wk</span>
  </div>
</div>`;
}

// ── Render the Add card button ─────────────────────────────
function renderAddCard(weekOf) {
  return `
<div class="add-card" onclick="openAddModal('${esc(weekOf)}')">
  <div class="add-card-inner">
    <div class="add-icon">+</div>
    <span>Add WOTP</span>
  </div>
</div>`;
}

// ── Filter ideas by active filter state ───────────────────
function applyFilters(ideas) {
  const typeF   = window.APP_STATE?.filterType   || 'all';
  const statusF = window.APP_STATE?.filterStatus || 'all';
  const searchF = (window.APP_STATE?.filterSearch || '').toUpperCase();

  return ideas.filter(idea => {
    if (typeF !== 'all' && idea.optionType !== typeF) return false;
    if (statusF !== 'all' && (idea.status || 'active') !== statusF) return false;
    if (searchF && !idea.symbol.toUpperCase().includes(searchF)) return false;
    return true;
  });
}

// ── Render monthly view ────────────────────────────────────
function renderMonthlyView(year, month, ideas) {
  const filtered = applyFilters(ideas);
  const weeks = getWeeksInMonth(filtered, year, month);
  // Always show current week if in this month even with no ideas (empty)
  const allWeeks = getWeeksInMonth(ideas, year, month); // unfiltered for structure

  const el = document.getElementById('main-content');
  if (!allWeeks.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📋</div>
      <p>No ideas for ${fmtMonthLabel(year, month)}</p>
      <button class="btn-primary" onclick="openAddModal()">+ Add First Idea</button>
    </div>`;
    return;
  }

  el.innerHTML = allWeeks.map(monday => {
    const weekIdeas = filtered.filter(i => i.weekOf === monday);
    const totalIdeas = ideas.filter(i => i.weekOf === monday).length;
    const callCount = weekIdeas.filter(i => i.optionType === 'call').length;
    const putCount  = weekIdeas.filter(i => i.optionType === 'put').length;
    const isCurrentWeek = monday === getMondayOf(todayStr());

    return `
<section class="week-section ${isCurrentWeek ? 'current-week' : ''}">
  <div class="week-header">
    <div class="week-label">
      ${isCurrentWeek ? '<span class="current-badge">This Week</span>' : ''}
      <span class="week-range">${fmtWeekRange(monday)}</span>
    </div>
    <div class="week-meta">
      ${weekIdeas.length ? `<span class="meta-chip calls">${callCount}C</span><span class="meta-chip puts">${putCount}P</span>` : ''}
      <span class="meta-chip total">${totalIdeas} total</span>
    </div>
  </div>
  <div class="cards-grid">
    ${weekIdeas.map(renderCard).join('')}
    ${renderAddCard(monday)}
  </div>
</section>`;
  }).join('');
}

// ── Render weekly view ─────────────────────────────────────
function renderWeeklyView(monday, ideas) {
  const filtered = applyFilters(ideas).filter(i => i.weekOf === monday);
  const isCurrentWeek = monday === getMondayOf(todayStr());
  const callCount = filtered.filter(i => i.optionType === 'call').length;
  const putCount  = filtered.filter(i => i.optionType === 'put').length;

  const el = document.getElementById('main-content');
  el.innerHTML = `
<section class="week-section ${isCurrentWeek ? 'current-week' : ''}" style="margin-top:0">
  <div class="week-header">
    <div class="week-label">
      ${isCurrentWeek ? '<span class="current-badge">This Week</span>' : ''}
      <span class="week-range">${fmtWeekRange(monday)}</span>
    </div>
    <div class="week-meta">
      ${filtered.length ? `<span class="meta-chip calls">${callCount}C</span><span class="meta-chip puts">${putCount}P</span>` : ''}
      <span class="meta-chip total">${filtered.length} ideas</span>
    </div>
  </div>
  <div class="cards-grid weekly-grid">
    ${filtered.map(renderCard).join('')}
    ${renderAddCard(monday)}
  </div>
</section>`;
}

// ── Render daily view (one row per day of the week) ────────
function renderDailyView(monday, ideas) {
  const today    = todayStr();
  const filtered = applyFilters(ideas);
  const el       = document.getElementById('main-content');

  // Build all 7 days of the week Mon–Sun
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday + 'T12:00:00');
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  el.innerHTML = days.map(date => {
    const isToday   = date === today;
    const dayIdeas  = filtered.filter(i => (i.createdAt || today) === date);
    const callCount = dayIdeas.filter(i => i.optionType === 'call').length;
    const putCount  = dayIdeas.filter(i => i.optionType === 'put').length;
    const dayLabel  = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    return `
<section class="week-section daily-day-section ${isToday ? 'current-week' : ''}">
  <div class="week-header">
    <div class="week-label">
      ${isToday ? '<span class="current-badge">Today</span>' : ''}
      <span class="week-range">${dayLabel}</span>
    </div>
    <div class="week-meta">
      ${dayIdeas.length ? `<span class="meta-chip calls">${callCount}C</span><span class="meta-chip puts">${putCount}P</span>` : ''}
      <span class="meta-chip total">${dayIdeas.length} idea${dayIdeas.length !== 1 ? 's' : ''}</span>
    </div>
  </div>
  <div class="cards-grid">
    ${dayIdeas.map(renderCard).join('')}
    ${renderAddCard(monday)}
  </div>
</section>`;
  }).join('');
}
