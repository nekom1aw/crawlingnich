const express = require('express');
const axios = require('axios');
const { parseString } = require('xml2js');

const app = express();
const PORT = 3000;

// =============================
// MIDDLEWARE
// =============================
app.use(express.json());
app.use(express.static('.'));

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

// =============================
// 🔥 MAIN: NEWS + JOURNAL
// =============================
app.post('/api/crawl-all', async (req, res) => {
    const { primaryKeywords, secondaryKeywords, yearFrom, yearTo } = req.body;

    if (!primaryKeywords?.length || !secondaryKeywords?.length) {
        return res.json({ error: 'Keyword tidak boleh kosong', results: [] });
    }

    const results = [];
    const seen = new Set();

    for (const primary of primaryKeywords) {
        for (const secondary of secondaryKeywords) {

            const query = `${primary} ${secondary}`;
            console.log(`🔍 Query: ${query}`);

            // =====================
            // 1. NEWS (Google RSS)
            // =====================
            try {
                const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=id&gl=ID&ceid=ID:id`;

                const response = await axios.get(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                const parsed = await new Promise((resolve, reject) => {
                    parseString(response.data, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                const items = parsed?.rss?.channel?.[0]?.item || [];

                items.forEach(item => {
                    const link = item.link?.[0];
                    if (!link || seen.has(link)) return;

                    let year = null;
                    const pubDate = item.pubDate?.[0];

                    if (pubDate) {
                        try { year = new Date(pubDate).getFullYear(); } catch { }
                    }

                    if (yearFrom && yearTo && year) {
                        if (year < yearFrom || year > yearTo) return;
                    }

                    seen.add(link);

                    results.push({
                        type: "news",
                        title: item.title?.[0],
                        link: link,
                        date: formatDate(pubDate),
                        source: extractSource(link),
                        matchedKeywords: `${primary} + ${secondary}`
                    });
                });

            } catch (err) {
                console.log("❌ News error:", err.message);
            }

            // =====================
            // 2. JOURNAL (OpenAlex)
            // =====================
            try {
                const response = await axios.get("https://api.openalex.org/works", {
                    params: {
                        search: query,
                        per_page: 10
                    }
                });

                const papers = response.data.results;

                papers.forEach(p => {
                    const link = p.primary_location?.landing_page_url || '';
                    if (!link || seen.has(link)) return;

                    const year = p.publication_year;

                    if (yearFrom && yearTo && year) {
                        if (year < yearFrom || year > yearTo) return;
                    }

                    seen.add(link);
                    results.push({
                        type: "journal",
                        title: p.title,
                        link: link,
                        date: year || '-',
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

            // Delay biar aman
            await new Promise(r => setTimeout(r, 500));
        }
    }

    console.log(`✅ Total hasil: ${results.length}`);

    res.json({
        success: true,
        total: results.length,
        results
    });
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