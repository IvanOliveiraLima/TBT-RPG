// Tab navigation, mobile header updates, and HP bar management.

const TAB_PAGE_MAP = {
  status: 'page-1',
  combat: 'page-1',
  spells: 'page-3',
  inv:    'page-2',
  lore:   'page-4',
};

let activeTab = 'status';

function setTab(tabId) {
  if (!TAB_PAGE_MAP[tabId]) return;
  activeTab = tabId;

  document.querySelectorAll('#tab-bar .tab-item').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  const targetPageId = TAB_PAGE_MAP[tabId];
  document.querySelectorAll('.page').forEach(p => { p.style.display = 'none'; });
  const target = document.getElementById(targetPageId);
  if (target) target.style.display = '';

  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function updateMobileHeader() {
  const nameInput = document.querySelector('[name="char-name"]');
  const name = nameInput?.value || '';

  const nameEl = document.getElementById('mobile-char-name');
  const subEl  = document.getElementById('mobile-char-sub');

  if (nameEl) nameEl.textContent = name || 'Character';

  if (subEl) {
    const race      = document.querySelector('[name="race-class"]')?.value || '';
    const firstRow  = document.querySelector('#class-rows .class-row');
    const className = firstRow?.querySelector('[name="class-name"]')?.value || '';
    const level     = document.getElementById('total-level')?.value || '';
    const classPart = className && level ? `${className} ${level}` : className;
    const parts     = [race, classPart].filter(Boolean);
    subEl.textContent = parts.join(' · ');
  }
}

export function updateHpBar() {
  const current = parseFloat(document.querySelector('[name="current-health"]')?.value) || 0;
  const max     = parseFloat(document.querySelector('[name="max-health"]')?.value)     || 0;
  const temp    = parseFloat(document.querySelector('[name="temp-health"]')?.value)    || 0;

  const fill    = document.getElementById('hp-bar-fill');
  const tempBar = document.getElementById('hp-bar-temp');
  if (!fill) return;

  const pct     = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const tempPct = max > 0 ? Math.min(100 - pct, (temp / max) * 100)           : 0;

  fill.style.width = `${pct}%`;
  fill.classList.toggle('hp-low', pct > 0 && pct < 30);
  fill.classList.toggle('hp-mid', pct >= 30 && pct < 60);

  if (tempBar) {
    tempBar.style.left  = `${pct}%`;
    tempBar.style.width = `${tempPct}%`;
    tempBar.style.display = temp > 0 ? 'block' : 'none';
  }
}

export function getActiveTab() {
  return activeTab;
}

export function initTabNav() {
  const tabBar = document.getElementById('tab-bar');
  if (!tabBar) return;

  tabBar.addEventListener('click', e => {
    const btn = e.target.closest('.tab-item');
    if (btn?.dataset.tab) setTab(btn.dataset.tab);
  });

  // Set initial active tab without scrolling (already at top)
  setTab('status');

  // Mobile header: update on any char-info input change
  document.addEventListener('input', e => {
    if (
      e.target.matches('[name="char-name"]') ||
      e.target.matches('[name="race-class"]') ||
      e.target.closest('#class-rows') ||
      e.target.matches('#total-level')
    ) {
      updateMobileHeader();
    }

    if (e.target.matches('[name="current-health"], [name="max-health"], [name="temp-health"]')) {
      updateHpBar();
    }
  });

  // Re-render after remote sync applies
  document.addEventListener('remoteSyncApplied', () => {
    updateMobileHeader();
    updateHpBar();
  });
}
