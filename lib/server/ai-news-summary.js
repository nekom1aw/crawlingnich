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
    return "Aku chatbot ringkasan berita. Aku bisa mencari sumber berita, menyaring hasil yang relevan, lalu membuat ringkasan 5W + 1H. Aku tidak akan crawling kalau pesanmu hanya sapaan atau obrolan ringan.";
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
  const topArticles = articles.slice(0, 8);
  const sourceList = [...new Set(topArticles.map((item) => item.source).filter(Boolean))].slice(0, 6);
  const latestDate = topArticles
    .map((item) => new Date(item.date).getTime())
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => b - a)[0];
  const latestText = latestDate
    ? new Date(latestDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : "tanggal terbaru tidak tersedia";

  return [
    `Ringkasan awal untuk "${query}".`,
    `Ditemukan ${articles.length} berita, dengan pembaruan terbaru sekitar ${latestText}.`,
    sourceList.length ? `Sumber yang muncul: ${sourceList.join(", ")}.` : "Sumber berita tidak tersedia.",
    "Poin utama dari judul berita teratas:",
    ...topArticles.slice(0, 5).map((item, index) => `${index + 1}. ${item.title}`),
    note,
  ].join("\n");
}

function buildSourceOnlyNewsSummary(query, articles = [], note = "") {
  const topArticles = articles.slice(0, 6);
  const sourceList = [...new Set(topArticles.map((item) => item.source).filter(Boolean))].slice(0, 5);
  const latestDate = topArticles
    .map((item) => new Date(item.date).getTime())
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => b - a)[0];
  const latestText = latestDate
    ? new Date(latestDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : "tanggal terbaru tidak tersedia";
  const titles = topArticles.map((item) => item.title).filter(Boolean);
  const mainTitle = titles[0] || `berita tentang ${query}`;

  return [
    "1. Jawaban langsung atas pertanyaan",
    `Hasil berita yang ditemukan paling kuat membahas ${mainTitle}. Dari ${articles.length} sumber yang lolos filter, isu utamanya berkaitan dengan ${query} dan perkembangan terbaru sekitar ${latestText}.`,
    "",
    "2. Mengapa jawaban itu dipilih",
    `Jawaban ini dipilih karena judul-judul teratas berulang menyebut tema yang sama dan berasal dari sumber seperti ${sourceList.length ? sourceList.join(", ") : "media berita yang tersedia"}. Pola pengulangan judul tersebut menunjukkan isu ini menjadi fokus utama dalam daftar sumber.`,
    "",
    "3. 5W + 1H",
    `What: ${mainTitle}.`,
    `Who: pihak utama tidak seluruhnya disebut jelas dalam sumber, tetapi beberapa judul menyebut aparat, pemerintah daerah, atau pihak terkait kasus.`,
    `When: perkembangan terbaru sekitar ${latestText}.`,
    "Where: lokasi mengikuti judul berita yang tersedia; jika lokasi tidak muncul di judul, berarti tidak disebutkan jelas dalam sumber.",
    `Why: isu ini penting karena berkaitan dengan ${query} dan muncul berulang dalam sumber berita.`,
    "How: kronologi lengkap perlu dibaca dari artikel asli, tetapi judul-judul menunjukkan adanya perkembangan kasus, respons pihak terkait, atau edukasi publik.",
    "",
    "4. Detail penting",
    titles.slice(0, 3).map((title, index) => `${index + 1}. ${title}`).join("\n") || "Detail sumber belum tersedia.",
    "",
    "5. Sumber dominan dan kehati-hatian",
    `${sourceList.length ? `Sumber dominan: ${sourceList.join(", ")}.` : "Sumber dominan belum jelas."} Ringkasan ini dibuat dari judul dan metadata sumber karena NVIDIA belum menyelesaikan ringkasan penuh tepat waktu.${note ? ` ${note}` : ""}`,
  ].join("\n");
}

function buildSummaryPrompt(query, articles) {
  const articleLimit = Number(process.env.AI_SUMMARY_ARTICLE_LIMIT || 3);
  const articleContext = articles.slice(0, articleLimit).map((item, index) => (
    `${index + 1}. ${item.title}\nSumber: ${item.source || "Unknown"}\nTanggal: ${item.date || "-"}`
  )).join("\n\n");

  return `Jawab sebagai analis berita berbahasa Indonesia.
Gunakan hanya daftar berita di bawah ini. Jawab langsung tanpa reasoning panjang. Jangan mengarang fakta. Jangan tampilkan reasoning, pemikiran internal, "Reasoning Complete", atau proses analisis.

Pertanyaan user: ${query}

Daftar berita:
${articleContext}

Buat jawaban dengan format ini:
1. Jawaban langsung atas pertanyaan
Jawab inti pertanyaan dalam 3 sampai 5 kalimat.

2. Mengapa jawaban itu dipilih
Jelaskan alasan analitis dalam 2 sampai 4 kalimat berdasarkan pola judul, sumber, tanggal, atau pihak yang disebut.

3. 5W + 1H
What: ...
Who: ...
When: ...
Where: ...
Why: ...
How: ...

4. Detail penting
Tulis 3 kalimat penting dalam teks biasa. Jangan mengulang format 5W + 1H.

5. Sumber dominan dan kehati-hatian
Sebutkan sumber paling kuat dan keterbatasan data dalam 2 sampai 3 kalimat.

Aturan penting:
- Jangan membuat bagian 5W + 1H lebih dari satu kali.
- Jika salah satu unsur 5W + 1H tidak tersedia di daftar berita, tulis "tidak disebutkan jelas dalam sumber".
- Jangan memakai Markdown seperti **tebal**, bullet "- ", bullet "* ", atau simbol dekoratif lain.
- Gunakan teks polos saja dengan nomor bagian 1 sampai 5.
- Target panjang jawaban 220 sampai 420 kata agar cepat selesai tetapi tetap informatif.
- Pastikan jawaban selesai sampai bagian 5, jangan berhenti di tengah kalimat.`;
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
        provider: "nvidia-timeout",
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
  const { default: OpenAI } = await import("openai");
  const baseUrl = (process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "");
  const model = process.env.NVIDIA_MODEL || "z-ai/glm-5.2";
  const openai = new OpenAI({
    apiKey,
    baseURL: baseUrl,
    timeout: timeoutMs,
    maxRetries: 0,
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let summary = "";
  try {
    const completion = await openai.chat.completions.create({
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
      seed: Number(process.env.NVIDIA_SEED || 42),
      stream: true,
    }, { signal: controller.signal });

    for await (const chunk of completion) {
      summary += chunk.choices?.[0]?.delta?.content || "";
      if (summary.length >= Number(process.env.NVIDIA_MAX_CHARS || 3200)) break;
    }
  } catch (err) {
    if (controller.signal.aborted || err.name === "AbortError") {
      throw new Error(`NVIDIA timeout setelah ${Math.round(timeoutMs / 1000)} detik`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  summary = summary.trim();

  if (!summary) throw new Error("NVIDIA GLM response kosong");

  return {
    aiEnabled: true,
    provider: `nvidia:${model}`,
    summary,
  };
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
    } = req.body || {};

    const cleanQuery = String(query || "").trim();
    if (!cleanQuery) {
      return res.status(400).json({ error: "Pertanyaan atau query berita tidak boleh kosong", results: [] });
    }

    const chatOnlyResponse = getChatOnlyResponse(cleanQuery);
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
    const results = await collectNewsByQuery(cleanQuery, startBoundary, endBoundary, Math.min(limit, 80));
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
