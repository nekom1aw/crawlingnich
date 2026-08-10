const BASE_URL = "https://rpbbi.phl.kehutanan.go.id";

export type RpbbiReport = "pemenuhan" | "penggunaan" | "utilitas";
export type RpbbiStatus = "Rencana" | "Realisasi";
export type RpbbiScale = "over" | "under";
export type RpbbiProduction = "Primer" | "Sekunder";
export type RpbbiScope = "national" | "province";

export type RpbbiReportOptions = {
  report: RpbbiReport;
  year: number;
  status: RpbbiStatus;
  scale?: RpbbiScale;
  production?: RpbbiProduction;
  scope?: RpbbiScope;
};

export type RpbbiDataResponse = {
  title: string;
  headers: string[];
  rows: string[][];
  totalRows: number;
  sourceUrl: string;
};

export function buildRpbbiReportUrl(options: RpbbiReportOptions) {
  const year = Math.trunc(options.year);
  if (year < 2002 || year > 2026) throw new Error("Tahun laporan RPBBI tidak tersedia.");
  const query = `?Tahun=${year}`;

  if (options.report === "pemenuhan") {
    const plan = options.status === "Rencana" ? "Rencana" : "Realisasi";
    const scale = options.scale === "under" ? "_sd6000" : "";
    return `${BASE_URL}/asp/Rekap${plan}PemenuhanNasionalPerPropinsi${scale}.asp${query}`;
  }

  if (options.report === "penggunaan") {
    const prefix = options.status === "Rencana" ? "EvalRcManfaat" : "EvalManfaat";
    const production = options.production === "Sekunder" ? "Sekunder" : "PrimerUmum";
    const umum = options.status === "Realisasi" && options.production === "Sekunder" && options.scale !== "under" ? "Umum" : "";
    const scale = options.scale === "under" ? "_sd6000" : "";
    return `${BASE_URL}/asp/${prefix}${production}${umum}${scale}.asp${query}`;
  }

  const scope = options.scope === "province" ? "R" : "rekap2";
  return `${BASE_URL}/asp/UtilitasTahunanNasional_${scope}_${options.status}.asp${query}`;
}

export const rpbbiSourcePages = {
  pemenuhan: `${BASE_URL}/MonefUmum/MonitoringPemenuhanBB.aspx`,
  penggunaan: `${BASE_URL}/MonefUmum/EvalRcManfaat.aspx`,
  utilitas: `${BASE_URL}/MonefUmum/UtilitasTahunan.aspx`,
};

