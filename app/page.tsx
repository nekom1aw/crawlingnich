import LegacyPage from './_components/LegacyPage';

const styleText = String.raw`*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #eef5ff;
  --bg2: rgba(255,255,255,0.5);
  --bg3: rgba(255,255,255,0.78);
  --panel: rgba(255,255,255,0.44);
  --panel-strong: rgba(255,255,255,0.68);
  --panel-soft: rgba(255,255,255,0.28);
  --border: rgba(255,255,255,0.58);
  --border2: rgba(115,140,184,0.24);
  --shadow: 0 22px 60px rgba(96, 124, 172, 0.18);
  --shadow-soft: 0 10px 26px rgba(96, 124, 172, 0.12);
  --text: #17304f;
  --text2: #547090;
  --text3: #7d92ad;
  --accent: #0f6bff;
  --accent-soft: rgba(15,107,255,0.12);
  --accent2: #3c8cff;
  --green: #1fc38c;
  --font-head: 'Manrope', sans-serif;
  --font-body: 'Manrope', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
  --radius: 8px;
  --radius-lg: 8px;
}

html {
  background:
    radial-gradient(circle at top left, rgba(255,255,255,0.95), rgba(255,255,255,0) 34%),
    radial-gradient(circle at 82% 16%, rgba(143,204,255,0.38), rgba(143,204,255,0) 25%),
    radial-gradient(circle at 20% 86%, rgba(143,170,255,0.28), rgba(143,170,255,0) 32%),
    linear-gradient(180deg, #f7fbff 0%, #e8f1ff 45%, #dfeaff 100%);
}

body {
  font-family: var(--font-body);
  color: var(--text);
  min-height: 100vh;
  font-size: 14px;
  background: transparent;
  padding: 14px;
}

body::before,
body::after {
  content: '';
  position: fixed;
  inset: auto;
  pointer-events: none;
  z-index: 0;
  filter: blur(10px);
}

body::before {
  width: 260px;
  height: 260px;
  top: 78px;
  right: 7vw;
  background: radial-gradient(circle, rgba(98,163,255,0.28) 0%, rgba(98,163,255,0) 70%);
}

body::after {
  width: 320px;
  height: 320px;
  bottom: 6vh;
  left: 5vw;
  background: radial-gradient(circle, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0) 72%);
}

.shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: 1fr;
  height: calc(100vh - 64px - 34px - 28px);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.68);
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(255,255,255,0.44), rgba(255,255,255,0.2));
  box-shadow: var(--shadow);
  backdrop-filter: blur(26px) saturate(165%);
  -webkit-backdrop-filter: blur(26px) saturate(165%);
}

.shell::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.56), rgba(255,255,255,0) 42%),
    linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0));
  pointer-events: none;
}

@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
@keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }

#appHeader {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255,255,255,0.22);
  border-bottom: 1px solid rgba(255,255,255,0.52);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
}

.app-nav { height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 0 24px; }
.nav-left { display: flex; align-items: center; gap: 34px; min-width: 0; }
.nav-logo { display: flex; align-items: center; gap: 10px; color: var(--text); font-family: var(--font-head); font-size: 16px; font-weight: 800; white-space: nowrap; }
.logo-dot { width: 10px; height: 10px; border-radius: 999px; background: linear-gradient(180deg, #ffffff, #7bc2ff); box-shadow: 0 0 0 6px rgba(255,255,255,0.28); }
.nav-menu { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 6px; background: rgba(255,255,255,0.26); border: 1px solid rgba(255,255,255,0.56); border-radius: 999px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.5); }
.nav-link { height: 36px; min-width: 0; display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 0 16px; border: 1px solid transparent; border-radius: 999px; background: transparent; color: var(--text2); cursor: pointer; text-decoration: none; font-family: var(--font-mono); font-size: 11px; line-height: 1; transition: color 0.18s ease, background 0.18s ease, border-color 0.18s ease, transform 0.14s ease, box-shadow 0.18s ease; }
.nav-link i { font-size: 15px; }
.nav-link:hover { color: var(--text); background: rgba(255,255,255,0.5); border-color: rgba(255,255,255,0.62); transform: translateY(-1px); box-shadow: var(--shadow-soft); }
.nav-link.active { color: #fff; background: linear-gradient(180deg, rgba(76,147,255,0.98), rgba(38,107,239,0.96)); border-color: rgba(38,107,239,0.35); cursor: default; transform: none; box-shadow: 0 10px 24px rgba(35, 108, 235, 0.28); }
.nav-right { display: flex; align-items: center; gap: 12px; justify-content: flex-end; flex-shrink: 0; }
.badge-live { height: 30px; display: inline-flex; align-items: center; gap: 7px; padding: 0 12px; border: 1px solid rgba(255,255,255,0.6); border-radius: 999px; color: var(--text2); background: rgba(255,255,255,0.3); font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase; white-space: nowrap; }
.dot-pulse { width: 6px; height: 6px; border-radius: 999px; background: #2ecf9d; animation: pulse 1.5s infinite; box-shadow: 0 0 0 5px rgba(46,207,157,0.14); }
.nav-icon { color: var(--text3); font-size: 18px; }
.theme-toggle {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,0.62);
  border-radius: 999px;
  background: rgba(255,255,255,0.34);
  color: var(--text);
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.48), 0 8px 20px rgba(111, 139, 183, 0.08);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.theme-toggle:hover {
  transform: translateY(-1px);
  background: rgba(255,255,255,0.62);
}
.theme-toggle i { font-size: 18px; }

.main {
  position: relative;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 420px;
  overflow: hidden;
  transition: grid-template-columns 0.22s ease;
}

.main.is-sidebar-collapsed { grid-template-columns: 0 minmax(0, 1fr) 420px; }
.main.is-preview-collapsed { grid-template-columns: 320px minmax(0, 1fr) 0; }
.main.is-sidebar-collapsed.is-preview-collapsed { grid-template-columns: 0 minmax(0, 1fr) 0; }

.filter-sidebar,
.toolbar,
.stats-bar,
.preview-top,
.preview-note,
.regional-bar {
  background: rgba(255,255,255,0.14);
  backdrop-filter: blur(22px) saturate(160%);
  -webkit-backdrop-filter: blur(22px) saturate(160%);
}

.filter-sidebar {
  border-right: 1px solid rgba(255,255,255,0.46);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 20px 16px;
  gap: 22px;
  transition: opacity 0.2s ease, padding 0.2s ease, border-color 0.2s ease;
}

.main.is-sidebar-collapsed .filter-sidebar { opacity: 0; pointer-events: none; padding-left: 0; padding-right: 0; border-color: transparent; overflow: hidden; }
.filter-sidebar::-webkit-scrollbar { width: 4px; }
.filter-sidebar::-webkit-scrollbar-thumb { background: rgba(93,121,160,0.24); border-radius: 999px; }

.sidebar-handle {
  position: absolute;
  top: 50%;
  left: 320px;
  width: 24px;
  height: 92px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,0.54);
  border-left: 0;
  border-radius: 0 999px 999px 0;
  background: rgba(255,255,255,0.38);
  color: var(--text2);
  cursor: pointer;
  z-index: 20;
  transform: translateY(-50%);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: left 0.2s ease, color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.sidebar-handle:hover { color: var(--text); border-color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.6); }
.main.is-sidebar-collapsed .sidebar-handle { left: 0; }
.sidebar-handle i { transition: transform 0.2s ease; }
.main.is-sidebar-collapsed .sidebar-handle i { transform: rotate(180deg); }

.preview-handle {
  position: absolute;
  top: 50%;
  right: 420px;
  width: 24px;
  height: 92px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,0.54);
  border-right: 0;
  border-radius: 999px 0 0 999px;
  background: rgba(255,255,255,0.38);
  color: var(--text2);
  cursor: pointer;
  z-index: 20;
  transform: translateY(-50%);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: right 0.2s ease, color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.preview-handle:hover { color: var(--text); border-color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.6); }
.main.is-preview-collapsed .preview-handle { right: 0; }
.preview-handle i { transition: transform 0.2s ease; }
.main.is-preview-collapsed .preview-handle i { transform: rotate(180deg); }

.section-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: var(--text3); text-transform: uppercase; margin-bottom: 10px; }
.keyword-notice,
.between-box,
.date-summary,
.type-btn,
.tag,
.result-card,
.preview-blocked-card,
.page-btn,
.type-count,
.featured-badge,
.read-badge,
.badge-live,
.preview-link,
.card-open,
.preview-close,
.range-picker,
.input-wrap input,
.search-bar input,
.regional-input input {
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.46), 0 8px 20px rgba(111, 139, 183, 0.08);
}

.keyword-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255,255,255,0.58);
  border-radius: var(--radius);
  background: rgba(255,255,255,0.34);
  color: var(--text2);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.4;
}

.keyword-notice i { color: var(--accent); font-size: 14px; }
.keyword-group { display: flex; flex-direction: column; gap: 10px; }
.input-wrap { position: relative; }
.input-wrap .lbl { position: absolute; top: -8px; left: 12px; font-size: 10px; font-family: var(--font-mono); color: var(--accent); background: rgba(248,251,255,0.92); padding: 0 4px; z-index: 1; letter-spacing: 0.5px; }
.input-wrap input,
.search-bar input,
.regional-input input,
.range-picker {
  width: 100%;
  border: 1px solid rgba(255,255,255,0.58);
  border-radius: var(--radius);
  background: rgba(255,255,255,0.52);
  color: var(--text);
  outline: none;
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.input-wrap input { padding: 11px 13px 11px 36px; font-size: 13px; }
.search-bar input { padding: 11px 13px 11px 38px; font-size: 13px; }
.regional-input input { height: 40px; padding: 0 11px 0 34px; font-size: 12px; }
.range-picker { height: 46px; padding: 0 12px; font-size: 12px; font-family: var(--font-mono); cursor: pointer; }

.input-wrap input:focus,
.search-bar input:focus,
.regional-input input:focus,
.range-picker:focus,
.range-picker:hover {
  border-color: rgba(52,124,255,0.48);
  background: rgba(255,255,255,0.72);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.64), 0 0 0 4px rgba(15,107,255,0.08);
}

.input-wrap input::placeholder,
.search-bar input::placeholder { color: var(--text3); }
.input-icon,
.search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text3); font-size: 15px; pointer-events: none; }
.regional-input .input-icon { left: 10px; }

.tags-list { display: flex; flex-wrap: wrap; gap: 8px; min-height: 36px; }
.tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  font-size: 11px;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: 0.18s ease;
  border: 1px solid rgba(255,255,255,0.62);
  border-radius: 999px;
  background: rgba(255,255,255,0.38);
}

.tag-primary { color: var(--accent); }
.tag-secondary { color: var(--text2); }
.tag .remove { opacity: 0.5; font-size: 12px; }

.type-filter { display: flex; flex-direction: column; gap: 8px; }
.type-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(255,255,255,0.44);
  border-radius: var(--radius);
  background: rgba(255,255,255,0.24);
  color: var(--text2);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 13px;
  width: 100%;
  text-align: left;
  transition: 0.18s ease;
}

.type-btn.active {
  background: linear-gradient(180deg, rgba(255,255,255,0.82), rgba(221,236,255,0.76));
  border-color: rgba(110,145,196,0.24);
  color: var(--text);
}

.type-btn:hover:not(.active) {
  background: rgba(255,255,255,0.46);
  color: var(--text);
}

.type-count {
  margin-left: auto;
  font-size: 11px;
  font-family: var(--font-mono);
  background: rgba(255,255,255,0.56);
  padding: 3px 8px;
  border-radius: 999px;
}

.date-filter { display: flex; flex-direction: column; gap: 10px; }
.between-box {
  border: 1px solid rgba(255,255,255,0.56);
  border-radius: var(--radius);
  background: rgba(255,255,255,0.32);
  padding: 12px;
}

.between-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.between-label { display: flex; align-items: center; gap: 8px; color: var(--text); font-family: var(--font-mono); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
.between-clear { background: transparent; border: 0; color: var(--text3); cursor: pointer; font-size: 11px; font-family: var(--font-mono); padding: 0; transition: color 0.18s ease; }
.between-clear:hover { color: var(--accent); }
.between-inputs { display: block; }

.flatpickr-calendar {
  background: rgba(246,250,255,0.92);
  border: 1px solid rgba(255,255,255,0.74);
  border-radius: 14px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.flatpickr-calendar.arrowTop:before,
.flatpickr-calendar.arrowTop:after { display: none; }

.flatpickr-months .flatpickr-month,
.flatpickr-current-month,
.flatpickr-weekdays,
span.flatpickr-weekday,
.flatpickr-day,
.numInputWrapper span,
.flatpickr-monthDropdown-months,
.flatpickr-monthDropdown-month { color: var(--text); }

.flatpickr-monthDropdown-months,
.numInput.cur-year { background: rgba(255,255,255,0.68); }
.flatpickr-day { border-color: transparent; }
.flatpickr-day.today { border-color: rgba(15,107,255,0.4); color: var(--accent); }
.flatpickr-day.selected,
.flatpickr-day.startRange,
.flatpickr-day.endRange,
.flatpickr-day.today.selected,
.flatpickr-day.today.startRange,
.flatpickr-day.today.endRange {
  background: linear-gradient(180deg, #59a1ff, #2f76f2);
  color: #fff;
  border-color: transparent;
}

.flatpickr-day.inRange {
  background: rgba(77,150,255,0.14);
  border-color: rgba(77,150,255,0.14);
  color: var(--text);
  box-shadow: none;
}

.flatpickr-day:hover {
  background: rgba(255,255,255,0.7);
  border-color: rgba(255,255,255,0.6);
}

.date-summary {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text);
  background: rgba(255,255,255,0.38);
  border: 1px solid rgba(255,255,255,0.58);
  border-radius: var(--radius);
  padding: 12px 10px;
  text-align: center;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.btn-crawl,
.btn-cancel,
.btn-regional,
.card-open,
.preview-link,
.page-btn {
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.btn-crawl {
  width: 100%;
  padding: 13px 14px;
  border: 1px solid rgba(24,111,246,0.18);
  border-radius: var(--radius);
  background: linear-gradient(180deg, rgba(102,169,255,0.95), rgba(37,111,242,0.95));
  color: #fff;
  font-family: var(--font-head);
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  letter-spacing: 0.2px;
  box-shadow: 0 14px 26px rgba(38, 113, 241, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-crawl:hover { transform: translateY(-1px); }

.crawl-actions {
  display: grid;
  gap: 8px;
}

.btn-cancel {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid rgba(202, 57, 57, 0.24);
  border-radius: var(--radius);
  background: rgba(255,255,255,0.54);
  color: #9f2525;
  font-family: var(--font-head);
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  letter-spacing: 0.2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-cancel:hover {
  background: rgba(255, 231, 231, 0.86);
  transform: translateY(-1px);
}

.btn-cancel[hidden] {
  display: none;
}

.btn-regional {
  width: 100%;
  padding: 11px;
  background: rgba(255,255,255,0.42);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: var(--radius);
  color: var(--text);
  font-family: var(--font-head);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  letter-spacing: 0.2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-regional:hover { background: rgba(255,255,255,0.6); }

.content { display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.toolbar { display: flex; align-items: center; gap: 12px; padding: 18px 28px 14px; border-bottom: 1px solid rgba(255,255,255,0.42); }
.search-bar { flex: 1; position: relative; }

.regional-tags { grid-column: 1 / -1; min-height: 0; max-width: 440px; }
.regional-bar {
  display: grid;
  grid-template-columns: minmax(220px, 320px) auto minmax(240px, 1fr);
  gap: 10px;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.42);
}

.regional-bar[hidden] { display: none; }
.regional-bar .regional-tags { grid-column: auto; max-width: none; }

.stats-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 28px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.42);
  font-size: 12px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text2);
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.34);
  border: 1px solid rgba(255,255,255,0.54);
}

.stat-item strong { color: var(--text); font-family: var(--font-mono); font-size: 13px; }
.stat-dot { width: 6px; height: 6px; border-radius: 999px; background: linear-gradient(180deg, #8bc8ff, #337efe); }

.stats-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.btn-export {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 13px;
  border: 1px solid rgba(255,255,255,0.62);
  border-radius: var(--radius);
  background: rgba(255,255,255,0.5);
  color: var(--text);
  font-family: var(--font-head);
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.48), 0 8px 18px rgba(94, 124, 174, 0.08);
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease, opacity 0.18s ease;
}

.btn-export:hover:not(:disabled) {
  background: rgba(255,255,255,0.72);
  border-color: rgba(88,139,218,0.26);
  transform: translateY(-1px);
}

.btn-export:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.results {
  flex: 1;
  overflow-y: auto;
  padding: 18px 24px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.results::-webkit-scrollbar { width: 5px; }
.results::-webkit-scrollbar-thumb { background: rgba(93,121,160,0.22); border-radius: 999px; }

.result-card {
  background: rgba(255,255,255,0.36);
  border: 1px solid rgba(255,255,255,0.62);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  gap: 14px;
  transition: border-color 0.2s, transform 0.15s, background 0.18s ease;
  cursor: pointer;
  backdrop-filter: blur(18px) saturate(145%);
  -webkit-backdrop-filter: blur(18px) saturate(145%);
}

.result-card:hover { border-color: rgba(70,134,238,0.24); transform: translateY(-1px); background: rgba(255,255,255,0.5); }
.result-card.is-selected { border-color: rgba(73,136,243,0.4); background: rgba(255,255,255,0.68); }
.result-card.is-featured { border-color: rgba(88,151,255,0.42); box-shadow: inset 3px 0 0 #5b9cff, 0 14px 28px rgba(98, 124, 170, 0.1); }
.result-card.is-read { background: linear-gradient(90deg, rgba(74,227,167,0.16), rgba(255,255,255,0.5)); border-color: rgba(31,195,140,0.28); box-shadow: inset 3px 0 0 rgba(31,195,140,0.64), 0 14px 28px rgba(98, 124, 170, 0.1); }
.result-card.is-read .card-icon { border-color: rgba(31,195,140,0.24); color: #1db887; }

.card-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.62);
  border-radius: var(--radius);
  background: rgba(255,255,255,0.42);
}

.icon-news { color: var(--accent); }
.icon-journal { color: #4e6ea1; }
.icon-regional { color: #23b385; }

.card-body { flex: 1; min-width: 0; }
.card-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
.type-badge,
.featured-badge,
.read-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.3;
}

.type-badge { font-weight: 500; border: 1px solid rgba(255,255,255,0.62); background: rgba(255,255,255,0.44); }
.badge-news { color: var(--accent); }
.badge-journal { color: #48648f; }
.badge-regional { color: #23b385; border-color: rgba(35,179,133,0.24); }
.featured-badge { border: 1px solid rgba(91,156,255,0.22); background: rgba(91,156,255,0.12); color: #2d79f0; text-transform: uppercase; }
.read-badge { border: 1px solid rgba(31,195,140,0.26); background: rgba(31,195,140,0.12); color: #18a777; text-transform: uppercase; letter-spacing: 0.6px; }

.card-source,
.card-date,
.preview-meta,
.preview-keywords,
.preview-note { color: var(--text3); font-family: var(--font-mono); }
.card-source { font-size: 11px; }
.card-date { font-size: 11px; margin-left: auto; }
.card-title { font-size: 15px; font-weight: 700; line-height: 1.42; margin-bottom: 5px; color: var(--text); }
.card-snippet { font-size: 12px; color: var(--text2); line-height: 1.62; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-footer { display: flex; align-items: center; gap: 8px; margin-top: 12px; }

.card-open,
.preview-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(255,255,255,0.74);
  color: var(--text);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: 11px;
}

.card-open:hover,
.preview-link:hover,
.page-btn:hover:not(:disabled) { transform: translateY(-1px); background: rgba(255,255,255,0.88); }

.card-open.is-read { background: rgba(31,195,140,0.16); border-color: rgba(31,195,140,0.2); color: #128c65; }
.card-open.is-disabled { pointer-events: none; opacity: 0.35; }

.preview-panel {
  min-width: 0;
  background: rgba(255,255,255,0.16);
  border-left: 1px solid rgba(255,255,255,0.46);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: opacity 0.2s ease, border-color 0.2s ease;
}

.main.is-preview-collapsed .preview-panel {
  opacity: 0;
  pointer-events: none;
  border-color: transparent;
}

.preview-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 28px;
  text-align: center;
  color: var(--text3);
}

.preview-empty i { font-size: 42px; color: var(--accent2); }
.preview-empty strong { color: var(--text); font-family: var(--font-head); font-size: 18px; }
.preview-empty p { max-width: 270px; line-height: 1.6; font-size: 12px; }
.preview-content { height: 100%; min-height: 0; display: flex; flex-direction: column; }
.preview-content[hidden], .preview-empty[hidden] { display: none; }
.preview-top { padding: 18px; border-bottom: 1px solid rgba(255,255,255,0.44); display: flex; flex-direction: column; gap: 10px; }
.preview-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.preview-label { display: inline-flex; align-items: center; gap: 7px; color: var(--accent); font-family: var(--font-mono); font-size: 10px; letter-spacing: 1px; text-transform: uppercase; }

.preview-close {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255,255,255,0.62);
  border-radius: 999px;
  background: rgba(255,255,255,0.48);
  color: var(--text2);
  cursor: pointer;
}

.preview-close:hover { color: var(--text); background: rgba(255,255,255,0.74); }
.preview-title { font-family: var(--font-head); font-size: 20px; line-height: 1.28; font-weight: 800; }
.preview-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; }
.preview-keywords { font-size: 12px; line-height: 1.5; color: var(--text2); }

.preview-frame-wrap {
  flex: 1;
  min-height: 0;
  background: rgba(249,252,255,0.4);
  position: relative;
}

.preview-frame { width: 100%; height: 100%; border: 0; background: rgba(255,255,255,0.56); }
.preview-blocked { height: 100%; display: flex; align-items: center; justify-content: center; padding: 24px; text-align: center; background: rgba(255,255,255,0.2); }
.preview-blocked[hidden] { display: none; }

.preview-blocked-card {
  max-width: 310px;
  border: 1px solid rgba(255,255,255,0.62);
  border-radius: var(--radius);
  background: rgba(255,255,255,0.5);
  padding: 18px;
  color: var(--text2);
  font-size: 12px;
  line-height: 1.6;
}

.preview-blocked-card strong { display: block; color: var(--text); font-family: var(--font-head); font-size: 16px; margin-bottom: 8px; }
.preview-note { padding: 10px 16px; border-top: 1px solid rgba(255,255,255,0.42); font-size: 11px; line-height: 1.5; }

.skeleton-card { pointer-events: none; }
.skeleton-icon,
.skeleton-pill,
.skeleton-line,
.skeleton-button {
  background: linear-gradient(90deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.62) 50%, rgba(255,255,255,0.18) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.3s linear infinite;
  border-radius: var(--radius);
}

.skeleton-icon { width: 42px; height: 42px; border: 1px solid rgba(255,255,255,0.62); flex-shrink: 0; }
.skeleton-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.skeleton-pill { width: 58px; height: 18px; border: 1px solid rgba(255,255,255,0.62); }
.skeleton-source { width: 86px; height: 12px; }
.skeleton-date { width: 74px; height: 12px; margin-left: auto; }
.skeleton-line { height: 12px; margin-bottom: 8px; }
.skeleton-line.lg { width: 84%; height: 14px; }
.skeleton-line.md { width: 96%; }
.skeleton-line.sm { width: 70%; margin-bottom: 0; }
.skeleton-footer { display: flex; justify-content: flex-end; margin-top: 12px; }
.skeleton-button { width: 72px; height: 24px; border: 1px solid rgba(255,255,255,0.62); }

.empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--text3); padding: 60px 0; }
.empty i { font-size: 48px; color: var(--accent2); }

.pagination { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 28px 18px; border-top: 1px solid rgba(255,255,255,0.42); flex-wrap: wrap; }
.page-btn {
  padding: 7px 12px;
  background: rgba(255,255,255,0.48);
  border: 1px solid rgba(255,255,255,0.62);
  border-radius: 999px;
  color: var(--text2);
  font-size: 12px;
  cursor: pointer;
  font-family: var(--font-mono);
}

.page-btn.active { background: linear-gradient(180deg, rgba(98,163,255,0.98), rgba(49,119,246,0.96)); border-color: rgba(49,119,246,0.3); color: #fff; }
.page-btn:disabled { opacity: 0.34; cursor: not-allowed; }

.type-btn[data-type="regional"],
.type-count,
.stat-item:has(#regionalCount) {
  display: none;
}

html[data-theme="dark"] {
  background:
    radial-gradient(circle at top left, rgba(93,141,214,0.22), rgba(93,141,214,0) 34%),
    radial-gradient(circle at 82% 16%, rgba(77,136,255,0.2), rgba(77,136,255,0) 28%),
    radial-gradient(circle at 20% 86%, rgba(46,207,157,0.14), rgba(46,207,157,0) 32%),
    linear-gradient(180deg, #0d1524 0%, #101827 48%, #111827 100%);
  color-scheme: dark;
}

html[data-theme="dark"] {
  --bg: #0d1524;
  --bg2: rgba(18,28,45,0.58);
  --bg3: rgba(28,42,64,0.78);
  --panel: rgba(22,32,50,0.58);
  --panel-strong: rgba(31,45,68,0.72);
  --panel-soft: rgba(255,255,255,0.08);
  --border: rgba(255,255,255,0.16);
  --border2: rgba(179,204,255,0.16);
  --shadow: 0 22px 70px rgba(0,0,0,0.34);
  --shadow-soft: 0 10px 26px rgba(0,0,0,0.22);
  --text: #eef5ff;
  --text2: #a9b8cf;
  --text3: #76879f;
  --accent: #82b7ff;
  --accent-soft: rgba(130,183,255,0.16);
  --accent2: #9fc8ff;
  --green: #3addaa;
}

html[data-theme="dark"] body::before {
  background: radial-gradient(circle, rgba(78,141,255,0.18) 0%, rgba(78,141,255,0) 70%);
}

html[data-theme="dark"] body::after {
  background: radial-gradient(circle, rgba(46,207,157,0.11) 0%, rgba(46,207,157,0) 72%);
}

html[data-theme="dark"] .shell {
  border-color: rgba(255,255,255,0.14);
  background: linear-gradient(180deg, rgba(28,39,61,0.56), rgba(15,24,39,0.62));
}

html[data-theme="dark"] .shell::before {
  background:
    linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 42%),
    linear-gradient(180deg, rgba(96,154,255,0.08), rgba(255,255,255,0));
}

html[data-theme="dark"] #appHeader,
html[data-theme="dark"] .filter-sidebar,
html[data-theme="dark"] .toolbar,
html[data-theme="dark"] .stats-bar,
html[data-theme="dark"] .preview-top,
html[data-theme="dark"] .preview-note,
html[data-theme="dark"] .regional-bar {
  background: rgba(14,22,36,0.48);
  border-color: rgba(255,255,255,0.12);
}

html[data-theme="dark"] .nav-menu,
html[data-theme="dark"] .theme-toggle,
html[data-theme="dark"] .badge-live,
html[data-theme="dark"] .keyword-notice,
html[data-theme="dark"] .between-box,
html[data-theme="dark"] .date-summary,
html[data-theme="dark"] .type-btn,
html[data-theme="dark"] .tag,
html[data-theme="dark"] .result-card,
html[data-theme="dark"] .stat-item,
html[data-theme="dark"] .preview-blocked-card,
html[data-theme="dark"] .page-btn,
html[data-theme="dark"] .type-count,
html[data-theme="dark"] .type-badge,
html[data-theme="dark"] .card-icon,
html[data-theme="dark"] .card-open,
html[data-theme="dark"] .preview-link,
html[data-theme="dark"] .btn-cancel,
html[data-theme="dark"] .btn-export,
html[data-theme="dark"] .preview-close,
html[data-theme="dark"] .preview-handle,
html[data-theme="dark"] .range-picker,
html[data-theme="dark"] .input-wrap input,
html[data-theme="dark"] .search-bar input,
html[data-theme="dark"] .regional-input input {
  background: rgba(26,39,60,0.54);
  border-color: rgba(255,255,255,0.14);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 24px rgba(0,0,0,0.16);
}

html[data-theme="dark"] .theme-toggle:hover,
html[data-theme="dark"] .nav-link:hover,
html[data-theme="dark"] .type-btn:hover:not(.active),
html[data-theme="dark"] .card-open:hover,
html[data-theme="dark"] .preview-link:hover,
html[data-theme="dark"] .btn-export:hover:not(:disabled),
html[data-theme="dark"] .page-btn:hover:not(:disabled) {
  background: rgba(43,61,90,0.74);
}

html[data-theme="dark"] .nav-link.active,
html[data-theme="dark"] .btn-crawl,
html[data-theme="dark"] .page-btn.active {
  background: linear-gradient(180deg, rgba(92,151,255,0.98), rgba(40,103,226,0.96));
  color: #fff;
}

html[data-theme="dark"] .btn-cancel {
  color: #ffb8b8;
}

html[data-theme="dark"] .type-btn.active,
html[data-theme="dark"] .result-card.is-selected {
  background: rgba(38,58,88,0.78);
  border-color: rgba(130,183,255,0.32);
}

html[data-theme="dark"] .result-card:hover {
  background: rgba(32,49,74,0.72);
  border-color: rgba(130,183,255,0.28);
}

html[data-theme="dark"] .result-card.is-read {
  background: linear-gradient(90deg, rgba(35,179,133,0.2), rgba(24,38,58,0.64));
}

html[data-theme="dark"] .preview-panel,
html[data-theme="dark"] .preview-frame-wrap,
html[data-theme="dark"] .preview-blocked {
  background: rgba(14,22,36,0.34);
  border-color: rgba(255,255,255,0.12);
}

html[data-theme="dark"] .preview-frame {
  background: rgba(12,18,29,0.72);
}

html[data-theme="dark"] .flatpickr-calendar {
  background: rgba(20,31,48,0.94);
  border-color: rgba(255,255,255,0.16);
}

html[data-theme="dark"] .flatpickr-monthDropdown-months,
html[data-theme="dark"] .numInput.cur-year {
  background: rgba(27,41,62,0.95);
}

@media (max-width: 1024px) {
  body { padding: 10px; }
  .shell { height: calc(100vh - 64px - 34px - 20px); border-radius: 24px; }
  .main { grid-template-columns: 1fr; }
  .main.is-sidebar-collapsed { grid-template-columns: 1fr; }
  .main.is-preview-collapsed,
  .main.is-sidebar-collapsed.is-preview-collapsed { grid-template-columns: 1fr; }
  .filter-sidebar { max-height: 50vh; }
  .regional-bar { grid-template-columns: 1fr; padding: 10px 14px; }
  .regional-tags { max-width: none; }
  .preview-panel,
  .preview-handle { display: none; }
  .sidebar-handle {
    top: 12px;
    left: auto;
    right: 12px;
    width: 34px;
    height: 34px;
    border-left: 1px solid rgba(255,255,255,0.62);
    border-radius: 999px;
    transform: none;
  }
  .main.is-sidebar-collapsed .sidebar-handle { left: auto; right: 12px; }
}

@media (max-width: 720px) {
  .shell { grid-template-rows: 1fr; border-radius: 20px; }
  .app-nav { justify-content: space-between; padding: 0 12px; gap: 10px; height: 58px; }
  .nav-left { gap: 14px; }
  .nav-logo { font-size: 14px; }
  .nav-menu { gap: 6px; padding: 4px; }
  .nav-link { width: 34px; padding: 0; }
  .nav-link span,
  .badge-live { display: none; }
  .toolbar,
  .stats-bar,
  .results,
  .pagination { padding-left: 14px; padding-right: 14px; }
  .stats-bar { gap: 8px; }
  .stat-item { width: calc(50% - 4px); justify-content: center; }
  .stats-actions { width: 100%; margin-left: 0; }
  .btn-export { width: 100%; }
  .date-summary { white-space: normal; }
}`;

const monochromeCrawlingTheme = String.raw`
:root {
  --bg: #f4f4f1;
  --bg2: rgba(255,255,255,0.52);
  --bg3: rgba(255,255,255,0.78);
  --panel: rgba(255,255,255,0.44);
  --panel-strong: rgba(255,255,255,0.62);
  --panel-soft: rgba(255,255,255,0.18);
  --border: rgba(0,0,0,0.13);
  --border2: rgba(0,0,0,0.2);
  --shadow: 0 24px 80px rgba(0,0,0,0.11);
  --shadow-soft: 0 12px 36px rgba(0,0,0,0.08);
  --text: #111111;
  --text2: #4d4d4d;
  --text3: #777777;
  --accent: #111111;
  --accent-soft: rgba(0,0,0,0.08);
  --accent2: #111111;
  --green: #111111;
  color-scheme: light;
}

*, *::before, *::after,
.shell,
#appHeader,
.app-nav,
.nav-menu,
.nav-link,
.logo-dot,
.badge-live,
.dot-pulse,
.theme-toggle,
.filter-sidebar,
.toolbar,
.stats-bar,
.preview-panel,
.preview-top,
.preview-note,
.regional-bar,
.keyword-notice,
.input-wrap input,
.search-bar input,
.regional-input input,
.type-btn,
.tag,
.between-box,
.range-picker,
.date-summary,
.btn-crawl,
.btn-cancel,
.btn-export,
.stat-item,
.result-card,
.card-icon,
.type-badge,
.featured-badge,
.read-badge,
.card-open,
.preview-link,
.preview-close,
.preview-handle,
.sidebar-handle,
.preview-blocked-card,
.page-btn,
.flatpickr-calendar {
  border-radius: 0 !important;
}

html {
  background:
    linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px),
    linear-gradient(180deg, #fafafa 0%, #f0f0ec 100%);
  background-size: 32px 32px, 32px 32px, auto;
}

body {
  padding: 0;
  background: transparent;
}

body::before,
body::after,
.shell::before {
  display: none;
}

.shell {
  width: 100vw;
  height: 100vh;
  border: 1px solid rgba(0,0,0,0.14);
  background: rgba(255,255,255,0.44);
  box-shadow: var(--shadow);
  backdrop-filter: blur(22px) saturate(112%);
  -webkit-backdrop-filter: blur(22px) saturate(112%);
}

#appHeader,
.filter-sidebar,
.toolbar,
.stats-bar,
.preview-top,
.preview-note,
.regional-bar {
  background: rgba(255,255,255,0.48);
  border-color: rgba(0,0,0,0.12);
  backdrop-filter: blur(18px) saturate(110%);
  -webkit-backdrop-filter: blur(18px) saturate(110%);
}

.logo-dot,
.dot-pulse {
  background: #111;
  box-shadow: none;
}

.nav-menu {
  gap: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.nav-link,
.theme-toggle,
.badge-live,
.keyword-notice,
.between-box,
.date-summary,
.type-btn,
.tag,
.result-card,
.stat-item,
.preview-blocked-card,
.page-btn,
.type-badge,
.card-icon,
.card-open,
.preview-link,
.btn-cancel,
.btn-export,
.preview-close,
.preview-handle,
.sidebar-handle,
.range-picker,
.input-wrap input,
.search-bar input,
.regional-input input {
  background: rgba(255,255,255,0.46);
  border: 1px solid rgba(0,0,0,0.14);
  box-shadow: none;
}

.nav-link {
  color: var(--text2);
}

.nav-link:hover,
.theme-toggle:hover,
.type-btn:hover:not(.active),
.card-open:hover,
.preview-link:hover,
.btn-export:hover:not(:disabled),
.page-btn:hover:not(:disabled),
.result-card:hover {
  background: rgba(255,255,255,0.72);
  border-color: rgba(0,0,0,0.28);
  box-shadow: none;
}

.nav-link.active,
.btn-crawl,
.page-btn.active,
.type-btn.active {
  background: #111;
  border-color: #111;
  color: #fff;
  box-shadow: none;
}

.btn-crawl:hover {
  background: #000;
}

.result-card.is-selected {
  background: rgba(255,255,255,0.64);
  border-color: rgba(0,0,0,0.36);
}

.result-card.is-featured,
.result-card.is-read {
  border-color: rgba(0,0,0,0.24);
  box-shadow: inset 3px 0 0 #111;
}

.featured-badge,
.read-badge {
  background: #111;
  border-color: #111;
  color: #fff;
}

.card-open,
.preview-link {
  color: #111;
}

.results::-webkit-scrollbar-thumb,
.filter-sidebar::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.2);
}

html[data-theme="dark"] {
  --bg: #050505;
  --bg2: rgba(12,12,12,0.62);
  --bg3: rgba(20,20,20,0.72);
  --panel: rgba(14,14,14,0.58);
  --panel-strong: rgba(28,28,28,0.72);
  --panel-soft: rgba(255,255,255,0.06);
  --border: rgba(255,255,255,0.14);
  --border2: rgba(255,255,255,0.22);
  --shadow: 0 24px 80px rgba(0,0,0,0.42);
  --shadow-soft: 0 12px 36px rgba(0,0,0,0.28);
  --text: #f4f4f4;
  --text2: #b5b5b5;
  --text3: #7c7c7c;
  --accent: #f4f4f4;
  --accent-soft: rgba(255,255,255,0.1);
  --accent2: #f4f4f4;
  --green: #f4f4f4;
  background:
    linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px),
    linear-gradient(180deg, #050505 0%, #101010 100%);
  background-size: 32px 32px, 32px 32px, auto;
}

html[data-theme="dark"] .shell,
html[data-theme="dark"] #appHeader,
html[data-theme="dark"] .filter-sidebar,
html[data-theme="dark"] .toolbar,
html[data-theme="dark"] .stats-bar,
html[data-theme="dark"] .preview-top,
html[data-theme="dark"] .preview-note,
html[data-theme="dark"] .regional-bar {
  background: rgba(10,10,10,0.58);
  border-color: rgba(255,255,255,0.12);
}

html[data-theme="dark"] .nav-menu {
  background: transparent;
  border: 0;
}

html[data-theme="dark"] .nav-link,
html[data-theme="dark"] .theme-toggle,
html[data-theme="dark"] .badge-live,
html[data-theme="dark"] .keyword-notice,
html[data-theme="dark"] .between-box,
html[data-theme="dark"] .date-summary,
html[data-theme="dark"] .type-btn,
html[data-theme="dark"] .tag,
html[data-theme="dark"] .result-card,
html[data-theme="dark"] .stat-item,
html[data-theme="dark"] .preview-blocked-card,
html[data-theme="dark"] .page-btn,
html[data-theme="dark"] .type-badge,
html[data-theme="dark"] .card-icon,
html[data-theme="dark"] .card-open,
html[data-theme="dark"] .preview-link,
html[data-theme="dark"] .btn-cancel,
html[data-theme="dark"] .btn-export,
html[data-theme="dark"] .preview-close,
html[data-theme="dark"] .preview-handle,
html[data-theme="dark"] .sidebar-handle,
html[data-theme="dark"] .range-picker,
html[data-theme="dark"] .input-wrap input,
html[data-theme="dark"] .search-bar input,
html[data-theme="dark"] .regional-input input {
  background: rgba(18,18,18,0.58);
  border-color: rgba(255,255,255,0.14);
  box-shadow: none;
}

html[data-theme="dark"] .card-open,
html[data-theme="dark"] .preview-link {
  background: #fff;
  border-color: #fff;
  color: #000;
}

html[data-theme="dark"] .card-open:hover,
html[data-theme="dark"] .preview-link:hover {
  background: #f4f4f4;
  border-color: #f4f4f4;
  color: #000;
}

html[data-theme="dark"] .logo-dot,
html[data-theme="dark"] .dot-pulse {
  background: #fff;
}

html[data-theme="dark"] .nav-link.active,
html[data-theme="dark"] .btn-crawl,
html[data-theme="dark"] .page-btn.active,
html[data-theme="dark"] .type-btn.active,
html[data-theme="dark"] .featured-badge,
html[data-theme="dark"] .read-badge {
  background: #fff;
  border-color: #fff;
  color: #000;
}

html[data-theme="dark"] .nav-link:hover,
html[data-theme="dark"] .theme-toggle:hover,
html[data-theme="dark"] .type-btn:hover:not(.active),
html[data-theme="dark"] .card-open:hover,
html[data-theme="dark"] .preview-link:hover,
html[data-theme="dark"] .btn-export:hover:not(:disabled),
html[data-theme="dark"] .page-btn:hover:not(:disabled),
html[data-theme="dark"] .result-card:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.28);
}

@media (max-width: 1024px) {
  body { padding: 0; }
  .shell { height: calc(100vh - 64px - 34px); }
  .sidebar-handle { border-radius: 0; }
}

@media (max-width: 720px) {
  .shell { border-radius: 0; }
  .nav-menu { padding: 0; }
}
`;
const bodyContent = (
  <div className="shell">
    <div className="main is-preview-collapsed">
      <button className="sidebar-handle" id="sidebarHandle" type="button" aria-label="Buka tutup panel kiri">
        <i className="ti ti-chevron-left" />
      </button>
      <aside className="filter-sidebar">
        <div>
          <div className="keyword-notice"><i className="ti ti-corner-down-left" /> klik enter untuk memasukan keyword</div>
          <div className="section-label">Primary Keyword</div>
          <div className="keyword-group">
            <div className="input-wrap primary-tag">
              <i className="ti ti-key input-icon" />
              <input type="text" id="primaryInput" placeholder="masukkan kata kunci utama..." />
            </div>
            <div className="tags-list" id="primaryTags" />
          </div>
        </div>

        <div>
          <div className="section-label">Secondary Keyword</div>
          <div className="keyword-group">
            <div className="input-wrap secondary-tag">
              <i className="ti ti-tag input-icon" />
              <input type="text" id="secondaryInput" placeholder="tambah kata kunci pendukung..." />
            </div>
            <div className="tags-list" id="secondaryTags" />
          </div>
        </div>

        <div>
          <div className="section-label">Tipe Konten</div>
          <div className="type-filter">
            <button className="type-btn active" data-type="all"><i className="ti ti-world" /> Semua <span className="type-count" id="cnt-all">0</span></button>
            <button className="type-btn" data-type="news"><i className="ti ti-news" /> Berita <span className="type-count" id="cnt-berita">0</span></button>
            <button className="type-btn" data-type="journal"><i className="ti ti-book" /> Jurnal <span className="type-count" id="cnt-jurnal">0</span></button>
            <button className="type-btn" data-type="regional"><i className="ti ti-map-pin" /> Isu Daerah <span className="type-count" id="cnt-regional">0</span></button>
          </div>
        </div>

        <div>
          <div className="section-label">Filter Tanggal</div>
          <div className="date-filter">
            <div className="between-box">
              <div className="between-head">
                <div className="between-label"><i className="ti ti-calendar-stats" /> Between</div>
                <button className="between-clear" id="clearDateBtn" type="button">clear</button>
              </div>
              <div className="between-inputs">
                <input className="range-picker" type="text" id="rangePicker" readOnly placeholder="Pilih rentang tanggal" />
                <input type="hidden" id="fromDate" />
                <input type="hidden" id="toDate" />
              </div>
            </div>
            <div className="date-summary" id="dateSummary">- pilih rentang tanggal -</div>
          </div>
        </div>

        <div className="crawl-actions">
          <button className="btn-crawl" id="crawlBtn" type="button"><i className="ti ti-radar" style={{ fontSize: 16 }} /> Mulai Crawling</button>
          <button className="btn-cancel" id="cancelCrawlBtn" type="button" hidden><i className="ti ti-circle-x" style={{ fontSize: 16 }} /> Cancel Crawling</button>
        </div>
      </aside>

      <div className="content">
        <div className="toolbar">
          <div className="search-bar">
            <i className="ti ti-search search-icon" />
            <input type="text" placeholder="Cari dalam hasil crawling..." id="searchInResults" />
          </div>
        </div>

        <div className="stats-bar">
          <div className="stat-item"><div className="stat-dot" /><strong id="totalCount">0</strong> total hasil</div>
          <div className="stat-item"><div className="stat-dot" /><strong id="newsCount">0</strong> berita</div>
          <div className="stat-item"><div className="stat-dot" /><strong id="journalCount">0</strong> jurnal</div>
          <div className="stat-item"><div className="stat-dot" /><strong id="regionalCount">0</strong> isu daerah</div>
          <div className="stats-actions">
            <button className="btn-export" id="exportCsvBtn" type="button" disabled><i className="ti ti-download" /> Download CSV Temuan</button>
          </div>
        </div>

        <div className="results" id="resultsList" />
        <div className="pagination" id="pagination" />
      </div>

      <section className="preview-panel" id="previewPanel" aria-label="Preview berita">
        <div className="preview-empty" id="previewEmpty">
          <i className="ti ti-news" />
          <strong>Preview Berita</strong>
          <p>Klik area kartu berita di tengah untuk melihat preview di panel kanan. Tombol &quot;Buka berita&quot; tetap membuka tab baru.</p>
        </div>

        <div className="preview-content" id="previewContent" hidden>
          <div className="preview-top">
            <div className="preview-head">
              <div className="preview-label"><i className="ti ti-layout-sidebar-right" /> Preview</div>
              <button className="preview-close" id="closePreviewBtn" type="button" aria-label="Tutup preview">
                <i className="ti ti-x" />
              </button>
            </div>
            <h2 className="preview-title" id="previewTitle">-</h2>
            <div className="preview-meta">
              <span id="previewType">-</span>
              <span id="previewSource">-</span>
              <span id="previewDate">-</span>
            </div>
            <div className="preview-keywords" id="previewKeywords" />
            <a className="preview-link" id="previewOpenLink" href="#" target="_blank" rel="noopener noreferrer">
              <i className="ti ti-external-link" /> Buka berita asli
            </a>
          </div>
          <div className="preview-frame-wrap">
            <iframe className="preview-frame" id="previewFrame" title="Preview halaman berita" referrerPolicy="no-referrer" sandbox="allow-forms allow-popups allow-scripts allow-same-origin" />
            <div className="preview-blocked" id="previewBlocked" hidden>
              <div className="preview-blocked-card">
                <strong id="previewBlockedTitle">Preview belum tersedia</strong>
                <span id="previewBlockedText">Link berita kosong atau tidak bisa dibaca. Gunakan tombol &quot;Buka berita asli&quot;.</span>
              </div>
            </div>
          </div>
          <div className="preview-note">
            Preview memakai server lokal/API untuk membaca artikel. Kalau sumbernya terlalu ketat, gunakan tombol &quot;Buka berita asli&quot;.
          </div>
        </div>
      </section>
    </div>
  </div>
);
const scriptText = "let DATA = [];\nlet activeType = 'all';\nlet currentPage = 1;\nlet isLoading = false;\nlet rangePicker = null;\nlet selectedPreviewIndex = null;\nlet activeCrawlController = null;\nconst resolvedLinkCache = new Map();\nconst PER_PAGE = 10;\nconst READ_LINKS_KEY = 'crawling-read-links';\nconst MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];\n\nfunction getTags(listId) {\n  return [...document.querySelectorAll(`#${listId} .tag`)].map(t => t.dataset.value).filter(Boolean);\n}\n\nfunction parseDateInput(inputId, endOfDay = false) {\n  const value = document.getElementById(inputId).value;\n  if (!value) return null;\n  const [year, month, day] = value.split('-').map(Number);\n  if (!year || !month || !day) return null;\n  return endOfDay ? new Date(year, month - 1, day, 23, 59, 59, 999) : new Date(year, month - 1, day, 0, 0, 0, 0);\n}\n\nfunction getFiltered() {\n  const q = document.getElementById('searchInResults').value.toLowerCase();\n  const fromDate = parseDateInput('fromDate');\n  const toDate = parseDateInput('toDate', true);\n\n  return prioritizeClientResults(DATA.filter(d => {\n    const matchType = activeType === 'all' || d.type === activeType;\n    const matchQ = !q || (d.title || '').toLowerCase().includes(q);\n\n    const itemDate = d.date ? new Date(d.date) : null;\n    const validDate = itemDate && !Number.isNaN(itemDate.getTime());\n\n    if (fromDate || toDate) {\n      if (!validDate) return matchType && matchQ;\n      if (fromDate && itemDate < fromDate) return false;\n      if (toDate && itemDate > toDate) return false;\n    }\n\n    return matchType && matchQ;\n  }));\n}\n\nfunction formatDateID(dateStr) {\n  if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return 'Tanggal tidak tersedia';\n  const d = new Date(dateStr);\n  if (Number.isNaN(d.getTime()) || d.getFullYear() <= 1970) return 'Tanggal tidak tersedia';\n  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });\n}\n\nfunction isFeaturedResult(item = {}) {\n  return Boolean(item.isFeatured || /betahita/i.test(`${item.source || ''} ${item.link || ''}`));\n}\n\nfunction resultTime(item = {}) {\n  if (!item.date) return 0;\n  const time = new Date(item.date).getTime();\n  return Number.isNaN(time) ? 0 : time;\n}\n\nfunction prioritizeClientResults(items = []) {\n  return items\n    .map((item, index) => ({ item, index }))\n    .sort((a, b) => {\n      const aFeatured = isFeaturedResult(a.item);\n      const bFeatured = isFeaturedResult(b.item);\n      if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;\n\n      const dateDiff = resultTime(b.item) - resultTime(a.item);\n      if (dateDiff) return dateDiff;\n\n      return a.index - b.index;\n    })\n    .map(entry => entry.item);\n}\n\nfunction escapeHtml(value = '') {\n  return String(value)\n    .replace(/&/g, '&amp;')\n    .replace(/</g, '&lt;')\n    .replace(/>/g, '&gt;')\n    .replace(/\"/g, '&quot;')\n    .replace(/'/g, '&#39;');\n}\n\nfunction safeLink(link) {\n  try {\n    const url = new URL(String(link || '').trim());\n    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';\n  } catch {\n    return '';\n  }\n}\n\nfunction getItemLink(item = {}) {\n  return safeLink(item.resolvedLink || item.finalUrl || item.link);\n}\n\nfunction isGoogleNewsLink(link = '') {\n  try {\n    return /(^|\\.)news\\.google\\.com$/i.test(new URL(link).hostname);\n  } catch {\n    return false;\n  }\n}\n\nasync function resolveSourceLink(item = {}, index = null) {\n  const currentLink = getItemLink(item);\n  if (!currentLink || !isGoogleNewsLink(currentLink)) return currentLink;\n  if (resolvedLinkCache.has(currentLink)) return resolvedLinkCache.get(currentLink);\n\n  const response = await fetch('/api/resolve-url', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({\n      url: currentLink,\n      title: item.title || '',\n      source: item.source || '',\n    }),\n  });\n  const data = await response.json().catch(() => ({}));\n  if (!response.ok) throw new Error(data.error || 'Gagal membuka sumber asli');\n\n  const finalLink = safeLink(data.finalUrl);\n  if (!finalLink) throw new Error('URL sumber asli tidak valid');\n  resolvedLinkCache.set(currentLink, finalLink);\n  item.resolvedLink = finalLink;\n  if (Number.isInteger(index) && DATA[index]) DATA[index].resolvedLink = finalLink;\n  return finalLink;\n}\n\nfunction getPreviewUrl(link) {\n  return link ? `/api/preview?url=${encodeURIComponent(link)}` : 'about:blank';\n}\n\nfunction getReadLinks() {\n  try {\n    const links = JSON.parse(localStorage.getItem(READ_LINKS_KEY) || '[]');\n    return Array.isArray(links) ? links : [];\n  } catch {\n    return [];\n  }\n}\n\nfunction hasReadLink(link) {\n  return getReadLinks().includes(link);\n}\n\nfunction markReadLink(link) {\n  if (!link) return;\n  const links = new Set(getReadLinks());\n  links.add(link);\n  localStorage.setItem(READ_LINKS_KEY, JSON.stringify([...links].slice(-500)));\n}\n\n\nfunction cleanCsvValue(value = '') {\n  return String(value || '').replace(/\\s+/g, ' ').trim();\n}\n\nfunction csvCell(value = '') {\n  const text = cleanCsvValue(value);\n  return '\"' + text.replace(/\"/g, '\"\"') + '\"';\n}\n\nfunction firstSentence(text = '') {\n  return cleanCsvValue(text).split(/(?<=[.!?])\\s+/)[0] || '';\n}\n\nfunction sentenceWith(text = '', patterns = []) {\n  const sentences = cleanCsvValue(text).split(/(?<=[.!?])\\s+|\\s+-\\s+|\\s+\\|\\s+/).filter(Boolean);\n  return sentences.find(sentence => patterns.some(pattern => pattern.test(sentence))) || '';\n}\n\nfunction detectWhere(item = {}) {\n  if (item.region) return item.region;\n  const text = cleanCsvValue((item.title || '') + ' ' + (item.snippet || ''));\n  const match = text.match(/\\b(?:di|dari|ke)\\s+([A-Z][A-Za-zÀ-ÿ.'-]*(?:\\s+[A-Z][A-Za-zÀ-ÿ.'-]*){0,4})/);\n  return match ? match[1] : '';\n}\n\nfunction detectWho(item = {}) {\n  const text = cleanCsvValue(item.title || item.snippet || '');\n  const match = text.match(/\\b([A-Z][A-Za-zÀ-ÿ.'-]*(?:\\s+[A-Z][A-Za-zÀ-ÿ.'-]*){1,4})\\b/);\n  if (match) return match[1];\n  return item.source || '';\n}\n\nfunction buildFiveWOneH(item = {}) {\n  const title = cleanCsvValue(item.title || '-');\n  const snippet = cleanCsvValue(item.snippet || '');\n  const context = title + '. ' + snippet;\n  const why = sentenceWith(context, [/\\bkarena\\b/i, /\\bakibat\\b/i, /\\bsebab\\b/i, /\\bdampak\\b/i, /\\btujuan\\b/i, /\\bterkait\\b/i, /\\bdipicu\\b/i]);\n  const how = sentenceWith(context, [/\\bdengan\\b/i, /\\bmelalui\\b/i, /\\bcara\\b/i, /\\bupaya\\b/i, /\\bproses\\b/i, /\\bmodus\\b/i, /\\bkronologi\\b/i]);\n\n  return {\n    apa: title,\n    siapa: detectWho(item),\n    kapan: formatDateID(item.date),\n    diMana: detectWhere(item),\n    mengapa: why,\n    bagaimana: how || firstSentence(snippet),\n  };\n}\n\nfunction setExportState(running, text = '') {\n  const btn = document.getElementById('exportCsvBtn');\n  if (!btn) return;\n  btn.disabled = running || !getFiltered().length;\n  btn.innerHTML = running\n    ? '<i class=\"ti ti-loader-2\" style=\"font-size:16px;animation:spin 1s linear infinite\"></i> ' + (text || 'Membaca artikel...')\n    : '<i class=\"ti ti-download\"></i> Download CSV 5W+1H';\n}\n\nasync function fetchArticleFiveWOneH(rows = []) {\n  const response = await fetch('/api/article-5w1h', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({\n      items: rows.map((item) => ({\n        title: item.title || '',\n        source: item.source || '',\n        date: item.date || '',\n        link: getItemLink(item),\n        snippet: item.snippet || '',\n        matchedKeywords: item.matchedKeywords || '',\n        region: item.region || '',\n        issue: item.issue || '',\n        type: item.type || '',\n      })),\n    }),\n  });\n  const data = await response.json().catch(() => ({}));\n  if (!response.ok) throw new Error(data.error || 'Gagal membaca isi artikel');\n  const byIndex = new Map();\n  (Array.isArray(data.results) ? data.results : []).forEach((entry) => {\n    byIndex.set(entry.index, entry);\n  });\n  return byIndex;\n}\n\nasync function downloadCsv5w1h() {\n  const rows = getFiltered();\n  if (!rows.length) {\n    alert('Belum ada hasil untuk di-download.');\n    return;\n  }\n\n  setExportState(true, 'Membaca artikel...');\n\n  try {\n    const enrichedByIndex = await fetchArticleFiveWOneH(rows);\n    setExportState(true, 'Membuat CSV...');\n\n    const headers = [\n      'No', 'Tipe', 'Judul', 'Sumber', 'Tanggal', 'Link', 'Final URL', 'Keyword',\n      'Apa (detail)', 'Siapa (detail)', 'Kapan (detail)', 'Di mana (detail)', 'Mengapa (detail)', 'Bagaimana (detail)',\n      'Ringkasan Artikel', 'Artikel Terbaca', 'Jumlah Paragraf', 'Catatan Ekstraksi', 'Snippet Crawl'\n    ];\n    const lines = [headers.map(csvCell).join(',')];\n\n    rows.forEach((item, index) => {\n      const enriched = enrichedByIndex.get(index) || {};\n      const fiveWOneH = enriched.fiveWOneH || buildFiveWOneH(item);\n      lines.push([\n        index + 1,\n        getTypeMeta(item.type).label,\n        item.title || '',\n        item.source || '',\n        formatDateID(item.date),\n        getItemLink(item),\n        enriched.finalUrl || getItemLink(item),\n        item.region ? 'Daerah: ' + item.region + (item.issue ? ' | Isu: ' + item.issue : '') : (item.matchedKeywords || ''),\n        fiveWOneH.apa,\n        fiveWOneH.siapa,\n        fiveWOneH.kapan,\n        fiveWOneH.diMana,\n        fiveWOneH.mengapa,\n        fiveWOneH.bagaimana,\n        fiveWOneH.ringkasanArtikel || '',\n        fiveWOneH.artikelTerbaca ? 'Ya' : 'Tidak',\n        fiveWOneH.jumlahParagraf || 0,\n        enriched.error || '',\n        item.snippet || '',\n      ].map(csvCell).join(','));\n    });\n\n    const blob = new Blob(['\\ufeff' + lines.join('\\n')], { type: 'text/csv;charset=utf-8;' });\n    const url = URL.createObjectURL(blob);\n    const link = document.createElement('a');\n    const stamp = new Date().toISOString().slice(0, 10);\n    link.href = url;\n    link.download = 'hasil-crawling-5w1h-artikel-' + stamp + '.csv';\n    document.body.appendChild(link);\n    link.click();\n    link.remove();\n    URL.revokeObjectURL(url);\n  } catch (err) {\n    alert('Gagal membuat CSV 5W+1H dari isi artikel: ' + err.message);\n  } finally {\n    setExportState(false);\n  }\n}\nfunction updateCounters(filtered) {\n  const news = filtered.filter(x => x.type === 'news').length;\n  const journal = filtered.filter(x => x.type === 'journal').length;\n  const regional = filtered.filter(x => x.type === 'regional').length;\n  document.getElementById('cnt-all').textContent = filtered.length;\n  document.getElementById('cnt-berita').textContent = news;\n  document.getElementById('cnt-jurnal').textContent = journal;\n  document.getElementById('cnt-regional').textContent = regional;\n  document.getElementById('totalCount').textContent = filtered.length;\n  document.getElementById('newsCount').textContent = news;\n  document.getElementById('journalCount').textContent = journal;\n  document.getElementById('regionalCount').textContent = regional;\n  const exportBtn = document.getElementById('exportCsvBtn');\n  if (exportBtn) exportBtn.disabled = !filtered.length;\n}\n\nfunction getTypeMeta(type) {\n  if (type === 'journal') return { icon: 'ti-book', iconClass: 'icon-journal', badgeClass: 'badge-journal', label: 'JURNAL' };\n  if (type === 'regional') return { icon: 'ti-map-pin', iconClass: 'icon-regional', badgeClass: 'badge-regional', label: 'ISU' };\n  return { icon: 'ti-news', iconClass: 'icon-news', badgeClass: 'badge-news', label: 'BERITA' };\n}\n\nfunction renderSkeletons(count = 5) {\n  const list = document.getElementById('resultsList');\n  const pg = document.getElementById('pagination');\n  list.innerHTML = Array.from({ length: count }, () => `\n    <div class=\"result-card skeleton-card\">\n      <div class=\"skeleton-icon\"></div>\n      <div class=\"card-body\">\n        <div class=\"skeleton-meta\">\n          <div class=\"skeleton-pill\"></div>\n          <div class=\"skeleton-line skeleton-source\"></div>\n          <div class=\"skeleton-line skeleton-date\"></div>\n        </div>\n        <div class=\"skeleton-line lg\"></div>\n        <div class=\"skeleton-line md\"></div>\n        <div class=\"skeleton-line sm\"></div>\n        <div class=\"skeleton-footer\">\n          <div class=\"skeleton-button\"></div>\n        </div>\n      </div>\n    </div>\n  `).join('');\n  pg.innerHTML = '';\n}\n\nfunction renderResults() {\n  if (isLoading) {\n    renderSkeletons();\n    return;\n  }\n\n  const filtered = getFiltered();\n  updateCounters(filtered);\n\n  const list = document.getElementById('resultsList');\n  const total = filtered.length;\n  const pages = Math.max(1, Math.ceil(total / PER_PAGE));\n  currentPage = Math.min(currentPage, pages);\n  const start = (currentPage - 1) * PER_PAGE;\n  const slice = filtered.slice(start, start + PER_PAGE);\n\n  if (!slice.length) {\n    list.innerHTML = `<div class=\"empty\"><i class=\"ti ti-mood-empty\"></i><p>Tidak ada hasil ditemukan</p></div>`;\n    renderPagination(1);\n    return;\n  }\n\n  list.innerHTML = slice.map((d) => {\n    const itemIndex = DATA.indexOf(d);\n    const link = getItemLink(d);\n    const escapedLink = escapeHtml(link);\n    const isRead = Boolean(link && hasReadLink(link));\n    const isSelected = itemIndex === selectedPreviewIndex;\n    const isFeatured = isFeaturedResult(d);\n    const cardClass = `result-card${isFeatured ? ' is-featured' : ''}${isRead ? ' is-read' : ''}${isSelected ? ' is-selected' : ''}`;\n    const openClass = link ? `card-open${isRead ? ' is-read' : ''}` : 'card-open is-disabled';\n    const readBadge = isRead ? '<span class=\"read-badge\"><i class=\"ti ti-check\"></i> Sudah dibaca</span>' : '';\n    const featuredBadge = isFeatured ? '<span class=\"featured-badge\"><i class=\"ti ti-star-filled\"></i> Media Terpercaya</span>' : '';\n    const typeMeta = getTypeMeta(d.type);\n    return `\n    <div class=\"${cardClass}\" data-index=\"${itemIndex}\">\n      <div class=\"card-icon ${typeMeta.iconClass}\">\n        <i class=\"ti ${typeMeta.icon}\"></i>\n      </div>\n      <div class=\"card-body\">\n        <div class=\"card-meta\">\n          <span class=\"type-badge ${typeMeta.badgeClass}\">${typeMeta.label}</span>\n          <span class=\"card-source\">${escapeHtml(d.source || 'Unknown')}</span>\n          ${featuredBadge}\n          ${readBadge}\n          <span class=\"card-date\"><i class=\"ti ti-calendar\" style=\"font-size:11px\"></i> ${formatDateID(d.date)}</span>\n        </div>\n        <div class=\"card-title\">${escapeHtml(d.title || '-')}</div>\n        <div class=\"card-snippet\">${d.region ? `Daerah: ${escapeHtml(d.region)}${d.issue ? ` | Isu: ${escapeHtml(d.issue)}` : ''}` : (d.snippet ? escapeHtml(d.snippet) : (d.matchedKeywords ? `Keyword: ${escapeHtml(d.matchedKeywords)}` : ''))}</div>\n        <div class=\"card-footer\">\n          <a class=\"${openClass}\" href=\"${escapedLink || '#'}\" data-read-link=\"${escapedLink}\" target=\"_blank\" rel=\"noopener noreferrer\">\n            <i class=\"ti ti-external-link\" style=\"font-size:12px\"></i> Buka berita\n          </a>\n        </div>\n      </div>\n    </div>\n  `;\n  }).join('');\n\n  renderPagination(pages);\n}\n\nfunction showPreview(item, index) {\n  if (!item) return;\n\n  document.querySelector('.main').classList.remove('is-preview-collapsed');\n  selectedPreviewIndex = index;\n  document.querySelectorAll('.result-card').forEach(card => {\n    card.classList.toggle('is-selected', Number(card.dataset.index) === selectedPreviewIndex);\n  });\n\n  const link = getItemLink(item);\n  document.getElementById('previewEmpty').hidden = true;\n  document.getElementById('previewContent').hidden = false;\n  document.getElementById('previewTitle').textContent = item.title || '-';\n  document.getElementById('previewType').textContent = getTypeMeta(item.type).label;\n  document.getElementById('previewSource').textContent = item.source || 'Unknown';\n  document.getElementById('previewDate').textContent = formatDateID(item.date);\n  document.getElementById('previewKeywords').textContent = item.region ? `Daerah: ${item.region}${item.issue ? ` | Isu: ${item.issue}` : ''}` : (item.matchedKeywords ? `Keyword: ${item.matchedKeywords}` : '');\n  document.getElementById('previewOpenLink').href = link || '#';\n\n  if (!link) {\n    showPreviewBlocked('URL tidak valid', 'Link berita kosong atau bukan URL yang bisa dibaca.');\n    return;\n  }\n\n  document.getElementById('previewBlocked').hidden = true;\n  document.getElementById('previewFrame').hidden = false;\n  document.getElementById('previewFrame').src = getPreviewUrl(link);\n\n  if (isGoogleNewsLink(link)) {\n    resolveSourceLink(item, index).then((resolvedLink) => {\n      if (selectedPreviewIndex !== index || !resolvedLink || resolvedLink === link) return;\n      document.getElementById('previewOpenLink').href = resolvedLink;\n      document.getElementById('previewFrame').src = getPreviewUrl(resolvedLink);\n      renderResults();\n    }).catch(() => {});\n  }\n}\n\nfunction clearPreview() {\n  selectedPreviewIndex = null;\n  document.querySelector('.main').classList.add('is-preview-collapsed');\n  document.querySelectorAll('.result-card').forEach(card => card.classList.remove('is-selected'));\n  document.getElementById('previewContent').hidden = true;\n  document.getElementById('previewEmpty').hidden = false;\n  document.getElementById('previewBlocked').hidden = true;\n  document.getElementById('previewFrame').src = 'about:blank';\n}\n\nfunction showPreviewBlocked(title, text) {\n  document.getElementById('previewBlockedTitle').textContent = title;\n  document.getElementById('previewBlockedText').textContent = text;\n  document.getElementById('previewFrame').hidden = true;\n  document.getElementById('previewFrame').src = 'about:blank';\n  document.getElementById('previewBlocked').hidden = false;\n}\n\n\nfunction renderPagination(pages) {\n  const pg = document.getElementById('pagination');\n  if (pages <= 1) { pg.innerHTML = ''; return; }\n  let html = `<button class=\"page-btn\" ${currentPage===1?'disabled':''} onclick=\"goPage(${currentPage-1})\"><i class=\"ti ti-chevron-left\"></i></button>`;\n  for (let i = 1; i <= pages; i++) {\n    html += `<button class=\"page-btn ${i===currentPage?'active':''}\" onclick=\"goPage(${i})\">${i}</button>`;\n  }\n  html += `<button class=\"page-btn\" ${currentPage===pages?'disabled':''} onclick=\"goPage(${currentPage+1})\"><i class=\"ti ti-chevron-right\"></i></button>`;\n  pg.innerHTML = html;\n}\n\nfunction goPage(p) { currentPage = p; renderResults(); }\n\ndocument.querySelectorAll('.type-btn').forEach(btn => {\n  btn.addEventListener('click', () => {\n    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));\n    btn.classList.add('active');\n    activeType = btn.dataset.type;\n    currentPage = 1;\n    renderResults();\n  });\n});\n\nconst sidebarHandle = document.getElementById('sidebarHandle');\nconst previewHandle = document.createElement('button');\npreviewHandle.className = 'preview-handle';\npreviewHandle.id = 'previewHandle';\npreviewHandle.type = 'button';\npreviewHandle.setAttribute('aria-label', 'Buka tutup panel kanan');\npreviewHandle.innerHTML = '<i class=\"ti ti-chevron-right\"></i>';\nsidebarHandle.insertAdjacentElement('afterend', previewHandle);\nsidebarHandle.addEventListener('click', () => {\n  document.querySelector('.main').classList.toggle('is-sidebar-collapsed');\n});\npreviewHandle.addEventListener('click', () => {\n  document.querySelector('.main').classList.toggle('is-preview-collapsed');\n});\n\ndocument.getElementById('searchInResults').addEventListener('input', () => { currentPage = 1; renderResults(); });\n\ndocument.getElementById('resultsList').addEventListener('click', async (e) => {\n  const openLink = e.target.closest('.card-open:not(.is-disabled)');\n  if (openLink) {\n    let link = openLink.dataset.readLink || openLink.href;\n    const card = openLink.closest('.result-card');\n    const index = card ? Number(card.dataset.index) : null;\n\n    if (isGoogleNewsLink(link) && Number.isInteger(index) && DATA[index]) {\n      e.preventDefault();\n      const oldHtml = openLink.innerHTML;\n      openLink.innerHTML = '<i class=\"ti ti-loader-2\" style=\"font-size:12px;animation:spin 1s linear infinite\"></i> Membuka...';\n      try {\n        link = await resolveSourceLink(DATA[index], index);\n        openLink.href = link;\n        openLink.dataset.readLink = link;\n        window.open(link, '_blank', 'noopener,noreferrer');\n        renderResults();\n      } catch (err) {\n        alert('Sumber asli belum bisa dibuka otomatis: ' + err.message);\n      } finally {\n        openLink.innerHTML = oldHtml;\n      }\n      return;\n    }\n\n    markReadLink(link);\n    openLink.classList.add('is-read');\n\n    if (!card) return;\n    card.classList.add('is-read');\n\n    const meta = card.querySelector('.card-meta');\n    if (meta && !meta.querySelector('.read-badge')) {\n      const date = meta.querySelector('.card-date');\n      const badge = '<span class=\"read-badge\"><i class=\"ti ti-check\"></i> Sudah dibaca</span>';\n      if (date) {\n        date.insertAdjacentHTML('beforebegin', badge);\n      } else {\n        meta.insertAdjacentHTML('beforeend', badge);\n      }\n    }\n    return;\n  }\n\n  const card = e.target.closest('.result-card:not(.skeleton-card)');\n  if (!card) return;\n  const index = Number(card.dataset.index);\n  if (Number.isNaN(index)) return;\n  showPreview(DATA[index], index);\n});\n\ndocument.getElementById('closePreviewBtn').addEventListener('click', clearPreview);\ndocument.getElementById('exportCsvBtn').addEventListener('click', downloadCsv5w1h);\n\nfunction toInputDate(date) {\n  const y = date.getFullYear();\n  const m = String(date.getMonth() + 1).padStart(2, '0');\n  const d = String(date.getDate()).padStart(2, '0');\n  return `${y}-${m}-${d}`;\n}\n\nfunction updateDateSummary() {\n  const fromValue = document.getElementById('fromDate').value;\n  const toValue = document.getElementById('toDate').value;\n  const el = document.getElementById('dateSummary');\n  const rangeInput = document.getElementById('rangePicker');\n  if (!fromValue && !toValue) {\n    rangeInput.value = 'Semua tanggal';\n    el.textContent = 'Semua tanggal';\n    return;\n  }\n\n  const format = (value) => {\n    if (!value) return 'awal';\n    const [year, month, day] = value.split('-');\n    return `${day} ${MONTHS[Number(month)-1].slice(0,3)} ${year}`;\n  };\n\n  rangeInput.value = toValue\n    ? `${format(fromValue)} -> ${format(toValue)}`\n    : format(fromValue);\n  el.textContent = toValue\n    ? `${format(fromValue)}  ->  ${format(toValue)}`\n    : `${format(fromValue)}  ->  akhir`;\n}\n\nfunction clearDateFilter() {\n  document.getElementById('fromDate').value = '';\n  document.getElementById('toDate').value = '';\n  const rangeInput = document.getElementById('rangePicker');\n  if (rangeInput) rangeInput.value = 'Semua tanggal';\n  if (rangePicker) rangePicker.clear();\n  updateDateSummary();\n}\n\nfunction initDateBetween() {\n  const now = new Date();\n  const firstDay = new Date(now.getFullYear(), 0, 1);\n  document.getElementById('fromDate').value = toInputDate(firstDay);\n  document.getElementById('toDate').value = toInputDate(now);\n\n  rangePicker = flatpickr('#rangePicker', {\n    mode: 'range',\n    dateFormat: 'Y-m-d',\n    defaultDate: [toInputDate(firstDay), toInputDate(now)],\n    monthSelectorType: 'dropdown',\n    allowInput: false,\n    clickOpens: true,\n    locale: {\n      firstDayOfWeek: 0,\n    },\n    onChange(selectedDates) {\n      document.getElementById('fromDate').value = selectedDates[0] ? toInputDate(selectedDates[0]) : '';\n      document.getElementById('toDate').value = selectedDates[1] ? toInputDate(selectedDates[1]) : '';\n      updateDateSummary();\n      renderResults();\n    },\n  });\n\n  updateDateSummary();\n}\n\ndocument.getElementById('clearDateBtn').addEventListener('click', () => {\n  clearDateFilter();\n  renderResults();\n});\n\nfunction addTag(inputId, listId, cls) {\n  const inp = document.getElementById(inputId);\n  const val = inp.value.trim();\n  if (!val) return;\n  const list = document.getElementById(listId);\n  const exists = [...list.querySelectorAll('.tag')].some(t => t.dataset.value.toLowerCase() === val.toLowerCase());\n  if (exists) { inp.value = ''; return; }\n  const span = document.createElement('span');\n  span.className = `tag ${cls}`;\n  span.dataset.value = val;\n  span.innerHTML = `${val} <span class=\"remove\">×</span>`;\n  list.appendChild(span);\n  inp.value = '';\n}\n\ndocument.getElementById('primaryInput').addEventListener('keydown', e => {\n  if (e.key === 'Enter') { e.preventDefault(); addTag('primaryInput', 'primaryTags', 'tag-primary'); }\n});\ndocument.getElementById('secondaryInput').addEventListener('keydown', e => {\n  if (e.key === 'Enter') { e.preventDefault(); addTag('secondaryInput', 'secondaryTags', 'tag-secondary'); }\n});\ndocument.getElementById('primaryTags').addEventListener('click', e => {\n  if (e.target.classList.contains('remove')) { e.target.parentElement.remove(); renderResults(); }\n});\ndocument.getElementById('secondaryTags').addEventListener('click', e => {\n  if (e.target.classList.contains('remove')) { e.target.parentElement.remove(); renderResults(); }\n});\n\nfunction setCrawlControls(running) {\n  const btn = document.getElementById('crawlBtn');\n  const cancelBtn = document.getElementById('cancelCrawlBtn');\n  btn.disabled = running;\n  btn.innerHTML = running\n    ? '<i class=\"ti ti-loader-2\" style=\"font-size:16px;animation:spin 1s linear infinite\"></i> Crawling...'\n    : '<i class=\"ti ti-radar\" style=\"font-size:16px\"></i> Mulai Crawling';\n  cancelBtn.hidden = !running;\n  cancelBtn.disabled = !running;\n}\n\nfunction cancelActiveCrawl() {\n  if (!activeCrawlController) return;\n  activeCrawlController.abort();\n  activeCrawlController = null;\n  isLoading = false;\n  setCrawlControls(false);\n  renderResults();\n}\n\nasync function runCrawl() {\n  const primaryKeywords = getTags('primaryTags');\n  const secondaryKeywords = getTags('secondaryTags');\n  if (!primaryKeywords.length || !secondaryKeywords.length) {\n    alert('Primary dan secondary keyword wajib diisi.');\n    return;\n  }\n\n  document.getElementById('searchInResults').value = '';\n  const fromDateValue = document.getElementById('fromDate').value || null;\n  const toDateValue = document.getElementById('toDate').value || null;\n\n  const payload = {\n    primaryKeywords,\n    secondaryKeywords,\n    startDate: fromDateValue,\n    endDate: toDateValue,\n  };\n  activeCrawlController = new AbortController();\n  const fetchOptions = {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify(payload),\n    signal: activeCrawlController.signal,\n  };\n  let response;\n  clearPreview();\n  isLoading = true;\n  setCrawlControls(true);\n  renderResults();\n\n  try {\n    response = await fetch('/api/crawl-all', fetchOptions);\n    if (!response.ok) {\n      response = await fetch('/api/crawl-all.js', fetchOptions);\n    }\n  } catch (err) {\n    if (err.name === 'AbortError') throw err;\n    response = await fetch('/api/crawl-all.js', fetchOptions);\n  }\n\n  if (!activeCrawlController || activeCrawlController.signal.aborted) return;\n  const data = await response.json();\n  if (!activeCrawlController || activeCrawlController.signal.aborted) return;\n  DATA = Array.isArray(data.results) ? data.results : [];\n  currentPage = 1;\n  isLoading = false;\n  activeCrawlController = null;\n  setCrawlControls(false);\n  renderResults();\n}\n\ndocument.getElementById('cancelCrawlBtn').addEventListener('click', cancelActiveCrawl);\n\ndocument.getElementById('crawlBtn').addEventListener('click', async () => {\n  if (activeCrawlController) return;\n  try {\n    await runCrawl();\n  } catch (e) {\n    if (e.name !== 'AbortError') {\n      alert('Gagal crawl: ' + e.message);\n    }\n  } finally {\n    isLoading = false;\n    activeCrawlController = null;\n    setCrawlControls(false);\n    renderResults();\n  }\n});\n\naddTag('primaryInput', 'primaryTags', 'tag-primary');\ndocument.getElementById('primaryTags').innerHTML = '';\naddTag('secondaryInput', 'secondaryTags', 'tag-secondary');\ndocument.getElementById('secondaryTags').innerHTML = '';\n['orangutan'].forEach(v => {\n  const s = document.createElement('span');\n  s.className = 'tag tag-primary';\n  s.dataset.value = v;\n  s.innerHTML = `${v} <span class=\"remove\">×</span>`;\n  document.getElementById('primaryTags').appendChild(s);\n});\n['konflik','perdagangan'].forEach(v => {\n  const s = document.createElement('span');\n  s.className = 'tag tag-secondary';\n  s.dataset.value = v;\n  s.innerHTML = `${v} <span class=\"remove\">×</span>`;\n  document.getElementById('secondaryTags').appendChild(s);\n});\ninitDateBetween();\nrenderResults();";

const crawlingPolishTheme = String.raw`
.stats-bar {
  gap: 12px;
  padding: 12px 24px;
  align-items: center;
}

.stat-item,
html[data-theme="dark"] .stat-item {
  min-height: 34px;
  padding: 0;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  color: var(--text2);
  font-size: 13px;
  gap: 8px;
}

.stat-item strong {
  min-width: 24px;
  color: var(--text);
  font-size: 18px;
  text-align: right;
}

.stat-dot {
  width: 8px;
  height: 8px;
  background: currentColor !important;
  border: 1px solid currentColor !important;
  box-shadow: none !important;
}

.card-open,
.preview-link,
html[data-theme="dark"] .card-open,
html[data-theme="dark"] .preview-link {
  background: #fff !important;
  border-color: #fff !important;
  color: #000 !important;
  opacity: 1;
}

.card-open:hover,
.preview-link:hover,
html[data-theme="dark"] .card-open:hover,
html[data-theme="dark"] .preview-link:hover {
  background: #f1f1f1 !important;
  border-color: #f1f1f1 !important;
  color: #000 !important;
}

.card-open.is-disabled,
html[data-theme="dark"] .card-open.is-disabled {
  opacity: 0.38;
  pointer-events: none;
}

.hero-icon {
  width: 1em;
  height: 1em;
  flex: 0 0 auto;
  vertical-align: -0.14em;
}

.sidebar-handle,
.preview-handle {
  width: 34px !important;
  top: var(--handle-start, 127px) !important;
  bottom: 0 !important;
  height: auto !important;
  min-height: 0;
  transform: none !important;
  border-radius: 0 !important;
}

.sidebar-handle {
  border-left: 0 !important;
}

.preview-handle {
  border-right: 0 !important;
}

.content,
.results,
.preview-panel,
.preview-empty,
.preview-frame-wrap,
.preview-frame,
.preview-blocked {
  background: #fff !important;
}

.preview-panel {
  border-left: 1px solid #cfcfcf !important;
}

.preview-empty {
  border-left: 1px solid #e4e4e4 !important;
  box-shadow: inset 1px 0 0 #f3f3f3 !important;
}

.preview-top,
.preview-note {
  border-color: #dedede !important;
}

.empty {
  min-height: 100%;
  background: #fff !important;
  color: #777 !important;
}

.preview-empty strong,
.empty p {
  color: #111 !important;
}

.preview-empty p {
  color: #555 !important;
}

html[data-theme="dark"] .content,
html[data-theme="dark"] .results,
html[data-theme="dark"] .preview-panel,
html[data-theme="dark"] .preview-empty,
html[data-theme="dark"] .preview-frame-wrap,
html[data-theme="dark"] .preview-frame,
html[data-theme="dark"] .preview-blocked,
html[data-theme="dark"] .empty {
  background: #000 !important;
}

html[data-theme="dark"] .empty,
html[data-theme="dark"] .preview-empty {
  color: #8f8f8f !important;
}

html[data-theme="dark"] .preview-empty strong,
html[data-theme="dark"] .empty p {
  color: #f4f4f4 !important;
}

html[data-theme="dark"] .preview-empty p {
  color: #b5b5b5 !important;
}
`;

const plainCrawlingBackgroundTheme = String.raw`
html,
body,
.app-content,
.shell,
.main,
.content,
.results,
.preview-panel,
.preview-empty,
.preview-frame-wrap,
.preview-frame,
.preview-blocked {
  background: #fff !important;
  background-image: none !important;
}

body::before,
body::after,
.shell::before {
  display: none !important;
  content: none !important;
}

.shell {
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.filter-sidebar,
.toolbar,
.stats-bar,
.preview-top,
.preview-note,
.regional-bar {
  background: #fff !important;
  background-image: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

html[data-theme="dark"],
html[data-theme="dark"] body,
html[data-theme="dark"] .app-content,
html[data-theme="dark"] .shell,
html[data-theme="dark"] .main,
html[data-theme="dark"] .content,
html[data-theme="dark"] .results,
html[data-theme="dark"] .preview-panel,
html[data-theme="dark"] .preview-empty,
html[data-theme="dark"] .preview-frame-wrap,
html[data-theme="dark"] .preview-frame,
html[data-theme="dark"] .preview-blocked,
html[data-theme="dark"] .filter-sidebar,
html[data-theme="dark"] .toolbar,
html[data-theme="dark"] .stats-bar,
html[data-theme="dark"] .preview-top,
html[data-theme="dark"] .preview-note,
html[data-theme="dark"] .regional-bar {
  background: #000 !important;
  background-image: none !important;
}

body,
input,
button,
select,
.tag,
.stat-item,
.result-card,
.preview-panel {
  font-family: var(--font-body, Manrope, Arial, sans-serif) !important;
}

.shell {
  border: 0 !important;
  color: var(--text) !important;
}

.filter-sidebar,
.toolbar,
.stats-bar,
.preview-top,
.preview-note,
.regional-bar {
  border-color: #dddddd !important;
}

.filter-sidebar {
  padding: 14px 14px !important;
  border-right: 1px solid #dddddd !important;
  gap: 14px !important;
}

.toolbar {
  padding: 10px 20px !important;
  border-bottom: 1px solid #dddddd !important;
}

.search-bar input,
.input-wrap input,
.range-picker,
.date-summary {
  height: 36px !important;
  border: 1px solid #d2d2d2 !important;
  background: #fff !important;
  color: #111 !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  box-shadow: none !important;
}

.keyword-notice {
  min-height: 34px !important;
  padding: 0 12px !important;
  font-size: 11px !important;
}

.section-label {
  margin-bottom: 8px !important;
  font-size: 10px !important;
}

.keyword-group,
.date-filter {
  gap: 8px !important;
}

.input-wrap .input-icon,
.search-icon {
  font-size: 14px !important;
}

.keyword-notice,
.type-btn,
.between-box,
.tag,
.stat-item,
.result-card,
.page-btn,
.btn-export,
.btn-cancel {
  border: 1px solid #d2d2d2 !important;
  background: #fff !important;
  color: #222 !important;
  box-shadow: none !important;
}

.stats-bar {
  min-height: 44px !important;
  padding: 7px 20px !important;
  border-bottom: 1px solid #dddddd !important;
  gap: 8px !important;
}

.stat-item {
  min-height: 28px !important;
  padding: 0 10px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  gap: 6px !important;
}

.stat-item strong {
  color: #111 !important;
  font-size: 14px !important;
}

.stat-dot {
  background: #111 !important;
  border-color: #111 !important;
}

.btn-crawl,
.type-btn.active,
.page-btn.active {
  background: #111 !important;
  border-color: #111 !important;
  color: #fff !important;
  box-shadow: none !important;
}

.btn-crawl {
  height: 38px !important;
  font-size: 13px !important;
  font-weight: 800 !important;
}

.btn-cancel,
.btn-export {
  min-height: 32px !important;
  padding: 0 10px !important;
  font-size: 11px !important;
}

.type-btn {
  min-height: 34px !important;
  padding: 0 10px !important;
  font-size: 12px !important;
}

.tag {
  min-height: 28px !important;
  padding: 0 9px !important;
  font-size: 11px !important;
}

.between-box {
  padding: 10px !important;
}

.between-head {
  margin-bottom: 8px !important;
}

.results {
  padding: 14px 20px !important;
}

.result-card {
  padding: 14px !important;
  border-color: #dddddd !important;
  background: #fff !important;
  gap: 12px !important;
}

.result-card:hover,
.result-card.is-selected {
  background: #fafafa !important;
  border-color: #999 !important;
  transform: none !important;
}

.card-icon,
.type-badge,
.featured-badge,
.read-badge {
  border: 1px solid #d2d2d2 !important;
  background: #fff !important;
  color: #111 !important;
  box-shadow: none !important;
}

.card-title {
  color: #111 !important;
  font-weight: 800 !important;
  font-size: 16px !important;
  line-height: 1.35 !important;
}

.card-snippet,
.card-source,
.card-date {
  color: #666 !important;
  font-size: 12px !important;
}

.card-open,
.preview-link {
  min-height: 28px !important;
  padding: 0 10px !important;
  border: 1px solid #111 !important;
  background: #fff !important;
  color: #111 !important;
  font-weight: 700 !important;
  font-size: 11px !important;
}

.card-open:hover,
.preview-link:hover {
  background: #111 !important;
  color: #fff !important;
}

.preview-panel {
  border-left: 1px solid #dddddd !important;
}

.preview-top {
  padding: 14px !important;
}

.preview-title {
  font-size: 18px !important;
}

.preview-note {
  padding: 10px 14px !important;
  font-size: 11px !important;
}

.sidebar-handle,
.preview-handle {
  width: 28px !important;
}

.sidebar-handle:hover,
.preview-handle:hover {
  background: #111 !important;
  border-color: #111 !important;
  color: #fff !important;
}

html[data-theme="dark"] .sidebar-handle:hover,
html[data-theme="dark"] .preview-handle:hover {
  background: #fff !important;
  border-color: #fff !important;
  color: #000 !important;
}

html[data-theme="dark"] .filter-sidebar,
html[data-theme="dark"] .toolbar,
html[data-theme="dark"] .stats-bar,
html[data-theme="dark"] .preview-panel,
html[data-theme="dark"] .preview-top,
html[data-theme="dark"] .preview-note,
html[data-theme="dark"] .regional-bar {
  border-color: #242424 !important;
}

html[data-theme="dark"] .search-bar input,
html[data-theme="dark"] .input-wrap input,
html[data-theme="dark"] .range-picker,
html[data-theme="dark"] .date-summary,
html[data-theme="dark"] .keyword-notice,
html[data-theme="dark"] .type-btn,
html[data-theme="dark"] .between-box,
html[data-theme="dark"] .tag,
html[data-theme="dark"] .stat-item,
html[data-theme="dark"] .result-card,
html[data-theme="dark"] .page-btn,
html[data-theme="dark"] .btn-export,
html[data-theme="dark"] .btn-cancel,
html[data-theme="dark"] .card-icon,
html[data-theme="dark"] .type-badge,
html[data-theme="dark"] .featured-badge,
html[data-theme="dark"] .read-badge {
  background: #000 !important;
  border-color: #2a2a2a !important;
  color: #f5f5f5 !important;
}

html[data-theme="dark"] .search-bar input::placeholder,
html[data-theme="dark"] .input-wrap input::placeholder,
html[data-theme="dark"] .card-snippet,
html[data-theme="dark"] .card-source,
html[data-theme="dark"] .card-date {
  color: #a8a8a8 !important;
}

html[data-theme="dark"] .btn-crawl,
html[data-theme="dark"] .type-btn.active,
html[data-theme="dark"] .page-btn.active {
  background: #fff !important;
  border-color: #fff !important;
  color: #000 !important;
}

html[data-theme="dark"] .stat-item strong,
html[data-theme="dark"] .card-title {
  color: #f5f5f5 !important;
}

html[data-theme="dark"] .stat-dot {
  background: #f5f5f5 !important;
  border-color: #f5f5f5 !important;
}

html[data-theme="dark"] .result-card:hover,
html[data-theme="dark"] .result-card.is-selected {
  background: #080808 !important;
  border-color: #5a5a5a !important;
}

html[data-theme="dark"] .card-open,
html[data-theme="dark"] .preview-link {
  background: #fff !important;
  border-color: #fff !important;
  color: #000 !important;
}
`;

const heroIconAndLinkGuardScript = String.raw`
function isAssetUrl(url) {
  const host = url.hostname.replace(/^www\./i, '').toLowerCase();
  const path = url.pathname.toLowerCase();
  if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(host)) return true;
  return /\.(css|js|mjs|json|xml|woff2?|ttf|otf|eot|png|jpe?g|gif|webp|svg|ico|mp4|webm|mp3|wav)$/i.test(path);
}

function safeLink(link) {
  try {
    const url = new URL(String(link || '').trim());
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    if (isAssetUrl(url)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function getItemLink(item = {}) {
  const candidates = [item.resolvedLink, item.finalUrl, item.link];
  for (const candidate of candidates) {
    const link = safeLink(candidate);
    if (link) return link;
  }
  return '';
}

function getCurrentUserId() {
  try {
    const key = 'crawling-user-id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
}

function getReadStorageKey() {
  return 'crawling-read-links:' + getCurrentUserId();
}

function getReadLinks() {
  try {
    const maxAge = 60 * 60 * 1000;
    const now = Date.now();
    const raw = JSON.parse(localStorage.getItem(getReadStorageKey()) || '{}');
    const next = {};
    const links = [];
    Object.entries(raw && typeof raw === 'object' ? raw : {}).forEach(([link, time]) => {
      const ts = Number(time);
      if (link && ts && now - ts <= maxAge) {
        next[link] = ts;
        links.push(link);
      }
    });
    localStorage.setItem(getReadStorageKey(), JSON.stringify(next));
    return links;
  } catch {
    return [];
  }
}

function hasReadLink(link) {
  return getReadLinks().includes(link);
}

function markReadLink(link) {
  if (!link) return;
  try {
    const maxAge = 60 * 60 * 1000;
    const now = Date.now();
    const raw = JSON.parse(localStorage.getItem(getReadStorageKey()) || '{}');
    const next = {};
    Object.entries(raw && typeof raw === 'object' ? raw : {}).forEach(([savedLink, time]) => {
      const ts = Number(time);
      if (savedLink && ts && now - ts <= maxAge) next[savedLink] = ts;
    });
    next[link] = now;
    localStorage.setItem(getReadStorageKey(), JSON.stringify(next));
  } catch {}
}

if (!window.__crawlFetchUserWrapped) {
  window.__crawlFetchUserWrapped = true;
  window.__crawlOriginalFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = String(init?.method || (typeof input === 'object' ? input.method : '') || 'GET').toUpperCase();
    if (url.includes('/api/crawl-all') && method === 'POST') {
      const headers = new Headers(init.headers || {});
      headers.set('x-crawl-user', getCurrentUserId());
      return window.__crawlOriginalFetch(input, { ...init, headers });
    }
    return window.__crawlOriginalFetch(input, init);
  };
}

document.addEventListener('click', (event) => {
  const openLink = event.target.closest?.('.card-open:not(.is-disabled)');
  if (!openLink) return;
  const link = openLink.dataset.readLink || openLink.href;
  if (link) markReadLink(link);
}, true);

async function resolveSourceLink(item = {}, index = null) {
  const currentLink = getItemLink(item);
  if (!currentLink || !isGoogleNewsLink(currentLink)) return currentLink;
  if (resolvedLinkCache.has(currentLink)) return resolvedLinkCache.get(currentLink);

  try {
    const response = await fetch('/api/resolve-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: currentLink,
        title: item.title || '',
        source: item.source || '',
      }),
    });
    const data = await response.json().catch(() => ({}));
    const finalLink = response.ok ? safeLink(data.finalUrl) : '';
    const nextLink = finalLink || currentLink;

    resolvedLinkCache.set(currentLink, nextLink);
    if (finalLink) {
      item.resolvedLink = finalLink;
      if (Number.isInteger(index) && DATA[index]) DATA[index].resolvedLink = finalLink;
      if (hasReadLink(currentLink)) markReadLink(finalLink);
    }
    return nextLink;
  } catch {
    resolvedLinkCache.set(currentLink, currentLink);
    return currentLink;
  }
}

async function resolvePublisherOnly(item = {}, index = null) {
  const currentLink = getItemLink(item);
  if (!currentLink || !isGoogleNewsLink(currentLink)) return currentLink;

  try {
    const response = await fetch('/api/resolve-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: currentLink,
        title: item.title || '',
        source: item.source || '',
      }),
    });
    const data = await response.json().catch(() => ({}));
    const finalLink = response.ok ? safeLink(data.finalUrl) : '';
    if (!finalLink || isGoogleNewsLink(finalLink)) return '';

    resolvedLinkCache.set(currentLink, finalLink);
    item.resolvedLink = finalLink;
    if (Number.isInteger(index) && DATA[index]) DATA[index].resolvedLink = finalLink;
    return finalLink;
  } catch {
    return '';
  }
}

let backgroundResolveToken = 0;
let backgroundResolveRunning = false;

async function resolveGoogleNewsInBackground() {
  if (backgroundResolveRunning || !Array.isArray(DATA) || !DATA.length) return;

  const jobs = DATA
    .map((item, index) => ({ item, index, link: getItemLink(item) }))
    .filter(job => job.link && isGoogleNewsLink(job.link) && !job.item.resolvedLink && !job.item.resolveQueued);

  if (!jobs.length) return;

  backgroundResolveRunning = true;
  const token = ++backgroundResolveToken;
  jobs.forEach(job => { job.item.resolveQueued = true; });

  for (let i = 0; i < jobs.length; i += 3) {
    const chunk = jobs.slice(i, i + 3);
    await Promise.all(chunk.map(async (job) => {
      const resolved = await resolvePublisherOnly(job.item, job.index);
      job.item.resolveQueued = false;
      job.item.resolveFailed = !resolved;
    }));

    if (token !== backgroundResolveToken) break;
    if (selectedPreviewIndex !== null) {
      const selected = DATA[selectedPreviewIndex];
      if (selected && selected.resolvedLink && !isGoogleNewsLink(selected.resolvedLink)) {
        document.getElementById('previewOpenLink').href = selected.resolvedLink;
        document.getElementById('previewBlocked').hidden = true;
        document.getElementById('previewFrame').hidden = false;
        document.getElementById('previewFrame').src = getPreviewUrl(selected.resolvedLink, selected);
      }
    }
    renderResults();
  }

  backgroundResolveRunning = false;
}

setInterval(resolveGoogleNewsInBackground, 1200);

const INCIDENT_CSV_HEADERS = [
  'tanggal temuan',
  'kematian/kelahiran',
  'inisial',
  'Liar/Jinak',
  'Jenis kelamin',
  'umur/Thn',
  'Kelas Umur',
  'Penyebab Kematian',
  'Desa',
  'Kecamatan',
  'Kabupaten',
  'Provinsi',
  'N',
  'E',
  'Keteragan',
  'Sumber',
];

function pickMatch(text = '', patterns = []) {
  for (const pattern of patterns) {
    const match = String(text || '').match(pattern);
    if (match) return cleanCsvValue(match[1] || match[0]);
  }
  return '';
}

function detectEventType(text = '') {
  if (/\b(?:lahir|kelahiran|melahirkan|bayi)\b/i.test(text)) return 'Kelahiran';
  if (/\b(?:mati|kematian|tewas|bangkai|dibunuh|terbunuh)\b/i.test(text)) return 'Kematian';
  return '';
}

function detectWildStatus(text = '') {
  if (/\b(?:liar|alam liar|habitat|hutan|dilepasliarkan)\b/i.test(text)) return 'Liar';
  if (/\b(?:jinak|peliharaan|dipelihara|kandang|penangkaran)\b/i.test(text)) return 'Jinak';
  return '';
}

function detectAgeClass(text = '') {
  if (/\b(?:bayi|anakan|anak orangutan|anak orang utan)\b/i.test(text)) return 'Anak';
  if (/\b(?:remaja|juvenil)\b/i.test(text)) return 'Remaja';
  if (/\b(?:dewasa|induk|betina dewasa|jantan dewasa)\b/i.test(text)) return 'Dewasa';
  return '';
}

function detectDeathCause(text = '') {
  if (!/\b(?:mati|kematian|tewas|bangkai|dibunuh|terbunuh)\b/i.test(text)) return '';
  return pickMatch(text, [
    /\b(?:karena|akibat|diduga karena|disebabkan oleh)\s+([^.!?]{8,120})/i,
    /\b(?:tertembak|diracun|terjerat|luka|konflik|perdagangan ilegal|perburuan|dibunuh)[^.!?]{0,100}/i,
  ]);
}

function normalizeIncidentDate(value = '') {
  const text = cleanCsvValue(value);
  if (!text) return '';

  const monthMap = {
    jan: 0, januari: 0,
    feb: 1, februari: 1,
    mar: 2, maret: 2,
    apr: 3, april: 3,
    mei: 4,
    jun: 5, juni: 5,
    jul: 6, juli: 6,
    agu: 7, ags: 7, agustus: 7,
    sep: 8, september: 8,
    okt: 9, oktober: 9,
    nov: 10, november: 10,
    des: 11, desember: 11,
  };

  const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (numeric) {
    const year = Number(numeric[3].length === 2 ? '20' + numeric[3] : numeric[3]);
    const date = new Date(year, Number(numeric[2]) - 1, Number(numeric[1]));
    return Number.isNaN(date.getTime()) ? '' : formatDateID(date.toISOString());
  }

  const named = text.match(/\b(\d{1,2})\s+(Jan(?:uari)?|Feb(?:ruari)?|Mar(?:et)?|Apr(?:il)?|Mei|Jun(?:i)?|Jul(?:i)?|Agu(?:stus)?|Ags|Sep(?:tember)?|Okt(?:ober)?|Nov(?:ember)?|Des(?:ember)?)\s+(\d{4})\b/i);
  if (named) {
    const month = monthMap[named[2].toLowerCase()];
    const date = new Date(Number(named[3]), month, Number(named[1]));
    return Number.isNaN(date.getTime()) ? '' : formatDateID(date.toISOString());
  }

  return '';
}

function detectIncidentDate(text = '', fallbackDate = '') {
  const sentences = cleanCsvValue(text).split(/(?<=[.!?])\s+|\s+-\s+|\n+/).filter(Boolean);
  const eventSentences = sentences.filter(sentence => /\b(?:mati|kematian|tewas|bangkai|dibunuh|terbunuh|lahir|kelahiran|melahirkan|bayi)\b/i.test(sentence));

  for (const sentence of [...eventSentences, ...sentences]) {
    const found = normalizeIncidentDate(sentence);
    if (found) return found;
  }

  const fallback = formatDateID(fallbackDate);
  return fallback === 'Tanggal tidak tersedia' ? '' : fallback;
}

function buildIncidentCsvRow(item = {}, enriched = {}) {
  const fiveW = enriched.fiveWOneH || {};
  const detailText = cleanCsvValue([
    item.title,
    item.snippet,
    fiveW.ringkasanArtikel,
    fiveW.apa,
    fiveW.kapan,
    fiveW.bagaimana,
    fiveW.diMana,
    enriched.error,
  ].filter(Boolean).join('. '));
  const sourceLink = safeLink(enriched.finalUrl || getItemLink(item));
  const incidentDate = detectIncidentDate(detailText, item.date);

  return {
    'tanggal temuan': incidentDate,
    'kematian/kelahiran': detectEventType(detailText),
    'inisial': pickMatch(detailText, [
      /\borang\s*utan(?:\s+sumatera|\s+kalimantan)?\s+(?:bernama|berinisial|bernama panggilan)?\s*([A-Z][A-Za-zÀ-ÿ'-]{2,20})\b/,
      /\bbernama\s+([A-Z][A-Za-zÀ-ÿ'-]{2,20})\b/,
    ]),
    'Liar/Jinak': detectWildStatus(detailText),
    'Jenis kelamin': pickMatch(detailText, [/\b(jantan|betina)\b/i]),
    'umur/Thn': pickMatch(detailText, [
      /\b(?:berumur|usia|umur)\s+(?:sekitar\s+)?(\d+(?:[,.]\d+)?\s*(?:tahun|bulan|thn|bln))\b/i,
      /\b(\d+(?:[,.]\d+)?\s*(?:tahun|bulan|thn|bln))\b/i,
    ]),
    'Kelas Umur': detectAgeClass(detailText),
    'Penyebab Kematian': detectDeathCause(detailText),
    'Desa': pickMatch(detailText, [/\bDesa\s+([A-Z][A-Za-zÀ-ÿ0-9' -]{2,50})/]),
    'Kecamatan': pickMatch(detailText, [/\bKecamatan\s+([A-Z][A-Za-zÀ-ÿ0-9' -]{2,50})/]),
    'Kabupaten': pickMatch(detailText, [/\bKabupaten\s+([A-Z][A-Za-zÀ-ÿ0-9' -]{2,50})/, /\bKab\.\s*([A-Z][A-Za-zÀ-ÿ0-9' -]{2,50})/]),
    'Provinsi': pickMatch(detailText, [/\bProvinsi\s+([A-Z][A-Za-zÀ-ÿ0-9' -]{2,50})/, /\b(Aceh|Riau|Jambi|Sumatera Utara|Sumatera Barat|Sumatera Selatan|Kalimantan Barat|Kalimantan Tengah|Kalimantan Selatan|Kalimantan Timur|Kalimantan Utara|Papua|Papua Barat|Papua Barat Daya)\b/i]),
    'N': pickMatch(detailText, [/\b(?:N|LU|Lat(?:itude)?)\s*[:=]?\s*(-?\d{1,2}[.,]\d+)\b/i]),
    'E': pickMatch(detailText, [/\b(?:E|BT|Long(?:itude)?)\s*[:=]?\s*(-?\d{1,3}[.,]\d+)\b/i]),
    'Keteragan': cleanCsvValue(fiveW.ringkasanArtikel || item.snippet || item.title || ''),
    'Sumber': sourceLink || cleanCsvValue(item.source || ''),
  };
}

function setExportState(running, text = '') {
  const btn = document.getElementById('exportCsvBtn');
  if (!btn) return;
  btn.disabled = running || !getFiltered().length;
  btn.innerHTML = running
    ? '<i class="ti ti-loader-2" style="font-size:16px;animation:spin 1s linear infinite"></i> ' + (text || 'Membaca artikel...')
    : '<i class="ti ti-download"></i> Download CSV Temuan';
}

async function downloadCsv5w1h() {
  const rows = getFiltered();
  if (!rows.length) {
    alert('Belum ada hasil untuk di-download.');
    return;
  }

  setExportState(true, 'Membaca artikel...');

  try {
    const enrichedByIndex = await fetchArticleFiveWOneH(rows);
    setExportState(true, 'Membuat CSV...');

    const lines = [INCIDENT_CSV_HEADERS.map(csvCell).join(',')];
    rows.forEach((item, index) => {
      const row = buildIncidentCsvRow(item, enrichedByIndex.get(index) || {});
      lines.push(INCIDENT_CSV_HEADERS.map((header) => csvCell(row[header] || '')).join(','));
    });

    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = 'data-temuan-orangutan-' + stamp + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Gagal membuat CSV data temuan: ' + err.message);
  } finally {
    setExportState(false);
  }
}

function getPreviewUrl(link, item = {}) {
  if (!link) return 'about:blank';
  const params = new URLSearchParams({ url: link });
  if (item.title) params.set('title', item.title);
  if (item.source) params.set('source', item.source);
  return '/api/preview?' + params.toString();
}

function showPreview(item, index) {
  if (!item) return;

  document.querySelector('.main').classList.remove('is-preview-collapsed');
  selectedPreviewIndex = index;
  document.querySelectorAll('.result-card').forEach(card => {
    card.classList.toggle('is-selected', Number(card.dataset.index) === selectedPreviewIndex);
  });

  const link = getItemLink(item);
  document.getElementById('previewEmpty').hidden = true;
  document.getElementById('previewContent').hidden = false;
  document.getElementById('previewTitle').textContent = item.title || '-';
  document.getElementById('previewType').textContent = getTypeMeta(item.type).label;
  document.getElementById('previewSource').textContent = item.source || 'Unknown';
  document.getElementById('previewDate').textContent = formatDateID(item.date);
  document.getElementById('previewKeywords').textContent = item.region
    ? 'Daerah: ' + item.region + (item.issue ? ' | Isu: ' + item.issue : '')
    : (item.matchedKeywords ? 'Keyword: ' + item.matchedKeywords : '');
  document.getElementById('previewOpenLink').href = link || '#';

  if (!link) {
    showPreviewBlocked('URL tidak valid', 'Link berita kosong atau bukan URL yang bisa dibaca.');
    return;
  }

  if (isGoogleNewsLink(link)) {
    showPreviewBlocked(
      'Mencari sumber asli',
      'Menunggu Google News diarahkan ke URL publisher asli sebelum preview dimuat.'
    );
    resolveSourceLink(item, index).then((resolvedLink) => {
      if (selectedPreviewIndex !== index) return;
      if (!resolvedLink || isGoogleNewsLink(resolvedLink)) {
        document.getElementById('previewOpenLink').href = link;
        showPreviewBlocked(
          'Sumber asli belum ditemukan',
          'Google News belum memberi URL publisher asli. Tombol Buka berita tetap bisa dipakai untuk membuka link yang tersedia.'
        );
        return;
      }
      document.getElementById('previewOpenLink').href = resolvedLink;
      document.getElementById('previewBlocked').hidden = true;
      document.getElementById('previewFrame').hidden = false;
      document.getElementById('previewFrame').src = getPreviewUrl(resolvedLink, item);
      renderResults();
    }).catch(() => {});
    return;
  }

  document.getElementById('previewBlocked').hidden = true;
  document.getElementById('previewFrame').hidden = false;
  document.getElementById('previewFrame').src = getPreviewUrl(link, item);
}

const HERO_ICON_PATHS = {
  radar: '<path d="M12 19a7 7 0 1 0-7-7"/><path d="M12 15a3 3 0 1 0-3-3"/><path d="M12 12 4.5 4.5"/>',
  'map-pin': '<path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><path d="M12 10.5h.01"/>',
  news: '<path d="M6 5h9.5A2.5 2.5 0 0 1 18 7.5V19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M18 8h1a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2"/><path d="M8 9h6"/><path d="M8 13h7"/><path d="M8 16h4"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H7a3 3 0 0 0-3 3V5.5Z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/>',
  world: '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M3.6 9h16.8"/><path d="M3.6 15h16.8"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/>',
  key: '<path d="M15.5 7.5a4 4 0 1 1 1 3.9L10 18H7v-3H4v-3h3l4.6-4.6a4 4 0 0 1 3.9.1Z"/><path d="M17 7h.01"/>',
  tag: '<path d="M20 10.5 13.5 4H5v8.5L11.5 19a2 2 0 0 0 2.8 0L20 13.3a2 2 0 0 0 0-2.8Z"/><path d="M8.5 8.5h.01"/>',
  'calendar-stats': '<path d="M7 3v3"/><path d="M17 3v3"/><path d="M4 8h16"/><path d="M5 5h14a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1Z"/><path d="M8 17v-3"/><path d="M12 17v-5"/><path d="M16 17v-7"/>',
  calendar: '<path d="M7 3v3"/><path d="M17 3v3"/><path d="M4 8h16"/><path d="M5 5h14a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1Z"/>',
  search: '<path d="m21 21-4.3-4.3"/><path d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  'external-link': '<path d="M13 5h6v6"/><path d="m10 14 9-9"/><path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4"/>',
  'layout-sidebar-right': '<path d="M4 5h16v14H4z"/><path d="M15 5v14"/>',
  'table-options': '<path d="M4 5h16v14H4z"/><path d="M4 10h16"/><path d="M10 5v14"/><path d="M14 15h4"/><path d="M16 13v4"/>',
  x: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'circle-x': '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  'corner-down-left': '<path d="M9 10 4 15l5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
  'mood-empty': '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M9 15h6"/>',
  'loader-2': '<path d="M12 3a9 9 0 1 0 9 9"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  'star-filled': '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9 6.6 19.8l1-6.1-4.4-4.3 6.1-.9L12 3Z" fill="currentColor" stroke="none"/>',
};

function heroIconSvg(name, className = '', style = '') {
  const path = HERO_ICON_PATHS[name] || HERO_ICON_PATHS.news;
  const classes = (className + ' hero-icon').trim();
  const styleAttr = style ? ' style="' + escapeHtml(style) + '"' : '';
  return '<svg class="' + classes + '"' + styleAttr + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
}

function applyHeroIcons(root = document) {
  root.querySelectorAll('i.ti').forEach((icon) => {
    const iconClass = [...icon.classList].find((name) => name.startsWith('ti-') && name !== 'ti');
    if (!iconClass) return;
    const keepClasses = [...icon.classList].filter((name) => name !== 'ti' && !name.startsWith('ti-')).join(' ');
    icon.outerHTML = heroIconSvg(iconClass.replace(/^ti-/, ''), keepClasses, icon.getAttribute('style') || '');
  });
}

applyHeroIcons(document.querySelector('.app-content') || document);
new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1 && document.querySelector('.app-content')?.contains(node)) applyHeroIcons(node);
    });
  }
}).observe(document.body, { childList: true, subtree: true });

function syncPanelHandleStart() {
  const main = document.querySelector('.main');
  const stats = document.querySelector('.stats-bar');
  if (!main || !stats) return;

  const mainTop = main.getBoundingClientRect().top;
  const statsBottom = stats.getBoundingClientRect().bottom;
  main.style.setProperty('--handle-start', Math.max(0, Math.round(statsBottom - mainTop - 1)) + 'px');
}

requestAnimationFrame(syncPanelHandleStart);
window.addEventListener('resize', syncPanelHandleStart);
if (window.ResizeObserver) {
  const handleObserver = new ResizeObserver(syncPanelHandleStart);
  const toolbar = document.querySelector('.toolbar');
  const stats = document.querySelector('.stats-bar');
  if (toolbar) handleObserver.observe(toolbar);
  if (stats) handleObserver.observe(stats);
}
`;

export default function CrawlingPage() {
  return (
    <LegacyPage
      title="Dashboard Beta Crawling"
      fontsHref="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
      extraStylesheets={["https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css"]}
      beforeScriptSrc={["https://cdn.jsdelivr.net/npm/flatpickr"]}
      styleText={`${styleText}\n${monochromeCrawlingTheme}\n${crawlingPolishTheme}\n${plainCrawlingBackgroundTheme}`}
      scriptText={`${scriptText}\n${heroIconAndLinkGuardScript}`}
    >
      {bodyContent}
    </LegacyPage>
  );
}
