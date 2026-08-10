import * as cheerio from "cheerio";
import type { NewsItem, SearchResponse } from "./kemenhut.js";

const BASE_URL = "https://kemenlh.go.id";

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function fold(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("id-ID");
}

async function fetchBatch(page: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const url = page === 1 ? `${BASE_URL}/news/main/berita` : `${BASE_URL}/news/muat_lebih/${(page - 1) * 9}`;
    const response = await fetch(url, {
      method: page === 1 ? "GET" : "POST",
      headers: {
        Accept: "text/html",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "MCP-Kemenhut-Demo/0.1 (pencarian data publik)",
      },
      body: page === 1 ? undefined : new URLSearchParams({ kat: "berita" }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`KemenLH merespons HTTP ${response.status}.`);
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchKemenlhNews({ keyword, limit = 10, maxPages = 10 }: { keyword: string; limit?: number; maxPages?: number }): Promise<SearchResponse> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 25);
  const safePages = Math.min(Math.max(Math.trunc(maxPages), 1), 25);
  const needle = fold(clean(keyword));
  const found = new Map<string, NewsItem>();
  let pagesScanned = 0;

  for (let page = 1; page <= safePages && found.size < safeLimit; page += 1) {
    const html = await fetchBatch(page);
    if (clean(html) === "No") break;
    const $ = cheerio.load(html);
    $('a[href*="/news/detail/"]').each((_, element) => {
      const anchor = $(element);
      const href = anchor.attr("href");
      if (!href) return;
      const title = clean(anchor.find(".card-title, h5").first().text()) || clean(anchor.find("img").attr("alt") ?? "");
      if (title.length < 8 || !fold(title).includes(needle)) return;
      const url = new URL(href, BASE_URL).toString();
      found.set(url, {
        title,
        url,
        date: clean(anchor.find(".card-text").first().text()) || null,
        category: "Berita Lingkungan",
        sourceType: "kemenlh",
      });
    });
    pagesScanned = page;
  }

  return { keyword: clean(keyword), total: found.size, pagesScanned, source: `${BASE_URL}/news/main/berita`, results: [...found.values()] };
}

