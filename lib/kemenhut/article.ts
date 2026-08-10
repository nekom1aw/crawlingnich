import * as cheerio from "cheerio";

const BASE_URL = "https://www.kehutanan.go.id";

export type ArticleDetail = {
  slug: string;
  title: string;
  date: string;
  category: string;
  image: string | null;
  sourceUrl: string;
  summary: string;
  fiveWOneH: {
    what: string;
    who: string;
    when: string;
    where: string;
    why: string;
    how: string;
  };
};

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sentences(value: string) {
  return clean(value)
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ0-9"“])/)
    .map(clean)
    .filter((sentence) => sentence.length >= 35);
}

function truncate(value: string, length: number) {
  if (value.length <= length) return value;
  return `${value.slice(0, length).replace(/\s+\S*$/, "")}…`;
}

function pickSentence(items: string[], pattern: RegExp, fallback: string) {
  return truncate(items.find((sentence) => pattern.test(sentence)) ?? fallback, 280);
}

export async function getKemenhutArticle(slug: string): Promise<ArticleDetail | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const sourceUrl = `${BASE_URL}/news/${slug}`;
  const response = await fetch(sourceUrl, {
    headers: { Accept: "text/html", "User-Agent": "MCP-Kemenhut-Demo/0.1 (ringkasan data publik)" },
    next: { revalidate: 600 },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Kemenhut merespons HTTP ${response.status}.`);

  const $ = cheerio.load(await response.text());
  const title = clean($("meta[property='og:title']").attr("content") ?? "") || clean($("title").text());
  const meta = clean($("p.text-gray-600.mb-4").first().text());
  const [date = "Tanggal tidak tersedia", category = "Berita"] = meta.split("|").map(clean);
  const content = $("div.mt-4.break-words").first();
  const paragraphTexts = content.find("p").map((_, element) => clean($(element).text())).get()
    .filter((text) => text.length >= 35 && !/^(SIARAN PERS|Nomor:)/i.test(text));
  const fullText = clean(content.text()).replace(/^SIARAN PERS\s+(?:Nomor:\s*\S+\s+)?/i, "");
  const sourceParagraphs = paragraphTexts.length > 0 ? paragraphTexts : [fullText];
  const allSentences = sourceParagraphs.flatMap(sentences);
  const summary = truncate(allSentences.slice(0, 3).join(" ") || clean($("meta[name=description]").attr("content") ?? ""), 720);
  const mainFact = allSentences[1] ?? allSentences[0] ?? summary;
  const fiveWOneH = {
    what: truncate(mainFact, 280),
    who: pickSentence(allSentences, /\b(Kementerian|Menteri|Balai|Direktorat|tim|masyarakat|pemerintah|perusahaan|PT\.?|CV\.?|gajah|satwa)\b/i, mainFact),
    when: pickSentence(allSentences, /\b(?:Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|\d{1,2}\/\d{1,2})\b/i, date),
    where: pickSentence(allSentences, /\b(?:di|dari)\s+(?:Kota|Kabupaten|Provinsi|Desa|Kecamatan|Taman|Pusat|Balai|[A-Z][a-z]+)\b/, mainFact),
    why: pickSentence(allSentences, /\b(?:karena|akibat|disebabkan|penyebab|bertujuan|tujuan|guna|untuk memastikan)\b/i, "Alasan atau penyebab tidak dinyatakan secara tegas dalam bagian awal artikel."),
    how: pickSentence(allSentences, /\b(?:melalui|dengan|upaya|tindakan|penanganan|perawatan|terapi|dilakukan|melakukan)\b/i, "Cara pelaksanaan tidak dijelaskan secara rinci dalam bagian awal artikel."),
  };
  const image = $("meta[property='og:image']").attr("content") ?? content.prevAll("div").find("img").first().attr("src") ?? null;

  return {
    slug,
    title,
    date,
    category,
    image,
    sourceUrl,
    summary: summary || "Ringkasan belum dapat dibuat dari artikel ini.",
    fiveWOneH,
  };
}

