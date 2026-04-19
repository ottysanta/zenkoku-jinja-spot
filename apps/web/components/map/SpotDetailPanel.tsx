"use client";
/**
 * 右サイドの詳細パネル（モバイルでは下ドロワー想定、Phase 1c MVP では固定右ペイン）。
 *
 * - 神社情報表示
 * - 直近の参拝チェックイン / 統計
 * - 参拝チェックインフォーム（GPS 有無で UI を切替）
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

  // 初回ロード
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
  const tooFar =
    distance !== null && distance > CHECKIN_MAX_DISTANCE_M;
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
      setMessage({
        kind: "ok",
        text: `参拝を記録しました（${WISH_LABELS[wish] ?? ""}）`,
      });
      setComment("");
      // 一覧と統計を更新
      setRecent((prev) => [result, ...(prev ?? [])].slice(0, 5));
      api.getCheckinStats(spot.id).then(setStats).catch(() => {});
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "エラーが発生しました";
      setMessage({ kind: "err", text: msg });
    } finally {
      setBusy(false);
    }
  }

  // ご利益 JSON 配列のパース
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

  return (
    <aside
      className="
        fixed inset-x-0 bottom-0 z-40 flex max-h-[82dvh] w-full flex-col overflow-hidden
        rounded-t-2xl border border-border bg-washi text-sumi shadow-2xl
        md:static md:max-h-none md:w-[420px] md:rounded-none md:border-0 md:border-l md:shadow-none
      "
    >
      {/* ヒーロー写真 */}
      {spot.photo_url ? (
        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-kinari">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spot.photo_url}
            alt={spot.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 rounded-md border border-border bg-white/90 px-2 py-1 text-xs text-sumi hover:bg-white"
            aria-label="閉じる"
          >
            閉じる
          </button>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent px-4 py-3">
            <h2 className="truncate font-serif text-xl text-white drop-shadow">
              <Link
                href={`/shrines/${spotSlug(spot)}`}
                className="hover:underline"
              >
                {spot.name}
              </Link>
            </h2>
            {spot.prefecture ? (
              <p className="mt-0.5 text-[11px] text-white/85">{spot.prefecture}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <header className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate font-serif text-lg">
              <Link
                href={`/shrines/${spotSlug(spot)}`}
                className="hover:underline"
              >
                {spot.name}
              </Link>
            </h2>
            {spot.prefecture ? (
              <p className="mt-0.5 text-[11px] text-sumi/60">{spot.prefecture}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-kinari px-2 py-1 text-xs hover:bg-white"
            aria-label="閉じる"
          >
            閉じる
          </button>
        </header>
      )}

      {/* サブヘッダ: 住所・距離・詳細リンク */}
      <div className="border-b border-border px-4 py-2 text-xs text-sumi/75">
        {spot.address ? <p className="truncate">📍 {spot.address}</p> : null}
        <div className="mt-1 flex items-center justify-between gap-2">
          <span>
            {distance !== null ? (
              <>現在地から <b className="text-sumi">{formatDistance(distance)}</b></>
            ) : (
              <span className="text-sumi/50">位置情報なし</span>
            )}
          </span>
          <Link
            href={`/shrines/${spotSlug(spot)}`}
            className="text-moss underline"
          >
            詳細ページ →
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 text-sm leading-6">
        {/* 見どころバッジ（ご利益 + 社格）*/}
        {(benefits.length > 0 || spot.shrine_rank || spot.founded) ? (
          <section className="mb-3 flex flex-wrap gap-1.5">
            {benefits.map((b) => (
              <span
                key={b}
                className="inline-flex items-center rounded-full border border-vermilion/40 bg-vermilion/5 px-2.5 py-0.5 text-[11px] text-vermilion-deep"
              >
                {b}
              </span>
            ))}
            {spot.shrine_rank ? (
              <span className="inline-flex items-center rounded-full border border-border bg-white px-2.5 py-0.5 text-[11px] text-sumi/80">
                {spot.shrine_rank}
              </span>
            ) : null}
            {spot.founded ? (
              <span className="inline-flex items-center rounded-full border border-border bg-kinari/60 px-2.5 py-0.5 text-[11px] text-sumi/80">
                創建: {spot.founded}
              </span>
            ) : null}
          </section>
        ) : null}

        {/* 概要（Wikipedia） */}
        {spot.description ? (
          <section className="mb-4 rounded-md border border-border bg-white/70 p-3">
            <p className="text-[13px] leading-relaxed text-sumi/90">
              {spot.description}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-sumi/55">
              {spot.photo_attribution ? (
                <span>写真: {spot.photo_attribution}</span>
              ) : <span />}
              {spot.wikipedia_url ? (
                <a
                  href={spot.wikipedia_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-moss underline"
                >
                  もっと読む（Wikipedia）→
                </a>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* 基本情報 */}
        {(spot.deity || spot.shrine_type) ? (
          <section className="mb-4 space-y-1">
            {spot.shrine_type ? (
              <p><span className="text-sumi/60">区分:</span> {spot.shrine_type}</p>
            ) : null}
            {spot.deity ? (
              <p><span className="text-sumi/60">祭神:</span> {spot.deity}</p>
            ) : null}
          </section>
        ) : null}

        {/* 見どころ（ハイライト） */}
        {highlights.length > 0 ? (
          <section className="mb-4">
            <h3 className="mb-1 text-xs font-semibold text-sumi/70">見どころ</h3>
            <ul className="list-disc space-y-0.5 pl-5 text-[13px]">
              {highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* 御朱印 */}
        {(spot.goshuin_available != null || spot.goshuin_info) ? (
          <section className="mb-4">
            <h3 className="mb-1 text-xs font-semibold text-sumi/70">御朱印</h3>
            {spot.goshuin_available === true ? (
              <p className="text-[13px] text-sumi/90">あり{spot.goshuin_info ? ` — ${spot.goshuin_info}` : ""}</p>
            ) : spot.goshuin_available === false ? (
              <p className="text-[13px] text-sumi/60">なし</p>
            ) : spot.goshuin_info ? (
              <p className="text-[13px]">{spot.goshuin_info}</p>
            ) : null}
          </section>
        ) : null}

        {/* 公式リンク */}
        {(spot.website || spot.source_url) ? (
          <section className="mb-4 text-[12px]">
            {spot.website ? (
              <p className="truncate">
                🔗 <a href={spot.website} target="_blank" rel="noreferrer" className="text-moss underline">公式サイト</a>
              </p>
            ) : null}
          </section>
        ) : null}

        {spot.access_info ? (
          <section className="mb-4">
            <h3 className="mb-1 text-xs font-semibold text-sumi/70">アクセス</h3>
            <p className="whitespace-pre-wrap text-[13px]">{spot.access_info}</p>
          </section>
        ) : null}

        {stats ? (
          <section className="mb-4 rounded-md border border-border bg-white/60 p-3">
            <h3 className="mb-1 text-xs font-semibold text-sumi/70">参拝記録</h3>
            <p className="text-xs">
              累計 <b>{stats.total}</b> 件 / 今月 <b>{stats.month}</b> 件 /{" "}
              参拝者 <b>{stats.unique_visitors}</b> 名
            </p>
            {stats.last_at ? (
              <p className="mt-0.5 text-xs text-sumi/60">
                最終: {formatRelative(stats.last_at)}
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="mb-4">
          <h3 className="mb-2 text-xs font-semibold text-sumi/70">参拝チェックイン</h3>
          {userLocation ? (
            <form onSubmit={handleCheckin} className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {Object.entries(WISH_LABELS).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setWish(k)}
                    className={
                      "rounded-full border px-3 py-1 text-xs " +
                      (wish === k
                        ? "border-vermilion bg-vermilion text-white"
                        : "border-border bg-white hover:bg-kinari")
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
                className="w-full rounded-md border border-border bg-white px-2 py-1 text-sm"
                maxLength={40}
              />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="ひとこと（任意・140字まで）"
                className="w-full rounded-md border border-border bg-white px-2 py-1 text-sm"
                rows={2}
                maxLength={140}
              />
              {tooFar ? (
                <p className="text-xs text-vermilion">
                  境内から離れすぎています（{formatDistance(distance)}）。300m 以内で記録できます。
                </p>
              ) : null}
              {accuracyBad ? (
                <p className="text-xs text-vermilion">
                  GPS 精度が粗いため（±{Math.round(userLocation.accuracy!)}m）、屋外に出てから試してください。
                </p>
              ) : null}
              <button
                type="submit"
                disabled={busy || tooFar || accuracyBad}
                className="w-full rounded-md bg-vermilion px-3 py-2 text-sm font-medium text-white hover:bg-vermilion-deep disabled:opacity-50"
              >
                {busy ? "記録中…" : "参拝を記録する"}
              </button>
            </form>
          ) : (
            <p className="rounded-md border border-border bg-white/60 p-3 text-xs text-sumi/70">
              位置情報が取得できていません。ページ上部の「現在地」から許可してください。
            </p>
          )}
          {message ? (
            <p
              className={
                "mt-2 text-xs " +
                (message.kind === "ok" ? "text-moss" : "text-vermilion")
              }
            >
              {message.text}
            </p>
          ) : null}
        </section>

        {recent && recent.length > 0 ? (
          <section>
            <h3 className="mb-2 text-xs font-semibold text-sumi/70">最近の参拝</h3>
            <ul className="space-y-2">
              {recent.map((c) => (
                <li key={c.id} className="rounded-md border border-border bg-white/60 p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {c.nickname?.trim() || "匿名さん"}
                    </span>
                    <span className="text-sumi/60">{formatRelative(c.created_at)}</span>
                  </div>
                  {c.wish_type && WISH_LABELS[c.wish_type] ? (
                    <span className="mt-1 inline-block rounded-full border border-border bg-kinari px-2 py-0.5 text-[10px]">
                      {WISH_LABELS[c.wish_type]}
                    </span>
                  ) : null}
                  {c.comment ? (
                    <p className="mt-1 whitespace-pre-wrap text-sumi/80">{c.comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
