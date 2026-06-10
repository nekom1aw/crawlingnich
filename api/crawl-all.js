const axios = require("axios");
const { parseString } = require("xml2js");

function extractSource(link) {
  try {
    const url = new URL(link);
    const source = url.hostname.replace("www.", "").split(".")[0];
    return source.charAt(0).toUpperCase() + source.slice(1);
  } catch {
    return "Unknown";
  }
}

function extractRssSource(item, fallbackLink) {
  const source = item?.source?.[0];
  if (typeof source === "string" && source.trim()) return source.trim();
  if (source?._) return source._;
  return extractSource(fallbackLink);
}

function toIsoDate(input) {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function yearToIso(year) {
  if (!year || Number.isNaN(Number(year))) return null;
  return `${year}-01-01T00:00:00.000Z`;
}

function parseBoundaryDate(value, endOfDay = false) {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
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

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      message: "API crawl-all aktif (gunakan POST)",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      primaryKeywords = [],
      secondaryKeywords = [],
      startDate = null,
      endDate = null,
    } = req.body || {};

    const startBoundary = parseBoundaryDate(startDate, false);
    const endBoundary = parseBoundaryDate(endDate, true);

    if (!primaryKeywords.length || !secondaryKeywords.length) {
      return res.status(400).json({
        error: "Keyword tidak boleh kosong",
        results: [],
      });
    }

    const results = [];
    const seen = new Set();

    for (const primary of primaryKeywords) {
      for (const secondary of secondaryKeywords) {
        const query = `${primary} ${secondary}`.trim();

        // NEWS
        try {
          const feeds = [
            `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&setlang=id-ID`,
            `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=id&gl=ID&ceid=ID:id`,
          ];

          let addedNews = 0;
          for (const url of feeds) {
            if (addedNews >= 10) break;

            try {
              const response = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 15000,
              });

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

                const rawPubDate = item.pubDate?.[0] || null;
                const isoDate = toIsoDate(rawPubDate);
                if (!isWithinDateRange(isoDate, startBoundary, endBoundary)) continue;

                seen.add(link);
                addedNews++;
                results.push({
                  type: "news",
                  title: item.title?.[0] || "Tanpa Judul",
                  link,
                  date: isoDate,
                  source: extractRssSource(item, link),
                  matchedKeywords: `${primary} + ${secondary}`,
                });
              }
            } catch (feedErr) {
              console.log("News feed skip:", feedErr.message);
            }
          }
        } catch (err) {
          console.log("News error:", err.message);
        }

        // JOURNAL
        try {
          const response = await axios.get("https://api.openalex.org/works", {
            params: {
              search: query,
              per_page: 10,
            },
          });

          const papers = response.data?.results || [];

          papers.forEach((p) => {
            const link = p.primary_location?.landing_page_url || p.id || "";
            if (!link || seen.has(link)) return;

            const publicationDate = yearToIso(p.publication_year || null);
            if (!isWithinDateRange(publicationDate, startBoundary, endBoundary)) return;

            seen.add(link);
            results.push({
              type: "journal",
              title: p.title || "Tanpa Judul",
              link,
              date: publicationDate,
              source: extractSource(link),
              matchedKeywords: `${primary} + ${secondary}`,
            });
          });
        } catch (err) {
          console.log("Journal error:", err.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      total: results.length,
      results,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Server error",
      detail: err.message,
    });
  }
};
