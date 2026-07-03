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
      console.log("AI summary feed skip:", err.message);
    }
  }

  return items;
}

async function collectNewsByQuery(query, startBoundary = null, endBoundary = null, maxItems = 40) {
  const items = await fetchNewsFeedItems(query, maxItems);
  const results = [];
  const seen = new Set();

  for (const item of items) {
    const link = item.link?.[0];
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
      matchedKeywords: query,
    });
  }

  results.sort((a, b) => {
    const bTime = new Date(b.date || 0).getTime() || 0;
    const aTime = new Date(a.date || 0).getTime() || 0;
    return bTime - aTime;
  });

  return results;
}

function buildFallbackNewsSummary(query, articles = [], note = "Mode AI penuh belum aktif karena environment AI belum diset di server production. Set salah satu dari NVIDIA_API_KEY, AI_GATEWAY_API_KEY, GEMINI_API_KEY, atau OPENAI_API_KEY lalu restart aplikasi.") {
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

function buildSummaryPrompt(query, articles) {
  const articleContext = articles.slice(0, 25).map((item, index) => (
    `${index + 1}. ${item.title}\nSumber: ${item.source || "Unknown"}\nTanggal: ${item.date || "-"}\nLink: ${item.link || "-"}`
  )).join("\n\n");

  return `Kamu adalah analis berita berbahasa Indonesia.
Jawab pertanyaan user secara detail hanya berdasarkan daftar berita yang diberikan. Jangan mengarang fakta di luar sumber.

Pertanyaan user: ${query}

Daftar berita:
${articleContext}

Buat jawaban dengan format ini:
1. Jawaban langsung atas pertanyaan
   - Jawab pertanyaan user dengan detail, jelas, dan tidak terlalu pendek.
   - Jika pertanyaannya meminta penilaian, kesimpulan, penyebab, dampak, atau rekomendasi, berikan jawaban yang tegas tetapi tetap berbasis sumber.
   - Jelaskan konteks utama dari berita yang relevan, bukan sekadar mengulang judul.

2. Mengapa jawaban itu dipilih
   - Jelaskan alasan analitis kenapa jawaban/kesimpulan tersebut dipilih.
   - Sebutkan petunjuk dari daftar berita yang mendukung alasan itu, misalnya pola sumber, jumlah berita, tanggal, pihak yang disebut, atau pengulangan isu.
   - Jangan memakai frasa kosong seperti "berdasarkan sumber" saja; jelaskan sumbernya menunjukkan apa.

3. 5W + 1H
   - Tulis bagian ini hanya satu kali dalam seluruh jawaban.
   - What: apa isu atau peristiwa utamanya.
   - Who: siapa pihak utama yang disebut.
   - When: kapan peristiwa atau perkembangan disebut terjadi.
   - Where: di mana lokasi atau konteks wilayahnya.
   - Why: mengapa isu ini terjadi atau penting, berdasarkan daftar berita.
   - How: bagaimana kronologi, dampak, atau prosesnya.

4. Detail penting
   - Buat bullet pendek berisi fakta pendukung yang paling relevan.
   - Jangan mengulang lagi format 5W + 1H di bagian ini.

5. Sumber dominan dan kehati-hatian
   - Sebutkan sumber media yang paling sering atau paling kuat muncul.
   - Jelaskan keterbatasan data jika ada unsur yang belum jelas.

Aturan penting:
- Jangan membuat bagian 5W + 1H lebih dari satu kali.
- Jangan menulis ulang 5W + 1H di ringkasan, detail penting, atau catatan.
- Jika salah satu unsur 5W + 1H tidak tersedia di daftar berita, tulis "tidak disebutkan jelas dalam sumber".
- Semua klaim harus dapat ditelusuri ke daftar berita yang diberikan.`;
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

async function summarizeNewsWithNvidiaGLM(query, articles) {
  const apiKey = process.env.NVIDIA_API_KEY || process.env.NVAPI_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "");
  const model = process.env.NVIDIA_MODEL || "z-ai/glm-5.2";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
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
      max_tokens: Number(process.env.NVIDIA_MAX_TOKENS || 8192),
      seed: Number(process.env.NVIDIA_SEED || 42),
      stream: false,
    }),
    signal: AbortSignal.timeout(60000),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `NVIDIA GLM request failed (${response.status})`);

  return {
    aiEnabled: true,
    provider: `nvidia:${model}`,
    summary: extractChatCompletionText(data) || buildFallbackNewsSummary(query, articles, "NVIDIA GLM aktif, tetapi respons ringkasan kosong."),
  };
}

async function summarizeNewsWithAI(query, articles) {
  try {
    const nvidiaResult = await summarizeNewsWithNvidiaGLM(query, articles);
    if (nvidiaResult) return nvidiaResult;
  } catch (err) {
    console.log("NVIDIA GLM summary skip:", err.message);
  }

  try {
    const gatewayResult = await summarizeNewsWithVercelAIGateway(query, articles);
    if (gatewayResult) return gatewayResult;
  } catch (err) {
    console.log("Vercel AI Gateway summary skip:", err.message);
  }

  try {
    const sdkResult = await summarizeNewsWithDirectGeminiSDK(query, articles);
    if (sdkResult) return sdkResult;
  } catch (err) {
    console.log("Direct Gemini SDK summary skip:", err.message);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    try {
      const geminiResult = await summarizeNewsWithGemini(query, articles);
      if (geminiResult) return geminiResult;
    } catch (err) {
      console.log("Gemini summary skip:", err.message);
    }

    return {
      aiEnabled: false,
      provider: "fallback",
      summary: buildFallbackNewsSummary(query, articles),
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "Kamu adalah analis berita berbahasa Indonesia. Ringkas hanya berdasarkan daftar berita yang diberikan. Jangan mengarang fakta di luar sumber.",
        },
        {
          role: "user",
          content: buildSummaryPrompt(query, articles),
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "OpenAI summary failed");

  return {
    aiEnabled: true,
    provider: `openai:${process.env.OPENAI_MODEL || "gpt-4.1-mini"}`,
    summary: extractOpenAIText(data) || buildFallbackNewsSummary(query, articles),
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ message: "API ai-news-summary aktif (gunakan POST)" });
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

    const startBoundary = parseBoundaryDate(startDate, false);
    const endBoundary = parseBoundaryDate(endDate, true);
    const numericMaxItems = Number(maxItems);
    const limit = Number.isFinite(numericMaxItems) && numericMaxItems > 0 ? numericMaxItems : 40;
    const results = await collectNewsByQuery(cleanQuery, startBoundary, endBoundary, Math.min(limit, 80));
    const summaryResult = await summarizeNewsWithAI(cleanQuery, results);

    return res.status(200).json({
      success: true,
      query: cleanQuery,
      total: results.length,
      aiEnabled: summaryResult.aiEnabled,
      provider: summaryResult.provider,
      summary: summaryResult.summary,
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
