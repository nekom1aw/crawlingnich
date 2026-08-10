import * as cheerio from "cheerio";

const BASE_URL = "https://www.kehutanan.go.id";
const USER_AGENT = "MCP-Kemenhut-Demo/0.1 (pencarian data publik; kontak: local-development)";

export type NewsItem = {
  title: string;
  url: string;
  date: string | null;
  category: string | null;
  sourceType: "kemenhut" | "kemenlh";
};

export type SearchResponse = {
  keyword: string;
  total: number;
  pagesScanned: number;
  source: string;
  results: NewsItem[];
};

type SearchOptions = { keyword: string; limit?: number; maxPages?: number };

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function fold(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("id-ID");
}

function extractDate(text: string) {
  const match = text.match(/(?:Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu),?\s+\d{1,2}\s+[A-Za-z]+\s+\d{4}/i);
  return match ? clean(match[0]) : null;
}

function extractCategory(text: string) {
  const match = text.match(/\b(Siaran Pers|Berita|Artikel)\b/i);
  return match ? match[1] : null;
}

async function fetchNewsPage(page: number) {
  const url = `${BASE_URL}/news?page=${page}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      headers: { Accept: "text/html", "User-Agent": USER_AGENT },
      signal: controller.signal,
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`Kemenhut merespons HTTP ${response.status} pada halaman ${page}.`);
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchKemenhutNews(options: SearchOptions): Promise<SearchResponse> {
  const keyword = clean(options.keyword);
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? 10), 1), 25);
  const maxPages = Math.min(Math.max(Math.trunc(options.maxPages ?? 10), 1), 25);
  const needle = fold(keyword);
  const found = new Map<string, NewsItem>();
  let pagesScanned = 0;

  for (let page = 1; page <= maxPages && found.size < limit; page += 1) {
    const html = await fetchNewsPage(page);
    const $ = cheerio.load(html);
    const candidates = new Map<string, { title: string; context: string; date: string | null; category: string | null }>();

    $('a[href^="/news/"]').each((_, element) => {
      const anchor = $(element);
      const href = anchor.attr("href");
      if (!href) return;
      const heading = clean(anchor.find("h1, h2, h3, h4").first().text());
      const imageAlt = clean(anchor.find("img").first().attr("alt") ?? "");
      const title = heading || imageAlt;
      const context = clean(anchor.closest("article, li, div").text());
      const paragraphTexts = anchor.find("p").map((__, paragraph) => clean($(paragraph).text())).get();
      const date = paragraphTexts.find((text) => extractDate(text)) ?? null;
      const category = paragraphTexts.find((text) => /^(Siaran Pers|Berita|Artikel)$/i.test(text)) ?? null;
      const previous = candidates.get(href);
      if (!previous || title.length > previous.title.length) candidates.set(href, { title, context, date, category });
    });

    for (const [href, candidate] of candidates) {
      const fallbackTitle = href.split("/").pop()?.replace(/-/g, " ") ?? "Berita Kemenhut";
      const title = candidate.title.length >= 8 ? candidate.title : fallbackTitle;
      if (!fold(`${title} ${candidate.context}`).includes(needle)) continue;
      const url = new URL(href, BASE_URL).toString();
      found.set(url, {
        title,
        url,
        date: candidate.date ?? extractDate(candidate.context),
        category: candidate.category ?? extractCategory(candidate.context),
        sourceType: "kemenhut",
      });
      if (found.size >= limit) break;
    }

    pagesScanned = page;
  }

  return { keyword, total: found.size, pagesScanned, source: `${BASE_URL}/news`, results: [...found.values()] };
}

