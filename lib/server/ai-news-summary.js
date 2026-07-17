const axios = require("axios");
const { parseString } = require("xml2js");
const fs = require("fs");
const path = require("path");

function loadRuntimeEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return false;

  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }

  return true;
}

loadRuntimeEnvFile();

const SUMMARY_JOBS = global.__AI_SUMMARY_JOBS || new Map();
global.__AI_SUMMARY_JOBS = SUMMARY_JOBS;

function createSummaryJobId() {
  return `summary_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function cleanupSummaryJobs() {
  const now = Date.now();
  for (const [jobId, job] of SUMMARY_JOBS.entries()) {
    if (now - job.createdAt > 30 * 60 * 1000) SUMMARY_JOBS.delete(jobId);
  }
}

function extractSource(link) {
  try {
    const url = new URL(link);
    const publisherUrl = url.searchParams.get("url");
    if (/(^|\.)bing\.com$/i.test(url.hostname) && publisherUrl) return extractSource(publisherUrl);

    const hostname = url.hostname.replace(/^www\./, "");
    const parts = hostname.split(".");
    const source = parts.length > 2 ? parts[parts.length - 2] : parts[0];
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

function stripHtml(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearchQuery(query = "") {
  const stopwords = new Set([
    "cari", "carikan", "tolong", "berita", "news", "artikel", "tentang", "mengenai",
    "ringkas", "ringkaskan", "rangkum", "summarize", "summary", "yang", "dan", "di",
    "ke", "dari", "untuk", "terbaru", "hari", "ini",
  ]);
  const words = String(query)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !stopwords.has(word));
  const unique = [...new Set(words)];
  return unique.length ? unique.join(" ") : String(query || "").trim();
}

function getChatOnlyResponse(query = "") {
  const text = String(query || "").trim().toLowerCase();
  const normalized = text.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

  if (!normalized) return null;

  if (/^(hai|halo|hallo|hello|hi|pagi|siang|sore|malam|assalamualaikum|salam)$/.test(normalized)) {
    return "Halo. Aku siap bantu cari, menyaring, dan merangkum berita. Tulis saja topiknya, misalnya: carikan berita tapir, ringkas konflik orangutan, atau cari berita perdagangan satwa liar.";
  }

  if (/^(makasih|terima kasih|thanks|thank you|sip|oke|ok|baik)$/.test(normalized)) {
    return "Sama-sama. Kalau mau cari berita lain, langsung tulis topik atau pertanyaannya.";
  }

  if (/^(siapa kamu|kamu siapa|ini apa|bisa apa|bisa bantu apa|help|bantuan)$/.test(normalized)) {
    return "Aku chatbot ringkasan berita. Aku bisa mencari sumber berita, menyaring hasil yang relevan, lalu membuat ringkasan dan analisis fleksibel sesuai pertanyaanmu. Aku tidak akan crawling kalau pesanmu hanya sapaan atau obrolan ringan.";
  }

  const casualPatterns = [
    /^(apa kabar|gimana kabarnya|lagi apa|test|tes)$/,
    /^(hai|halo|hallo|hello|hi)\s+(dong|ya|min|admin)?$/,
  ];
  if (casualPatterns.some((pattern) => pattern.test(normalized))) {
    return "Aku aktif. Kirim topik berita yang ingin dicari kalau kamu mau aku mulai crawling.";
  }

  return null;
}

function getRequiredTerms(query = "") {
  return normalizeSearchQuery(query)
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length >= 3)
    .slice(0, 4);
}

function itemMatchesRequiredTerms(item, terms) {
  if (!terms.length) return true;
  const haystack = [
    item.title?.[0],
    item.description?.[0],
    item["content:encoded"]?.[0],
    extractRssSource(item, item.link?.[0] || ""),
  ].map(stripHtml).join(" ").toLowerCase();

  return terms.every((term) => haystack.includes(term));
}

function getPublisherLink(link = "") {
  try {
    const url = new URL(link);
    const publisherUrl = url.searchParams.get("url");
    if (/(^|\.)bing\.com$/i.test(url.hostname) && publisherUrl) return publisherUrl;
    return link;
  } catch {
    return link;
  }
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

async function fetchNewsFeedItems(query, maxItems = 40) {
  const searchQuery = normalizeSearchQuery(query);
  const feeds = [
    `https://www.bing.com/news/search?q=${encodeURIComponent(searchQuery)}&format=rss&setlang=id-ID`,
    `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=id&gl=ID&ceid=ID:id`,
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
      console.log("AI summary feed skip:", err.message);
    }
  }

  return items;
}

async function collectNewsByQuery(query, startBoundary = null, endBoundary = null, maxItems = 40) {
  const items = await fetchNewsFeedItems(query, maxItems);
  const results = [];
  const seen = new Set();
  const requiredTerms = getRequiredTerms(query);

  for (const item of items) {
    if (!itemMatchesRequiredTerms(item, requiredTerms)) continue;

    const link = getPublisherLink(item.link?.[0]);
    if (!link || seen.has(link)) continue;

    const pubDate = item.pubDate?.[0];
    const isoDate = toIsoDate(pubDate) || pubDate || null;
    if (!isWithinDateRange(isoDate, startBoundary, endBoundary)) continue;

    seen.add(link);
    results.push({
      type: "news",
      title: item.title?.[0] || "Tanpa Judul",
      link,
      date: isoDate,
      source: extractRssSource(item, link),
      snippet: stripHtml(item.description?.[0] || ""),
      matchedKeywords: normalizeSearchQuery(query),
    });
  }

  results.sort((a, b) => {
    const bTime = new Date(b.date || 0).getTime() || 0;
    const aTime = new Date(a.date || 0).getTime() || 0;
    return bTime - aTime;
  });

  return results;
}

function buildFallbackNewsSummary(query, articles = [], note = "Mode fallback dipakai karena belum ada provider AI aktif atau provider AI tidak memberi respons selesai.") {
  const listMode = wantsFullList(query);
  const topArticles = listMode ? articles : articles.slice(0, 8);
  const sourceList = [...new Set(topArticles.map((item) => item.source).filter(Boolean))].slice(0, 6);
  const latestDate = topArticles
    .map((item) => new Date(item.date).getTime())
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => b - a)[0];
  const latestText = latestDate
    ? new Date(latestDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : "tanggal terbaru tidak tersedia";

  if (listMode) {
    return [
      `Berikut daftar ${articles.length} sumber yang tersedia untuk permintaan: "${query}".`,
      `Pembaruan terbaru terlihat sekitar ${latestText}.`,
      sourceList.length ? `Sumber yang muncul: ${sourceList.join(", ")}.` : "Sumber berita tidak tersedia.",
      "",
      "Daftar sumber:",
      articles.map(formatArticleListItem).join("\n\n") || "Tidak ada sumber yang bisa ditampilkan.",
      technicalNoteLine(note),
    ].filter(Boolean).join("\n");
  }

  if (wantsTopicAnalysis(query)) {
    return buildTopicSummary(query, articles, note);
  }

  if (wantsTradeRegionAnalysis(query)) {
    return buildTradeRegionFallback(query, articles, note);
  }

  if (wantsRegionCoverageAnalysis(query)) {
    return buildRegionCoverageSummary(query, articles, note);
  }

  return buildPlainPatternSummary(query, articles, {
    latestText,
    sourceList,
    note,
  });
}

function wantsFullList(query = "") {
  const text = String(query || "").toLowerCase();
  return /\b(semua|seluruh|full|list|daftar|tampilkan|tampilin|judul|lengkap|kurang)\b/i.test(text)
    || /\b(daftar|list|tampilkan|tampilin)\s+(sumber|judul|berita)\b/i.test(text)
    || /\b(kok|kenapa|mengapa)\s+(cuma|hanya)\b/i.test(text)
    || /\b(cuma|hanya)\s+\d+\b/i.test(text);
}

function technicalNoteLine(note = "") {
  if (process.env.AI_SUMMARY_SHOW_TECHNICAL_NOTE !== "1" || !note) return "";
  return `\nCatatan teknis: ${note}`;
}

function wantsTradeRegionAnalysis(query = "") {
  const text = String(query || "").toLowerCase();
  return /\b(daerah|wilayah|lokasi|tempat|kabupaten|kecamatan|mana)\b/.test(text)
    && /\b(perdagangan|dagang|pedagang|trafficking|trade|diperjualbelikan|dagangan)\b/.test(text);
}

function wantsRegionCoverageAnalysis(query = "") {
  const text = String(query || "").toLowerCase();
  return /\b(dimana|di mana|daerah|wilayah|lokasi|tempat|terjadi|teridentifikasi|identifikasi)\b/.test(text)
    && !wantsTradeRegionAnalysis(query);
}

function wantsTopicAnalysis(query = "") {
  const text = String(query || "").toLowerCase();
  return /\b(topik|tema|bahasan|dibahas|membahas|isu apa|apa aja yang dibahas|apa saja yang dibahas)\b/.test(text);
}

function formatArticleListItem(item = {}, index = 0) {
  const date = item.date
    ? new Date(item.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : "tanggal tidak tersedia";
  const source = item.source || "Unknown";
  const link = item.link ? `\n   Link: ${item.link}` : "";
  return `${index + 1}. ${item.title || "Tanpa Judul"}\n   Sumber: ${source}\n   Tanggal: ${date}${link}`;
}

const REGION_HINTS = [
  { name: "Indonesia", patterns: [/\bindonesia\b/i] },
  { name: "Sumatera", patterns: [/\bsumatera\b/i, /\bsumatra\b/i] },
  { name: "Sumatera Utara", patterns: [/\bsumatera utara\b/i, /\bsumut\b/i, /\bnorth sumatra\b/i] },
  { name: "Pakpak Bharat", patterns: [/\bpakpak bharat\b/i] },
  { name: "Kalimantan Timur", patterns: [/\bkalimantan timur\b/i, /\bkaltim\b/i] },
  { name: "Kutai Timur / Kutim", patterns: [/\bkutai timur\b/i, /\bkutim\b/i] },
  { name: "Bengalon", patterns: [/\bbengalon\b/i] },
  { name: "Keraitan", patterns: [/\bkeraitan\b/i] },
  { name: "Gunung Batu Mesangat", patterns: [/\bgunung batu mesangat\b/i] },
  { name: "Kalimantan Barat", patterns: [/\bkalimantan barat\b/i, /\bkalbar\b/i] },
  { name: "Kalimantan Tengah", patterns: [/\bkalimantan tengah\b/i, /\bkalteng\b/i] },
  { name: "Kalimantan Selatan", patterns: [/\bkalimantan selatan\b/i, /\bkalsel\b/i] },
  { name: "Kalimantan Utara", patterns: [/\bkalimantan utara\b/i, /\bkaltara\b/i] },
  { name: "Borneo / Kalimantan", patterns: [/\bborneo\b/i, /\bkalimantan\b/i] },
  { name: "Aceh", patterns: [/\baceh\b/i] },
  { name: "Riau", patterns: [/\briau\b/i] },
  { name: "Jambi", patterns: [/\bjambi\b/i] },
  { name: "Papua", patterns: [/\bpapua\b/i] },
];

function articleText(item = {}) {
  return stripHtml([
    item.title,
    item.snippet,
    item.source,
    item.region,
    item.issue,
    item.matchedKeywords,
  ].filter(Boolean).join(" "));
}

const ISSUE_PATTERNS = [
  { label: "deforestasi dan kehilangan tutupan hutan", pattern: /\b(deforestasi|penggundulan|tutupan hutan|hutan berisiko|forest loss|kehilangan hutan)\b/i },
  { label: "tambang, sawit, dan food estate sebagai pemicu", pattern: /\b(tambang|pertambangan|konsesi|sawit|kelapa sawit|food estate|perkebunan)\b/i },
  { label: "penegakan hukum sumber daya alam dan lingkungan", pattern: /\b(aph|aparat penegak hukum|penegak hukum|simposium|sda-lh|sumber daya alam|lingkungan hidup|brigjen|polri|kejaksaan)\b/i },
  { label: "taman nasional dan kawasan lindung", pattern: /\b(taman nasional|kawasan lindung|national parks|protected area|konservasi)\b/i },
  { label: "konservasi dan kawasan perlindungan", pattern: /\b(konservasi|preservasi|perlindungan|kawasan|koridor|habitat|lahan|hutan)\b/i },
  { label: "konflik orangutan dengan warga atau kebun", pattern: /\b(konflik|warga|kebun|terjebak|relokasi|translokasi|senapan|bksda)\b/i },
  { label: "perdagangan atau kejahatan satwa liar", pattern: /\b(perdagangan|ilegal|trafficking|dagang|dagangan|repatriasi|sindikat)\b/i },
  { label: "rehabilitasi dan pelepasliaran", pattern: /\b(rehabilitasi|lepasliar|dilepasliarkan|pulangkan|pemulangan|diselamatkan)\b/i },
  { label: "penurunan populasi dan ancaman ekologis", pattern: /\b(populasi|berkurang|terancam|banjir|sawit|perkebunan|rusak|destroy|habitats)\b/i },
  { label: "riset perilaku atau temuan ilmiah", pattern: /\b(studi|riset|research|offspring|playdates|canopy bridge|world first|menggunakan)\b/i },
];

function detectIssuePatterns(articles = []) {
  return ISSUE_PATTERNS.map((issue) => {
    const matches = articles.filter((item) => issue.pattern.test(articleText(item)));
    return {
      label: issue.label,
      count: matches.length,
      examples: matches.slice(0, 3).map((item) => item.title).filter(Boolean),
    };
  }).filter((issue) => issue.count > 0).sort((a, b) => b.count - a.count);
}

function detectRegionMentions(articles = []) {
  const counts = new Map();
  for (const item of articles) {
    for (const region of findArticleRegions(articleText(item))) {
      counts.set(region, (counts.get(region) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([region, count]) => ({ region, count }));
}

function buildPlainPatternSummary(query, articles = [], options = {}) {
  const latestText = options.latestText || "tanggal terbaru tidak tersedia";
  const sourceList = options.sourceList || [...new Set(articles.map((item) => item.source).filter(Boolean))].slice(0, 8);
  const issues = detectIssuePatterns(articles);
  const regions = detectRegionMentions(articles);
  const topTitles = articles.slice(0, 5).map((item) => item.title).filter(Boolean);

  const issueText = issues.length
    ? issues.slice(0, 4).map((issue) => `${issue.label} (${issue.count} berita)`).join(", ")
    : "pola isu belum terlalu tegas dari metadata";
  const regionText = regions.length
    ? regions.map((entry) => `${entry.region} (${entry.count})`).join(", ")
    : "lokasi spesifik belum banyak terbaca dari judul/snippet";
  const sourceText = sourceList.length ? sourceList.join(", ") : "sumber belum terbaca jelas";

  return [
    `Dari ${articles.length} berita yang masuk, pola besarnya terlihat di sekitar ${issueText}. Update terbaru yang terbaca sekitar ${latestText}.`,
    "",
    `Kalau dibaca sebagai peta isu biasa, arus paling kuat bukan satu kasus tunggal, tapi gabungan dari beberapa tema yang muncul berulang di judul dan snippet. Daerah yang paling sering muncul dari metadata: ${regionText}. Sumber yang banyak muncul: ${sourceText}.`,
    "",
    topTitles.length
      ? `Contoh berita yang membentuk pola itu: ${topTitles.join("; ")}.`
      : "Contoh judul belum tersedia dari data crawling.",
    "",
    "Catatan sementara: ini sengaja dibaca longgar dari judul, sumber, tanggal, dan snippet dulu. Jadi kesimpulannya dipakai untuk melihat pola awal, bukan sebagai SOP final atau kesimpulan hukum.",
    technicalNoteLine(options.note),
  ].filter(Boolean).join("\n");
}

function getArticleRegionLabels(item = {}) {
  const labels = findArticleRegions(articleText(item));
  const unique = new Set(labels.filter((label) => label !== "Indonesia"));
  const hasSpecificSumatra = ["Sumatera Utara", "Pakpak Bharat", "Aceh", "Riau", "Jambi"].some((region) => unique.has(region));
  const hasSpecificKalimantan = [
    "Kalimantan Timur",
    "Kutai Timur / Kutim",
    "Bengalon",
    "Keraitan",
    "Gunung Batu Mesangat",
    "Kalimantan Barat",
    "Kalimantan Tengah",
    "Kalimantan Selatan",
    "Kalimantan Utara",
  ].some((region) => unique.has(region));
  if (hasSpecificSumatra) unique.delete("Sumatera");
  if (hasSpecificKalimantan) unique.delete("Borneo / Kalimantan");
  return [...unique];
}

function buildRegionCoverageSummary(query, articles = [], note = "") {
  const rows = articles.map((item, index) => ({
    index: index + 1,
    title: item.title || "Tanpa Judul",
    source: item.source || "Unknown",
    regions: getArticleRegionLabels(item),
  }));
  const identified = rows.filter((row) => row.regions.length);
  const unidentified = rows.filter((row) => !row.regions.length);
  const counts = new Map();

  for (const row of identified) {
    for (const region of row.regions) {
      counts.set(region, (counts.get(region) || 0) + 1);
    }
  }

  const regionSummary = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([region, count]) => `${region} (${count})`);

  const askingUnidentified = /\b(belum|tidak|nggak|gak|teridentifikasi|identifikasi|mana aja)\b/i.test(query);

  if (askingUnidentified) {
    return [
      `Iya, benar. Dari ${articles.length} berita, yang lokasi/daerahnya terbaca dari judul dan metadata baru ${identified.length} berita. Sisanya ${unidentified.length} berita belum cukup jelas lokasi spesifiknya dari metadata.`,
      "",
      identified.length
        ? `Yang sudah terdeteksi: ${regionSummary.join(", ")}.`
        : "Belum ada lokasi yang cukup jelas terbaca.",
      "",
      unidentified.length
        ? [
            "Yang belum teridentifikasi lokasinya:",
            ...unidentified.slice(0, 20).map((row) => `${row.index}. ${row.title} (${row.source})`),
          ].join("\n")
        : "Semua berita sudah punya indikasi lokasi dari metadata.",
      "",
      "Penyebabnya biasanya judul hanya menyebut tema umum seperti populasi, kawasan perlindungan, riset perilaku, atau konservasi tanpa menyebut kabupaten/provinsi. Untuk memastikan lokasi semua berita, sistem perlu membuka isi artikel, bukan hanya membaca judul/snippet.",
      technicalNoteLine(note),
    ].filter(Boolean).join("\n");
  }

  return [
    `Dari ${articles.length} berita, lokasi yang paling sering terbaca adalah ${regionSummary.length ? regionSummary.join(", ") : "belum jelas dari metadata"}.`,
    "",
    `Yang sudah punya indikasi lokasi: ${identified.length} berita. Yang belum teridentifikasi lokasi spesifiknya dari judul/snippet: ${unidentified.length} berita.`,
    "",
    identified.length
      ? [
          "Contoh yang terdeteksi:",
          ...identified.slice(0, 10).map((row) => `${row.index}. ${row.regions.join(", ")} - ${row.title}`),
        ].join("\n")
      : "",
    unidentified.length
      ? [
          "Contoh yang belum jelas lokasinya:",
          ...unidentified.slice(0, 8).map((row) => `${row.index}. ${row.title}`),
        ].join("\n")
      : "",
    technicalNoteLine(note),
  ].filter(Boolean).join("\n");
}

function buildTopicSummary(query, articles = [], note = "") {
  const issues = detectIssuePatterns(articles);
  const topics = issues.length
    ? issues
    : articles.slice(0, 8).map((item) => ({
        label: item.title || "Tanpa Judul",
        count: 1,
        examples: [item.title || "Tanpa Judul"],
      }));

  return [
    `Dari ${articles.length} berita itu, topik yang dibahas kira-kira terbagi begini:`,
    "",
    ...topics.slice(0, 8).map((issue, index) => [
      `${index + 1}. ${issue.label}`,
      `   Muncul di sekitar ${issue.count} berita.`,
      issue.examples?.length ? `   Contoh: ${issue.examples.slice(0, 2).join(" | ")}` : "",
    ].filter(Boolean).join("\n")),
    "",
    "Jadi secara sederhana, berita-berita ini sedang membahas peta masalah dan responsnya: apa kerusakan/ancamannya, faktor pendorong yang disebut, area atau sektor yang terdampak, serta langkah tata kelola atau penegakan hukum yang muncul di pemberitaan.",
    technicalNoteLine(note),
  ].filter(Boolean).join("\n");
}

function hasTradeSignal(text = "") {
  return /\b(perdagangan|pedagang|dagang|dagangan|trafficking|trafficked|trade|diperjualbelikan|jual beli|organized crime)\b/i.test(text);
}

function hasConflictSignal(text = "") {
  return /\b(konflik|warga|habitat|koridor|translokasi|bksda|sengketa|lahan|rawan)\b/i.test(text);
}

function findArticleRegions(text = "") {
  const found = [];
  for (const hint of REGION_HINTS) {
    if (hint.patterns.some((pattern) => pattern.test(text))) found.push(hint.name);
  }
  return found;
}

function buildTradeRegionFallback(query, articles = [], note = "") {
  const regionMap = new Map();
  const directTradeArticles = [];

  for (const item of articles) {
    const text = articleText(item);
    const regions = findArticleRegions(text);
    const trade = hasTradeSignal(text);
    const conflict = hasConflictSignal(text);
    if (trade) directTradeArticles.push(item);

    for (const region of regions) {
      const current = regionMap.get(region) || { region, count: 0, tradeCount: 0, conflictCount: 0, examples: [] };
      current.count += 1;
      if (trade) current.tradeCount += 1;
      if (conflict) current.conflictCount += 1;
      if (current.examples.length < 3) current.examples.push(item.title || "Tanpa Judul");
      regionMap.set(region, current);
    }
  }

  const regions = [...regionMap.values()].sort((a, b) => {
    const score = (entry) => (entry.tradeCount * 3) + (entry.conflictCount * 1.5) + entry.count;
    return score(b) - score(a);
  });

  if (!regions.length) {
    return [
      `Dari ${articles.length} berita itu, lokasi perdagangan orangutan belum terlihat jelas dari judul dan metadata yang tersedia.`,
      "Yang bisa ditandai baru berita-berita dengan sinyal perdagangan langsung:",
      directTradeArticles.slice(0, 6).map((item, index) => `${index + 1}. ${item.title}`).join("\n") || "Belum ada judul yang menyebut perdagangan secara eksplisit.",
      "Kesimpulan aman: perlu buka isi artikel untuk memastikan lokasi kasus perdagangan, karena metadata belum cukup menyebut daerahnya.",
      technicalNoteLine(note),
    ].filter(Boolean).join("\n");
  }

  return [
    `Dari daftar berita itu, daerah yang kira-kira terkait perdagangan orangutan paling kuat adalah:`,
    "",
    ...regions.slice(0, 8).map((entry, index) => {
      const strength = entry.tradeCount
        ? "ada sinyal perdagangan langsung di judul/metadata"
        : "lebih kuat sebagai wilayah konflik atau area rawan, bukan bukti transaksi";
      return [
        `${index + 1}. ${entry.region}`,
        `   - ${strength}.`,
        `   - Muncul di ${entry.count} berita; sinyal perdagangan: ${entry.tradeCount}; sinyal konflik/rawan: ${entry.conflictCount}.`,
        `   - Contoh: ${entry.examples.slice(0, 2).join(" | ")}`,
      ].join("\n");
    }),
    "",
    "Berita yang paling langsung menyebut perdagangan:",
    directTradeArticles.slice(0, 8).map((item, index) => `${index + 1}. ${item.title}`).join("\n") || "Tidak ada judul yang eksplisit menyebut perdagangan.",
    "",
    regions.some((entry) => entry.region === "Kalimantan Timur" || entry.region === "Kutai Timur / Kutim")
      ? "Kesimpulan aman: daerah prioritas yang perlu ditandai adalah Kalimantan Timur, terutama Kutai Timur/Kutim jika muncul bersama Bengalon atau Keraitan. Namun ini perlu dibedakan sebagai area konflik/rawan kecuali artikel menyebut transaksi perdagangan secara eksplisit."
      : "Kesimpulan aman: pakai daerah di atas sebagai kandidat prioritas, tetapi verifikasi isi artikel tetap perlu karena metadata belum selalu memisahkan lokasi konflik, lokasi asal satwa, dan lokasi transaksi perdagangan.",
    technicalNoteLine(note),
  ].filter(Boolean).join("\n");
}

function buildSourceOnlyNewsSummary(query, articles = [], note = "") {
  const listMode = wantsFullList(query);
  const visibleArticles = articles;
  const sourceList = [...new Set(visibleArticles.map((item) => item.source).filter(Boolean))].slice(0, 8);
  const latestDate = articles
    .map((item) => new Date(item.date).getTime())
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => b - a)[0];
  const latestText = latestDate
    ? new Date(latestDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : "tanggal terbaru tidak tersedia";
  if (wantsTradeRegionAnalysis(query)) {
    return buildTradeRegionFallback(query, articles, note);
  }

  if (wantsTopicAnalysis(query)) {
    return buildTopicSummary(query, articles, note);
  }

  if (wantsRegionCoverageAnalysis(query)) {
    return buildRegionCoverageSummary(query, articles, note);
  }

  if (listMode) {
    return [
      `Berikut daftar ${articles.length} sumber yang tersedia untuk permintaan: "${query}".`,
      `Pembaruan terbaru terlihat sekitar ${latestText}.`,
      sourceList.length ? `Sumber yang muncul: ${sourceList.join(", ")}.` : "Sumber dominan belum terlihat jelas dari metadata.",
      "",
      "Daftar sumber:",
      articles.map(formatArticleListItem).join("\n\n") || "Tidak ada sumber yang bisa ditampilkan.",
      technicalNoteLine(note),
    ].filter(Boolean).join("\n");
  }

  return buildPlainPatternSummary(query, articles, {
    latestText,
    sourceList,
    note: `Ringkasan ini dibuat dari judul dan metadata sumber karena provider AI belum menyelesaikan ringkasan penuh.${note ? ` ${note}` : ""}`,
  });
}

function normalizeSourceItems(items = [], maxItems = 80) {
  const seen = new Set();
  const normalized = [];

  for (const item of Array.isArray(items) ? items : []) {
    if (normalized.length >= maxItems) break;
    const title = stripHtml(item?.title || "");
    const link = getPublisherLink(String(item?.link || item?.finalUrl || item?.resolvedLink || ""));
    const key = link || `${title}-${item?.date || ""}`;
    if ((!title && !link) || seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      type: item?.type || "news",
      title: title || "Tanpa Judul",
      link,
      date: toIsoDate(item?.date) || item?.date || null,
      source: stripHtml(item?.source || "") || extractSource(link),
      snippet: stripHtml(item?.snippet || ""),
      matchedKeywords: stripHtml(item?.matchedKeywords || ""),
      region: stripHtml(item?.region || ""),
      issue: stripHtml(item?.issue || ""),
    });
  }

  normalized.sort((a, b) => {
    const bTime = new Date(b.date || 0).getTime() || 0;
    const aTime = new Date(a.date || 0).getTime() || 0;
    return bTime - aTime;
  });

  return normalized;
}

function buildSummaryPrompt(query, articles) {
  const defaultLimit = wantsFullList(query) ? 80 : 12;
  const articleLimit = Number(process.env.AI_SUMMARY_ARTICLE_LIMIT || defaultLimit);
  const articleContext = articles.slice(0, articleLimit).map((item, index) => (
    `${index + 1}. ${item.title}\nSumber: ${item.source || "Unknown"}\nTanggal: ${item.date || "-"}\nLink: ${item.link || "-"}\nSnippet: ${item.snippet || "-"}`
  )).join("\n\n");

  /*
  SOP lama 5W + 1H disimpan dulu kalau nanti mau dipakai lagi:
  Buat jawaban dengan format ini:
  1. Jawaban langsung atas pertanyaan
  2. Mengapa jawaban itu dipilih
  3. 5W + 1H
  4. Detail penting
  5. Sumber dominan dan kehati-hatian
  */

  return `Jawab sebagai analis berita berbahasa Indonesia dengan gaya biasa dan natural.
Gunakan hanya daftar berita di bawah ini. Jawab langsung sesuai pertanyaan user, jangan mengarang fakta di luar sumber, dan jangan tampilkan reasoning, pemikiran internal, "Reasoning Complete", atau proses analisis.

Pertanyaan user: ${query}

Daftar berita:
${articleContext}

Gaya jawaban:
- Jangan pakai SOP, format kaku, atau 5W + 1H kecuali user meminta.
- Untuk pertanyaan umum, baca seperti analis biasa: pola apa yang terlihat, isu mana yang dominan, daerah/sumber mana yang sering muncul, dan contoh judul yang mendukung.
- Jika user meminta list/daftar/tampilkan semua, tampilkan semua item yang ada di daftar berita.
- Kalau data hanya judul/snippet, bilang kesimpulannya masih pola awal.
- Jawaban boleh pendek-menengah, natural, dan tidak perlu terlalu formal.`;
}

function extractOpenAIText(data) {
  if (data.output_text) return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) chunks.push(content.text);
      if (content.type === "text" && content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

function extractGeminiText(data) {
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part.text || "").filter(Boolean).join("\n").trim();
}

async function summarizeNewsWithVercelAIGateway(query, articles) {
  if (!process.env.AI_GATEWAY_API_KEY) return null;

  const model = process.env.AI_GATEWAY_MODEL || "anthropic/claude-haiku-4.5";
  const { generateText } = await import("ai");
  const result = await generateText({
    model,
    prompt: buildSummaryPrompt(query, articles),
    temperature: 0.2,
  });

  return {
    aiEnabled: true,
    provider: `vercel-ai-gateway:${model}`,
    summary: result.text || buildFallbackNewsSummary(query, articles, "Vercel AI Gateway aktif, tetapi respons ringkasan kosong."),
  };
}

async function summarizeNewsWithDirectGeminiSDK(query, articles) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  const [{ generateText }, { createGoogleGenerativeAI }] = await Promise.all([
    import("ai"),
    import("@ai-sdk/google"),
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
    summary: result.text || buildFallbackNewsSummary(query, articles, "Vercel AI SDK aktif, tetapi respons ringkasan kosong."),
  };
}

async function summarizeNewsWithGemini(query, articles) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildSummaryPrompt(query, articles) }] }],
      generationConfig: { temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(60000),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `Gemini request failed (${response.status})`);

  return {
    aiEnabled: true,
    provider: `gemini:${model}`,
    summary: extractGeminiText(data) || buildFallbackNewsSummary(query, articles, "Gemini aktif, tetapi respons ringkasan kosong."),
  };
}

function extractChatCompletionText(data) {
  return (data.choices || [])
    .map((choice) => choice?.message?.content || choice?.delta?.content || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function summarizeNewsWithNvidiaGLM(query, articles, timeoutOverride = null) {
  const apiKey = process.env.NVIDIA_API_KEY || process.env.NVAPI_KEY;
  if (!apiKey) return null;

  const timeoutMs = Number(timeoutOverride || process.env.NVIDIA_TIMEOUT_MS || 45000);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`NVIDIA timeout setelah ${Math.round(timeoutMs / 1000)} detik`)), timeoutMs);
  });

  return Promise.race([
    runNvidiaGLMRequest(query, articles, apiKey, timeoutMs),
    timeoutPromise,
  ]);
}

function startSummaryJob(jobId, query, articles) {
  const job = SUMMARY_JOBS.get(jobId);
  if (!job) return;

  const timeoutMs = Number(process.env.NVIDIA_JOB_TIMEOUT_MS || 90 * 1000);
  summarizeNewsWithNvidiaGLM(query, articles, timeoutMs)
    .then((result) => {
      if (!result) throw new Error("NVIDIA_API_KEY belum aktif di server.");
      SUMMARY_JOBS.set(jobId, {
        ...job,
        status: "complete",
        aiEnabled: result.aiEnabled,
        provider: result.provider,
        summary: result.summary,
        finishedAt: Date.now(),
      });
    })
    .catch((err) => {
      SUMMARY_JOBS.set(jobId, {
        ...job,
        status: "complete",
        aiEnabled: false,
        provider: /timeout/i.test(err.message)
          ? "nvidia-timeout | metadata-analysis"
          : "nvidia-error | metadata-analysis",
        summary: buildSourceOnlyNewsSummary(
          query,
          articles,
          `NVIDIA tidak memberi respons selesai: ${err.message}`
        ),
        error: err.message,
        finishedAt: Date.now(),
      });
    });
}

async function runNvidiaGLMRequest(query, articles, apiKey, timeoutMs) {
  const baseUrl = (process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "");
  const model = process.env.NVIDIA_MODEL || "z-ai/glm-5.2";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Kamu adalah analis berita berbahasa Indonesia. Ringkas hanya berdasarkan daftar berita yang diberikan. Jangan mengarang fakta di luar sumber.",
          },
          {
            role: "user",
            content: buildSummaryPrompt(query, articles),
          },
        ],
        temperature: Number(process.env.NVIDIA_TEMPERATURE || 0.2),
        top_p: Number(process.env.NVIDIA_TOP_P || 1),
        max_tokens: Number(process.env.NVIDIA_MAX_TOKENS || 700),
        stream: false,
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.detail || data.error?.message || data.message || text || `NVIDIA request failed (${response.status})`);
    }

    const summary = extractChatCompletionText(data);
    if (!summary) throw new Error("NVIDIA GLM response kosong");

    return {
      aiEnabled: true,
      provider: `nvidia:${model}`,
      summary,
    };
  } catch (err) {
    if (controller.signal.aborted || err.name === "AbortError") {
      throw new Error(`NVIDIA timeout setelah ${Math.round(timeoutMs / 1000)} detik`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function summarizeNewsWithAI(query, articles) {
  try {
    const nvidiaResult = await summarizeNewsWithNvidiaGLM(query, articles);
    if (nvidiaResult) return nvidiaResult;
  } catch (err) {
    console.log("NVIDIA GLM summary skip:", err.message);
    return {
      aiEnabled: false,
      provider: "fallback",
      summary: buildFallbackNewsSummary(
        query,
        articles,
        `Mode fallback dipakai karena NVIDIA gagal: ${err.message}`
      ),
    };
  }

  return {
    aiEnabled: false,
    provider: "fallback",
    summary: buildFallbackNewsSummary(
      query,
      articles,
      "Mode fallback dipakai karena NVIDIA_API_KEY belum aktif di server."
    ),
  };
}

module.exports = async function handler(req, res) {
  cleanupSummaryJobs();

  if (req.method === "GET") {
    const jobId = req.query?.jobId;
    if (jobId) {
      const job = SUMMARY_JOBS.get(String(jobId));
      if (!job) return res.status(404).json({ error: "Job ringkasan tidak ditemukan" });
      return res.status(200).json({
        success: true,
        jobId,
        status: job.status,
        query: job.query,
        total: job.total,
        aiEnabled: job.aiEnabled,
        provider: job.provider,
        summary: job.summary,
        error: job.error,
        results: job.results,
      });
    }

    return res.status(200).json({
      message: "API ai-news-summary aktif (gunakan POST)",
      envLocalFile: fs.existsSync(path.join(process.cwd(), ".env.local")),
      providers: {
        nvidia: Boolean(process.env.NVIDIA_API_KEY || process.env.NVAPI_KEY),
        nvidiaModel: process.env.NVIDIA_MODEL || "z-ai/glm-5.2",
      },
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      query = "",
      startDate = null,
      endDate = null,
      maxItems = 40,
      sourceItems = [],
      sourceMode = "search",
    } = req.body || {};

    const cleanQuery = String(query || "").trim();
    if (!cleanQuery) {
      return res.status(400).json({ error: "Pertanyaan atau query berita tidak boleh kosong", results: [] });
    }

    const providedResults = sourceMode === "crawl-results"
      ? normalizeSourceItems(sourceItems, Math.min(Number(maxItems) || 80, 80))
      : [];

    const chatOnlyResponse = providedResults.length ? null : getChatOnlyResponse(cleanQuery);
    if (chatOnlyResponse) {
      return res.status(200).json({
        success: true,
        status: "complete",
        query: cleanQuery,
        total: 0,
        aiEnabled: false,
        provider: "chat",
        summary: chatOnlyResponse,
        results: [],
      });
    }

    const startBoundary = parseBoundaryDate(startDate, false);
    const endBoundary = parseBoundaryDate(endDate, true);
    const numericMaxItems = Number(maxItems);
    const limit = Number.isFinite(numericMaxItems) && numericMaxItems > 0 ? numericMaxItems : 40;
    const results = providedResults.length
      ? providedResults
      : await collectNewsByQuery(cleanQuery, startBoundary, endBoundary, Math.min(limit, 80));
    const model = process.env.NVIDIA_MODEL || "z-ai/glm-5.2";
    const jobId = createSummaryJobId();
    SUMMARY_JOBS.set(jobId, {
      status: "processing",
      query: cleanQuery,
      total: results.length,
      aiEnabled: false,
      provider: `nvidia:${model}`,
      summary: "NVIDIA sedang menyusun ringkasan. Mohon tunggu...",
      results,
      createdAt: Date.now(),
    });
    startSummaryJob(jobId, cleanQuery, results);

    return res.status(200).json({
      success: true,
      status: "processing",
      jobId,
      query: cleanQuery,
      total: results.length,
      aiEnabled: false,
      provider: `nvidia:${model}`,
      summary: "NVIDIA sedang menyusun ringkasan. Mohon tunggu...",
      results,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Gagal membuat ringkasan AI",
      detail: err.message,
      results: [],
    });
  }
};
