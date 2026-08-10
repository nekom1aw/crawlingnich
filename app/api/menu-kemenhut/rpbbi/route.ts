import { NextRequest, NextResponse } from "next/server";
import { getRpbbiData } from "../../../../lib/kemenhut/rpbbi-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const report = params.get("report");
  const status = params.get("status");
  const scale = params.get("scale");
  const production = params.get("production");
  const scope = params.get("scope");
  const year = Number(params.get("year") ?? 2026);

  if (report !== "pemenuhan" && report !== "penggunaan" && report !== "utilitas") {
    return NextResponse.json({ error: "Jenis laporan RPBBI tidak valid." }, { status: 400 });
  }

  try {
    const result = await getRpbbiData({
      report,
      year,
      status: status === "Realisasi" ? "Realisasi" : "Rencana",
      scale: scale === "under" ? "under" : "over",
      production: production === "Sekunder" ? "Sekunder" : "Primer",
      scope: scope === "province" ? "province" : "national",
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Gagal mengambil laporan RPBBI.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

