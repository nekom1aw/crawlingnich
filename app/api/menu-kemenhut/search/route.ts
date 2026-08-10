import { NextRequest, NextResponse } from "next/server";
import { searchKemenhutNews } from "../../../../lib/kemenhut/kemenhut";
import { searchKemenlhNews } from "../../../../lib/kemenhut/kemenlh";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword")?.trim() ?? "";
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 10);
  const maxPages = Number(request.nextUrl.searchParams.get("maxPages") ?? 10);
  const source = request.nextUrl.searchParams.get("source") ?? "all";

  if (keyword.length < 2) {
    return NextResponse.json({ error: "Kata kunci minimal 2 karakter." }, { status: 400 });
  }

  try {
    const result = source === "kemenhut"
      ? await searchKemenhutNews({ keyword, limit, maxPages })
      : source === "kemenlh"
        ? await searchKemenlhNews({ keyword, limit, maxPages })
        : await Promise.all([
            searchKemenhutNews({ keyword, limit, maxPages }),
            searchKemenlhNews({ keyword, limit, maxPages }),
          ]).then(([forest, environment]) => ({
            keyword,
            total: forest.results.length + environment.results.length,
            pagesScanned: forest.pagesScanned + environment.pagesScanned,
            source: "Kemenhut + KemenLH",
            results: [...forest.results, ...environment.results].slice(0, Math.min(Math.max(limit, 1), 25)),
          }));
    return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Gagal mengambil data Kemenhut.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
