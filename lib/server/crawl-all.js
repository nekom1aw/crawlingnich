const axios = require("axios");
const { parseString } = require("xml2js");
const { fetchArticleForUrl, resolveArticleUrl } = require("./preview");

function extractSource(link) {
  try {
    const url = new URL(getPublisherLink(link));
    const hostname = url.hostname.replace(/^www\./i, "");
    const parts = hostname.split(".");
    const secondLevelTlds = new Set([
      "ac.id", "co.id", "go.id", "or.id", "sch.id", "web.id", "net.id",
      "co.uk", "com.au", "com.my", "com.sg",
    ]);
    const suffix = parts.slice(-2).join(".");
    const source = secondLevelTlds.has(suffix) && parts.length > 2
      ? parts[parts.length - 3]
      : (parts.length > 2 ? parts[parts.length - 2] : parts[0]);
    return source.charAt(0).toUpperCase() + source.slice(1);
  } catch {
    return "Unknown";
  }
}

function isBlockedAggregatorHost(host = "") {
  return /(^|\.)bing\.com$/i.test(host);
}

function decodeBingWrappedUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const normalized = raw
      .replace(/^a1/i, "")
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = Buffer.from(padded, "base64").toString("utf8");
    return /^https?:\/\//i.test(decoded) ? decoded : "";
  } catch {
    return "";
  }
}

function getPublisherLink(link = "") {
  try {
    const url = new URL(String(link || "").trim());
    const host = url.hostname.toLowerCase();

    if (/(^|\.)bing\.com$/i.test(host)) {
      const directUrl = url.searchParams.get("url");
      if (directUrl && /^https?:\/\//i.test(directUrl)) return directUrl;

      const wrappedUrl = url.searchParams.get("u");
      const decodedUrl = decodeBingWrappedUrl(wrappedUrl);
      if (decodedUrl) return decodedUrl;
    }

    return url.toString();
  } catch {
    return String(link || "");
  }
}

function isGoogleNewsLink(link = "") {
  try {
    return /(^|\.)news\.google\.com$/i.test(new URL(String(link || "").trim()).hostname);
  } catch {
    return false;
  }
}

async function resolvePublisherLink(link = "", title = "", source = "") {
  const publisherLink = getPublisherLink(link);
  if (!isGoogleNewsLink(publisherLink)) return publisherLink;

  try {
    return (await resolveArticleUrl(publisherLink, title, source)).toString();
  } catch (err) {
    console.log("Publisher resolve skip:", err.message);
    return publisherLink;
  }
}

function isUsableArticleUrl(link = "") {
  try {
    const url = new URL(getPublisherLink(link));
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    const path = url.pathname.toLowerCase();
    if (!["http:", "https:"].includes(url.protocol)) return false;
    if (isBlockedAggregatorHost(host)) return false;
    if (["fonts.googleapis.com", "fonts.gstatic.com"].includes(host)) return false;
    if (/\.(css|js|mjs|json|xml|woff2?|ttf|otf|eot|png|jpe?g|gif|webp|svg|ico|mp4|webm|mp3|wav)$/i.test(path)) return false;
    return true;
  } catch {
    return false;
  }
}

function extractRssSource(item, fallbackLink) {
  const source = item?.source?.[0];
  if (typeof source === "string" && source.trim() && !/^bing$/i.test(source.trim())) return source.trim();
  if (source?._ && !/^bing$/i.test(source._)) return source._;
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

function decodeHtmlEntities(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function cleanSnippet(value = "") {
  return cleanText(
    decodeHtmlEntities(value)
      .replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function normalizeKeyword(value = "") {
  return cleanText(value).toLowerCase();
}

function compactKeyword(value = "") {
  return normalizeKeyword(value).replace(/[^a-z0-9]+/gi, "");
}

function normalizeTitleForDedupe(title = "") {
  return cleanText(
    decodeHtmlEntities(title)
      .replace(/\s+[-–—|]\s+[^-–—|]{2,45}$/i, "")
      .replace(/[“”"']/g, "")
      .replace(/\s+/g, " ")
  )
    .toLowerCase()
    .replace(/\b(berita|news|terbaru|update)\b/g, " ")
    .replace(/[^a-z0-9À-ÿ]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SEMANTIC_QUERY_VARIANT_LIMIT = 18;
const CRAWL_CACHE_TTL_MS = 60 * 60 * 1000;
const CRAWL_PAIR_CONCURRENCY = 3;
const FEED_QUERY_VARIANT_LIMIT = 8;
const WEB_QUERY_VARIANT_LIMIT = 5;
const NEWS_RESULT_LIMIT = 18;
const NEWS_PER_FEED_LIMIT = 8;
const INDONESIAN_NEWS_TARGET = 12;
const ENGLISH_NEWS_TARGET = 6;
const crawlCache = new Map();
const crawlLogs = [];
const MAX_CRAWL_LOGS = 250;

const KEYWORD_ALIASES = {
  orangutan: ["orang utan", "orang hutan", "orang-utan", "pongo", "ape", "great ape", "satwa dilindungi", "primata", "habitat orangutan"],
  satwa: ["hewan", "fauna", "wildlife", "wild animals", "satwa liar", "satwa dilindungi", "keanekaragaman hayati", "biodiversitas"],
  habitat: ["ekosistem", "ecosystem", "habitat", "kawasan hidup", "wilayah jelajah", "ruang hidup", "hutan habitat"],
  konservasi: ["pelestarian", "conservation", "perlindungan", "protection", "kawasan konservasi", "restorasi", "rehabilitasi", "biodiversitas"],
  hutan: ["kehutanan", "forest", "rainforest", "kawasan hutan", "tutupan hutan", "hutan alam", "hutan lindung"],
  deforestasi: ["penggundulan hutan", "kehilangan hutan", "kehilangan tutupan hutan", "pembukaan hutan", "alih fungsi hutan"],
  karhutla: ["kebakaran hutan", "kebakaran lahan", "kabut asap", "hotspot", "titik api"],
  sawit: ["kelapa sawit", "perkebunan sawit", "palm oil", "cpo", "minyak sawit"],
  batubara: ["batu bara", "coal", "tambang batu bara", "pertambangan batu bara", "energi fosil"],
  tambang: ["pertambangan", "mining", "galian", "izin tambang", "konsesi tambang"],
  nikel: ["nickel", "tambang nikel", "smelter nikel", "hilirisasi nikel"],
  pln: ["perusahaan listrik negara", "listrik negara", "kelistrikan", "pasokan listrik"],
  pltu: ["pembangkit listrik tenaga uap", "pembangkit batu bara", "pembangkit batubara", "coal power plant"],
  energi: ["ketenagalistrikan", "listrik", "energi fosil", "energi terbarukan", "transisi energi"],
  konflik: ["sengketa", "perselisihan", "bentrok", "conflict", "human wildlife conflict", "konflik lahan", "konflik agraria"],
  perdagangan: ["dagang", "dagangan", "diperdagangkan", "trade", "trafficking", "trafficked", "wildlife trade", "wildlife trafficking", "illegal wildlife trade", "perdagangan ilegal", "perdagangan satwa", "perdagangan satwa liar"],
  agraria: ["lahan", "tanah", "konflik lahan", "konflik agraria", "sengketa lahan"],
  masyarakatadat: ["masyarakat adat", "komunitas adat", "hak ulayat", "wilayah adat", "adat"],
  korupsi: ["rasuah", "suap", "gratifikasi", "penyelewengan", "tipikor", "kpk"],
  ekonomi: ["perekonomian", "investasi", "industri", "bisnis", "perdagangan", "pasar"],
  lingkungan: ["ekologi", "ekosistem", "pencemaran", "kerusakan lingkungan", "dampak lingkungan"],
  pencemaran: ["polusi", "limbah", "cemaran", "pencemaran air", "pencemaran udara"],
  bencana: ["banjir", "longsor", "kekeringan", "gempa", "bencana alam", "cuaca ekstrem"],
  infrastruktur: ["proyek strategis", "jalan", "bendungan", "pelabuhan", "pembangunan", "proyek infrastruktur"],
};

function getKeywordVariants(value = "") {
  const keyword = normalizeKeyword(value);
  const compact = compactKeyword(keyword);
  const variants = [keyword, compact, ...(KEYWORD_ALIASES[compact] || [])];

  return [...new Set(variants.map(normalizeKeyword).filter(Boolean))];
}

function buildQueryVariants(primary = "", secondary = "") {
  const primaryVariants = getKeywordVariants(primary);
  const secondaryVariants = getKeywordVariants(secondary);
  const effectiveSecondaryVariants = secondaryVariants.length ? secondaryVariants : [""];
  const variants = [];

  for (const p of primaryVariants) {
    for (const s of effectiveSecondaryVariants) {
      variants.push(`${p} ${s}`.trim());
    }
  }

  return [...new Set(variants.filter(Boolean))].slice(0, SEMANTIC_QUERY_VARIANT_LIMIT);
}

function buildNewsFeedUrls(variant = "") {
  const query = cleanText(variant);
  if (!query) return [];

  const indonesianQueries = [
    query,
    `${query} site:betahita.id`,
    `${query} site:mongabay.co.id`,
    `${query} site:antaranews.com`,
    `${query} site:kompas.com`,
  ];
  const internationalQueries = [
    query,
    `${query} site:bbc.com`,
    `${query} site:theguardian.com`,
    `${query} site:mongabay.com`,
  ];

  return [
    ...indonesianQueries.flatMap((indonesianQuery) => [
      {
        url: `https://www.bing.com/news/search?q=${encodeURIComponent(indonesianQuery)}&format=rss&setlang=id-ID`,
        language: "id",
      },
      {
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(indonesianQuery)}&hl=id&gl=ID&ceid=ID:id`,
        language: "id",
      },
    ]),
    ...internationalQueries.flatMap((internationalQuery) => [
      {
        url: `https://www.bing.com/news/search?q=${encodeURIComponent(internationalQuery)}&format=rss&setlang=en-US`,
        language: "en",
      },
      {
        url: `https://news.google.com/rss/search?q=${encodeURIComponent(internationalQuery)}&hl=en-US&gl=US&ceid=US:en`,
        language: "en",
      },
    ]),
  ];
}

function uniqueFeedRequests(feeds = []) {
  const seen = new Set();
  const unique = [];
  for (const feed of feeds) {
    if (!feed?.url || seen.has(feed.url)) continue;
    seen.add(feed.url);
    unique.push(feed);
  }
  return unique;
}

function mergeBalancedNewsResults(newsByLanguage = {}) {
  const idNews = newsByLanguage.id || [];
  const enNews = newsByLanguage.en || [];
  const otherNews = newsByLanguage.other || [];
  const selected = [
    ...idNews.slice(0, INDONESIAN_NEWS_TARGET),
    ...enNews.slice(0, ENGLISH_NEWS_TARGET),
  ];
  const selectedLinks = new Set(selected.map((item) => item.link));
  const remaining = [...idNews, ...enNews, ...otherNews]
    .filter((item) => item?.link && !selectedLinks.has(item.link));

  return [...selected, ...remaining].slice(0, NEWS_RESULT_LIMIT);
}

function getCacheEntry(cache, key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCacheEntry(cache, key, value, ttlMs) {
  cache.set(key, {
    value,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  });
}

function getCacheStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;

  for (const [key, entry] of crawlCache.entries()) {
    if (now > entry.expiresAt) {
      expired++;
      crawlCache.delete(key);
    } else {
      active++;
    }
  }

  return {
    active,
    expired,
    ttlMinutes: Math.round(CRAWL_CACHE_TTL_MS / 60000),
  };
}

function getCrawlUser(req = {}) {
  const headers = req.headers || {};
  return cleanText(
    headers["x-crawl-user"] ||
    headers["x-user-id"] ||
    headers["x-forwarded-user"] ||
    "anonymous"
  ).slice(0, 80);
}

function appendCrawlLog(entry = {}) {
  crawlLogs.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...entry,
  });
  crawlLogs.splice(MAX_CRAWL_LOGS);
}

function getCrawlLogs() {
  return crawlLogs.slice();
}

function createCrawlCacheKey(body = {}) {
  return JSON.stringify({
    version: 11,
    primaryKeywords: [...(body.primaryKeywords || [])].map(normalizeKeyword).sort(),
    secondaryKeywords: [...(body.secondaryKeywords || [])].map(normalizeKeyword).sort(),
    startDate: body.startDate || null,
    endDate: body.endDate || null,
  });
}

async function mapWithConcurrency(items, limit, worker) {
  const results = [];
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, runWorker));
  return results;
}

function getRssSnippet(item) {
  return cleanSnippet(
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
    .map(getKeywordVariants)
    .filter((variants) => variants.length)
    .every((variants) => variants.some((keyword) => (
      haystack.includes(keyword) || compactHaystack.includes(compactKeyword(keyword))
    )));
}

function isFeaturedCrawlResult(item = {}) {
  const source = String(item.source || "").toLowerCase();
  const link = String(item.link || "").toLowerCase();
  return source.includes("betahita") || link.includes("betahita.id");
}

function isTrustedSource(source = "", link = "") {
  const sourceText = `${source} ${link}`.toLowerCase();
  return sourceText.includes("betahita");
}

function isTrustedPrimaryMatch(title = "", snippet = "", primary = "", source = "", link = "") {
  if (!isTrustedSource(source, link)) return false;
  return isRelevantToKeywords(title, snippet, [primary]);
}

async function isRelevantInArticleBody(link = "", title = "", source = "", keywords = []) {
  if (!link || !keywords.length) return false;

  try {
    const { article } = await fetchArticleForUrl(link, title, source);
    const articleText = cleanText([
      article?.title,
      article?.description,
      ...(Array.isArray(article?.paragraphs) ? article.paragraphs : []),
    ].filter(Boolean).join(" "));

    return isRelevantToKeywords(title, articleText, keywords);
  } catch (err) {
    console.log("Article relevance skip:", err.message);
    return false;
  }
}

async function shouldKeepNewsResult({ title = "", snippet = "", link = "", source = "", primary = "", secondary = "" } = {}) {
  const keywords = [primary, secondary].filter(Boolean);
  if (!keywords.length) return true;
  if (isRelevantToKeywords(title, snippet, keywords)) return true;
  if (!isTrustedPrimaryMatch(title, snippet, primary, source, link)) return false;
  return isRelevantInArticleBody(link, title, source, keywords);
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

function dedupeCrawlResultsByTitle(items = []) {
  const seenTitles = new Set();
  const deduped = [];

  for (const item of items) {
    const titleKey = normalizeTitleForDedupe(item.title);
    if (titleKey && seenTitles.has(titleKey)) continue;
    if (titleKey) seenTitles.add(titleKey);
    deduped.push(item);
  }

  return deduped;
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
    const link = getPublisherLink(anchor.attr("href") || "");
    const snippet = cleanText(
      $(el).find(".b_caption p").first().text() ||
      $(el).find("p").first().text()
    );

    if (!title || !link) return;
    if (!isUsableArticleUrl(link)) return;
    const source = extractSource(link);
    results.push({
      title,
      link,
      snippet,
      source,
    });
  });

  const kept = [];
  for (const item of results) {
    if (kept.length >= maxItems) break;
    const keep = await shouldKeepNewsResult({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
      source: item.source,
      primary: keywords[0],
      secondary: keywords[1],
    });
    if (keep) kept.push(item);
  }

  return kept;
}

async function fetchExpandedBingWebResults(query, keywords = [], maxItems = 12) {
  const queryVariants = [
    query,
    ...(keywords.length >= 2 ? buildQueryVariants(keywords[0], keywords[1]) : []),
    `"${keywords.filter(Boolean).join("\" \"")}"`,
    `${query} opini editorial`,
  ].filter(Boolean).slice(0, WEB_QUERY_VARIANT_LIMIT);

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

async function crawlKeywordPair({ primary, secondary, startBoundary, endBoundary }) {
  const pairResults = [];
  const seen = new Set();
  const queryVariants = buildQueryVariants(primary, secondary);
  const query = queryVariants[0] || `${primary} ${secondary}`.trim();
  const matchedKeywords = `${primary} + ${secondary}`;

  // NEWS
  try {
    const feeds = uniqueFeedRequests(
      queryVariants.slice(0, FEED_QUERY_VARIANT_LIMIT).flatMap(buildNewsFeedUrls)
    );
    const newsByLanguage = { id: [], en: [], other: [] };

    const feedResponses = await Promise.allSettled(feeds.map((feed) => (
      axios.get(feed.url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 6500,
      }).then((response) => ({ feed, response }))
    )));

    for (const feedResult of feedResponses) {
      if (feedResult.status === "rejected") {
        console.log("News feed skip:", feedResult.reason?.message || "Feed gagal");
        continue;
      }

      try {
        const { feed, response } = feedResult.value;

        const parsed = await new Promise((resolve, reject) => {
          parseString(response.data, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });

        const items = parsed?.rss?.channel?.[0]?.item || [];
        let addedFromFeed = 0;

        for (const item of items) {
          if (addedFromFeed >= NEWS_PER_FEED_LIMIT) break;

          const rawLink = item.link?.[0] || "";
          const link = getPublisherLink(rawLink);
          if (!link || seen.has(link) || !isUsableArticleUrl(link)) continue;

          const rawPubDate = item.pubDate?.[0] || null;
          const isoDate = toIsoDate(rawPubDate);
          if (!isWithinDateRange(isoDate, startBoundary, endBoundary)) continue;

          seen.add(link);
          const title = item.title?.[0] || "Tanpa Judul";
          const snippet = getRssSnippet(item);
          const source = extractRssSource(item, link);
          const keep = await shouldKeepNewsResult({ title, snippet, link, source, primary, secondary });
          if (!keep) continue;

          addedFromFeed++;
          const language = ["id", "en"].includes(feed.language) ? feed.language : "other";
          newsByLanguage[language].push({
            type: "news",
            title,
            link,
            date: isoDate,
            source,
            snippet,
            language,
            matchedKeywords,
          });
        }
      } catch (feedErr) {
        console.log("News feed skip:", feedErr.message);
      }
    }

    pairResults.push(...mergeBalancedNewsResults(newsByLanguage));
  } catch (err) {
    console.log("News error:", err.message);
  }

  try {
    const webResults = await fetchExpandedBingWebResults(query, [primary, secondary], 8);
    for (const item of webResults) {
      const link = getPublisherLink(item.link);
      if (!link || seen.has(link) || !isUsableArticleUrl(link)) continue;
      seen.add(link);
      pairResults.push({
        type: "news",
        title: item.title,
        link,
        date: null,
        source: item.source || extractSource(link),
        snippet: item.snippet,
        matchedKeywords,
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
        per_page: 8,
      },
      timeout: 6500,
    });

    const papers = response.data?.results || [];

    papers.forEach((p) => {
      const link = getPublisherLink(p.primary_location?.landing_page_url || p.id || "");
      if (!link || seen.has(link) || !isUsableArticleUrl(link)) return;

      const publicationDate = yearToIso(p.publication_year || null);
      if (!isWithinDateRange(publicationDate, startBoundary, endBoundary)) return;

      seen.add(link);
      pairResults.push({
        type: "journal",
        title: p.title || "Tanpa Judul",
        link,
        date: publicationDate,
        source: extractSource(link),
        matchedKeywords,
      });
    });
  } catch (err) {
    console.log("Journal error:", err.message);
  }

  return pairResults;
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

    if (!primaryKeywords.length) {
      return res.status(400).json({
        error: "Primary keyword tidak boleh kosong",
        results: [],
      });
    }

    const cacheKey = createCrawlCacheKey(req.body || {});
    const crawlUser = getCrawlUser(req);
    const cached = getCacheEntry(crawlCache, cacheKey);
    if (cached) {
      appendCrawlLog({
        user: crawlUser,
        cacheHit: true,
        primaryKeywords: primaryKeywords.map(cleanText),
        secondaryKeywords: secondaryKeywords.map(cleanText),
        startDate,
        endDate,
        total: cached.total || 0,
        durationMs: 0,
      });
      res.setHeader("Cache-Control", "private, max-age=3600");
      return res.status(200).json({
        ...cached,
        cached: true,
      });
    }

    const startedAt = Date.now();
    const results = [];
    const seen = new Set();
    const effectiveSecondaryKeywords = secondaryKeywords.length ? secondaryKeywords : [""];
    const crawlJobs = primaryKeywords.flatMap((primary) => (
      effectiveSecondaryKeywords.map((secondary) => ({
        primary,
        secondary,
        startBoundary,
        endBoundary,
      }))
    ));

    const groupedResults = await mapWithConcurrency(
      crawlJobs,
      CRAWL_PAIR_CONCURRENCY,
      crawlKeywordPair
    );

    const normalizedItems = await mapWithConcurrency(groupedResults.flat(), 5, async (item) => {
      const source = /^bing$/i.test(item.source || "") ? extractSource(item.link) : item.source;
      const link = await resolvePublisherLink(item.link, item.title, source);
      return {
        ...item,
        link,
        source: /^bing$/i.test(source || "") ? extractSource(link) : (source || extractSource(link)),
      };
    });

    for (const item of normalizedItems) {
      const link = getPublisherLink(item.link);
      if (!link || seen.has(link) || !isUsableArticleUrl(link)) continue;
      seen.add(link);
      results.push({
        ...item,
        link,
        source: /^bing$/i.test(item.source || "") ? extractSource(link) : (item.source || extractSource(link)),
      });
    }

    const prioritizedResults = dedupeCrawlResultsByTitle(prioritizeCrawlResults(results));
    const payload = {
      success: true,
      total: prioritizedResults.length,
      results: prioritizedResults,
    };
    setCacheEntry(crawlCache, cacheKey, payload, CRAWL_CACHE_TTL_MS);
    appendCrawlLog({
      user: crawlUser,
      cacheHit: false,
      primaryKeywords: primaryKeywords.map(cleanText),
      secondaryKeywords: secondaryKeywords.map(cleanText),
      startDate,
      endDate,
      total: prioritizedResults.length,
      durationMs: Date.now() - startedAt,
    });

    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.status(200).json({
      ...payload,
      cached: false,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Server error",
      detail: err.message,
    });
  }
};

module.exports.getCrawlLogs = getCrawlLogs;
module.exports.getCacheStats = getCacheStats;
