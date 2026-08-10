import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { buildRpbbiReportUrl, type RpbbiDataResponse, type RpbbiReportOptions } from "./rpbbi";

function clean(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function directRows($: cheerio.CheerioAPI, table: AnyNode) {
  return $(table).children("tr").add($(table).children("thead, tbody, tfoot").children("tr")).toArray();
}

function expandTable($: cheerio.CheerioAPI, table: AnyNode) {
  const grid: string[][] = [];
  const spans = new Map<string, { value: string; remaining: number }>();

  directRows($, table).forEach((row, rowIndex) => {
    const output: string[] = [];
    let column = 0;
    const fillSpans = () => {
      while (spans.has(`${rowIndex}:${column}`)) {
        const span = spans.get(`${rowIndex}:${column}`)!;
        output[column] = span.value;
        column += 1;
      }
    };
    fillSpans();
    $(row).children("th, td").each((_, cell) => {
      fillSpans();
      const value = clean($(cell).text());
      const colspan = Math.max(Number($(cell).attr("colspan") ?? 1), 1);
      const rowspan = Math.max(Number($(cell).attr("rowspan") ?? 1), 1);
      for (let offset = 0; offset < colspan; offset += 1) {
        output[column + offset] = value;
        for (let nextRow = 1; nextRow < rowspan; nextRow += 1) {
          spans.set(`${rowIndex + nextRow}:${column + offset}`, { value, remaining: rowspan - nextRow });
        }
      }
      column += colspan;
    });
    grid.push(output);
  });
  return grid;
}

export async function getRpbbiData(options: RpbbiReportOptions): Promise<RpbbiDataResponse> {
  const sourceUrl = buildRpbbiReportUrl(options);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(sourceUrl, {
      headers: { Accept: "text/html", "User-Agent": "MCP-Kemenhut-Demo/0.1 (data publik RPBBI)" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`RPBBI merespons HTTP ${response.status}.`);
    const $ = cheerio.load(await response.text());
    const unavailable = clean($("body").text()).includes("Untuk Saat Ini Data Tidak Tersedia");
    if (unavailable) return { title: clean($("title").text()), headers: [], rows: [], totalRows: 0, sourceUrl };

    const tables = $("table").toArray();
    const table = tables.sort((a, b) => {
      const score = (tableNode: AnyNode) => directRows($, tableNode).filter((row) => /^\d+\.?$/.test(clean($(row).children("th, td").first().text()))).length;
      return score(b) - score(a);
    })[0];
    if (!table) throw new Error("Tabel laporan tidak ditemukan pada halaman RPBBI.");
    const grid = expandTable($, table);
    const firstDataIndex = grid.findIndex((row) => /^\d+\.?$/.test(row[0] ?? ""));
    if (firstDataIndex < 0) throw new Error("Baris data tidak ditemukan pada laporan RPBBI.");
    const width = Math.max(...grid.slice(firstDataIndex).map((row) => row.length));
    const headerRows = grid.slice(0, firstDataIndex);
    const usefulHeaderRows = headerRows.filter((row) => new Set(row.filter(Boolean)).size > 1);
    const headers = Array.from({ length: width }, (_, column) => {
      const parts = usefulHeaderRows.map((row) => row[column]).filter(Boolean);
      return [...new Set(parts)].join(" · ") || `Kolom ${column + 1}`;
    });
    const rows = grid.slice(firstDataIndex).filter((row) => /^\d+\.?$|^jumlah$/i.test(row[0] ?? "")).map((row) =>
      Array.from({ length: width }, (_, column) => row[column] ?? ""),
    );

    return { title: clean($("title").text()), headers, rows, totalRows: rows.length, sourceUrl };
  } finally {
    clearTimeout(timeout);
  }
}

