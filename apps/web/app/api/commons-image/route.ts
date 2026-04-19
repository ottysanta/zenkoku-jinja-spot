import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/commons-image?q=<神社名>
 *
 * Wikimedia Commons API で画像を検索し、最初の結果の 800px サムネイル URL を返す。
 * Wikipedia 記事がない神社でも Commons に写真が上がっているケースをカバー。
 *
 * レスポンス: { url: string | null, attribution: string | null }
 */
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

type CommonsQueryResp = {
  query?: {
    search?: Array<{ title: string; pageid: number }>;
  };
};

type CommonsImageInfoResp = {
  query?: {
    pages?: Record<
      string,
      {
        title: string;
        imageinfo?: Array<{
          thumburl?: string;
          url?: string;
          user?: string;
          extmetadata?: Record<string, { value?: string }>;
        }>;
      }
    >;
  };
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "ZenkokuJinjaSpot/0.1 (https://example.com/contact)",
        Accept: "application/json",
      },
      // Commons は公開エンドポイントだが 5s でタイムアウトする
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ url: null, attribution: null, error: "q required" }, { status: 400 });
  }

  // 1. srsearch=<神社名> filetype:bitmap → 画像ファイルを探す
  const searchUrl =
    COMMONS_API +
    "?action=query&list=search&srnamespace=6&srlimit=5&format=json&origin=*&srsearch=" +
    encodeURIComponent(q + " 神社 filetype:bitmap");
  const search = await fetchJson<CommonsQueryResp>(searchUrl);
  const hits = search?.query?.search ?? [];
  if (!hits.length) {
    return NextResponse.json({ url: null, attribution: null });
  }

  // 上位 3 件の中で、OSM データにヒットしそうなのを優先。ここでは単純に 1 位を使う。
  const title = hits[0].title;

  // 2. 画像情報（サムネ + 著作情報）を取得
  const infoUrl =
    COMMONS_API +
    "?action=query&prop=imageinfo&iiprop=url|user|extmetadata&iiurlwidth=800&format=json&origin=*&titles=" +
    encodeURIComponent(title);
  const info = await fetchJson<CommonsImageInfoResp>(infoUrl);
  const pages = info?.query?.pages ?? {};
  const first = Object.values(pages)[0];
  const ii = first?.imageinfo?.[0];
  const url = ii?.thumburl || ii?.url || null;
  if (!url) {
    return NextResponse.json({ url: null, attribution: null });
  }
  const author =
    ii?.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, "").trim() ||
    ii?.user ||
    null;
  const license =
    ii?.extmetadata?.LicenseShortName?.value ||
    ii?.extmetadata?.License?.value ||
    "";
  const attribution = [author, license].filter(Boolean).join(" / ") || "Wikimedia Commons";
  return NextResponse.json({
    url,
    attribution,
    commonsTitle: title,
  });
}
