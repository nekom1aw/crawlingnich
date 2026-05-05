const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static(__dirname));

// =============================
// HOMEPAGE
// =============================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pdf.html'));
});

// =============================
// SEARCH PDF (SMART + FILTER)
// =============================
app.post('/api/search-pdf', async (req, res) => {
    const { keyword } = req.body;

    if (!keyword) {
        return res.json({ error: 'Keyword kosong', results: [] });
    }

    const results = [];
    const seen = new Set();

    // 🔥 multi query biar nggak kosong
    const queries = [
        `${keyword} filetype:pdf`,
        `${keyword} pdf`,
        `${keyword} report`,
        `${keyword} sustainability`,
        `${keyword} annual report`
    ];

    try {
        for (const q of queries) {

            const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;

            const response = await axios.get(searchUrl, {
                headers: { "User-Agent": "Mozilla/5.0" }
            });

            const $ = cheerio.load(response.data);

            $("li.b_algo h2 a").each((i, el) => {
                const title = $(el).text().trim();
                const link = $(el).attr("href");

                if (!link || seen.has(link)) return;

                // 🔥 filter PDF
                const isPDF =
                    link.toLowerCase().includes(".pdf") ||
                    title.toLowerCase().includes("pdf") ||
                    title.toLowerCase().includes("report");

                // 🔥 filter relevansi keyword
                const keywordParts = keyword.toLowerCase().split(" ");
                const isRelevant = keywordParts.some(k =>
                    title.toLowerCase().includes(k)
                );

                if (isPDF && isRelevant) {
                    seen.add(link);

                    results.push({
                        type: "document",
                        title: title,
                        link: link,
                        source: new URL(link).hostname
                    });
                }
            });
        }

        res.json({
            success: true,
            total: results.length,
            results
        });

    } catch (err) {
        res.json({
            error: "Gagal mengambil PDF",
            detail: err.message
        });
    }
});

// =============================
app.listen(PORT, () => {
    console.log(`
🚀 PDF SEARCH SERVER JALAN
📍 http://localhost:${PORT}
`);
});