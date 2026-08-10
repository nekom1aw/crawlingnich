import * as cheerio from "cheerio";

const SEARCH_URL = "https://silk.phl.kehutanan.go.id/index.php/info/get_iuiphhk/0.12345";
const SOURCE_URL = "https://silk.phl.kehutanan.go.id/index.php/info/iuiphhk";

export type PbphhItem = {
  number: number;
  company: string;
  address: string;
  province: string;
  city: string;
  certificationBody: string;
  certificateNumber: string;
  svlkNumber: string;
  validityPeriod: string;
  certificateType: string;
};

export type PbphhResponse = {
  total: number;
  page: number;
  totalPages: number;
  source: string;
  results: PbphhItem[];
};

export type PbphhSearchOptions = {
  company?: string;
  address?: string;
  provinceId?: string;
  cityId?: string;
  certificationBody?: string;
  certificateNumber?: string;
  svlkNumber?: string;
  certificateType?: "" | "1" | "2" | "3";
  page?: number;
};

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function searchPbphh(options: PbphhSearchOptions = {}): Promise<PbphhResponse> {
  const page = Math.min(Math.max(Math.trunc(options.page ?? 1), 1), 388);
  const body = new URLSearchParams({
    nama: options.company?.trim() ?? "",
    alamat: options.address?.trim() ?? "",
    idprop: options.provinceId ?? "",
    idkab: options.cityId ?? "",
    nama_lvlk: options.certificationBody?.trim() ?? "",
    no_sertifikat: options.certificateNumber?.trim() ?? "",
    no_tanda_svlk: options.svlkNumber?.trim() ?? "",
    jenis: options.certificateType ?? "",
    index: String(page),
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        Accept: "text/html",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "MCP-Kemenhut-Demo/0.1 (pencarian data publik)",
      },
      body,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`SILK merespons HTTP ${response.status}.`);

    const $ = cheerio.load(await response.text());
    const totalText = clean($(".clsTotal").text());
    const total = Number((totalText.match(/[\d.]+/)?.[0] ?? "0").replace(/\./g, ""));
    const pageText = clean($(".pagination").first().text());
    const totalPages = Number(pageText.match(/\d+\s+of\s+(\d+)/i)?.[1] ?? (total > 0 ? 1 : 0));
    const results: PbphhItem[] = [];

    $("table tbody tr").each((_, row) => {
      const cells = $(row).find("td").map((__, cell) => clean($(cell).text())).get();
      if (cells.length < 10) return;
      results.push({
        number: Number(cells[0]),
        company: cells[1],
        address: cells[2],
        province: cells[3],
        city: cells[4],
        certificationBody: cells[5],
        certificateNumber: cells[6],
        svlkNumber: cells[7],
        validityPeriod: cells[8],
        certificateType: cells[9],
      });
    });

    return { total, page, totalPages, source: SOURCE_URL, results };
  } finally {
    clearTimeout(timeout);
  }
}

