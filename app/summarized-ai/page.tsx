import LegacyPage from '../_components/LegacyPage';

const styleText = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; border-radius: 0 !important; }
:root {
  --bg: #f7f7f7;
  --panel: #ffffff;
  --panel2: #f1f1f1;
  --border: #d8d8d8;
  --border2: #bdbdbd;
  --text: #101010;
  --text2: #555;
  --text3: #8a8a8a;
  --inverse: #0f0f0f;
  --inverse-text: #fff;
  --font-head: 'Syne', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'DM Mono', monospace;
}
html[data-theme="dark"] {
  --bg: #080808;
  --panel: #101010;
  --panel2: #171717;
  --border: #292929;
  --border2: #3a3a3a;
  --text: #f5f5f5;
  --text2: #b7b7b7;
  --text3: #747474;
  --inverse: #fff;
  --inverse-text: #000;
}
body {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 14px;
  overflow: hidden;
}
.shell {
  height: calc(100vh - 64px - 34px);
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  background: var(--bg);
}
.chat-area {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  border-right: 1px solid var(--border);
}
.chat-head {
  min-height: 74px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}
.head-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.head-title strong {
  font-family: var(--font-head);
  font-size: 22px;
  line-height: 1.1;
}
.head-title span,
.chat-status,
.source-meta,
.message-meta {
  color: var(--text3);
  font-family: var(--font-mono);
  font-size: 11px;
}
.chat-status {
  padding: 7px 10px;
  border: 1px solid var(--border);
  background: var(--panel2);
  text-transform: uppercase;
}
.messages {
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.message {
  max-width: min(780px, 92%);
  display: grid;
  gap: 7px;
}
.message.user {
  align-self: flex-end;
}
.message.assistant {
  align-self: flex-start;
}
.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
}
.bubble {
  border: 1px solid var(--border);
  background: var(--panel);
  padding: 14px 15px;
  line-height: 1.72;
  white-space: pre-wrap;
}
.message.user .bubble {
  background: var(--inverse);
  color: var(--inverse-text);
  border-color: var(--inverse);
}
.message.loading .bubble {
  color: var(--text2);
}
.composer {
  border-top: 1px solid var(--border);
  background: var(--panel);
  padding: 14px 18px;
}
.composer-box {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: end;
  gap: 10px;
}
textarea {
  width: 100%;
  min-height: 48px;
  max-height: 160px;
  resize: vertical;
  padding: 13px 14px;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  outline: none;
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.55;
}
textarea::placeholder {
  color: var(--text3);
}
.btn {
  height: 48px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--inverse);
  background: var(--inverse);
  color: var(--inverse-text);
  font-family: var(--font-head);
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.btn.secondary {
  background: transparent;
  color: var(--text2);
  border-color: var(--border2);
}
.btn:hover:not(:disabled) {
  opacity: 0.86;
}
.btn:disabled {
  opacity: 0.55;
  cursor: wait;
}
.composer-hint {
  margin-top: 9px;
  color: var(--text3);
  font-family: var(--font-mono);
  font-size: 11px;
}
.sources-panel {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  background: var(--panel);
}
.sources-head {
  padding: 18px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.sources-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-head);
  font-size: 16px;
  font-weight: 800;
}
.sources-list {
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.source-card {
  border: 1px solid var(--border);
  background: var(--bg);
  padding: 13px;
  display: grid;
  gap: 8px;
}
.source-title {
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
}
.source-open {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  background: var(--inverse);
  color: var(--inverse-text);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: 11px;
}
.empty {
  min-height: 220px;
  display: grid;
  place-items: center;
  color: var(--text3);
  text-align: center;
  line-height: 1.7;
}
.empty i {
  display: block;
  font-size: 42px;
  margin-bottom: 10px;
}
@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
@media (max-width: 1040px) {
  body { overflow: auto; }
  .shell {
    height: auto;
    min-height: calc(100vh - 64px - 34px);
    grid-template-columns: 1fr;
  }
  .chat-area {
    min-height: 70vh;
    border-right: 0;
  }
  .sources-panel {
    min-height: 360px;
    border-top: 1px solid var(--border);
  }
}
@media (max-width: 680px) {
  .chat-head {
    align-items: flex-start;
    flex-direction: column;
    padding: 16px;
  }
  .messages {
    padding: 16px;
  }
  .message {
    max-width: 100%;
  }
  .composer-box {
    grid-template-columns: 1fr;
  }
  .btn {
    width: 100%;
  }
}
`;

const bodyHtml = `
<div class="shell">
  <main class="chat-area">
    <header class="chat-head">
      <div class="head-title">
        <strong>Summarized AI</strong>
        <span>chatbot pencarian dan ringkasan berita</span>
      </div>
      <div class="chat-status" id="aiStatus">ready</div>
    </header>

    <section class="messages" id="messagesList" aria-label="Percakapan AI"></section>

    <section class="composer" aria-label="Kirim pertanyaan">
      <div class="composer-box">
        <textarea id="aiPrompt" rows="2" placeholder="Tanya berita apa saja, contoh: ringkas konflik orangutan dan perdagangan satwa terbaru."></textarea>
        <button class="btn" id="sendBtn" type="button"><i class="ti ti-send"></i> Kirim</button>
        <button class="btn secondary" id="clearBtn" type="button"><i class="ti ti-refresh"></i> Reset</button>
      </div>
      <div class="composer-hint">Enter untuk kirim. Shift + Enter untuk baris baru.</div>
    </section>
  </main>

  <aside class="sources-panel">
    <div class="sources-head">
      <div class="sources-title"><i class="ti ti-news"></i> Sumber Berita</div>
      <div class="source-meta" id="sourcesMeta">0 sumber</div>
    </div>
    <div class="sources-list" id="sourcesList"></div>
  </aside>
</div>
`;

const scriptText = `
let CHAT = [];
let CURRENT_SOURCES = [];
let isLoading = false;

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeLink(link) {
  try {
    const url = new URL(String(link || '').trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function formatDateID(dateStr) {
  if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return 'Tanggal tidak tersedia';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime()) || d.getFullYear() <= 1970) return 'Tanggal tidak tersedia';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function scrollMessagesToBottom() {
  const list = document.getElementById('messagesList');
  requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });
}

function renderMessages() {
  const list = document.getElementById('messagesList');
  if (!CHAT.length) {
    list.innerHTML = '<div class="empty"><div><i class="ti ti-message-circle"></i><p>Mulai percakapan dengan bertanya berita yang ingin dicari dan diringkas.</p></div></div>';
    return;
  }

  list.innerHTML = CHAT.map((msg) => {
    const loading = msg.loading ? ' loading' : '';
    return \`
      <article class="message \${msg.role}\${loading}">
        <div class="message-meta">
          <span>\${msg.role === 'user' ? 'Anda' : 'AI'}</span>
          \${msg.meta ? \`<span>\${escapeHtml(msg.meta)}</span>\` : ''}
        </div>
        <div class="bubble">\${escapeHtml(msg.content || '')}</div>
      </article>
    \`;
  }).join('');
  scrollMessagesToBottom();
}

function renderSources() {
  const list = document.getElementById('sourcesList');
  document.getElementById('sourcesMeta').textContent = CURRENT_SOURCES.length + ' sumber';

  if (!CURRENT_SOURCES.length) {
    list.innerHTML = '<div class="empty"><div><i class="ti ti-news-off"></i><p>Sumber berita dari jawaban terakhir akan muncul di sini.</p></div></div>';
    return;
  }

  list.innerHTML = CURRENT_SOURCES.map((item) => {
    const link = safeLink(item.link);
    return \`
      <article class="source-card">
        <div class="source-meta">
          <span>\${escapeHtml(item.source || 'Unknown')}</span>
          <span>\${formatDateID(item.date)}</span>
        </div>
        <div class="source-title">\${escapeHtml(item.title || '-')}</div>
        <a class="source-open" href="\${escapeHtml(link || '#')}" target="_blank" rel="noopener noreferrer">
          <i class="ti ti-external-link"></i> Buka berita
        </a>
      </article>
    \`;
  }).join('');
}

function setLoadingState(running) {
  isLoading = running;
  const btn = document.getElementById('sendBtn');
  const status = document.getElementById('aiStatus');
  btn.disabled = running;
  btn.innerHTML = running
    ? '<i class="ti ti-loader-2" style="font-size:16px;animation:spin 1s linear infinite"></i> Memproses'
    : '<i class="ti ti-send"></i> Kirim';
  status.textContent = running ? 'thinking' : 'ready';
}

async function readApiJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    const plain = text
      .replace(/<script[\\s\\S]*?<\\/script>/gi, ' ')
      .replace(/<style[\\s\\S]*?<\\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\\s+/g, ' ')
      .trim()
      .slice(0, 220);
    throw new Error(
      plain
        ? \`Server mengembalikan HTML/error page, bukan JSON (HTTP \${response.status}). \${plain}\`
        : \`Server mengembalikan respons kosong atau bukan JSON (HTTP \${response.status}).\`
    );
  }
}

async function sendMessage() {
  if (isLoading) return;

  const input = document.getElementById('aiPrompt');
  const query = input.value.trim();
  if (!query) return;

  input.value = '';
  CHAT.push({ role: 'user', content: query });
  const loadingId = Date.now();
  CHAT.push({ role: 'assistant', content: 'Mencari berita dan menyusun ringkasan...', loading: true, id: loadingId });
  renderMessages();
  setLoadingState(true);

  try {
    const response = await fetch('/api/ai-news-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await readApiJson(response);
    if (!response.ok) throw new Error(data.detail || data.error || 'Gagal membuat ringkasan');

    const provider = data.provider || (data.aiEnabled ? 'ai' : 'fallback');
    CURRENT_SOURCES = Array.isArray(data.results) ? data.results : [];
    const idx = CHAT.findIndex((msg) => msg.id === loadingId);
    if (idx >= 0) {
      CHAT[idx] = {
        role: 'assistant',
        content: data.summary || 'Ringkasan tidak tersedia.',
        meta: \`\${CURRENT_SOURCES.length} berita | \${provider}\`,
      };
    }
    document.getElementById('aiStatus').textContent = provider;
    renderSources();
  } catch (err) {
    const idx = CHAT.findIndex((msg) => msg.id === loadingId);
    if (idx >= 0) {
      CHAT[idx] = {
        role: 'assistant',
        content: err.message || 'Gagal membuat ringkasan.',
        meta: 'error',
      };
    }
    document.getElementById('aiStatus').textContent = 'error';
  } finally {
    setLoadingState(false);
    renderMessages();
  }
}

function resetChat() {
  CHAT = [];
  CURRENT_SOURCES = [];
  document.getElementById('aiPrompt').value = '';
  document.getElementById('aiStatus').textContent = 'ready';
  renderMessages();
  renderSources();
}

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('clearBtn').addEventListener('click', resetChat);
document.getElementById('aiPrompt').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

renderMessages();
renderSources();
`;

export default function SummarizedAiPage() {
  return (
    <LegacyPage
      title="Summarized AI"
      fontsHref="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@500;700;800&family=Inter:wght@300;400;500;600&display=swap"
      extraStylesheets={["https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"]}
      beforeScriptSrc={[]}
      styleText={styleText}
      bodyHtml={bodyHtml}
      scriptText={scriptText}
    />
  );
}
