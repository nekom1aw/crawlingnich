const axios = require("axios");
const cheerio = require("cheerio");

const PREVIEW_CACHE_TTL_MS = 10 * 60 * 1000;
const previewCache = new Map();
const previewInflight = new Map();

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
    expiresAt: Date.now() + ttlMs,
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPreviewFallback(title, message, targetUrl = "") {
  const safeUrl = escapeHtml(targetUrl);
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0d0f14; color: #f0f2f8; font-family: Arial, sans-serif; }
  .box { width: min(420px, calc(100vw - 32px)); border: 1px solid rgba(255,255,255,.16); padding: 22px; text-align: center; background: rgba(255,255,255,.04); }
  h1 { margin: 0 0 10px; font-size: 20px; }
  p { color: #9aa0af; line-height: 1.6; font-size: 14px; }
  a { display: inline-block; margin-top: 12px; padding: 10px 12px; background: #fff; color: #000; text-decoration: none; font-weight: 700; }
</style>
</head>
<body>
  <div class="box">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    ${safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Buka sumber asli</a>` : ""}
  </div>
</body>
</html>`;
}

function buildPreviewUnavailable({ title = "", source = "", message = "", targetUrl = "" } = {}) {
  const safeUrl = escapeHtml(targetUrl);
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; background: #0b0b0b; color: #f5f5f5; font-family: Arial, sans-serif; }
  .wrap { max-width: 680px; margin: 0 auto; padding: 34px 26px; }
  .label { display: inline-block; margin-bottom: 18px; padding: 6px 9px; border: 1px solid rgba(255,255,255,.18); color: #cfcfcf; font: 700 11px monospace; text-transform: uppercase; }
  h1 { margin: 0 0 14px; font-size: clamp(24px, 5vw, 38px); line-height: 1.16; }
  .source { margin: 0 0 20px; color: #b8b8b8; font-size: 15px; }
  .note { border-top: 1px solid rgba(255,255,255,.16); padding-top: 18px; color: #a8a8a8; line-height: 1.65; font-size: 14px; }
  a { display: inline-block; margin-top: 22px; padding: 11px 13px; background: #fff; color: #000; text-decoration: none; font: 700 12px monospace; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="label">Preview Ringkas</div>
    <h1>${escapeHtml(title || "Preview belum tersedia")}</h1>
    ${source ? `<p class="source">${escapeHtml(source)}</p>` : ""}
    <p class="note">${escapeHtml(message || "Isi artikel belum bisa dimuat otomatis dari server. Gunakan tombol buka sumber untuk membaca halaman aslinya.")}</p>
    ${safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Buka sumber asli</a>` : ""}
  </div>
</body>
</html>`;
}

function sendPreviewHtml(res, html, statusCode = 200, cacheControl = "no-store") {
  return res
    .status(statusCode)
    .setHeader("Content-Type", "text/html; charset=utf-8")
    .setHeader("Cache-Control", cacheControl)
    .setHeader("X-Robots-Tag", "noindex")
    .send(html);
}

function normalizeTargetUrl(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const text = String(raw || "").trim();
  if (!text || text === "#") return null;

  try {
    return new URL(text);
  } catch {
    const cleaned = text.replace(/^\.\//, "/");
    if (cleaned.startsWith("/articles/") || cleaned.startsWith("/rss/articles/")) {
      return new URL(cleaned, "https://news.google.com");
    }
    return null;
  }
}

function isGoogleNewsUrl(url) {
  return /(^|\.)news\.google\.com$/i.test(url.hostname);
}

function decodeHtmlEntities(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeEscapedUrl(value = "") {
  return decodeHtmlEntities(value)
    .replace(/\\u003d/g, "=")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/");
}

function looksLikePublisherUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    if (!["http:", "https:"].includes(url.protocol)) return false;
    if (
      host.includes("google.") ||
      host.includes("googleapis.") ||
      host.includes("gstatic.") ||
      host.includes("googleusercontent.") ||
      host.includes("ggpht.")
    ) return false;
    if (host.includes("schema.org") || host.includes("w3.org")) return false;
    if (/\.(css|js|mjs|json|xml|png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|otf|eot|map)$/i.test(path)) return false;
    return true;
  } catch {
    return false;
  }
}

function extractPublisherUrlFromGoogleHtml(html = "") {
  const text = normalizeEscapedUrl(html);
  const patterns = [
    /data-n-au=["']([^"']+)["']/gi,
    /"url"\s*:\s*"([^"]+)"/gi,
    /href=["']https:\/\/www\.google\.com\/url\?q=([^"'&]+)[^"']*["']/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const raw = match[1] || match[0];
      const candidate = decodeURIComponent(raw);
      if (looksLikePublisherUrl(candidate)) return candidate;
    }
  }

  return null;
}

function extractPublisherUrlFromText(text = "") {
  const normalized = normalizeEscapedUrl(text);
  const matches = normalized.match(/https?:\/\/[^"'<>\s\\]+/gi) || [];
  for (const raw of matches) {
    const candidate = decodeURIComponent(raw);
    if (looksLikePublisherUrl(candidate)) return candidate;
  }
  return null;
}

function extractGoogleNewsDecodeParams(html = "") {
  const $ = cheerio.load(html || "");
  const node = $("[data-n-a-id][data-n-a-ts][data-n-a-sg]").first();
  const params = {
    id: node.attr("data-n-a-id") || "",
    timestamp: node.attr("data-n-a-ts") || "",
    signature: node.attr("data-n-a-sg") || "",
  };

  if (params.id && params.timestamp && params.signature) return params;

  const id = html.match(/data-n-a-id=["']([^"']+)["']/i)?.[1] || "";
  const timestamp = html.match(/data-n-a-ts=["']([^"']+)["']/i)?.[1] || "";
  const signature = html.match(/data-n-a-sg=["']([^"']+)["']/i)?.[1] || "";
  return { id, timestamp, signature };
}

async function decodeGoogleNewsBatch(html = "") {
  const params = extractGoogleNewsDecodeParams(html);
  if (!params.id || !params.timestamp || !params.signature) return null;

  const payload = JSON.stringify([[[
    "Fbv4je",
    JSON.stringify([
      "garturlreq",
      [["en-US", "US", ["FINANCE_TOP_INDICES", "WEB_TEST_1_0_0"], null, null, 1, 1, "US:en", null, 180, null, null, null, null, null, 0, null, null, [1608992183, 723341000]], "en-US", "US", 1, [2, 3, 4, 8], 1, 0, "655000234", 0, 0, null, 0],
      params.id,
      Number(params.timestamp),
      params.signature,
    ]),
    null,
    "generic",
  ]]]);

  const response = await axios.post(
    "https://news.google.com/_/DotsSplashUi/data/batchexecute",
    `f.req=${encodeURIComponent(payload)}`,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
      },
      timeout: 12000,
      responseType: "text",
      validateStatus: (status) => status >= 200 && status < 500,
    }
  );

  return extractPublisherUrlFromText(response.data || "");
}

async function resolveGoogleNewsUrl(parsedUrl) {
  if (!isGoogleNewsUrl(parsedUrl)) return parsedUrl;

  const response = await axios.get(parsedUrl.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    timeout: 15000,
    maxRedirects: 8,
    responseType: "text",
    validateStatus: (status) => status >= 200 && status < 500,
  });

  const finalUrl = response.request?.res?.responseUrl;
  if (finalUrl) {
    const finalParsed = new URL(finalUrl);
    if (!isGoogleNewsUrl(finalParsed)) return finalParsed;
  }

  const publisherUrl = extractPublisherUrlFromGoogleHtml(response.data || "");
  if (publisherUrl) return new URL(publisherUrl);

  const decodedUrl = await decodeGoogleNewsBatch(response.data || "");
  return decodedUrl ? new URL(decodedUrl) : parsedUrl;
}

async function findPublisherUrlFromSearch(title = "", source = "") {
  const query = cleanText(`"${title}" ${source}`).trim();
  if (!title || !query) return null;

  const response = await axios.get("https://www.bing.com/search", {
    params: { q: query, setlang: "id-ID" },
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    timeout: 10000,
    responseType: "text",
  });

  const $ = cheerio.load(response.data || "");
  let publisherUrl = null;
  $("li.b_algo h2 a").each((_, anchor) => {
    const href = $(anchor).attr("href");
    if (href && looksLikePublisherUrl(href)) {
      publisherUrl = href;
      return false;
    }
  });

  return publisherUrl ? new URL(publisherUrl) : null;
}

async function resolveArticleUrl(targetUrl, targetTitle = "", targetSource = "") {
  const parsedUrl = normalizeTargetUrl(targetUrl);
  if (!parsedUrl) {
    const err = new Error("URL tidak valid");
    err.statusCode = 400;
    throw err;
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    const err = new Error("Hanya mendukung URL HTTP atau HTTPS");
    err.statusCode = 400;
    throw err;
  }

  let resolvedUrl = await resolveGoogleNewsUrl(parsedUrl);
  if (isGoogleNewsUrl(resolvedUrl)) {
    const searchedUrl = await findPublisherUrlFromSearch(targetTitle, targetSource);
    if (searchedUrl) resolvedUrl = searchedUrl;
  }

  if (isGoogleNewsUrl(resolvedUrl)) {
    const err = new Error("Link Google News belum berhasil diarahkan ke publisher");
    err.statusCode = 422;
    throw err;
  }

  return resolvedUrl;
}

function absoluteUrl(value, baseUrl) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function cleanText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function extractArticleContent(html, finalUrl) {
  const $ = cheerio.load(html, { baseURI: finalUrl });
  $("script, style, noscript, iframe, svg, form, nav, header, footer, aside, button").remove();
  $("[class], [id]").each((_, el) => {
    const marker = `${$(el).attr("class") || ""} ${$(el).attr("id") || ""}`.toLowerCase();
    if (/\b(related|recommend|popular|latest|terkait|terpopuler|lainnya)\b/.test(marker)) {
      $(el).remove();
    }
  });

  $("h2, h3, h4, strong").each((_, el) => {
    const label = cleanText($(el).text()).toLowerCase();
    if (/^(berita lainnya|artikel terkait|berita terkait|baca juga|rekomendasi|terpopuler|berita terbaru)/i.test(label)) {
      let node = $(el);
      while (node.length) {
        const next = node.next();
        node.remove();
        node = next;
      }
    }
  });

  const title = cleanText(
    $("meta[property='og:title']").attr("content") ||
    $("meta[name='twitter:title']").attr("content") ||
    $("h1").first().text() ||
    $("title").text()
  );
  const description = cleanText(
    $("meta[property='og:description']").attr("content") ||
    $("meta[name='description']").attr("content") ||
    $("meta[name='twitter:description']").attr("content")
  );
  const publishedDate = cleanText(
    $("meta[property='article:published_time']").attr("content") ||
    $("meta[name='article:published_time']").attr("content") ||
    $("meta[name='pubdate']").attr("content") ||
    $("meta[name='publishdate']").attr("content") ||
    $("meta[itemprop='datePublished']").attr("content") ||
    $("time[datetime]").first().attr("datetime") ||
    $("time").first().text()
  );
  const siteName = cleanText(
    $("meta[property='og:site_name']").attr("content") ||
    $("meta[name='application-name']").attr("content")
  );
  const image = absoluteUrl(
    $("meta[property='og:image']").attr("content") ||
    $("meta[name='twitter:image']").attr("content") ||
    $("article img").first().attr("src") ||
    $("main img").first().attr("src") ||
    "",
    finalUrl
  );

  const selectors = ["article", ".article-content", ".entry-content", ".post-content", ".post", ".article", "[role='main']", "main", ".content"];
  let best = [];
  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const paragraphs = [];
      $(el).find("p").each((__, p) => {
        const text = cleanText($(p).text());
        if (text.length >= 45 && !/^baca juga\s*:/i.test(text)) paragraphs.push(text);
      });
      if (paragraphs.join(" ").length > best.join(" ").length) best = paragraphs;
    });
  }

  if (best.length < 2) {
    const paragraphs = [];
    $("p").each((_, p) => {
      const text = cleanText($(p).text());
      if (text.length >= 55 && !/^baca juga\s*:/i.test(text)) paragraphs.push(text);
    });
    best = paragraphs;
  }

  return {
    title,
    description,
    publishedDate,
    siteName,
    image,
    paragraphs: [...new Set(best)].slice(0, 24),
  };
}

async function fetchArticleForUrl(targetUrl, targetTitle = "", targetSource = "") {
  const resolvedUrl = await resolveArticleUrl(targetUrl, targetTitle, targetSource);

  const response = await axios.get(resolvedUrl.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    timeout: 9000,
    maxRedirects: 6,
    responseType: "text",
    validateStatus: (status) => status >= 200 && status < 500,
  });

  const contentType = response.headers["content-type"] || "";
  const finalUrl = response.request?.res?.responseUrl || resolvedUrl.toString();
  if (!contentType.includes("text/html") || typeof response.data !== "string") {
    const err = new Error("Sumber bukan halaman HTML");
    err.statusCode = 415;
    throw err;
  }

  const article = extractArticleContent(response.data, finalUrl);
  return {
    finalUrl,
    article,
  };
}

function buildArticleReader(article, finalUrl) {
  const safeUrl = escapeHtml(finalUrl);
  const paragraphHtml = article.paragraphs.length
    ? article.paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join("\n")
    : `<p>${escapeHtml(article.description || "Konten artikel tidak berhasil diekstrak penuh. Gunakan tombol buka sumber asli untuk melihat halaman lengkap.")}</p>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #101217; color: #f0f2f8; font-family: Georgia, 'Times New Roman', serif; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 26px 24px 44px; }
  .kicker { display: inline-block; margin-bottom: 16px; padding: 5px 8px; border: 1px solid rgba(255,255,255,.16); color: #9aa0af; font: 11px monospace; letter-spacing: 1px; text-transform: uppercase; }
  h1 { margin: 0 0 14px; font-family: Arial, sans-serif; font-size: clamp(26px, 5vw, 42px); line-height: 1.12; letter-spacing: -.04em; }
  .desc { color: #b7bbc6; font: 16px/1.65 Arial, sans-serif; margin: 0 0 20px; }
  img { width: 100%; height: auto; margin: 18px 0 22px; border: 1px solid rgba(255,255,255,.12); }
  article { font-size: 18px; line-height: 1.82; }
  p { margin: 0 0 18px; }
  .actions { margin-top: 28px; }
  a { display: inline-block; padding: 11px 13px; background: #fff; color: #000; text-decoration: none; font: 700 12px monospace; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="kicker">Artikel Preview</div>
    <h1>${escapeHtml(article.title || "Artikel")}</h1>
    ${article.description ? `<p class="desc">${escapeHtml(article.description)}</p>` : ""}
    ${article.image ? `<img src="${escapeHtml(article.image)}" alt="">` : ""}
    <article>${paragraphHtml}</article>
    <div class="actions"><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Buka sumber asli</a></div>
  </div>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendPreviewHtml(res, buildPreviewFallback("Method tidak valid", "Preview hanya mendukung request GET."), 405);
  }

  const targetUrl = req.query?.url;
  const targetTitle = req.query?.title;
  const targetSource = req.query?.source;
  const cacheControl = "private, max-age=600";

  try {
    if (!targetUrl) {
      return sendPreviewHtml(res, buildPreviewFallback(
        "Endpoint tab kanan aktif",
        "Route ini harus dipakai dengan parameter ?url=. Buka artikel dari tombol Buka di kanan pada dashboard, bukan membuka /api/preview langsung."
      ), 400);
    }

    const parsedUrl = normalizeTargetUrl(targetUrl);
    if (!parsedUrl) {
      return sendPreviewHtml(res, buildPreviewFallback("URL tidak valid", "Link sumber kosong atau bukan URL yang bisa dibaca.", targetUrl), 400);
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return sendPreviewHtml(res, buildPreviewFallback("URL tidak valid", "Preview hanya mendukung URL HTTP atau HTTPS."), 400);
    }

    const cacheKey = JSON.stringify({
      url: parsedUrl.toString(),
      title: String(Array.isArray(targetTitle) ? targetTitle[0] : targetTitle || ""),
      source: String(Array.isArray(targetSource) ? targetSource[0] : targetSource || ""),
    });
    const cached = getCacheEntry(previewCache, cacheKey);
    if (cached) {
      res.setHeader("X-Preview-Cache", "HIT");
      return sendPreviewHtml(res, cached.html, cached.statusCode, cacheControl);
    }

    if (previewInflight.has(cacheKey)) {
      const cachedFromInflight = await previewInflight.get(cacheKey);
      res.setHeader("X-Preview-Cache", "WAIT");
      return sendPreviewHtml(res, cachedFromInflight.html, cachedFromInflight.statusCode, cacheControl);
    }

    const loadPreview = (async () => {
      const { article, finalUrl } = await fetchArticleForUrl(targetUrl, targetTitle, targetSource);
      return {
        statusCode: 200,
        html: buildArticleReader(article, finalUrl),
      };
    })();

    previewInflight.set(cacheKey, loadPreview);
    const preview = await loadPreview;
    previewInflight.delete(cacheKey);
    setCacheEntry(previewCache, cacheKey, preview, PREVIEW_CACHE_TTL_MS);
    res.setHeader("X-Preview-Cache", "MISS");
    return sendPreviewHtml(res, preview.html, preview.statusCode, cacheControl);
  } catch (err) {
    if (targetUrl) {
      const parsedUrl = normalizeTargetUrl(targetUrl);
      if (parsedUrl) {
        const cacheKey = JSON.stringify({
          url: parsedUrl.toString(),
          title: String(Array.isArray(targetTitle) ? targetTitle[0] : targetTitle || ""),
          source: String(Array.isArray(targetSource) ? targetSource[0] : targetSource || ""),
        });
        previewInflight.delete(cacheKey);
      }
    }
    return sendPreviewHtml(res, buildPreviewUnavailable({
      title: String(Array.isArray(targetTitle) ? targetTitle[0] : targetTitle || ""),
      source: String(Array.isArray(targetSource) ? targetSource[0] : targetSource || ""),
      message: err.message || "Server tidak bisa mengambil halaman sumber.",
      targetUrl,
    }), 200, "no-store");
  }
};

module.exports.fetchArticleForUrl = fetchArticleForUrl;
module.exports.cleanText = cleanText;
module.exports.resolveArticleUrl = resolveArticleUrl;
