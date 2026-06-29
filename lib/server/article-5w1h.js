const { fetchArticleForUrl, cleanText } = require("./preview");

const ARTICLE_5W1H_CACHE_TTL_MS = 15 * 60 * 1000;
const ARTICLE_5W1H_CONCURRENCY = 3;
const articleCache = new Map();

function getCacheEntry(key) {
  const entry = articleCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    articleCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCacheEntry(key, value) {
  articleCache.set(key, {
    value,
    expiresAt: Date.now() + ARTICLE_5W1H_CACHE_TTL_MS,
  });
}

function normalizeDate(value = "") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() <= 1970) return cleanText(value);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function splitSentences(text = "") {
  const seen = new Set();
  return cleanText(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => cleanText(sentence))
    .filter((sentence) => sentence.length >= 24)
    .filter((sentence) => {
      const key = sentence.toLowerCase().replace(/[.!?]+$/g, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function tidySentence(value = "") {
  return cleanText(value)
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([.!?]){2,}$/g, "$1");
}

function findSentence(sentences, patterns) {
  return tidySentence(sentences.find((sentence) => patterns.some((pattern) => pattern.test(sentence))) || "");
}

function firstUsefulSentence(sentences, fallback = "") {
  return tidySentence(sentences.find((sentence) => sentence.length >= 45) || cleanText(fallback));
}

function uniqueValues(values = []) {
  const seen = new Set();
  const results = [];
  for (const value of values.map(cleanText).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(value);
  }
  return results;
}

function joinDetail(parts = []) {
  return parts.map(tidySentence).filter(Boolean).join(" ");
}

function sentenceScore(sentence = "", patterns = []) {
  return patterns.reduce((score, pattern) => score + (pattern.test(sentence) ? 1 : 0), 0);
}

function pickSentences(sentences = [], patterns = [], limit = 2) {
  return sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: sentenceScore(sentence, patterns),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => tidySentence(entry.sentence));
}

function stripSourceSuffix(title = "") {
  return cleanText(title)
    .replace(/\s+-\s+(?:[A-Z][A-Za-z0-9 ._-]+|MSN|Bing)$/i, "")
    .trim();
}

function formatList(values = [], fallback = "") {
  let cleaned = uniqueValues(values);
  if (cleaned.some((value) => /^Pemerintah daerah$/i.test(value))) {
    cleaned = cleaned.filter((value) => !/^Pemerintah$/i.test(value));
  }
  if (cleaned.some((value) => /^BKSDA\/BBKSDA$/i.test(value))) {
    cleaned = cleaned.filter((value) => !/^Pemerintah daerah$/i.test(value));
  }
  cleaned = cleaned.slice(0, 6);
  if (cleaned.length) return cleaned.join(", ");
  return fallback;
}

function buildSummary(sentences = [], fallback = "") {
  const leadSentences = uniqueValues(sentences)
    .filter((sentence) => sentence.length >= 45)
    .slice(0, 3);
  if (leadSentences.length) return leadSentences.join(" ");
  return tidySentence(fallback);
}

function hasExplicitTime(sentence = "") {
  return /\b(?:tanggal|tahun|bulan|pekan|minggu|hari\s+(?:ini|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|\d{1,2}\s+\w+\s+\d{4}|\d{4})\b/i.test(sentence);
}

function detectWhere(item = {}, article = {}, sentences = []) {
  if (item.region) return cleanText(item.region);

  const text = cleanText([article.title, article.description, sentences.slice(0, 5).join(" ")].join(" "));
  const match = text.match(/\b(?:di|dari|ke|sekitar|wilayah|kabupaten|kota|provinsi)\s+([A-Z][A-Za-zÀ-ÿ'-]*(?:\s+[A-Z][A-Za-zÀ-ÿ'-]*){0,4})/);
  if (!match) return "";

  return cleanText(match[1])
    .split(/\s+(?:yang|dan|untuk|karena|akibat|dengan|melalui|pada|saat|Warga|Pemerintah|Perusahaan)\b/)[0];
}

function detectWho(item = {}, article = {}, sentences = []) {
  const text = cleanText([article.title, article.description, sentences.slice(0, 4).join(" ")].join(" "));
  const actorMatch = text.match(/\b(warga|masyarakat adat|pemerintah(?:\s+daerah)?|perusahaan|polisi|kementerian|KLHK|KPK|aktivis|peneliti|petani|nelayan|pejabat|gubernur|bupati|walhi|greenpeace|LSM)\b/i);
  if (actorMatch) {
    return actorMatch[0]
      .split(" ")
      .map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word)
      .join(" ");
  }

  const orgPattern = /\b([A-Z][A-Za-zÀ-ÿ.'-]*(?:\s+[A-Z][A-Za-zÀ-ÿ.'-]*){1,6})\b/g;
  const ignored = new Set(["Menurut", "Pada", "Dalam", "Sementara", "Selain", "Baca", "Juga"]);
  const matches = [...text.matchAll(orgPattern)]
    .map((match) => cleanText(match[1]))
    .filter((value) => value && !ignored.has(value.split(" ")[0]) && !/\b(di|dari|ke)\b/i.test(value));

  if (matches.length) return matches[0];
  return cleanText(article.siteName || item.source || "");
}

function detectActors(item = {}, article = {}, sentences = []) {
  const text = cleanText([article.title, article.description, ...sentences.slice(0, 8)].join(" "));
  const candidates = [];

  const actorLabels = [
    ["Warga", /\bwarga\b/i],
    ["Masyarakat adat", /\bmasyarakat adat\b/i],
    ["Pemerintah daerah", /\bpemerintah daerah\b/i],
    ["Pemerintah", /\bpemerintah\b/i],
    ["Polisi", /\b(?:polisi|kepolisian|polda|polres)\b/i],
    ["BKSDA/BBKSDA", /\b(?:bksda|bbksda)\b/i],
    ["KLHK/Kementerian", /\b(?:klhk|kementerian|kemenhut)\b/i],
    ["Perusahaan", /\b(?:perusahaan|korporasi|pemegang konsesi|pengelola kawasan)\b/i],
    ["Aktivis/LSM", /\b(?:aktivis|lsm|walhi|greenpeace)\b/i],
    ["Peneliti", /\bpeneliti\b/i],
    ["Petugas", /\bpetugas\b/i],
    ["Orangutan/satwa", /\b(?:orangutan|orang utan|satwa)\b/i],
  ];
  for (const [label, pattern] of actorLabels) {
    if (pattern.test(text)) candidates.push(label);
  }

  const properNouns = [...text.matchAll(/\b([A-Z][A-Za-zÀ-ÿ.'-]*(?:\s+[A-Z][A-Za-zÀ-ÿ.'-]*){1,5})\b/g)]
    .map((match) => match[1])
    .filter((value) => !/\b(?:Saat|Dalam|Pada|Menurut|Baca Juga|Kalimantan Selatan|Kalimantan Timur|Sumatra|Sumatera|Aceh|Riau|Kaltim|Kalsel)\b/i.test(value))
    .slice(0, 5);

  const actors = uniqueValues([...candidates, ...properNouns])
    .filter((value) => value.length >= 3);
  return actors.length ? actors : uniqueValues([article.siteName, item.source]).filter((value) => value.length >= 3);
}

function detectLocations(item = {}, article = {}, sentences = []) {
  const text = cleanText([article.title, article.description, ...sentences.slice(0, 8)].join(" "));
  const candidates = [];
  if (item.region) candidates.push(item.region);

  const locationPatterns = [
    /\b(?:di|dari|ke|sekitar|wilayah|kawasan|kabupaten|kota|provinsi|desa|kecamatan)\s+([A-Z][A-Za-zÀ-ÿ'-]*(?:\s+[A-Z][A-Za-zÀ-ÿ'-]*){0,4})/g,
    /\b(Aceh|Riau|Jambi|Sumatra|Sumatera|Kalimantan(?:\s+Timur|\s+Selatan|\s+Tengah|\s+Barat)?|Kutai Timur|Bengalon|Tabalong|Manado|Jantho|Kaltim|Kalsel|Papua)\b/gi,
  ];
  for (const pattern of locationPatterns) {
    for (const match of text.matchAll(pattern)) {
      const value = cleanText(match[1] || match[0])
        .split(/\s+(?:yang|dan|untuk|karena|akibat|dengan|melalui|pada|saat|menurut|melaporkan|memprotes|meningkat|melahirkan|masuk|minta|larang)\b/i)[0]
        .split(/\s+(?:Warga|Pemerintah|Perusahaan|Polisi|BKSDA|BBKSDA|KLHK|Kementerian|Aktivis|Peneliti|Petugas)\b/)[0]
        .replace(/[,.!?;:].*$/g, "");
      candidates.push(value);
    }
  }

  return uniqueValues(candidates).filter((value) => value.length >= 3);
}

function buildArticleFiveWOneH(item = {}, article = {}) {
  const paragraphs = Array.isArray(article.paragraphs) ? article.paragraphs : [];
  const title = stripSourceSuffix(article.title || item.title || "");
  const articleText = cleanText(uniqueValues([
    title,
    article.description,
    ...paragraphs,
  ]).join(". "));
  const sentences = splitSentences(articleText);
  const lead = firstUsefulSentence(sentences, item.snippet || article.description || item.title);
  const summary = buildSummary(sentences, lead);

  const actors = detectActors(item, article, sentences);
  const locations = detectLocations(item, article, sentences);
  const whenSentences = pickSentences(sentences.filter(hasExplicitTime), [
    /\b(?:tanggal|tahun|bulan|pekan|minggu|hari\s+(?:ini|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|\d{1,2}\s+\w+\s+\d{4}|\d{4})\b/i,
  ], 2);
  const whereSentences = pickSentences(sentences, [
    /\b(?:di|dari|ke|wilayah|kawasan|kabupaten|kota|provinsi|desa|kecamatan|hutan|gambut|kampung|koridor)\b/i,
  ], 2);
  const actorSentences = pickSentences(sentences, [
    /\b(?:warga|masyarakat|pemerintah|polisi|bksda|bbksda|klhk|kementerian|perusahaan|aktivis|peneliti|petugas|pejabat|orangutan|orang utan)\b/i,
  ], 2);
  const whySentences = pickSentences(sentences, [
    /\bkarena\b/i,
    /\bakibat\b/i,
    /\bsebab\b/i,
    /\bdampak\b/i,
    /\bdipicu\b/i,
    /\bterkait\b/i,
    /\blantaran\b/i,
    /\btujuan\b/i,
    /\bkonflik\b/i,
    /\bperdagangan\b/i,
    /\bhabitat\b/i,
  ], 3);
  const howSentences = pickSentences(sentences, [
    /\bdengan\b/i,
    /\bmelalui\b/i,
    /\bcara\b/i,
    /\bupaya\b/i,
    /\bproses\b/i,
    /\bmodus\b/i,
    /\bkronologi\b/i,
    /\bmenurut\b/i,
    /\bmenyelamatkan\b/i,
    /\bmelarang\b/i,
    /\bmengamankan\b/i,
  ], 3);

  return {
    apa: joinDetail([
      title ? `Topik utama: ${title}.` : "",
      lead ? `Inti peristiwa: ${lead}` : "",
      summary && summary !== lead ? `Ringkasan konteks: ${summary}` : "",
    ]),
    siapa: joinDetail([
      `Aktor/pihak yang disebut: ${formatList(actors, detectWho(item, article, sentences) || "tidak disebut jelas")}.`,
      actorSentences.length ? `Kalimat pendukung: ${actorSentences.join(" ")}` : "",
    ]),
    kapan: joinDetail([
      `Waktu publikasi/kejadian: ${normalizeDate(article.publishedDate || item.date) || "tidak disebut jelas"}.`,
      whenSentences.length ? `Petunjuk waktu dari artikel: ${whenSentences.join(" ")}` : "",
    ]),
    diMana: joinDetail([
      `Lokasi yang teridentifikasi: ${formatList(locations, detectWhere(item, article, sentences) || "tidak disebut jelas")}.`,
      whereSentences.length ? `Kalimat pendukung lokasi: ${whereSentences.join(" ")}` : "",
    ]),
    mengapa: joinDetail([
      whySentences.length
        ? `Alasan/konteks yang disebut artikel: ${whySentences.join(" ")}`
        : "Alasan eksplisit tidak ditemukan; gunakan ringkasan artikel sebagai konteks awal.",
    ]),
    bagaimana: joinDetail([
      howSentences.length
        ? `Proses/kronologi/upaya yang disebut artikel: ${howSentences.join(" ")}`
        : `Proses belum dijelaskan rinci; inti artikel: ${lead}`,
    ]),
    ringkasanArtikel: summary,
    artikelTerbaca: paragraphs.length > 0,
    jumlahParagraf: paragraphs.length,
  };
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

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runWorker));
  return results;
}

async function enrichItem(item = {}) {
  const link = cleanText(item.link);
  if (!link) {
    return {
      fiveWOneH: buildArticleFiveWOneH(item, {
        title: item.title,
        description: item.snippet,
        paragraphs: item.snippet ? [item.snippet] : [],
        siteName: item.source,
      }),
      article: null,
      finalUrl: "",
      error: "Link kosong",
    };
  }

  const cacheKey = JSON.stringify({
    link,
    title: item.title || "",
    source: item.source || "",
  });
  const cached = getCacheEntry(cacheKey);
  if (cached) return cached;

  try {
    const { article, finalUrl } = await fetchArticleForUrl(link, item.title, item.source);
    const payload = {
      fiveWOneH: buildArticleFiveWOneH(item, article),
      article: {
        title: article.title,
        description: article.description,
        publishedDate: article.publishedDate,
        siteName: article.siteName,
        paragraphs: article.paragraphs,
      },
      finalUrl,
      error: "",
    };
    setCacheEntry(cacheKey, payload);
    return payload;
  } catch (err) {
    const fallbackArticle = {
      title: item.title,
      description: item.snippet,
      paragraphs: item.snippet ? [item.snippet] : [],
      siteName: item.source,
    };
    return {
      fiveWOneH: buildArticleFiveWOneH(item, fallbackArticle),
      article: fallbackArticle,
      finalUrl: link,
      error: err.message || "Artikel tidak bisa dibaca",
    };
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 200) : [];
  if (!items.length) {
    return res.status(400).json({ error: "Items kosong", results: [] });
  }

  const results = await mapWithConcurrency(items, ARTICLE_5W1H_CONCURRENCY, async (item, index) => ({
    index,
    ...(await enrichItem(item)),
  }));

  return res.status(200).json({
    success: true,
    total: results.length,
    results,
  });
};
