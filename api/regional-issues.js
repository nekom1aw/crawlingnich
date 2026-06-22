const axios = require("axios");
const { parseString } = require("xml2js");

const REGIONAL_ISSUE_TOPICS = [
  { label: "Lingkungan", terms: ["lingkungan", "limbah", "pencemaran", "hutan", "karhutla"] },
  { label: "Bencana", terms: ["banjir", "longsor", "gempa", "kebakaran", "cuaca ekstrem"] },
  { label: "Konflik Sosial", terms: ["konflik", "sengketa", "bentrok", "demo", "protes"] },
  { label: "Ekonomi", terms: ["ekonomi", "harga pangan", "inflasi", "umkm", "investasi"] },
  { label: "Kriminal", terms: ["kriminal", "narkoba", "pencurian", "pembunuhan", "penipuan"] },
  { label: "Korupsi", terms: ["korupsi", "gratifikasi", "suap", "kejaksaan", "kpk"] },
  { label: "Infrastruktur", terms: ["jalan rusak", "jembatan", "transportasi", "proyek", "pembangunan"] },
  { label: "Kesehatan", terms: ["kesehatan", "rumah sakit", "dinkes", "dbd", "stunting"] },
];

const CELEBRITY_HEALTH_TERMS = [
  "artis", "seleb", "selebriti", "aktor", "aktris", "penyanyi", "musisi",
  "influencer", "youtuber", "tiktoker", "presenter", "komedian",
  "sinetron", "film", "drakor", "kpop", "idol", "gosip", "hiburan",
  "infotainment", "hotman", "raffi", "nagita", "ayu ting ting",
  "lesti", "rizky billar", "atta", "aurel", "nikita mirzani",
];

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
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
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

function detectRegionalIssue(title = "", fallbackTopic = "") {
  const lowerTitle = title.toLowerCase();
  const matchedTopic = REGIONAL_ISSUE_TOPICS.find((topic) => (
    topic.terms.some((term) => lowerTitle.includes(term.toLowerCase()))
  ));
  return matchedTopic?.label || fallbackTopic || "Isu Daerah";
}

function isCelebrityHealthIssue(title = "", source = "", issue = "") {
  if (issue !== "Kesehatan") return false;
  const text = `${title} ${source}`.toLowerCase();
  return CELEBRITY_HEALTH_TERMS.some((term) => text.includes(term));
}

async function fetchNewsFeedItems(query, maxItems = 8) {
  const feeds = [
    `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&setlang=id-ID`,
    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=id&gl=ID&ceid=ID:id`,
  ];
  const items = [];
  const feedResponses = await Promise.allSettled(feeds.map((url) => (
    axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 8000,
    }).then((response) => response.data)
  )));

  for (const feedResult of feedResponses) {
    if (items.length >= maxItems) break;
    if (feedResult.status === "rejected") continue;

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
      console.log("Regional feed skip:", err.message);
    }
  }

  return items;
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ message: "API regional-issues aktif (gunakan POST)" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      regions = [],
      startDate = null,
      endDate = null,
      maxPerRegion = null,
    } = req.body || {};

    const cleanRegions = [...new Set(
      regions.map((region) => String(region || "").trim()).filter(Boolean)
    )].slice(0, 12);

    if (!cleanRegions.length) {
      return res.status(400).json({ error: "Daerah tidak boleh kosong", results: [] });
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

        const query = `${region} ${topic.terms.slice(0, 3).join(" OR ")}`;
        const remaining = hasRegionLimit ? numericLimit - addedForRegion : 40;
        const items = await fetchNewsFeedItems(query, Math.max(1, remaining));

        for (const item of items) {
          if (hasRegionLimit && addedForRegion >= numericLimit) break;

          const link = item.link?.[0];
          if (!link || seen.has(link)) continue;

          const pubDate = item.pubDate?.[0];
          const isoDate = toIsoDate(pubDate) || pubDate || null;
          if (!isWithinDateRange(isoDate, startBoundary, endBoundary)) continue;

          const title = item.title?.[0] || "Tanpa Judul";
          const issue = detectRegionalIssue(title, topic.label);
          const source = extractRssSource(item, link);
          if (isCelebrityHealthIssue(title, source, issue)) continue;

          seen.add(link);
          addedForRegion++;
          results.push({
            type: "regional",
            title,
            link,
            date: isoDate,
            source,
            region,
            issue,
            matchedKeywords: `${region} - ${issue}`,
          });
        }
      }
    }

    results.sort((a, b) => {
      const bTime = new Date(b.date || 0).getTime() || 0;
      const aTime = new Date(a.date || 0).getTime() || 0;
      return bTime - aTime;
    });

    return res.status(200).json({
      success: true,
      total: results.length,
      results,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      detail: err.message,
    });
  }
};
