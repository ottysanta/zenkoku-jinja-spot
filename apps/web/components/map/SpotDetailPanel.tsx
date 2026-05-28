"use client";
/**
 * 右サイドの詳細パネル（モバイルでは下ドロワー、PCでは固定右ペイン）。
 * ダークテーマ統一 + 祭神リッチカード対応。
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  api,
  spotSlug,
  type Spot,
  type Checkin,
  type CheckinStats,
  ApiError,
} from "@/lib/api";
import { getClientId } from "@/lib/client-id";
import { formatDistance, haversineM } from "@/lib/geo";
import BookmarkButtons from "@/components/shrines/BookmarkButtons";
import { resolveDeities } from "@/lib/deity-info";

type Props = {
  spot: Spot;
  userLocation: { lat: number; lng: number; accuracy?: number } | null;
  onClose: () => void;
};

const WISH_LABELS: Record<string, string> = {
  gratitude: "感謝",
  vow: "決意",
  milestone: "節目",
  thanks: "お礼",
  other: "その他",
};

const CHECKIN_MAX_DISTANCE_M = 300;
const CHECKIN_MIN_ACCURACY_M = 200;

function formatRelative(iso: string): string {
  try {
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "たった今";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}分前`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}時間前`;
    const d = Math.floor(hr / 24);
    if (d < 30) return `${d}日前`;
    return new Date(iso).toLocaleDateString("ja-JP");
  } catch { return iso; }
}

export default function SpotDetailPanel({ spot, userLocation, onClose }: Props) {
  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [recent, setRecent] = useState<Checkin[] | null>(null);
  const [wish, setWish] = useState<string>("gratitude");
  const [comment, setComment] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<
    | { kind: "ok"; text: string }
    | { kind: "err"; text: string }
    | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    setRecent(null);
    setMessage(null);
    Promise.all([
      api.getCheckinStats(spot.id).catch(() => null),
      api.listCheckins(spot.id, 5).catch(() => []),
    ]).then(([s, r]) => {
      if (cancelled) return;
      setStats(s);
      setRecent(r);
    });
    return () => { cancelled = true; };
  }, [spot.id]);

  const distance = userLocation
    ? haversineM(userLocation.lat, userLocation.lng, spot.lat, spot.lng)
    : null;
  const tooFar = distance !== null && distance > CHECKIN_MAX_DISTANCE_M;
  const accuracyBad =
    userLocation?.accuracy != null && userLocation.accuracy > CHECKIN_MIN_ACCURACY_M;

  async function handleCheckin(e: React.FormEvent) {
    e.preventDefault();
    if (!userLocation) {
      setMessage({ kind: "err", text: "GPS が取得できていません。位置情報を許可してください。" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await api.createCheckin(spot.id, {
        client_id: getClientId(),
        lat: userLocation.lat,
        lng: userLocation.lng,
        accuracy_m: userLocation.accuracy ?? null,
        wish_type: wish,
        comment: comment.trim() || null,
        nickname: nickname.trim() || null,
      });
      setMessage({ kind: "ok", text: `参拝を記録しました（${WISH_LABELS[wish] ?? ""}）` });
      setComment("");
      setRecent((prev) => [result, ...(prev ?? [])].slice(0, 5));
      api.getCheckinStats(spot.id).then(setStats).catch(() => {});
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "エラーが発生しました";
      setMessage({ kind: "err", text: msg });
    } finally {
      setBusy(false);
    }
  }

  let benefits: string[] = [];
  if (spot.benefits) {
    try {
      const parsed = JSON.parse(spot.benefits);
      if (Array.isArray(parsed)) benefits = parsed.filter((x) => typeof x === "string");
    } catch {}
  }
  let highlights: string[] = [];
  if (spot.highlights) {
    try {
      const parsed = JSON.parse(spot.highlights);
      if (Array.isArray(parsed)) highlights = parsed.filter((x) => typeof x === "string");
    } catch {}
  }

  const deityCards = resolveDeities(spot.deity);

  return (
    <aside
      className="
        fixed inset-x-0 bottom-0 z-[1100] flex max-h-[82dvh] w-full flex-col overflow-hidden
        rounded-t-2xl shadow-2xl
        md:static md:z-auto md:max-h-none md:w-[420px] md:rounded-none md:shadow-none
      "
      style={{ background: "#0D0A07", borderTop: "1px solid rgba(201,155,77,0.2)", borderLeft: "1px solid rgba(201,155,77,0.15)" }}
    >
      {/* モバイル用ドラッグハンドル */}
      <div className="flex justify-center pt-2 pb-0 md:hidden shrink-0">
        <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "rgba(201,155,77,0.35)" }} />
      </div>

      {/* ヒーロー写真 or ヘッダー */}
      {spot.photo_url ? (
        <div className="relative h-44 w-full shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spot.photo_url}
            alt={spot.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,10,7,0.85) 0%, rgba(13,10,7,0.2) 60%, transparent 100%)" }} />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm transition hover:opacity-80"
            style={{ background: "rgba(13,10,7,0.7)", color: "rgba(220,202,168,0.9)", border: "1px solid rgba(201,155,77,0.3)" }}
            aria-label="閉じる"
          >
            閉じる
          </button>
          <div className="absolute inset-x-0 bottom-0 px-4 py-3">
            <h2 className="font-serif text-xl" style={{ color: "#fff7e6" }}>
              <Link href={`/shrines/${spotSlug(spot)}`} className="hover:underline">
                {spot.name}
              </Link>
            </h2>
            <p className="mt-0.5 text-[11px]" style={{ color: "rgba(220,202,168,0.7)" }}>
              {spot.prefecture}{spot.city ? ` · ${spot.city}` : ""}
            </p>
          </div>
        </div>
      ) : (
        <header className="flex items-start justify-between gap-2 px-4 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(201,155,77,0.15)" }}>
          <div className="min-w-0">
            <h2 className="font-serif text-lg" style={{ color: "#fff7e6" }}>
              <Link href={`/shrines/${spotSlug(spot)}`} className="hover:underline">
                {spot.name}
              </Link>
            </h2>
            <p className="mt-0.5 text-[11px]" style={{ color: "rgba(220,202,168,0.6)" }}>
              {spot.prefecture}{spot.city ? ` · ${spot.city}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition hover:opacity-80"
            style={{ background: "rgba(28,17,8,0.8)", color: "rgba(220,202,168,0.8)", border: "1px solid rgba(201,155,77,0.25)" }}
            aria-label="閉じる"
          >
            閉じる
          </button>
        </header>
      )}

      {/* 住所・距離・詳細リンク */}
      <div className="shrink-0 px-4 py-2 text-xs" style={{ borderBottom: "1px solid rgba(201,155,77,0.12)", background: "rgba(28,17,8,0.5)" }}>
        {spot.address ? (
          <p className="truncate" style={{ color: "rgba(220,202,168,0.65)" }}>📍 {spot.address}</p>
        ) : null}
        <div className="mt-1 flex items-center justify-between gap-2">
          <span style={{ color: "rgba(220,202,168,0.5)" }}>
            {distance !== null ? (
              <>現在地から <b style={{ color: "#fff7e6" }}>{formatDistance(distance)}</b></>
            ) : (
              <span>位置情報なし</span>
            )}
          </span>
          <Link
            href={`/shrines/${spotSlug(spot)}`}
            className="font-medium transition hover:opacity-80"
            style={{ color: "rgba(201,155,77,0.85)" }}
          >
            詳細ページ →
          </Link>
        </div>
      </div>

      {/* スクロール可能コンテンツ */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* ブックマーク */}
        <section>
          <BookmarkButtons spotId={spot.id} />
        </section>

        {/* スペックバッジ */}
        {(benefits.length > 0 || spot.shrine_rank || spot.founded || spot.shrine_type) ? (
          <section className="flex flex-wrap gap-1.5">
            {spot.shrine_type ? (
              <span className="rounded-full px-2.5 py-0.5 text-[11px]" style={{ border: "1px solid rgba(201,155,77,0.25)", background: "rgba(28,17,8,0.6)", color: "rgba(220,202,168,0.75)" }}>
                {spot.shrine_type}
              </span>
            ) : null}
            {spot.shrine_rank ? (
              <span className="rounded-full px-2.5 py-0.5 text-[11px]" style={{ border: "1px solid rgba(201,155,77,0.25)", background: "rgba(28,17,8,0.6)", color: "rgba(220,202,168,0.75)" }}>
                {spot.shrine_rank}
              </span>
            ) : null}
            {spot.founded ? (
              <span className="rounded-full px-2.5 py-0.5 text-[11px]" style={{ border: "1px solid rgba(201,155,77,0.25)", background: "rgba(28,17,8,0.6)", color: "rgba(220,202,168,0.75)" }}>
                創建: {spot.founded}
              </span>
            ) : null}
            {benefits.map((b) => (
              <span
                key={b}
                className="rounded-full px-2.5 py-0.5 text-[11px]"
                style={{ border: "1px solid rgba(139,30,39,0.4)", background: "rgba(139,30,39,0.12)", color: "#a84048" }}
              >
                {b}
              </span>
            ))}
          </section>
        ) : null}

        {/* 概要 */}
        {spot.description ? (
          <section className="rounded-xl p-3" style={{ border: "1px solid rgba(201,155,77,0.2)", background: "linear-gradient(145deg, #1e1108, #170d06)" }}>
            <p className="text-[11px] tracking-widest font-semibold mb-2" style={{ color: "rgba(201,155,77,0.7)" }}>概要</p>
            <p className="text-[13px] leading-relaxed" style={{ color: "rgba(220,202,168,0.85)" }}>
              {spot.description.length > 200 ? spot.description.slice(0, 200) + "…" : spot.description}
            </p>
            {spot.wikipedia_url ? (
              <a
                href={spot.wikipedia_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-[11px] hover:underline"
                style={{ color: "rgba(201,155,77,0.7)" }}
              >
                もっと読む（Wikipedia）→
              </a>
            ) : null}
          </section>
        ) : null}

        {/* 御祭神 */}
        {spot.deity ? (
          <section>
            <p className="text-[11px] tracking-widest font-semibold mb-2" style={{ color: "rgba(201,155,77,0.7)" }}>御祭神</p>
            {deityCards.length > 0 ? (
              <div className="space-y-2">
                {deityCards.map((d) => (
                  <div key={d.name} className="rounded-xl p-3" style={{ border: "1px solid rgba(201,155,77,0.2)", background: "linear-gradient(145deg, #1e1108, #170d06)" }}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
                        style={{ background: "rgba(139,30,39,0.15)", border: "1px solid rgba(139,30,39,0.3)" }}
                      >
                        {d.icon}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-serif text-[14px] font-semibold" style={{ color: "#fff7e6" }}>{d.name}</span>
                          <span className="text-[10px]" style={{ color: "rgba(220,202,168,0.45)" }}>{d.reading}</span>
                        </div>
                        <p className="text-[11px]" style={{ color: "rgba(201,155,77,0.8)" }}>{d.domain}</p>
                      </div>
                    </div>
                    <p className="text-[12px] leading-relaxed" style={{ color: "rgba(220,202,168,0.78)" }}>
                      {d.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {d.benefits.map((b) => (
                        <span key={b} className="rounded-full px-2 py-0.5 text-[10px]" style={{ border: "1px solid rgba(139,30,39,0.35)", background: "rgba(139,30,39,0.1)", color: "#a84048" }}>
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {/* 未収録の祭神補足 */}
                {(() => {
                  const knownNames = deityCards.flatMap((d) => d.aliases);
                  const allNames = spot.deity!.split(/[、,・\n\/]+/).map((s) => s.trim()).filter(Boolean);
                  const unknown = allNames.filter((n) => !knownNames.some((k) => n.includes(k) || k.includes(n)));
                  return unknown.length > 0 ? (
                    <p className="text-[12px] px-1" style={{ color: "rgba(220,202,168,0.55)" }}>
                      その他：{unknown.join("、")}
                    </p>
                  ) : null;
                })()}
              </div>
            ) : (
              <div className="rounded-xl p-3" style={{ border: "1px solid rgba(201,155,77,0.2)", background: "linear-gradient(145deg, #1e1108, #170d06)" }}>
                <p className="text-[13px]" style={{ color: "rgba(220,202,168,0.85)" }}>{spot.deity}</p>
              </div>
            )}
          </section>
        ) : null}

        {/* 見どころ */}
        {highlights.length > 0 ? (
          <section className="rounded-xl p-3" style={{ border: "1px solid rgba(201,155,77,0.2)", background: "linear-gradient(145deg, #1e1108, #170d06)" }}>
            <p className="text-[11px] tracking-widest font-semibold mb-2" style={{ color: "rgba(201,155,77,0.7)" }}>見どころ</p>
            <ul className="space-y-1">
              {highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-[12px]" style={{ color: "rgba(220,202,168,0.82)" }}>
                  <span className="mt-0.5 shrink-0 text-[10px]" style={{ color: "rgba(139,30,39,0.8)" }}>▪</span>
                  {h}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* 御朱印 */}
        {(spot.goshuin_available != null || spot.goshuin_info) ? (
          <section className="rounded-xl p-3" style={{ border: "1px solid rgba(201,155,77,0.2)", background: "linear-gradient(145deg, #1e1108, #170d06)" }}>
            <p className="text-[11px] tracking-widest font-semibold mb-1.5" style={{ color: "rgba(201,155,77,0.7)" }}>御朱印</p>
            <p className="text-[13px]" style={{ color: spot.goshuin_available ? "#fff7e6" : "rgba(220,202,168,0.5)" }}>
              {spot.goshuin_available === true ? "✓ 授与あり" : spot.goshuin_available === false ? "授与情報なし" : "—"}
            </p>
            {spot.goshuin_info ? (
              <p className="mt-1 text-[12px]" style={{ color: "rgba(220,202,168,0.7)" }}>{spot.goshuin_info}</p>
            ) : null}
          </section>
        ) : null}

        {/* アクセス */}
        {spot.access_info ? (
          <section className="rounded-xl p-3" style={{ border: "1px solid rgba(201,155,77,0.2)", background: "linear-gradient(145deg, #1e1108, #170d06)" }}>
            <p className="text-[11px] tracking-widest font-semibold mb-1.5" style={{ color: "rgba(201,155,77,0.7)" }}>アクセス</p>
            <p className="whitespace-pre-wrap text-[12px]" style={{ color: "rgba(220,202,168,0.82)" }}>{spot.access_info}</p>
          </section>
        ) : null}

        {/* 公式サイト */}
        {spot.website ? (
          <a
            href={spot.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-medium transition hover:opacity-80"
            style={{ border: "1px solid rgba(201,155,77,0.2)", background: "rgba(28,17,8,0.5)", color: "rgba(201,155,77,0.85)" }}
          >
            🔗 公式サイトを開く
          </a>
        ) : null}

        {/* 参拝統計 */}
        {stats ? (
          <section className="rounded-xl p-3" style={{ border: "1px solid rgba(201,155,77,0.15)", background: "rgba(28,17,8,0.4)" }}>
            <p className="text-[11px] tracking-widest font-semibold mb-2" style={{ color: "rgba(201,155,77,0.7)" }}>参拝記録</p>
            <div className="flex gap-4 text-center">
              <div>
                <p className="font-serif text-lg font-semibold" style={{ color: "#fff7e6" }}>{stats.total}</p>
                <p className="text-[10px]" style={{ color: "rgba(220,202,168,0.5)" }}>累計</p>
              </div>
              <div>
                <p className="font-serif text-lg font-semibold" style={{ color: "#fff7e6" }}>{stats.month}</p>
                <p className="text-[10px]" style={{ color: "rgba(220,202,168,0.5)" }}>今月</p>
              </div>
              <div>
                <p className="font-serif text-lg font-semibold" style={{ color: "#fff7e6" }}>{stats.unique_visitors}</p>
                <p className="text-[10px]" style={{ color: "rgba(220,202,168,0.5)" }}>参拝者数</p>
              </div>
            </div>
            {stats.last_at ? (
              <p className="mt-2 text-[11px]" style={{ color: "rgba(220,202,168,0.45)" }}>
                最終参拝: {formatRelative(stats.last_at)}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* 参拝チェックイン */}
        <section>
          <p className="text-[11px] tracking-widest font-semibold mb-3" style={{ color: "rgba(201,155,77,0.7)" }}>参拝チェックイン</p>
          {userLocation ? (
            <form onSubmit={handleCheckin} className="space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(WISH_LABELS).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setWish(k)}
                    className="rounded-full px-3 py-1 text-xs font-medium transition"
                    style={wish === k
                      ? { background: "#8B1E27", color: "#fff7e6", border: "1px solid #8B1E27" }
                      : { background: "rgba(28,17,8,0.6)", color: "rgba(220,202,168,0.75)", border: "1px solid rgba(201,155,77,0.2)" }
                    }
                  >
                    {v}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="ニックネーム（任意）"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(28,17,8,0.8)", border: "1px solid rgba(201,155,77,0.2)", color: "rgba(220,202,168,0.9)" }}
                maxLength={40}
              />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="ひとこと（任意・140字まで）"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{ background: "rgba(28,17,8,0.8)", border: "1px solid rgba(201,155,77,0.2)", color: "rgba(220,202,168,0.9)" }}
                rows={2}
                maxLength={140}
              />
              {tooFar ? (
                <p className="text-[12px]" style={{ color: "#E8716F" }}>
                  境内から離れすぎています（{formatDistance(distance!)}）。300m 以内で記録できます。
                </p>
              ) : null}
              {accuracyBad ? (
                <p className="text-[12px]" style={{ color: "#E8716F" }}>
                  GPS 精度が粗いため（±{Math.round(userLocation.accuracy!)}m）、屋外に出てから試してください。
                </p>
              ) : null}
              <button
                type="submit"
                disabled={busy || tooFar || accuracyBad}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #8B1E27, #B8373E)" }}
              >
                {busy ? "記録中…" : "🙏 参拝を記録する"}
              </button>
            </form>
          ) : (
            <div className="rounded-xl p-3 text-[12px]" style={{ border: "1px solid rgba(201,155,77,0.15)", background: "rgba(28,17,8,0.4)", color: "rgba(220,202,168,0.55)" }}>
              位置情報が取得できていません。ページ上部の「現在地」から許可してください。
            </div>
          )}
          {message ? (
            <div className="mt-2">
              <p className="text-[12px]" style={{ color: message.kind === "ok" ? "#4F6B4A" : "#E8716F" }}>
                {message.text}
              </p>
              {message.kind === "ok" && (
                <div
                  className="mt-2 flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                  style={{ background: "rgba(201,155,77,0.07)", border: "1px solid rgba(201,155,77,0.25)" }}
                >
                  <p className="text-[10px]" style={{ color: "rgba(220,202,168,0.7)" }}>
                    Googleログインで端末をまたいで同期できます
                  </p>
                  <Link
                    href="/signin?callbackUrl=/me"
                    className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold transition hover:opacity-80"
                    style={{ background: "rgba(201,155,77,0.18)", color: "#C99B4D" }}
                  >
                    ログイン
                  </Link>
                </div>
              )}
            </div>
          ) : null}
        </section>

        {/* 最近の参拝 */}
        {recent && recent.length > 0 ? (
          <section>
            <p className="text-[11px] tracking-widest font-semibold mb-2" style={{ color: "rgba(201,155,77,0.7)" }}>最近の参拝</p>
            <ul className="space-y-2">
              {recent.map((c) => (
                <li key={c.id} className="rounded-xl p-3 text-[12px]" style={{ border: "1px solid rgba(201,155,77,0.15)", background: "rgba(28,17,8,0.5)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium" style={{ color: "#fff7e6" }}>
                      {c.nickname?.trim() || "匿名さん"}
                    </span>
                    <span style={{ color: "rgba(220,202,168,0.45)" }}>{formatRelative(c.created_at)}</span>
                  </div>
                  {c.wish_type && WISH_LABELS[c.wish_type] ? (
                    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] mb-1" style={{ border: "1px solid rgba(139,30,39,0.35)", background: "rgba(139,30,39,0.1)", color: "#a84048" }}>
                      {WISH_LABELS[c.wish_type]}
                    </span>
                  ) : null}
                  {c.comment ? (
                    <p className="mt-0.5" style={{ color: "rgba(220,202,168,0.78)" }}>「{c.comment}」</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* 余白 */}
        <div className="h-4" />
      </div>
    </aside>
  );
}
