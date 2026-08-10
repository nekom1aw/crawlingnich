import { NextRequest, NextResponse } from "next/server";
import { searchPbphh } from "../../../../lib/kemenhut/silk";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type") ?? "";

  try {
    const result = await searchPbphh({
      company: params.get("company") ?? "",
      address: params.get("address") ?? "",
      provinceId: params.get("provinceId") ?? "",
      certificationBody: params.get("certificationBody") ?? "",
      certificateNumber: params.get("certificateNumber") ?? "",
      svlkNumber: params.get("svlkNumber") ?? "",
      certificateType: type === "1" || type === "2" || type === "3" ? type : "",
      page: Number(params.get("page") ?? 1),
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Gagal mengambil data PBPHH.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

