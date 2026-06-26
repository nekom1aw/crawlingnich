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

function cleanText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizeKeyword(value = "") {
  return cleanText(value).toLowerCase();
}

function compactKeyword(value = "") {
  return normalizeKeyword(value).replace(/[^a-z0-9]+/gi, "");
}

function getRssSnippet(item) {
  return cleanText(
    item?.description?.[0] ||
    item?.["media:description"]?.[0] ||
    item?.content?.[0] ||
    ""
  );
}

function isRelevantToKeywords(title = "", snippet = "", keywords = []) {
  const haystack = normalizeKeyword(`${title} ${snippet}`);
  const compactHaystack = compactKeyword(`${title} ${snippet}`);
  return keywords
    .map(normalizeKeyword)
    .filter(Boolean)
    .every((keyword) => haystack.includes(keyword) || compactHaystack.includes(compactKeyword(keyword)));
}

function isFeaturedCrawlResult(item = {}) {
  const source = String(item.source || "").toLowerCase();
  const link = String(item.link || "").toLowerCase();
  return source.includes("betahita") || link.includes("betahita.id");
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
  const response = await axios.get("https://www.bing.com/search", {
    params: { q: query, setlang: "id-ID" },
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    timeout: 10000,
    responseType: "text",
  });

  const cheerio = require("cheerio");
  const $ = cheerio.load(response.data || "");
  const results = [];

  $("li.b_algo").each((_, el) => {
    if (results.length >= maxItems) return false;
    const anchor = $(el).find("h2 a").first();
    const title = cleanText(anchor.text());
    const link = anchor.attr("href") || "";
    const snippet = cleanText(
      $(el).find(".b_caption p").first().text() ||
      $(el).find("p").first().text()
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
    `"${keywords.filter(Boolean).join("\" \"")}"`,
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
          const feedResponses = await Promise.allSettled(feeds.map((url) => (
            axios.get(url, {
              headers: { "User-Agent": "Mozilla/5.0" },
              timeout: 8000,
            }).then((response) => ({ url, response }))
          )));

          for (const feedResult of feedResponses) {
            if (addedNews >= 10) break;
            if (feedResult.status === "rejected") {
              console.log("News feed skip:", feedResult.reason?.message || "Feed gagal");
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

                const rawPubDate = item.pubDate?.[0] || null;
                const isoDate = toIsoDate(rawPubDate);
                if (!isWithinDateRange(isoDate, startBoundary, endBoundary)) continue;

                seen.add(link);
                const title = item.title?.[0] || "Tanpa Judul";
                const snippet = getRssSnippet(item);
                addedNews++;
                results.push({
                  type: "news",
                  title,
                  link,
                  date: isoDate,
                  source: extractRssSource(item, link),
                  snippet,
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

        try {
          const webResults = await fetchExpandedBingWebResults(query, [primary, secondary], 12);
          for (const item of webResults) {
            if (!item.link || seen.has(item.link)) continue;
            seen.add(item.link);
            results.push({
              type: "news",
              title: item.title,
              link: item.link,
              date: null,
              source: item.source,
              snippet: item.snippet,
              matchedKeywords: `${primary} + ${secondary}`,
            });
          }
        } catch (err) {
          console.log("Web search fallback error:", err.message);
        }

        // JOURNAL
        try {
          const response = await axios.get("https://api.openalex.org/works", {
            params: {
              search: query,
              per_page: 10,
            },
            timeout: 8000,
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

    const prioritizedResults = prioritizeCrawlResults(results);

    return res.status(200).json({
      success: true,
      total: prioritizedResults.length,
      results: prioritizedResults,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Server error",
      detail: err.message,
    });
  }
};
