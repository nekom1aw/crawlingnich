const express = require('express');
const axios = require('axios');
const { parseString } = require('xml2js');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

function loadLocalEnv() {
    const envPaths = [
        path.join(__dirname, '.env.local'),
        path.join(__dirname, '.env'),
    ];

    for (const envPath of envPaths) {
        if (!fs.existsSync(envPath)) continue;

        const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            if (key && process.env[key] === undefined) process.env[key] = value;
        }
    }
}

loadLocalEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// =============================
// MIDDLEWARE
// =============================
app.use(express.json());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/isu-daerah', (req, res) => {
    res.sendFile(path.join(__dirname, 'isu-daerah.html'));
});
app.get('/summarized-ai', (req, res) => {
    res.sendFile(path.join(__dirname, 'summarized-ai.html'));
});
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/image', express.static(path.join(__dirname, 'image')));

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// =============================
// HELPER
// =============================
function extractYear(text) {
    if (!text) return null;
    const match = text.match(/(20\d{2})/);
    return match ? parseInt(match[1]) : null;
}

function extractSource(link) {
    try {
        const url = new URL(link);
        let source = url.hostname.replace('www.', '').split('.')[0];
        return source.charAt(0).toUpperCase() + source.slice(1);
    } catch {
        return 'Unknown';
    }
}

function extractRssSource(item, fallbackLink) {
    const source = item?.source?.[0];
    if (typeof source === 'string' && source.trim()) return source.trim();
    if (source?._) return source._;
    return extractSource(fallbackLink);
}

function toIsoDate(input) {
    if (!input) return null;
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
}

function parseIndonesianDateText(value = '') {
    const monthMap = {
        januari: 0,
        februari: 1,
        maret: 2,
        april: 3,
        mei: 4,
        juni: 5,
        juli: 6,
        agustus: 7,
        september: 8,
        oktober: 9,
        november: 10,
        desember: 11,
    };
    const match = cleanText(value).match(/(?:senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu)?[,]?\s*(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})/i);
    if (!match) return null;

    const day = Number(match[1]);
    const month = monthMap[match[2].toLowerCase()];
    const year = Number(match[3]);
    if (!day || month === undefined || !year) return null;

    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0)).toISOString();
}

function formatDate(pubDate) {
    if (!pubDate) return 'Tanggal tidak tersedia';
    try {
        return new Date(pubDate).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return 'Tanggal tidak tersedia';
    }
}

function parseBoundaryDate(value, endOfDay = false) {
    if (!value) return null;
    const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

function isWithinDateRange(dateValue, startDate, endDate) {
    if (!dateValue) return true;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return true;
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
}

const REGIONAL_ISSUE_TOPICS = [
    { label: 'Lingkungan', terms: ['lingkungan', 'limbah', 'pencemaran', 'hutan', 'karhutla'] },
    { label: 'Bencana', terms: ['banjir', 'longsor', 'gempa', 'kebakaran', 'cuaca ekstrem'] },
    { label: 'Konflik Sosial', terms: ['konflik', 'sengketa', 'bentrok', 'demo', 'protes'] },
    { label: 'Ekonomi', terms: ['ekonomi', 'harga pangan', 'inflasi', 'umkm', 'investasi'] },
    { label: 'Kriminal', terms: ['kriminal', 'narkoba', 'pencurian', 'pembunuhan', 'penipuan'] },
    { label: 'Korupsi', terms: ['korupsi', 'gratifikasi', 'suap', 'kejaksaan', 'kpk'] },
    { label: 'Infrastruktur', terms: ['jalan rusak', 'jembatan', 'transportasi', 'proyek', 'pembangunan'] },
    { label: 'Kesehatan', terms: ['kesehatan', 'rumah sakit', 'dinkes', 'dbd', 'stunting'] },
];

const CELEBRITY_HEALTH_TERMS = [
    'artis', 'seleb', 'selebriti', 'aktor', 'aktris', 'penyanyi', 'musisi',
    'influencer', 'youtuber', 'tiktoker', 'presenter', 'komedian',
    'sinetron', 'film', 'drakor', 'kpop', 'idol', 'gosip', 'hiburan',
    'infotainment', 'hotman', 'raff i', 'raffi', 'nagita', 'ayu ting ting',
    'lesti', 'rizky billar', 'att a', 'atta', 'aurel', 'nikita mirzani',
];

function detectRegionalIssue(title = '', fallbackTopic = '') {
    const lowerTitle = title.toLowerCase();
    const matchedTopic = REGIONAL_ISSUE_TOPICS.find(topic => (
        topic.terms.some(term => lowerTitle.includes(term.toLowerCase()))
    ));
    return matchedTopic?.label || fallbackTopic || 'Isu Daerah';
}

function isCelebrityHealthIssue(title = '', source = '', issue = '') {
    if (issue !== 'Kesehatan') return false;
    const text = `${title} ${source}`.toLowerCase();
    return CELEBRITY_HEALTH_TERMS.some(term => text.includes(term));
}

function buildFallbackNewsSummary(query, articles = [], note = 'Ringkasan ini dibuat tanpa model AI, berdasarkan judul dan metadata berita yang ditemukan.') {
    const topArticles = articles.slice(0, 8);
    const sourceList = [...new Set(topArticles.map(item => item.source).filter(Boolean))].slice(0, 6);
    const latestDate = topArticles
        .map(item => new Date(item.date).getTime())
        .filter(time => !Number.isNaN(time))
        .sort((a, b) => b - a)[0];
    const latestText = latestDate
        ? new Date(latestDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'tanggal terbaru tidak tersedia';

    return [
        `Ringkasan awal untuk "${query}".`,
        `Ditemukan ${articles.length} berita, dengan pembaruan terbaru sekitar ${latestText}.`,
        sourceList.length ? `Sumber yang muncul: ${sourceList.join(', ')}.` : 'Sumber berita tidak tersedia.',
        'Poin utama dari judul berita teratas:',
        ...topArticles.slice(0, 5).map((item, index) => `${index + 1}. ${item.title}`),
        note,
    ].join('\n');
}

function extractOpenAIText(data) {
    if (data.output_text) return data.output_text;
    const chunks = [];
    for (const item of data.output || []) {
        for (const content of item.content || []) {
            if (content.type === 'output_text' && content.text) chunks.push(content.text);
            if (content.type === 'text' && content.text) chunks.push(content.text);
        }
    }
    return chunks.join('\n').trim();
}

function extractGeminiText(data) {
    const parts = data.candidates?.[0]?.content?.parts || [];
    return parts.map(part => part.text || '').filter(Boolean).join('\n').trim();
}

function buildSummaryPrompt(query, articles) {
    const articleContext = articles.slice(0, 25).map((item, index) => (
        `${index + 1}. ${item.title}\nSumber: ${item.source || 'Unknown'}\nTanggal: ${item.date || '-'}\nLink: ${item.link || '-'}`
    )).join('\n\n');

    return `Kamu adalah analis berita berbahasa Indonesia.
Ringkas hanya berdasarkan daftar berita yang diberikan. Jangan mengarang fakta di luar sumber.

Pertanyaan user: ${query}

Daftar berita:
${articleContext}

Buat ringkasan dengan format:
1. Ringkasan utama 3-5 kalimat.
2. Analisis 5W + 1H:
   - What: apa isu atau peristiwa utamanya.
   - Who: siapa pihak utama yang disebut.
   - When: kapan peristiwa atau perkembangan disebut terjadi.
   - Where: di mana lokasi atau konteks wilayahnya.
   - Why: mengapa isu ini terjadi atau penting, berdasarkan sumber.
   - How: bagaimana kronologi, dampak, atau prosesnya.
3. Poin penting bullet pendek.
4. Sumber dominan.
5. Catatan kehati-hatian jika data belum cukup.

Jika salah satu unsur 5W + 1H tidak tersedia di daftar berita, tulis "tidak disebutkan jelas dalam sumber".`;
}

async function summarizeNewsWithGemini(query, articles) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const model = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: buildSummaryPrompt(query, articles) },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.2,
            },
        }),
        signal: AbortSignal.timeout(60000),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error?.message || `Gemini request failed (${response.status})`);
    }

    return {
        aiEnabled: true,
        provider: `gemini:${model}`,
        summary: extractGeminiText(data) || buildFallbackNewsSummary(query, articles, 'Gemini aktif, tetapi respons ringkasan kosong.'),
    };
}

async function summarizeNewsWithVercelAIGateway(query, articles) {
    if (!process.env.AI_GATEWAY_API_KEY) return null;

    const model = process.env.AI_GATEWAY_MODEL || 'anthropic/claude-haiku-4.5';
    const { generateText } = await import('ai');
    const result = await generateText({
        model,
        prompt: buildSummaryPrompt(query, articles),
        temperature: 0.2,
    });

    return {
        aiEnabled: true,
        provider: `vercel-ai-gateway:${model}`,
        summary: result.text || buildFallbackNewsSummary(query, articles, 'Vercel AI Gateway aktif, tetapi respons ringkasan kosong.'),
    };
}

async function summarizeNewsWithDirectGeminiSDK(query, articles) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return null;

    const model = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
    const [{ generateText }, { createGoogleGenerativeAI }] = await Promise.all([
        import('ai'),
        import('@ai-sdk/google'),
    ]);
    const google = createGoogleGenerativeAI({ apiKey });
    const result = await generateText({
        model: google(model),
        prompt: buildSummaryPrompt(query, articles),
        temperature: 0.2,
    });

    return {
        aiEnabled: true,
        provider: `direct-gemini-sdk:${model}`,
        summary: result.text || buildFallbackNewsSummary(query, articles, 'Vercel AI SDK aktif, tetapi respons ringkasan kosong.'),
    };
}

async function summarizeNewsWithAI(query, articles) {
    try {
        const gatewayResult = await summarizeNewsWithVercelAIGateway(query, articles);
        if (gatewayResult) return gatewayResult;
    } catch (err) {
        console.log('Vercel AI Gateway summary skip:', err.message);
    }

    try {
        const sdkResult = await summarizeNewsWithDirectGeminiSDK(query, articles);
        if (sdkResult) return sdkResult;
    } catch (err) {
        console.log('Direct Gemini SDK summary skip:', err.message);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        try {
            const geminiResult = await summarizeNewsWithGemini(query, articles);
            if (geminiResult) return geminiResult;
        } catch (err) {
            console.log('Gemini summary skip:', err.message);
        }

        return {
            aiEnabled: false,
            provider: 'fallback',
            summary: buildFallbackNewsSummary(query, articles),
        };
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
            input: [
                {
                    role: 'system',
                    content: 'Kamu adalah analis berita berbahasa Indonesia. Ringkas hanya berdasarkan daftar berita yang diberikan. Jangan mengarang fakta di luar sumber.',
                },
                {
                    role: 'user',
                    content: buildSummaryPrompt(query, articles),
                },
            ],
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || 'OpenAI summary failed');
    }

    return {
        aiEnabled: true,
        provider: `openai:${process.env.OPENAI_MODEL || 'gpt-4.1-mini'}`,
        summary: extractOpenAIText(data) || buildFallbackNewsSummary(query, articles),
    };
}

function formatSearchDate(date) {
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
}

function appendSearchDateRange(query, startDate = null, endDate = null) {
    const start = formatSearchDate(startDate);
    const end = formatSearchDate(endDate);
    const parts = [query];
    if (start) parts.push(`after:${start}`);
    if (end) parts.push(`before:${end}`);
    return parts.join(' ');
}

async function fetchNewsFeedItems(query, maxItems = 8) {
    const feeds = [
        `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&setlang=id-ID`,
        `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=id&gl=ID&ceid=ID:id`
    ];
    const items = [];
    const feedResponses = await Promise.allSettled(feeds.map(url => (
        axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 8000
        }).then(response => response.data)
    )));

    for (const feedResult of feedResponses) {
        if (items.length >= maxItems) break;
        if (feedResult.status === 'rejected') continue;

        try {
            const parsed = await new Promise((resolve, reject) => {
                parseString(feedResult.value, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            const feedItems = parsed?.rss?.channel?.[0]?.item || [];
            items.push(...feedItems.slice(0, maxItems - items.length));
        } catch (err) {
            console.log('⚠️ Regional feed skip:', err.message);
        }
    }

    return items;
}

async function collectNewsByQuery(query, startBoundary = null, endBoundary = null, maxItems = 40) {
    const items = await fetchNewsFeedItems(query, maxItems);
    const results = [];
    const seen = new Set();

    for (const item of items) {
        const link = item.link?.[0];
        if (!link || seen.has(link)) continue;

        const pubDate = item.pubDate?.[0];
        const isoDate = toIsoDate(pubDate) || pubDate || null;
        if (!isWithinDateRange(isoDate, startBoundary, endBoundary)) continue;

        seen.add(link);
        results.push({
            type: 'news',
            title: item.title?.[0] || 'Tanpa Judul',
            link,
            date: isoDate,
            source: extractRssSource(item, link),
            matchedKeywords: query,
        });
    }

    results.sort((a, b) => {
        const bTime = new Date(b.date || 0).getTime() || 0;
        const aTime = new Date(a.date || 0).getTime() || 0;
        return bTime - aTime;
    });

    return results;
}

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildPreviewFallback(title, message, targetUrl = '') {
    const safeUrl = escapeHtml(targetUrl);
    return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0d0f14; color: #f0f2f8; font-family: Arial, sans-serif; }
  .box { width: min(420px, calc(100vw - 32px)); border: 1px solid rgba(255,255,255,.16); padding: 22px; text-align: center; background: rgba(255,255,255,.04); }
  h1 { margin: 0 0 10px; font-size: 20px; }
  p { color: #9aa0af; line-height: 1.6; font-size: 14px; }
  a { display: inline-block; margin-top: 12px; padding: 10px 12px; background: #fff; color: #000; text-decoration: none; font-weight: 700; }
</style>
</head>
<body>
  <div class="box">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    ${safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Buka sumber asli</a>` : ''}
  </div>
</body>
</html>`;
}

function injectBaseTag(html, finalUrl) {
    const baseTag = `<base href="${escapeHtml(finalUrl)}">`;
    if (/<head[^>]*>/i.test(html)) {
        return html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
    }
    return `${baseTag}${html}`;
}

function absoluteUrl(value, baseUrl) {
    try {
        return new URL(value, baseUrl).toString();
    } catch {
        return '';
    }
}

function cleanText(value = '') {
    return String(value).replace(/\s+/g, ' ').trim();
}

function normalizeKeyword(value = '') {
    return cleanText(value).toLowerCase();
}

function compactKeyword(value = '') {
    return normalizeKeyword(value).replace(/[^a-z0-9]+/gi, '');
}

function getRssSnippet(item) {
    return cleanText(
        item?.description?.[0] ||
        item?.['media:description']?.[0] ||
        item?.content?.[0] ||
        ''
    );
}

function isRelevantToKeywords(title = '', snippet = '', keywords = []) {
    const haystack = normalizeKeyword(`${title} ${snippet}`);
    const compactHaystack = compactKeyword(`${title} ${snippet}`);
    return keywords
        .map(normalizeKeyword)
        .filter(Boolean)
        .every(keyword => haystack.includes(keyword) || compactHaystack.includes(compactKeyword(keyword)));
}

function isFeaturedCrawlResult(item = {}) {
    const source = String(item.source || '').toLowerCase();
    const link = String(item.link || '').toLowerCase();
    return source.includes('betahita') || link.includes('betahita.id');
}

function getResultTime(dateValue) {
    const time = new Date(dateValue || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
}

function prioritizeCrawlResults(items = []) {
    return items
        .map((item, index) => ({
            ...item,
            isFeatured: Boolean(item.isFeatured || isFeaturedCrawlResult(item)),
            _order: index,
        }))
        .sort((a, b) => {
            if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;

            const dateDiff = getResultTime(b.date) - getResultTime(a.date);
            if (dateDiff) return dateDiff;

            return a._order - b._order;
        })
        .map(({ _order, ...item }) => item);
}

async function fetchBingWebResults(query, keywords = [], maxItems = 8) {
    const response = await axios.get('https://www.bing.com/search', {
        params: { q: query, setlang: 'id-ID' },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 10000,
        responseType: 'text',
    });

    const $ = cheerio.load(response.data || '');
    const results = [];

    $('li.b_algo').each((_, el) => {
        if (results.length >= maxItems) return false;
        const anchor = $(el).find('h2 a').first();
        const title = cleanText(anchor.text());
        const link = anchor.attr('href') || '';
        const snippet = cleanText(
            $(el).find('.b_caption p').first().text() ||
            $(el).find('p').first().text()
        );

        if (!title || !link) return;
        if (!/^https?:\/\//i.test(link)) return;
        if (keywords.length && !isRelevantToKeywords(title, snippet, keywords)) return;

        results.push({
            title,
            link,
            snippet,
            source: extractSource(link),
        });
    });

    return results;
}

async function fetchExpandedBingWebResults(query, keywords = [], maxItems = 12) {
    const queryVariants = [
        query,
        `"${keywords.filter(Boolean).join('" "')}"`,
        `${query} opini editorial`,
    ].filter(Boolean);

    const results = [];
    const seen = new Set();

    for (const variant of queryVariants) {
        if (results.length >= maxItems) break;
        const items = await fetchBingWebResults(variant, keywords, maxItems);
        for (const item of items) {
            if (results.length >= maxItems) break;
            if (seen.has(item.link)) continue;
            seen.add(item.link);
            results.push(item);
        }
    }

    return results;
}

function keywordToSlugTokens(keywords = []) {
    return keywords
        .flatMap(keyword => normalizeKeyword(keyword).split(/\s+/))
        .filter(token => token.length >= 3);
}

async function fetchBetahitaSitemapResults(keywords = [], maxItems = 8) {
    const sitemapUrls = [
        'https://www.betahita.id/sitemap-news.xml',
        'https://www.betahita.id/sitemap-web.xml',
    ];
    const slugTokens = keywordToSlugTokens(keywords);
    const candidateUrls = [];
    const seenUrls = new Set();

    for (const sitemapUrl of sitemapUrls) {
        const response = await axios.get(sitemapUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000,
            responseType: 'text',
        });

        const parsed = await new Promise((resolve, reject) => {
            parseString(response.data, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        const urls = parsed?.urlset?.url || [];

        for (const item of urls) {
            const loc = item.loc?.[0];
            if (!loc || seenUrls.has(loc)) continue;
            const slug = normalizeKeyword(loc.replace(/[-_/]+/g, ' '));
            const compactSlug = compactKeyword(slug);
            const hasSlugMatch = keywords.some(keyword => (
                slug.includes(normalizeKeyword(keyword)) ||
                compactSlug.includes(compactKeyword(keyword))
            ));
            if (slugTokens.length && !hasSlugMatch && !slugTokens.some(token => slug.includes(token))) continue;
            seenUrls.add(loc);
            candidateUrls.push(loc);
        }
    }

    const results = [];
    for (const url of candidateUrls.slice(0, 40)) {
        if (results.length >= maxItems) break;
        try {
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000,
                responseType: 'text',
            });
            const $ = cheerio.load(response.data || '');
            const title = cleanText(
                $('meta[property="og:title"]').attr('content') ||
                $('h1').first().text() ||
                $('title').text()
            );
            const snippet = cleanText(
                $('meta[property="og:description"]').attr('content') ||
                $('meta[name="description"]').attr('content') ||
                ''
            );
            const articleText = cleanText($('h1').first().parent().text());
            const date = toIsoDate(
                $('meta[property="article:published_time"]').attr('content') ||
                $('meta[name="publishdate"]').attr('content') ||
                ''
            ) || parseIndonesianDateText(articleText);

            if (!title || !isRelevantToKeywords(title, snippet, keywords)) continue;

            results.push({
                title,
                link: url,
                snippet,
                date,
                source: 'Betahita',
                isFeatured: true,
            });
        } catch (err) {
            console.log('⚠️ Betahita fallback skip:', err.message);
        }
    }

    return results;
}

function extractArticleContent(html, finalUrl) {
    const $ = cheerio.load(html, { baseURI: finalUrl });
    $('script, style, noscript, iframe, svg, form, nav, header, footer, aside, button').remove();

    const title = cleanText(
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('h1').first().text() ||
        $('title').text()
    );
    const description = cleanText(
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content')
    );
    const image = absoluteUrl(
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        $('article img').first().attr('src') ||
        $('main img').first().attr('src') ||
        '',
        finalUrl
    );

    const containers = ['article', 'main', '[role="main"]', '.article', '.post', '.entry-content', '.content'];
    let best = null;
    for (const selector of containers) {
        $(selector).each((_, el) => {
            const paragraphs = [];
            $(el).find('p').each((__, p) => {
                const text = cleanText($(p).text());
                if (text.length >= 45 && !/^baca juga\s*:/i.test(text)) paragraphs.push(text);
            });
            if (!best || paragraphs.join(' ').length > best.paragraphs.join(' ').length) {
                best = { paragraphs };
            }
        });
    }

    if (!best || best.paragraphs.length < 2) {
        const paragraphs = [];
        $('p').each((_, p) => {
            const text = cleanText($(p).text());
            if (text.length >= 55 && !/^baca juga\s*:/i.test(text)) paragraphs.push(text);
        });
        best = { paragraphs };
    }

    return {
        title,
        description,
        image,
        paragraphs: [...new Set(best?.paragraphs || [])].slice(0, 24),
    };
}

function buildArticleReader(article, finalUrl) {
    const safeUrl = escapeHtml(finalUrl);
    const title = article.title || 'Artikel';
    const paragraphHtml = article.paragraphs.length
        ? article.paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join('\n')
        : `<p>${escapeHtml(article.description || 'Konten artikel tidak berhasil diekstrak penuh. Gunakan tombol buka sumber asli untuk melihat halaman lengkap.')}</p>`;

    return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #101217; color: #f0f2f8; font-family: Georgia, 'Times New Roman', serif; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 26px 24px 44px; }
  .kicker { display: inline-block; margin-bottom: 16px; padding: 5px 8px; border: 1px solid rgba(255,255,255,.16); color: #9aa0af; font: 11px monospace; letter-spacing: 1px; text-transform: uppercase; }
  h1 { margin: 0 0 14px; font-family: Arial, sans-serif; font-size: clamp(26px, 5vw, 42px); line-height: 1.12; letter-spacing: -.04em; }
  .desc { color: #b7bbc6; font: 16px/1.65 Arial, sans-serif; margin: 0 0 20px; }
  img { width: 100%; height: auto; margin: 18px 0 22px; border: 1px solid rgba(255,255,255,.12); }
  article { font-size: 18px; line-height: 1.82; }
  p { margin: 0 0 18px; }
  .actions { margin-top: 28px; }
  a { display: inline-block; padding: 11px 13px; background: #fff; color: #000; text-decoration: none; font: 700 12px monospace; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="kicker">Artikel Preview</div>
    <h1>${escapeHtml(title)}</h1>
    ${article.description ? `<p class="desc">${escapeHtml(article.description)}</p>` : ''}
    ${article.image ? `<img src="${escapeHtml(article.image)}" alt="">` : ''}
    <article>${paragraphHtml}</article>
    <div class="actions"><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Buka sumber asli</a></div>
  </div>
</body>
</html>`;
}

function normalizeTargetUrl(value) {
    const raw = Array.isArray(value) ? value[0] : value;
    const text = String(raw || '').trim();
    if (!text || text === '#') return null;

    try {
        return new URL(text);
    } catch {
        const cleaned = text.replace(/^\.\//, '/');
        if (cleaned.startsWith('/articles/') || cleaned.startsWith('/rss/articles/')) {
            return new URL(cleaned, 'https://news.google.com');
        }
        return null;
    }
}

function isGoogleNewsUrl(url) {
    return /(^|\.)news\.google\.com$/i.test(url.hostname);
}

function decodeHtmlEntities(value = '') {
    return String(value)
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

function normalizeEscapedUrl(value = '') {
    return decodeHtmlEntities(value)
        .replace(/\\u003d/g, '=')
        .replace(/\\u0026/g, '&')
        .replace(/\\\//g, '/');
}

function looksLikePublisherUrl(value) {
    try {
        const url = new URL(value);
        const host = url.hostname.toLowerCase();
        if (!['http:', 'https:'].includes(url.protocol)) return false;
        if (host.includes('google.') || host.includes('gstatic.') || host.includes('googleusercontent.')) return false;
        if (host.includes('schema.org') || host.includes('w3.org')) return false;
        if (/\.(css|js|png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|map)$/i.test(url.pathname)) return false;
        return true;
    } catch {
        return false;
    }
}

function extractPublisherUrlFromGoogleHtml(html = '') {
    const text = normalizeEscapedUrl(html);
    const patterns = [
        /data-n-au=["']([^"']+)["']/i,
        /"url"\s*:\s*"([^"]+)"/i,
        /href=["']https:\/\/www\.google\.com\/url\?q=([^"'&]+)[^"']*["']/i,
        /https?:\/\/[^"'<>\s\\]+/gi
    ];

    for (const pattern of patterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const raw = match[1] || match[0];
            const candidate = decodeURIComponent(raw);
            if (looksLikePublisherUrl(candidate)) return candidate;
        }
    }

    return null;
}

async function resolveGoogleNewsUrl(parsedUrl) {
    if (!isGoogleNewsUrl(parsedUrl)) return parsedUrl;

    const response = await axios.get(parsedUrl.toString(), {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000,
        maxRedirects: 8,
        responseType: 'text',
        validateStatus: status => status >= 200 && status < 500
    });

    const finalUrl = response.request?.res?.responseUrl;
    if (finalUrl) {
        const finalParsed = new URL(finalUrl);
        if (!isGoogleNewsUrl(finalParsed)) return finalParsed;
    }

    const publisherUrl = extractPublisherUrlFromGoogleHtml(response.data || '');
    return publisherUrl ? new URL(publisherUrl) : parsedUrl;
}

// =============================
// TEST
// =============================
app.get('/api/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server berjalan!',
        time: new Date().toISOString()
    });
});

app.get('/api/preview', async (req, res) => {
    const targetUrl = req.query.url;

    try {
        if (!targetUrl) {
            return res.status(400).send(buildPreviewFallback(
                'Endpoint tab kanan aktif',
                'Route ini harus dipakai dengan parameter ?url=. Buka artikel dari tombol "Buka di kanan" pada dashboard, bukan membuka /api/preview langsung.'
            ));
        }

        const parsedUrl = normalizeTargetUrl(targetUrl);
        if (!parsedUrl) {
            return res.status(400).send(buildPreviewFallback('URL tidak valid', 'Link sumber kosong atau bukan URL yang bisa dibaca.', targetUrl));
        }
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return res.status(400).send(buildPreviewFallback('URL tidak valid', 'Preview hanya mendukung URL HTTP atau HTTPS.'));
        }

        const resolvedUrl = await resolveGoogleNewsUrl(parsedUrl);

        if (isGoogleNewsUrl(resolvedUrl)) {
            return res.status(422).send(buildPreviewFallback(
                'Link Google News belum kebuka',
                'Google News memberi halaman perantara yang tidak bisa dirender penuh. Pakai tombol buka sumber asli, atau crawl ulang supaya link publisher ikut terambil.',
                resolvedUrl.toString()
            ));
        }

        const response = await axios.get(resolvedUrl.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 15000,
            maxRedirects: 8,
            responseType: 'text',
            validateStatus: status => status >= 200 && status < 500
        });

        const contentType = response.headers['content-type'] || '';
        const finalUrl = response.request?.res?.responseUrl || resolvedUrl.toString();

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Robots-Tag', 'noindex');

        if (!contentType.includes('text/html') || typeof response.data !== 'string') {
            return res.send(buildPreviewFallback('Preview tidak tersedia', 'Sumber ini bukan halaman HTML yang bisa dibaca di panel.', finalUrl));
        }

        const article = extractArticleContent(response.data, finalUrl);
        return res.send(buildArticleReader(article, finalUrl));
    } catch (err) {
        return res.status(502).send(buildPreviewFallback('Preview gagal dimuat', err.message || 'Server tidak bisa mengambil halaman sumber.', targetUrl));
    }
});

// =============================
// 🔥 MAIN: NEWS + JOURNAL
// =============================
app.post('/api/crawl-all', async (req, res) => {
    const { primaryKeywords, secondaryKeywords, startDate, endDate } = req.body;

    if (!primaryKeywords?.length || !secondaryKeywords?.length) {
        return res.json({ error: 'Keyword tidak boleh kosong', results: [] });
    }

    const startBoundary = parseBoundaryDate(startDate, false);
    const endBoundary = parseBoundaryDate(endDate, true);
    const results = [];
    const seen = new Set();

    for (const primary of primaryKeywords) {
        for (const secondary of secondaryKeywords) {

            const query = `${primary} ${secondary}`;
            console.log(`🔍 Query: ${query}`);

            // =====================
            // 1. NEWS (Bing RSS first, Google RSS backup)
            // =====================
            try {
                const feeds = [
                    `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&setlang=id-ID`,
                    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=id&gl=ID&ceid=ID:id`
                ];

                let addedNews = 0;
                const feedResponses = await Promise.allSettled(feeds.map(url => (
                    axios.get(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 8000
                    }).then(response => ({ url, response }))
                )));

                for (const feedResult of feedResponses) {
                    if (addedNews >= 10) break;
                    if (feedResult.status === 'rejected') {
                        console.log("⚠️ News feed skip:", feedResult.reason?.message || 'Feed gagal');
                        continue;
                    }

                    try {
                        const { response } = feedResult.value;

                        const parsed = await new Promise((resolve, reject) => {
                            parseString(response.data, (err, result) => {
                                if (err) reject(err);
                                else resolve(result);
                            });
                        });

                        const items = parsed?.rss?.channel?.[0]?.item || [];

                        for (const item of items) {
                            if (addedNews >= 10) break;

                            const link = item.link?.[0];
                            if (!link || seen.has(link)) continue;

                            const pubDate = item.pubDate?.[0];
                            const isoDate = toIsoDate(pubDate) || pubDate || null;
                            if (!isWithinDateRange(isoDate, startBoundary, endBoundary)) continue;
                            const title = item.title?.[0] || 'Tanpa Judul';
                            const snippet = getRssSnippet(item);

                            seen.add(link);
                            addedNews++;

                            results.push({
                                type: "news",
                                title,
                                link: link,
                                date: isoDate,
                                source: extractRssSource(item, link),
                                snippet,
                                matchedKeywords: `${primary} + ${secondary}`
                            });
                        }
                    } catch (feedErr) {
                        console.log("⚠️ News feed skip:", feedErr.message);
                    }
                }

            } catch (err) {
                console.log("❌ News error:", err.message);
            }

            // =====================
            // 1b. WEB fallback for articles outside news RSS
            // =====================
            try {
                const webResults = await fetchExpandedBingWebResults(query, [primary, secondary], 12);
                for (const item of webResults) {
                    if (seen.has(item.link)) continue;
                    seen.add(item.link);
                    results.push({
                        type: "news",
                        title: item.title,
                        link: item.link,
                        date: null,
                        source: item.source,
                        snippet: item.snippet,
                        matchedKeywords: `${primary} + ${secondary}`
                    });
                }
            } catch (err) {
                console.log("⚠️ Web search fallback error:", err.message);
            }

            try {
                const betahitaResults = await fetchBetahitaSitemapResults([primary, secondary], 8);
                for (const item of betahitaResults) {
                    if (seen.has(item.link)) continue;
                    if (!isWithinDateRange(item.date, startBoundary, endBoundary)) continue;
                    seen.add(item.link);
                    results.push({
                        type: "news",
                        title: item.title,
                        link: item.link,
                        date: item.date,
                        source: item.source,
                        snippet: item.snippet,
                        isFeatured: true,
                        matchedKeywords: `${primary} + ${secondary}`
                    });
                }
            } catch (err) {
                console.log("⚠️ Betahita fallback error:", err.message);
            }

            // =====================
            // 2. JOURNAL (OpenAlex)
            // =====================
            try {
                const response = await axios.get("https://api.openalex.org/works", {
                    params: {
                        search: query,
                        per_page: 10
                    },
                    timeout: 8000
                });

                const papers = response.data.results;

                papers.forEach(p => {
                    const link = p.primary_location?.landing_page_url || '';
                    if (!link || seen.has(link)) return;

                    const publicationDate = p.publication_year ? `${p.publication_year}-01-01T00:00:00.000Z` : null;
                    if (!isWithinDateRange(publicationDate, startBoundary, endBoundary)) return;

                    seen.add(link);
                    results.push({
                        type: "journal",
                        title: p.title,
                        link: link,
                        date: publicationDate,
                        source: link.includes("sciencedirect")
                            ? "ScienceDirect"
                            : link.includes("researchgate")
                                ? "ResearchGate"
                                : "Journal",
                        matchedKeywords: `${primary} + ${secondary}`
                    });
                });

            } catch (err) {
                console.log("❌ Journal error:", err.message);
            }
        }
    }

    const prioritizedResults = prioritizeCrawlResults(results);
    console.log(`✅ Total hasil: ${prioritizedResults.length}`);

    res.json({
        success: true,
        total: prioritizedResults.length,
        results: prioritizedResults
    });
});

app.post('/api/regional-issues', async (req, res) => {
    const {
        regions = [],
        startDate = null,
        endDate = null,
        maxPerRegion = null,
    } = req.body || {};

    const cleanRegions = [...new Set(
        regions.map(region => String(region || '').trim()).filter(Boolean)
    )].slice(0, 12);

    if (!cleanRegions.length) {
        return res.status(400).json({
            error: 'Daerah tidak boleh kosong',
            results: [],
        });
    }

    const startBoundary = parseBoundaryDate(startDate, false);
    const endBoundary = parseBoundaryDate(endDate, true);
    const numericLimit = Number(maxPerRegion);
    const hasRegionLimit = Number.isFinite(numericLimit) && numericLimit > 0;
    const results = [];
    const seen = new Set();

    for (const region of cleanRegions) {
        let addedForRegion = 0;

        for (const topic of REGIONAL_ISSUE_TOPICS) {
            if (hasRegionLimit && addedForRegion >= numericLimit) break;

            const baseQuery = `${region} ${topic.terms.slice(0, 3).join(' OR ')}`;
            const query = appendSearchDateRange(baseQuery, startBoundary, endBoundary);
            try {
                const remaining = hasRegionLimit ? numericLimit - addedForRegion : 40;
                const items = await fetchNewsFeedItems(query, Math.max(1, remaining));

                for (const item of items) {
                    if (hasRegionLimit && addedForRegion >= numericLimit) break;

                    const link = item.link?.[0];
                    if (!link || seen.has(link)) continue;

                    const pubDate = item.pubDate?.[0];
                    const isoDate = toIsoDate(pubDate) || pubDate || null;
                    if (!isWithinDateRange(isoDate, startBoundary, endBoundary)) continue;

                    const title = item.title?.[0] || 'Tanpa Judul';
                    const issue = detectRegionalIssue(title, topic.label);
                    const source = extractRssSource(item, link);
                    if (isCelebrityHealthIssue(title, source, issue)) continue;

                    seen.add(link);
                    addedForRegion++;
                    results.push({
                        type: 'regional',
                        title,
                        link,
                        date: isoDate,
                        source,
                        region,
                        issue,
                        matchedKeywords: `${region} - ${issue}`,
                    });
                }
            } catch (err) {
                console.log('❌ Regional issue error:', err.message);
            }
        }
    }

    results.sort((a, b) => {
        const bTime = new Date(b.date || 0).getTime() || 0;
        const aTime = new Date(a.date || 0).getTime() || 0;
        return bTime - aTime;
    });

    res.json({
        success: true,
        total: results.length,
        results,
    });
});

app.post('/api/ai-news-summary', async (req, res) => {
    try {
        const {
            query = '',
            startDate = null,
            endDate = null,
            maxItems = 40,
        } = req.body || {};

        const cleanQuery = String(query || '').trim();
        if (!cleanQuery) {
            return res.status(400).json({
                error: 'Pertanyaan atau query berita tidak boleh kosong',
                results: [],
            });
        }

        const startBoundary = parseBoundaryDate(startDate, false);
        const endBoundary = parseBoundaryDate(endDate, true);
        const numericMaxItems = Number(maxItems);
        const limit = Number.isFinite(numericMaxItems) && numericMaxItems > 0 ? numericMaxItems : 40;
        const results = await collectNewsByQuery(cleanQuery, startBoundary, endBoundary, Math.min(limit, 80));
        const summaryResult = await summarizeNewsWithAI(cleanQuery, results);

        return res.json({
            success: true,
            query: cleanQuery,
            total: results.length,
            aiEnabled: summaryResult.aiEnabled,
            provider: summaryResult.provider,
            summary: summaryResult.summary,
            results,
        });
    } catch (err) {
        return res.status(500).json({
            error: 'Gagal membuat ringkasan AI',
            detail: err.message,
            results: [],
        });
    }
});

// =============================
// START SERVER
// =============================
app.listen(PORT, () => {
    console.log(`
🚀 SERVER JALAN
📍 http://localhost:${PORT}
🧪 /api/test
🔥 /api/crawl-all
    `);
});
