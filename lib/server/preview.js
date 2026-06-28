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
    if (!["http:", "https:"].includes(url.protocol)) return false;
    if (host.includes("google.") || host.includes("gstatic.") || host.includes("googleusercontent.")) return false;
    if (host.includes("schema.org") || host.includes("w3.org")) return false;
    if (/\.(css|js|png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|map)$/i.test(url.pathname)) return false;
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
    /https?:\/\/[^"'<>\s\\]+/gi,
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
  return publisherUrl ? new URL(publisherUrl) : parsedUrl;
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
  const image = absoluteUrl(
    $("meta[property='og:image']").attr("content") ||
    $("meta[name='twitter:image']").attr("content") ||
    $("article img").first().attr("src") ||
    $("main img").first().attr("src") ||
    "",
    finalUrl
  );

  const selectors = ["article", "main", "[role='main']", ".article", ".post", ".entry-content", ".content"];
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
    image,
    paragraphs: [...new Set(best)].slice(0, 24),
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
      let resolvedUrl = await resolveGoogleNewsUrl(parsedUrl);
      if (isGoogleNewsUrl(resolvedUrl)) {
        const searchedUrl = await findPublisherUrlFromSearch(targetTitle, targetSource);
        if (searchedUrl) resolvedUrl = searchedUrl;
      }

      if (isGoogleNewsUrl(resolvedUrl)) {
        return {
          statusCode: 422,
          html: buildPreviewFallback(
            "Link Google News belum kebuka",
            "Google News memberi halaman perantara yang tidak bisa dirender penuh. Crawl ulang supaya link publisher ikut terambil, atau pakai tombol buka sumber asli.",
            resolvedUrl.toString()
          ),
        };
      }

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
        return {
          statusCode: 200,
          html: buildPreviewFallback("Preview tidak tersedia", "Sumber ini bukan halaman HTML yang bisa dibaca di panel.", finalUrl),
        };
      }

      const article = extractArticleContent(response.data, finalUrl);
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
    return sendPreviewHtml(res, buildPreviewFallback("Preview gagal dimuat", err.message || "Server tidak bisa mengambil halaman sumber.", targetUrl), 502);
  }
};
