import axios from "axios";
import { parseString } from "xml2js";

function extractSource(link) {
  try {
    const url = new URL(link);
    const source = url.hostname.replace("www.", "").split(".")[0];
    return source.charAt(0).toUpperCase() + source.slice(1);
  } catch {
    return "Unknown";
  }
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

function inYearRange(year, yearFrom, yearTo) {
  if (!year) return true;
  if (yearFrom && year < yearFrom) return false;
  if (yearTo && year > yearTo) return false;
  return true;
}

export default async function handler(req, res) {
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
      yearFrom = null,
      yearTo = null,
    } = req.body || {};

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
          const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=id&gl=ID&ceid=ID:id`;
          const response = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
          });

          const parsed = await new Promise((resolve, reject) => {
            parseString(response.data, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
          });

          const items = parsed?.rss?.channel?.[0]?.item || [];

          items.forEach((item) => {
            const link = item.link?.[0];
            if (!link || seen.has(link)) return;

            const rawPubDate = item.pubDate?.[0] || null;
            const isoDate = toIsoDate(rawPubDate);
            const pubYear = isoDate ? new Date(isoDate).getUTCFullYear() : null;

            if (!inYearRange(pubYear, yearFrom, yearTo)) return;

            seen.add(link);
            results.push({
              type: "news",
              title: item.title?.[0] || "Tanpa Judul",
              link,
              date: isoDate,
              source: extractSource(link),
              matchedKeywords: `${primary} + ${secondary}`,
            });
          });
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

            const publicationYear = p.publication_year || null;
            if (!inYearRange(publicationYear, yearFrom, yearTo)) return;

            seen.add(link);
            results.push({
              type: "journal",
              title: p.title || "Tanpa Judul",
              link,
              date: yearToIso(publicationYear),
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
}
