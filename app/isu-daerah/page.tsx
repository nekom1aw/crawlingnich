import LegacyPage from '../_components/LegacyPage';

const styleText = "*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; border-radius: 0 !important; }\n  :root {\n    --bg: #0d0f14;\n    --bg2: #13161d;\n    --bg3: #1a1e28;\n    --border: rgba(255,255,255,0.07);\n    --border2: rgba(255,255,255,0.13);\n    --text: #f0f2f8;\n    --text2: #8b90a0;\n    --text3: #555c6e;\n    --green: #9dffc1;\n    --font-head: 'Syne', sans-serif;\n    --font-body: 'Inter', sans-serif;\n    --font-mono: 'DM Mono', monospace;\n  }\n  body { min-height: 100vh; background: var(--bg); color: var(--text); font-family: var(--font-body); font-size: 14px; overflow: hidden; }\n  .shell { display: grid; grid-template-rows: 56px auto 1fr; height: 100vh; }\n  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }\n  @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }\n  @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }\n\n  .control-band { display: grid; grid-template-columns: minmax(260px, 360px) auto minmax(260px, 1fr); gap: 10px; align-items: center; padding: 14px 24px; background: #10131a; border-bottom: 1px solid var(--border); }\n  .input-wrap { position: relative; }\n  .input-wrap input { width: 100%; height: 40px; padding: 0 12px 0 36px; background: var(--bg3); border: 1px solid var(--border2); color: var(--text); outline: none; font-family: var(--font-body); font-size: 13px; }\n  .input-wrap input:focus { border-color: #fff; }\n  .input-wrap input::placeholder { color: var(--text3); }\n  .input-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text3); font-size: 15px; pointer-events: none; }\n  .btn { height: 40px; padding: 0 14px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #fff; border: 1px solid #fff; color: #000; font-family: var(--font-head); font-weight: 700; cursor: pointer; }\n  .btn:disabled { opacity: 0.65; cursor: wait; }\n  .tags-list { display: flex; flex-wrap: wrap; gap: 6px; min-height: 32px; align-items: center; }\n  .tag { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border: 1px solid rgba(113,255,174,0.42); background: rgba(113,255,174,0.08); color: var(--green); font-size: 11px; font-family: var(--font-mono); cursor: pointer; }\n  .tag .remove { opacity: 0.65; }\n\n  .main { min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr); overflow: hidden; }\n  .content { min-width: 0; display: flex; flex-direction: column; overflow: hidden; }\n  .stats { display: flex; gap: 20px; padding: 12px 24px; border-bottom: 1px solid var(--border); color: var(--text2); font-size: 12px; }\n  .stats strong { color: #fff; font-family: var(--font-mono); }\n  .results { flex: 1; min-height: 0; overflow: hidden; padding: 22px 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); grid-auto-rows: minmax(460px, 1fr); align-items: stretch; gap: 14px; }\n  .region-group { min-width: 0; min-height: 0; height: 100%; border: 1px solid var(--border2); background: rgba(255,255,255,0.025); display: flex; flex-direction: column; }\n  .region-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 13px 14px; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.045); }\n  .region-title { min-width: 0; display: flex; align-items: center; gap: 8px; font-family: var(--font-head); font-size: 16px; font-weight: 800; }\n  .region-title span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n  .region-count { flex-shrink: 0; color: var(--green); border: 1px solid rgba(113,255,174,0.42); padding: 3px 8px; font-family: var(--font-mono); font-size: 10px; }\n  .issue-filter { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 12px; border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.12); }\n  .issue-btn { height: 26px; padding: 0 8px; display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--border2); background: rgba(255,255,255,0.025); color: var(--text2); font-family: var(--font-mono); font-size: 10px; cursor: pointer; }\n  .issue-btn.active { color: #000; background: #fff; border-color: #fff; }\n  .region-list { flex: 1; min-height: 0; padding: 12px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; overscroll-behavior: contain; overflow-anchor: none; }\n  .card { background: var(--bg2); border: 1px solid var(--border); padding: 14px; display: flex; gap: 12px; }\n  .card:hover { border-color: #fff; background: rgba(255,255,255,0.055); }\n  .card-icon { width: 36px; height: 36px; display: grid; place-items: center; flex-shrink: 0; border: 1px solid rgba(113,255,174,0.42); color: var(--green); font-size: 16px; }\n  .card-body { min-width: 0; flex: 1; }\n  .meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 7px; color: var(--text3); font-family: var(--font-mono); font-size: 11px; }\n  .badge { color: var(--green); border: 1px solid rgba(113,255,174,0.42); padding: 2px 8px; }\n  .date { width: 100%; color: var(--text2); }\n  .title { color: var(--text); line-height: 1.45; font-weight: 500; margin-bottom: 6px; }\n  .snippet { color: var(--text2); font-size: 12px; line-height: 1.6; }\n  .open { margin-top: 11px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; background: #fff; color: #000; text-decoration: none; font-family: var(--font-mono); font-size: 11px; }\n  .empty { flex: 1; display: grid; place-items: center; color: var(--text3); text-align: center; line-height: 1.7; }\n  .skeleton { pointer-events: none; }\n  .skeleton .line, .skeleton .card-icon, .skeleton-region { background: linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.12), rgba(255,255,255,0.04)); background-size: 200% 100%; animation: shimmer 1.3s linear infinite; }\n  .skeleton .line { height: 12px; margin-bottom: 9px; }\n\n  @media (max-width: 1024px) {\n    body { overflow: auto; }\n    .shell { min-height: 100vh; height: auto; }\n    .control-band { grid-template-columns: 1fr; padding: 12px 14px; }\n    .main { grid-template-columns: 1fr; overflow: visible; }\n    .results { grid-template-columns: 1fr; }\n    .region-group { max-height: none; }\n  }";
const bodyHtml = "<div class=\"shell\">\n  <div id=\"appHeader\"></div>\n\n  <section class=\"control-band\">\n    <div class=\"input-wrap\">\n      <i class=\"ti ti-map-pin input-icon\"></i>\n      <input type=\"text\" id=\"regionInput\" placeholder=\"tambah daerah, contoh: Riau...\" />\n    </div>\n    <button class=\"btn\" id=\"regionalBtn\" type=\"button\"><i class=\"ti ti-satellite\"></i> Pantau Isu</button>\n    <div class=\"tags-list\" id=\"regionTags\"></div>\n  </section>\n\n  <main class=\"main\">\n    <section class=\"content\">\n      <div class=\"stats\">\n        <span><strong id=\"totalCount\">0</strong> total isu</span>\n        <span><strong id=\"regionCount\">0</strong> daerah</span>\n        <span id=\"scanStatus\">siap pantau</span>\n      </div>\n      <div class=\"results\" id=\"resultsList\"></div>\n    </section>\n\n  </main>\n</div>";
const scriptText = "let DATA = [];\nlet regionIssueFilters = {};\nlet activeScanId = 0;\nlet hasSearched = false;\nlet isArchiveScanning = false;\n\nfunction escapeHtml(value = '') {\n  return String(value)\n    .replace(/&/g, '&amp;')\n    .replace(/</g, '&lt;')\n    .replace(/>/g, '&gt;')\n    .replace(/\"/g, '&quot;')\n    .replace(/'/g, '&#39;');\n}\n\nfunction safeLink(link) {\n  try {\n    const url = new URL(String(link || '').trim());\n    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';\n  } catch {\n    return '';\n  }\n}\n\nfunction formatDateID(dateStr) {\n  if (!dateStr) return 'Tanggal tidak tersedia';\n  const d = new Date(dateStr);\n  if (Number.isNaN(d.getTime()) || d.getFullYear() <= 1970) return 'Tanggal tidak tersedia';\n  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });\n}\n\nfunction getTimeValue(dateStr) {\n  const time = new Date(dateStr).getTime();\n  return Number.isNaN(time) ? 0 : time;\n}\n\nfunction getTags() {\n  return [...document.querySelectorAll('#regionTags .tag')].map(tag => tag.dataset.value).filter(Boolean);\n}\n\nfunction addRegion(value) {\n  const val = String(value || document.getElementById('regionInput').value).trim();\n  if (!val) return;\n  const exists = getTags().some(tag => tag.toLowerCase() === val.toLowerCase());\n  document.getElementById('regionInput').value = '';\n  if (exists) return;\n\n  const span = document.createElement('span');\n  span.className = 'tag';\n  span.dataset.value = val;\n  span.innerHTML = `${escapeHtml(val)} <span class=\"remove\">x</span>`;\n  document.getElementById('regionTags').appendChild(span);\n  updateCounts();\n}\n\nfunction updateCounts() {\n  document.getElementById('totalCount').textContent = DATA.length;\n  document.getElementById('regionCount').textContent = getTags().length;\n}\n\nfunction toInputDate(date) {\n  return date.toISOString().slice(0, 10);\n}\n\nfunction buildScanWindows() {\n  const windows = [];\n  const today = new Date();\n  const firstStart = new Date(today);\n  firstStart.setMonth(firstStart.getMonth() - 1);\n  windows.push({ startDate: toInputDate(firstStart), endDate: toInputDate(today), label: '1 bulan terakhir' });\n\n  let cursorEnd = new Date(firstStart);\n  cursorEnd.setDate(cursorEnd.getDate() - 1);\n  const minDate = new Date('2020-01-01T00:00:00');\n\n  while (cursorEnd >= minDate) {\n    const cursorStart = new Date(cursorEnd);\n    cursorStart.setMonth(cursorStart.getMonth() - 1);\n    if (cursorStart < minDate) cursorStart.setTime(minDate.getTime());\n    windows.push({\n      startDate: toInputDate(cursorStart),\n      endDate: toInputDate(cursorEnd),\n      label: `${formatDateID(cursorStart)} - ${formatDateID(cursorEnd)}`,\n    });\n    cursorEnd = new Date(cursorStart);\n    cursorEnd.setDate(cursorEnd.getDate() - 1);\n  }\n\n  return windows;\n}\n\nfunction mergeResults(items = []) {\n  const seen = new Set(DATA.map(item => item.link || `${item.region}-${item.title}-${item.date}`));\n  const appended = [];\n  for (const item of items) {\n    const key = item.link || `${item.region}-${item.title}-${item.date}`;\n    if (seen.has(key)) continue;\n    seen.add(key);\n    appended.push(item);\n  }\n  DATA.push(...appended.sort((a, b) => getTimeValue(b.date) - getTimeValue(a.date)));\n  return appended;\n}\n\nfunction setScanStatus(text) {\n  const btn = document.getElementById('regionalBtn');\n  btn.innerHTML = text;\n}\n\nfunction setScanText(text) {\n  document.getElementById('scanStatus').textContent = text;\n}\n\nfunction scheduleScanText(text) {\n  requestAnimationFrame(() => setScanText(text));\n}\n\nfunction setButtonReady() {\n  const btn = document.getElementById('regionalBtn');\n  btn.disabled = false;\n  btn.innerHTML = '<i class=\"ti ti-satellite\"></i> Pantau Isu';\n}\n\nfunction getRegionScrollState() {\n  const state = {};\n  document.querySelectorAll('.region-group').forEach(group => {\n    const region = group.dataset.region;\n    const list = group.querySelector('.region-list');\n    if (region && list) state[region] = list.scrollTop;\n  });\n  return state;\n}\n\nfunction restoreRegionScrollState(state = {}) {\n  requestAnimationFrame(() => {\n    document.querySelectorAll('.region-group').forEach(group => {\n      const region = group.dataset.region;\n      const list = group.querySelector('.region-list');\n      if (region && list && state[region] !== undefined) list.scrollTop = state[region];\n    });\n  });\n}\n\nfunction renderSkeletons() {\n  const regions = getTags();\n  document.getElementById('resultsList').innerHTML = regions.map(region => `\n    <section class=\"region-group\">\n      <div class=\"region-head\">\n        <div class=\"region-title\"><i class=\"ti ti-map-pin\"></i><span>${escapeHtml(region)}</span></div>\n        <span class=\"region-count\">loading</span>\n      </div>\n      <div class=\"region-list\">\n        ${Array.from({ length: 3 }, () => `\n          <div class=\"card skeleton\">\n            <div class=\"card-icon\"></div>\n            <div class=\"card-body\">\n              <div class=\"line\" style=\"width:45%\"></div>\n              <div class=\"line\" style=\"width:92%;height:14px\"></div>\n              <div class=\"line\" style=\"width:70%\"></div>\n            </div>\n          </div>\n        `).join('')}\n      </div>\n    </section>\n  `).join('');\n}\n\nfunction renderCard(item) {\n  const link = safeLink(item.link);\n  return `\n    <article class=\"card\">\n      <div class=\"card-icon\"><i class=\"ti ti-news\"></i></div>\n      <div class=\"card-body\">\n        <div class=\"meta\">\n          <span class=\"badge\">${escapeHtml(item.issue || 'ISU')}</span>\n          <span>${escapeHtml(item.source || 'Unknown')}</span>\n          <span class=\"date\">${formatDateID(item.date)}</span>\n        </div>\n        <h3 class=\"title\">${escapeHtml(item.title || '-')}</h3>\n        <div class=\"snippet\">Daerah: ${escapeHtml(item.region || '-')} | Isu: ${escapeHtml(item.issue || '-')}</div>\n        <a class=\"open\" href=\"${escapeHtml(link || '#')}\" target=\"_blank\" rel=\"noopener noreferrer\"><i class=\"ti ti-external-link\"></i> Buka berita</a>\n      </div>\n    </article>\n  `;\n}\n\nfunction getRegionGroup(region) {\n  return [...document.querySelectorAll('.region-group')]\n    .find(group => group.dataset.region === region);\n}\n\nfunction refreshRegionFilter(region, items) {\n  const group = getRegionGroup(region);\n  if (!group) return;\n  const filter = group.querySelector('.issue-filter');\n  if (filter) filter.outerHTML = renderIssueFilter(region, items);\n}\n\nfunction appendResultsSmooth(items = []) {\n  if (!items.length) return;\n  updateCounts();\n\n  const grouped = new Map();\n  for (const item of items) {\n    const region = item.region || 'Lainnya';\n    if (!grouped.has(region)) grouped.set(region, []);\n    grouped.get(region).push(item);\n  }\n\n  for (const [region, regionItems] of grouped.entries()) {\n    const allRegionItems = DATA.filter(item => String(item.region || '').toLowerCase() === region.toLowerCase());\n    const activeIssue = regionIssueFilters[region] || 'Semua';\n    const group = getRegionGroup(region);\n    if (!group) {\n      requestAnimationFrame(renderResults);\n      continue;\n    }\n\n    group.querySelector('.region-count').textContent = `${allRegionItems.length} isu`;\n    refreshRegionFilter(region, allRegionItems);\n\n    const list = group.querySelector('.region-list');\n    if (!list) continue;\n    const empty = list.querySelector('.empty');\n    if (empty) empty.remove();\n\n    const visibleNewItems = activeIssue === 'Semua'\n      ? regionItems\n      : regionItems.filter(item => String(item.issue || 'Isu Daerah') === activeIssue);\n    if (!visibleNewItems.length) continue;\n\n    const fragment = document.createDocumentFragment();\n    for (const item of visibleNewItems) {\n      const template = document.createElement('template');\n      template.innerHTML = renderCard(item).trim();\n      fragment.appendChild(template.content.firstElementChild);\n    }\n    requestAnimationFrame(() => list.appendChild(fragment));\n  }\n}\n\nfunction renderResults() {\n  const scrollState = getRegionScrollState();\n  updateCounts();\n  const list = document.getElementById('resultsList');\n  if (!hasSearched) {\n    list.innerHTML = '<div class=\"empty\"><div><i class=\"ti ti-map-search\" style=\"font-size:48px\"></i><p>Tambahkan daerah lalu klik Pantau Isu.</p></div></div>';\n    return;\n  }\n  if (!DATA.length) {\n    const regions = getTags();\n    if (!regions.length) {\n      list.innerHTML = '<div class=\"empty\"><div><i class=\"ti ti-map-search\" style=\"font-size:48px\"></i><p>Tambahkan daerah lalu klik Pantau Isu.</p></div></div>';\n      return;\n    }\n    list.innerHTML = regions.map(region => `\n      <section class=\"region-group\" data-region=\"${escapeHtml(region)}\">\n        <div class=\"region-head\">\n          <div class=\"region-title\"><i class=\"ti ti-map-pin\"></i><span>${escapeHtml(region)}</span></div>\n          <span class=\"region-count\">0 isu</span>\n        </div>\n        ${renderIssueFilter(region, [])}\n        <div class=\"region-list\">\n          <div class=\"empty\" style=\"min-height:180px\"><div><i class=\"ti ti-news-off\" style=\"font-size:34px\"></i><p>Belum ada isu untuk daerah ini.</p></div></div>\n        </div>\n      </section>\n    `).join('');\n    restoreRegionScrollState(scrollState);\n    return;\n  }\n\n  const sorted = DATA.map((item, index) => ({ ...item, originalIndex: index }));\n  const groups = getTags().map(region => ({\n    region,\n    items: sorted.filter(item => String(item.region || '').toLowerCase() === region.toLowerCase()),\n  }));\n  const extraItems = sorted.filter(item => !groups.some(group => String(item.region || '').toLowerCase() === group.region.toLowerCase()));\n  if (extraItems.length) groups.push({ region: 'Lainnya', items: extraItems });\n\n  list.innerHTML = groups.map(group => `\n    <section class=\"region-group\" data-region=\"${escapeHtml(group.region)}\">\n      <div class=\"region-head\">\n        <div class=\"region-title\"><i class=\"ti ti-map-pin\"></i><span>${escapeHtml(group.region)}</span></div>\n        <span class=\"region-count\">${group.items.length} isu</span>\n      </div>\n      ${renderIssueFilter(group.region, group.items)}\n      <div class=\"region-list\">\n        ${getFilteredRegionItems(group.region, group.items).length ? getFilteredRegionItems(group.region, group.items).map(renderCard).join('') : '<div class=\"empty\" style=\"min-height:180px\"><div><i class=\"ti ti-news-off\" style=\"font-size:34px\"></i><p>Belum ada isu untuk daerah ini.</p></div></div>'}\n      </div>\n    </section>\n  `).join('');\n  restoreRegionScrollState(scrollState);\n}\n\nfunction getFilteredRegionItems(region, items) {\n  const activeIssue = regionIssueFilters[region] || 'Semua';\n  if (activeIssue === 'Semua') return items;\n  return items.filter(item => String(item.issue || 'Isu Daerah') === activeIssue);\n}\n\nfunction renderIssueFilter(region, items) {\n  const issues = ['Semua', ...new Set(items.map(item => item.issue || 'Isu Daerah').filter(Boolean))];\n  const activeIssue = regionIssueFilters[region] || 'Semua';\n  return `\n    <div class=\"issue-filter\">\n      <label class=\"issue-select-wrap\">\n        <select class=\"issue-select\" data-region=\"${escapeHtml(region)}\" aria-label=\"Filter isu ${escapeHtml(region)}\">\n          ${issues.map(issue => `\n            <option value=\"${escapeHtml(issue)}\" ${issue === activeIssue ? 'selected' : ''}>${escapeHtml(issue)}</option>\n          `).join('')}\n        </select>\n      </label>\n    </div>\n  `;\n}\n\nasync function runRegionalIssues(scanId) {\n  const regions = getTags();\n  if (!regions.length) {\n    alert('Daerah wajib diisi.');\n    return;\n  }\n\n  activeScanId = scanId;\n  DATA = [];\n  regionIssueFilters = {};\n  hasSearched = true;\n  isArchiveScanning = true;\n  renderSkeletons();\n\n  const windows = buildScanWindows();\n  for (let i = 0; i < windows.length; i++) {\n    if (activeScanId !== scanId) return;\n    const window = windows[i];\n    if (i === 0) {\n      setScanStatus('<i class=\"ti ti-loader-2\" style=\"font-size:16px;animation:spin 1s linear infinite\"></i> Memantau...');\n    }\n    scheduleScanText(`${i === 0 ? 'mencari 1 bulan terakhir' : 'mencari arsip ' + window.label}`);\n\n    const response = await fetch('/api/regional-issues', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({\n        regions,\n        startDate: window.startDate,\n        endDate: window.endDate,\n        maxPerRegion: 30,\n      }),\n    });\n    const data = await response.json();\n    if (!response.ok) throw new Error(data.error || 'Gagal mengambil isu daerah');\n\n    const addedItems = mergeResults(Array.isArray(data.results) ? data.results : []);\n    if (i === 0 || !document.querySelector('.region-group')) {\n      renderResults();\n    } else if (addedItems.length) {\n      appendResultsSmooth(addedItems);\n    }\n    if (i === 0) {\n      setButtonReady();\n      setScanText('hasil 1 bulan tampil, arsip lanjut di latar belakang');\n    }\n  }\n  isArchiveScanning = false;\n  setScanText('selesai sampai 2020');\n}\n\ndocument.getElementById('regionInput').addEventListener('keydown', (e) => {\n  if (e.key === 'Enter') {\n    e.preventDefault();\n    addRegion();\n  }\n});\n\ndocument.getElementById('regionTags').addEventListener('click', (e) => {\n  if (e.target.classList.contains('remove')) {\n    e.target.parentElement.remove();\n    DATA = DATA.filter(item => getTags().some(region => String(item.region || '').toLowerCase() === region.toLowerCase()));\n    updateCounts();\n    renderResults();\n  }\n});\n\ndocument.getElementById('regionalBtn').addEventListener('click', async () => {\n  const scanId = Date.now();\n  activeScanId = scanId;\n  const btn = document.getElementById('regionalBtn');\n  btn.disabled = true;\n  btn.innerHTML = '<i class=\"ti ti-loader-2\" style=\"font-size:16px;animation:spin 1s linear infinite\"></i> Memantau...';\n  runRegionalIssues(scanId).catch((err) => {\n    if (activeScanId === scanId) {\n      if (!DATA.length) {\n        DATA = [];\n        hasSearched = true;\n        renderResults();\n        setScanText('gagal');\n        alert('Gagal pantau isu daerah: ' + err.message);\n      } else {\n        setScanText('arsip berhenti: ' + err.message);\n      }\n    }\n  }).finally(() => {\n    if (activeScanId === scanId) {\n      isArchiveScanning = false;\n      setButtonReady();\n    }\n  });\n});\n\ndocument.getElementById('resultsList').addEventListener('change', (e) => {\n  const issueSelect = e.target.closest('.issue-select');\n  if (!issueSelect) return;\n  regionIssueFilters[issueSelect.dataset.region] = issueSelect.value;\n  renderResults();\n});\n\ndocument.getElementById('resultsList').addEventListener('click', (e) => {\n  if (e.target.closest('.open')) return;\n});\n\n['Riau', 'Kalimantan Timur', 'Papua'].forEach(addRegion);\nrenderResults();";

const regionalGlassTheme = String.raw`
*, *::before, *::after { border-radius: revert-layer; }

:root {
  --bg: #eef5ff;
  --bg2: rgba(255,255,255,0.5);
  --bg3: rgba(255,255,255,0.78);
  --border: rgba(255,255,255,0.58);
  --border2: rgba(115,140,184,0.24);
  --text: #17304f;
  --text2: #547090;
  --text3: #7d92ad;
  --green: #1fc38c;
  --accent: #0f6bff;
  --shadow: 0 22px 60px rgba(96, 124, 172, 0.18);
  --shadow-soft: 0 10px 26px rgba(96, 124, 172, 0.12);
  --font-head: 'Manrope', sans-serif;
  --font-body: 'Manrope', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}

html {
  background:
    radial-gradient(circle at top left, rgba(255,255,255,0.95), rgba(255,255,255,0) 34%),
    radial-gradient(circle at 82% 16%, rgba(143,204,255,0.38), rgba(143,204,255,0) 25%),
    radial-gradient(circle at 20% 86%, rgba(143,170,255,0.28), rgba(143,170,255,0) 32%),
    linear-gradient(180deg, #f7fbff 0%, #e8f1ff 45%, #dfeaff 100%);
}

body {
  background: transparent !important;
  color: var(--text);
  padding: 14px;
}

body::before,
body::after {
  content: '';
  position: fixed;
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
  grid-template-rows: 64px auto 1fr;
  height: calc(100vh - 28px);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.68);
  border-radius: 28px !important;
  background: linear-gradient(180deg, rgba(255,255,255,0.44), rgba(255,255,255,0.2));
  box-shadow: var(--shadow);
  backdrop-filter: blur(26px) saturate(165%);
  -webkit-backdrop-filter: blur(26px) saturate(165%);
}

#appHeader,
.control-band,
.stats {
  background: rgba(255,255,255,0.14) !important;
  border-color: rgba(255,255,255,0.42) !important;
  backdrop-filter: blur(22px) saturate(160%);
  -webkit-backdrop-filter: blur(22px) saturate(160%);
}

#appHeader {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 64px;
}

.app-nav { height: 64px; padding: 0 24px; }
.nav-logo { color: var(--text); font-family: var(--font-head); font-weight: 800; }
.logo-dot { width: 10px; height: 10px; border-radius: 999px !important; background: linear-gradient(180deg, #ffffff, #7bc2ff); box-shadow: 0 0 0 6px rgba(255,255,255,0.28); }
.nav-menu { gap: 10px; padding: 6px; background: rgba(255,255,255,0.26); border: 1px solid rgba(255,255,255,0.56); border-radius: 999px !important; }
.nav-link { height: 36px; border-radius: 999px !important; border-color: transparent; background: transparent; color: var(--text2); }
.nav-link:hover { color: var(--text); background: rgba(255,255,255,0.5); border-color: rgba(255,255,255,0.62); box-shadow: var(--shadow-soft); }
.nav-link.active { color: #fff; background: linear-gradient(180deg, rgba(76,147,255,0.98), rgba(38,107,239,0.96)); border-color: rgba(38,107,239,0.35); box-shadow: 0 10px 24px rgba(35,108,235,0.28); }
.badge-live { border-radius: 999px !important; background: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.6); color: var(--text2); }
.dot-pulse { border-radius: 999px !important; background: #2ecf9d; box-shadow: 0 0 0 5px rgba(46,207,157,0.14); }

.theme-toggle {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,0.62);
  border-radius: 999px !important;
  background: rgba(255,255,255,0.34);
  color: var(--text);
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.48), 0 8px 20px rgba(111,139,183,0.08);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  transition: transform 0.18s ease, background 0.18s ease;
}
.theme-toggle:hover { transform: translateY(-1px); background: rgba(255,255,255,0.62); }
.theme-toggle i { font-size: 18px; }

.control-band {
  grid-template-columns: minmax(260px, 360px) auto minmax(260px, 1fr);
  padding: 18px 24px 14px;
}

.input-wrap input,
.btn,
.tag,
.stats span,
.region-group,
.region-head,
.region-count,
.issue-filter,
.issue-btn,
.card,
.card-icon,
.badge,
.open {
  border-radius: 8px !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.46), 0 8px 20px rgba(111,139,183,0.08);
}

.input-wrap input {
  height: 44px;
  background: rgba(255,255,255,0.52);
  border: 1px solid rgba(255,255,255,0.58);
  color: var(--text);
}
.input-wrap input:focus { border-color: rgba(52,124,255,0.48); background: rgba(255,255,255,0.72); box-shadow: inset 0 1px 0 rgba(255,255,255,0.64), 0 0 0 4px rgba(15,107,255,0.08); }
.input-wrap input::placeholder { color: var(--text3); }
.input-icon { color: var(--text3); }

.btn {
  height: 44px;
  border: 1px solid rgba(24,111,246,0.18);
  background: linear-gradient(180deg, rgba(102,169,255,0.95), rgba(37,111,242,0.95));
  color: #fff;
  font-family: var(--font-head);
  font-weight: 800;
  box-shadow: 0 14px 26px rgba(38,113,241,0.22);
}

.tag {
  padding: 7px 11px;
  border-radius: 999px !important;
  border-color: rgba(255,255,255,0.62);
  background: rgba(255,255,255,0.38);
  color: #168c68;
}

.stats {
  gap: 16px;
  padding: 14px 24px 18px;
  flex-wrap: wrap;
  align-items: center;
}
.stats span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 8px 14px;
  border: 1px solid rgba(255,255,255,0.54);
  border-radius: 999px !important;
  background: rgba(255,255,255,0.34);
  color: var(--text2);
  white-space: nowrap;
}
.stats #scanStatus {
  min-width: 128px;
  justify-content: center;
}
.stats strong { color: var(--text); }

.results {
  padding: 18px 24px;
  gap: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  align-content: start;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: 520px;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}
.results::-webkit-scrollbar { width: 6px; }
.results::-webkit-scrollbar-thumb { background: rgba(93,121,160,0.24); border-radius: 999px !important; }
.results > .empty {
  grid-column: 1 / -1;
  min-height: 320px;
}

.region-group {
  border: 1px solid rgba(255,255,255,0.62);
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255,255,255,0.48), rgba(255,255,255,0.28));
  backdrop-filter: blur(18px) saturate(145%);
  -webkit-backdrop-filter: blur(18px) saturate(145%);
}
.region-head {
  padding: 16px 16px 10px;
  border-bottom: 0;
  background: transparent;
  box-shadow: none;
}
.region-title { color: var(--text); font-family: var(--font-head); }
.region-count { color: #168c68; border-color: rgba(31,195,140,0.24); background: rgba(31,195,140,0.12); border-radius: 999px !important; }
.issue-filter {
  display: block;
  padding: 0 16px 13px;
  border-bottom: 1px solid rgba(255,255,255,0.38);
  background: transparent;
  box-shadow: none;
}
.issue-select-wrap {
  position: relative;
  display: block;
  width: min(100%, 260px);
}
.issue-select-wrap::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 14px;
  width: 8px;
  height: 8px;
  border-right: 2px solid var(--text2);
  border-bottom: 2px solid var(--text2);
  transform: translateY(-68%) rotate(45deg);
  pointer-events: none;
}
.issue-select {
  width: 100%;
  height: 38px;
  appearance: none;
  -webkit-appearance: none;
  padding: 0 38px 0 12px;
  border: 1px solid rgba(255,255,255,0.62);
  border-radius: 8px !important;
  background: rgba(255,255,255,0.5);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 11px;
  outline: none;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.52), 0 8px 18px rgba(111,139,183,0.08);
}
.issue-select:focus {
  border-color: rgba(52,124,255,0.46);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.64), 0 0 0 4px rgba(15,107,255,0.08);
}
.issue-btn { border-color: rgba(255,255,255,0.62); background: rgba(255,255,255,0.44); color: var(--text2); border-radius: 999px !important; }
.issue-btn.active { color: #fff; background: linear-gradient(180deg, rgba(98,163,255,0.98), rgba(49,119,246,0.96)); border-color: rgba(49,119,246,0.3); }
.region-list {
  padding: 14px;
  background: rgba(255,255,255,0.1);
}
.region-list::-webkit-scrollbar { width: 5px; }
.region-list::-webkit-scrollbar-thumb { background: rgba(93,121,160,0.22); border-radius: 999px !important; }

.card {
  background: rgba(255,255,255,0.36);
  border: 1px solid rgba(255,255,255,0.62);
  transition: border-color 0.2s, transform 0.15s, background 0.18s ease;
}
.card:hover { border-color: rgba(70,134,238,0.24); transform: translateY(-1px); background: rgba(255,255,255,0.5); }
.card-icon { border-color: rgba(31,195,140,0.24); background: rgba(255,255,255,0.42); color: #168c68; }
.meta { color: var(--text3); }
.badge { color: #168c68; border-color: rgba(31,195,140,0.24); background: rgba(31,195,140,0.12); border-radius: 999px !important; }
.date { color: var(--text2); }
.title { color: var(--text); font-weight: 700; }
.snippet { color: var(--text2); }
.open { background: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.74); color: var(--text); border-radius: 999px !important; }
.open:hover { background: rgba(255,255,255,0.88); }
.empty { color: var(--text3); }

.skeleton .line,
.skeleton .card-icon,
.skeleton-region {
  background: linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.62), rgba(255,255,255,0.18));
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
  --border: rgba(255,255,255,0.16);
  --border2: rgba(179,204,255,0.16);
  --text: #eef5ff;
  --text2: #a9b8cf;
  --text3: #76879f;
  --green: #3addaa;
  --accent: #82b7ff;
  --shadow: 0 22px 70px rgba(0,0,0,0.34);
  --shadow-soft: 0 10px 26px rgba(0,0,0,0.22);
}

html[data-theme="dark"] body::before { background: radial-gradient(circle, rgba(78,141,255,0.18) 0%, rgba(78,141,255,0) 70%); }
html[data-theme="dark"] body::after { background: radial-gradient(circle, rgba(46,207,157,0.11) 0%, rgba(46,207,157,0) 72%); }
html[data-theme="dark"] .shell { border-color: rgba(255,255,255,0.14); background: linear-gradient(180deg, rgba(28,39,61,0.56), rgba(15,24,39,0.62)); }
html[data-theme="dark"] #appHeader,
html[data-theme="dark"] .control-band,
html[data-theme="dark"] .stats { background: rgba(14,22,36,0.48) !important; border-color: rgba(255,255,255,0.12) !important; }

html[data-theme="dark"] .nav-menu,
html[data-theme="dark"] .theme-toggle,
html[data-theme="dark"] .badge-live,
html[data-theme="dark"] .input-wrap input,
html[data-theme="dark"] .tag,
html[data-theme="dark"] .stats span,
html[data-theme="dark"] .region-group,
html[data-theme="dark"] .region-count,
html[data-theme="dark"] .issue-btn,
html[data-theme="dark"] .issue-select,
html[data-theme="dark"] .card,
html[data-theme="dark"] .card-icon,
html[data-theme="dark"] .badge,
html[data-theme="dark"] .open {
  background: rgba(26,39,60,0.54);
  border-color: rgba(255,255,255,0.14);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 24px rgba(0,0,0,0.16);
}

html[data-theme="dark"] .nav-link:hover,
html[data-theme="dark"] .theme-toggle:hover,
html[data-theme="dark"] .issue-select:hover,
html[data-theme="dark"] .card:hover,
html[data-theme="dark"] .open:hover {
  background: rgba(43,61,90,0.74);
}

html[data-theme="dark"] .region-group {
  background: linear-gradient(180deg, rgba(28,42,64,0.68), rgba(20,31,49,0.58));
}

html[data-theme="dark"] .region-head,
html[data-theme="dark"] .issue-filter {
  background: transparent;
  box-shadow: none;
}

html[data-theme="dark"] .issue-filter {
  border-bottom-color: rgba(255,255,255,0.12);
}

html[data-theme="dark"] .issue-select {
  color: var(--text);
}

html[data-theme="dark"] .issue-select-wrap::after {
  border-color: var(--text2);
}

html[data-theme="dark"] .region-list {
  background: rgba(10,16,27,0.16);
}

html[data-theme="dark"] .nav-link.active,
html[data-theme="dark"] .btn,
html[data-theme="dark"] .issue-btn.active {
  background: linear-gradient(180deg, rgba(92,151,255,0.98), rgba(40,103,226,0.96));
  color: #fff;
}

html[data-theme="dark"] .tag,
html[data-theme="dark"] .region-count,
html[data-theme="dark"] .badge,
html[data-theme="dark"] .card-icon {
  color: var(--green);
}

@media (max-width: 1024px) {
  body { padding: 10px; }
  .shell { min-height: calc(100vh - 20px); height: auto; border-radius: 24px !important; }
  .control-band { grid-template-columns: 1fr; padding: 12px 14px; }
  .results { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: 500px; }
}

@media (max-width: 720px) {
  .shell { grid-template-rows: 58px auto 1fr; border-radius: 20px !important; }
  .app-nav { height: 58px; padding: 0 12px; gap: 10px; }
  .nav-left { gap: 14px; }
  .nav-logo { font-size: 14px; }
  .nav-menu { gap: 6px; padding: 4px; }
  .nav-link { width: 34px; padding: 0; }
  .nav-link span,
  .badge-live { display: none; }
  .control-band,
  .stats,
  .results { padding-left: 14px; padding-right: 14px; }
  .stats { gap: 8px; }
  .stats span { width: calc(50% - 4px); justify-content: center; }
  .stats #scanStatus { width: 100%; }
  .results { grid-template-columns: 1fr; grid-auto-rows: 520px; }
}
`;

export default function RegionalIssuesPage() {
  return (
    <LegacyPage
      title="Isu Daerah Realtime"
      fontsHref="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
      extraStylesheets={["https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"]}
      beforeScriptSrc={[]}
      styleText={`${styleText}\n${regionalGlassTheme}`}
      bodyHtml={bodyHtml}
      scriptText={scriptText}
    />
  );
}
