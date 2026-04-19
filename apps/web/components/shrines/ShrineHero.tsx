"use client";
/**
 * 神社詳細ページのヒーロー画像エリア。
 *
 * フォールバック優先度:
 *   1. 既定の photo_url（Wikipedia / 管理者登録）
 *   2. /api/commons-image?q=<神社名> の結果
 *   3. スタイライズド SVG プレースホルダ
 *
 * さらに補助として:
 *   - ヒーロー右下に「Google マップで Street View を見る」リンク（外部、API キー不要）
 *   - クリックで写真フルスクリーンモーダル（画像が存在する場合）
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import ShrinePlaceholder from "./ShrinePlaceholder";
import PhotoLightbox from "./PhotoLightbox";

type Props = {
  name: string;
  lat: number;
  lng: number;
  prefecture?: string | null;
  shrineType?: string | null;
  address?: string | null;
  photoUrl?: string | null;
  photoAttribution?: string | null;
};

export default function ShrineHero({
  name,
  lat,
  lng,
  prefecture,
  shrineType,
  address,
  photoUrl,
  photoAttribution,
}: Props) {
  const [src, setSrc] = useState<string | null>(photoUrl ?? null);
  const [attribution, setAttribution] = useState<string | null>(
    photoAttribution ?? null,
  );
  const [lookedUp, setLookedUp] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  // 写真が無い時だけ Commons を問い合わせる
  useEffect(() => {
    if (src || lookedUp) return;
    let cancelled = false;
    setLookedUp(true);
    fetch("/api/commons-image?q=" + encodeURIComponent(name))
      .then((r) => r.json())
      .then((j: { url?: string | null; attribution?: string | null }) => {
        if (cancelled) return;
        if (j.url) {
          setSrc(j.url);
          setAttribution(j.attribution ?? "Wikimedia Commons");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [src, lookedUp, name]);

  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <section className="relative w-full overflow-hidden bg-kinari">
      <div className="relative h-64 w-full md:h-96">
        {src ? (
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="block h-full w-full cursor-zoom-in"
            aria-label={`${name} の写真を拡大`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={name}
              className="h-full w-full object-cover"
              loading="eager"
              onError={() => {
                // 読み込み失敗時はプレースホルダにフォールバック
                setSrc(null);
              }}
            />
          </button>
        ) : (
          <ShrinePlaceholder
            name={name}
            shrineType={shrineType}
            prefecture={prefecture}
            className="h-full w-full"
          />
        )}

        {/* オーバーレイ: 神社名・住所 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto max-w-5xl">
            <nav className="mb-2 text-[11px] text-white/80">
              <Link href="/" className="pointer-events-auto hover:underline">
                ホーム
              </Link>
              <span className="mx-1">›</span>
              <Link href="/map" className="pointer-events-auto hover:underline">
                地図
              </Link>
              {prefecture ? (
                <>
                  <span className="mx-1">›</span>
                  <Link
                    href={`/search?prefecture=${encodeURIComponent(prefecture)}`}
                    className="pointer-events-auto hover:underline"
                  >
                    {prefecture}
                  </Link>
                </>
              ) : null}
            </nav>
            <h1 className="font-serif text-2xl text-white drop-shadow md:text-4xl">
              {name}
            </h1>
            {address ? (
              <p className="mt-1 text-[12px] text-white/85 md:text-sm">
                📍 {address}
              </p>
            ) : null}
          </div>
        </div>

        {/* 右下: 外部地図リンク群 */}
        <div className="pointer-events-auto absolute right-2 top-2 flex flex-col gap-1 text-[11px] md:right-4 md:top-4">
          <a
            href={streetViewUrl}
            target="_blank"
            rel="noreferrer noopener"
            title="Google マップの Street View で開く"
            className="rounded-md bg-black/60 px-2 py-1 text-white hover:bg-black/80"
          >
            🚶 Street View
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer noopener"
            title="Google マップで開く"
            className="rounded-md bg-black/60 px-2 py-1 text-white hover:bg-black/80"
          >
            🗺 Google マップ
          </a>
        </div>
      </div>

      {attribution ? (
        <div className="border-t border-border bg-white/80 px-4 py-1 text-[10px] text-sumi/60">
          写真: {attribution}
        </div>
      ) : null}

      {src ? (
        <PhotoLightbox
          src={src}
          alt={name}
          caption={[prefecture, address].filter(Boolean).join(" · ")}
          open={lightbox}
          onClose={() => setLightbox(false)}
        />
      ) : null}
    </section>
  );
}
