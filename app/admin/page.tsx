import LegacyPage from '../_components/LegacyPage';

const styleText = `
*, *::before, *::after { box-sizing: border-box; }
:root {
  --bg: #f5f5f3;
  --panel: rgba(255,255,255,0.72);
  --border: rgba(0,0,0,0.14);
  --text: #111;
  --muted: #666;
  --soft: #efefef;
  --font-body: 'Manrope', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}
html[data-theme="dark"] {
  --bg: #050505;
  --panel: rgba(18,18,18,0.78);
  --border: rgba(255,255,255,0.16);
  --text: #f4f4f4;
  --muted: #aaa;
  --soft: #111;
}
body {
  min-height: 100vh;
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
}
.shell {
  min-height: calc(100vh - 64px - 34px);
  display: grid;
  grid-template-rows: auto 1fr;
}
.admin-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  padding: 28px 32px 20px;
  border-bottom: 1px solid var(--border);
}
.eyebrow {
  color: var(--muted);
  font: 700 11px var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
h1 {
  margin: 8px 0 0;
  font-size: 30px;
  line-height: 1.1;
}
.refresh {
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--border);
  background: var(--text);
  color: var(--bg);
  font: 700 12px var(--font-mono);
  cursor: pointer;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 20px 32px;
}
.stat {
  border: 1px solid var(--border);
  background: var(--panel);
  padding: 16px;
}
.stat strong {
  display: block;
  font: 800 26px var(--font-mono);
}
.stat span {
  color: var(--muted);
  font-size: 12px;
}
.table-wrap {
  margin: 0 32px 32px;
  border: 1px solid var(--border);
  background: var(--panel);
  overflow: auto;
}
table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}
th, td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
}
th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--soft);
  color: var(--muted);
  font: 700 11px var(--font-mono);
  text-transform: uppercase;
}
td {
  font-size: 13px;
}
.mono {
  font-family: var(--font-mono);
}
.pill {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 3px 8px;
  border: 1px solid var(--border);
  font: 700 11px var(--font-mono);
}
.hit {
  background: #111;
  color: #fff;
}
html[data-theme="dark"] .hit {
  background: #fff;
  color: #000;
}
.empty {
  padding: 42px 24px;
  color: var(--muted);
  text-align: center;
}
@media (max-width: 820px) {
  .admin-head {
    align-items: stretch;
    flex-direction: column;
    padding: 20px;
  }
  .stats {
    grid-template-columns: 1fr 1fr;
    padding: 16px 20px;
  }
  .table-wrap {
    margin: 0 20px 24px;
  }
}
`;

const bodyHtml = `
<div class="shell">
  <section class="admin-head">
    <div>
      <div class="eyebrow">Admin</div>
      <h1>Riwayat Crawling</h1>
    </div>
    <button class="refresh" id="refreshBtn" type="button">Refresh</button>
  </section>
  <section class="stats">
    <div class="stat"><strong id="logCount">0</strong><span>log crawling</span></div>
    <div class="stat"><strong id="cacheActive">0</strong><span>cache aktif</span></div>
    <div class="stat"><strong id="cacheTtl">60</strong><span>TTL menit</span></div>
    <div class="stat"><strong id="lastRun">-</strong><span>crawl terakhir</span></div>
  </section>
  <section class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Waktu</th>
          <th>User</th>
          <th>Status</th>
          <th>Primary</th>
          <th>Secondary</th>
          <th>Tanggal</th>
          <th>Hasil</th>
          <th>Durasi</th>
        </tr>
      </thead>
      <tbody id="logRows">
        <tr><td colspan="8"><div class="empty">Memuat log...</div></td></tr>
      </tbody>
    </table>
  </section>
</div>
`;

const scriptText = `
function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(ms = 0) {
  if (!ms) return '0 ms';
  if (ms < 1000) return ms + ' ms';
  return (ms / 1000).toFixed(1) + ' dtk';
}

function joinList(values = []) {
  return Array.isArray(values) && values.length ? values.join(', ') : '-';
}

async function loadAdminLogs() {
  const rows = document.getElementById('logRows');
  const response = await fetch('/api/admin/crawl-logs', { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Gagal memuat log');

  const logs = Array.isArray(data.logs) ? data.logs : [];
  document.getElementById('logCount').textContent = logs.length;
  document.getElementById('cacheActive').textContent = data.cache?.active || 0;
  document.getElementById('cacheTtl').textContent = data.cache?.ttlMinutes || 60;
  document.getElementById('lastRun').textContent = logs[0] ? formatDate(logs[0].createdAt) : '-';

  if (!logs.length) {
    rows.innerHTML = '<tr><td colspan="8"><div class="empty">Belum ada riwayat crawling.</div></td></tr>';
    return;
  }

  rows.innerHTML = logs.map((log) => {
    const status = log.cacheHit ? '<span class="pill hit">CACHE</span>' : '<span class="pill">CRAWL</span>';
    const range = [log.startDate || 'awal', log.endDate || 'akhir'].join(' -> ');
    return '<tr>' +
      '<td class="mono">' + escapeHtml(formatDate(log.createdAt)) + '</td>' +
      '<td>' + escapeHtml(log.user || 'anonymous') + '</td>' +
      '<td>' + status + '</td>' +
      '<td>' + escapeHtml(joinList(log.primaryKeywords)) + '</td>' +
      '<td>' + escapeHtml(joinList(log.secondaryKeywords)) + '</td>' +
      '<td class="mono">' + escapeHtml(range) + '</td>' +
      '<td class="mono">' + escapeHtml(log.total || 0) + '</td>' +
      '<td class="mono">' + escapeHtml(formatDuration(log.durationMs || 0)) + '</td>' +
    '</tr>';
  }).join('');
}

document.getElementById('refreshBtn').addEventListener('click', () => {
  loadAdminLogs().catch((err) => alert(err.message));
});

loadAdminLogs().catch((err) => {
  document.getElementById('logRows').innerHTML = '<tr><td colspan="8"><div class="empty">' + escapeHtml(err.message) + '</div></td></tr>';
});
setInterval(() => loadAdminLogs().catch(() => {}), 10000);
`;

export default function AdminPage() {
  return (
    <LegacyPage
      title="Admin Crawling"
      fontsHref="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Manrope:wght@400;500;700;800&display=swap"
      styleText={styleText}
      scriptText={scriptText}
    >
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </LegacyPage>
  );
}
