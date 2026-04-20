import { NextResponse, type NextRequest } from "next/server";
import { createSubmission } from "@/lib/shrine-db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/submit-shrine
 *
 * 神社側（宮司さん / 総代さん / 所有者 / 愛好家）からの新規掲載リクエスト。
 * DB の spot_submissions に pending で保存するだけ。spots には自動追加しない。
 */
type SubmitBody = {
  name?: string;
  name_kana?: string;
  address?: string;
  prefecture?: string;
  city?: string;
  lat?: number | string;
  lng?: number | string;
  deity?: string;
  shrine_type?: string;
  website?: string;
  photo_url?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_role?: string;
  evidence_url?: string;
  note?: string;
  client_id?: string;
  // ハニーポット（bot 対策）。値が入っていたらエラーにする。
  company?: string;
};

function clean(s: unknown, max: number = 500): string | null {
  if (typeof s !== "string") return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // ハニーポット
  if (body.company && body.company.trim() !== "") {
    return NextResponse.json({ ok: true, id: 0 });
  }

  const name = clean(body.name, 200);
  if (!name) {
    return NextResponse.json({ error: "神社名は必須です" }, { status: 400 });
  }
  const contactEmail = clean(body.contact_email, 200);
  if (!contactEmail || !/.+@.+\..+/.test(contactEmail)) {
    return NextResponse.json(
      { error: "連絡先メールアドレスは必須です" },
      { status: 400 },
    );
  }
  const contactName = clean(body.contact_name, 100);
  if (!contactName) {
    return NextResponse.json({ error: "ご担当者名は必須です" }, { status: 400 });
  }

  const lat = toNumber(body.lat);
  const lng = toNumber(body.lng);
  if (lat != null && (lat < 20 || lat > 46)) {
    return NextResponse.json({ error: "緯度が日本の範囲外です" }, { status: 400 });
  }
  if (lng != null && (lng < 122 || lng > 154)) {
    return NextResponse.json({ error: "経度が日本の範囲外です" }, { status: 400 });
  }

  const session = await auth().catch(() => null);
  const userId =
    session && typeof (session as { userId?: number }).userId === "number"
      ? (session as { userId: number }).userId
      : null;
  const submittedByEmail = session?.user?.email ?? null;

  const row = createSubmission({
    name,
    name_kana: clean(body.name_kana, 200),
    address: clean(body.address, 300),
    prefecture: clean(body.prefecture, 40),
    city: clean(body.city, 80),
    lat,
    lng,
    deity: clean(body.deity, 200),
    shrine_type: clean(body.shrine_type, 40),
    website: clean(body.website, 300),
    photo_url: clean(body.photo_url, 500),
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: clean(body.contact_phone, 40),
    contact_role: clean(body.contact_role, 80),
    evidence_url: clean(body.evidence_url, 500),
    note: clean(body.note, 4000),
    client_id: clean(body.client_id, 80),
    user_id: userId,
    submitted_by_email: submittedByEmail,
  });

  return NextResponse.json({ ok: true, id: row.id });
}
