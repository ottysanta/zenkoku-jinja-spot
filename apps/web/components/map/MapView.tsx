"use client";
/**
 * /map のトップレベルクライアントコンポーネント。
 *
 * 設計:
 *   - 全 spot を GeoJSON クラスタ方式で一括表示（25,000 件超でも軽量）
 *   - ズームアウト → クラスタに集約、ズームイン → 個別ピン展開
 *   - クリックで該当 spot を詳細取得し SpotDetailPanel を表示
 *   - useGeolocation で現在地マーカー + 近い神社リスト
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import maplibregl from "maplibre-gl";
import MapProvider, { useMap } from "./MapProvider";
import SpotClusterLayer from "./SpotClusterLayer";
import SpotDetailPanel from "./SpotDetailPanel";
import PrefectureHeatmapLayer from "./PrefectureHeatmapLayer";
import DistanceHistogramFilter, {
  type DistanceFilterValue,
} from "./DistanceHistogramFilter";
import { api, type Spot, ApiError } from "@/lib/api";
import { useGeolocation } from "@/hooks/useGeolocation";
import { formatDistance, haversineM } from "@/lib/geo";
import SearchBar from "@/components/search/SearchBar";

// 近い神社の計算に使う軽量な点データ（GeoJSON から抽出）
type LitePoint = { id: number; name: string; lat: number; lng: number };

function UserLocationMarker({
  coords,
}: {
  coords: { lat: number; lng: number; accuracy?: number } | null;
}) {
  const { map, ready } = useMap();
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!map || !ready) return;
    if (!coords) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const el = document.createElement("div");
    el.className =
      "h-3 w-3 rounded-full border-2 border-white bg-moss shadow";
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map);
    } else {
      markerRef.current.setLngLat([coords.lng, coords.lat]);
    }
  }, [map, ready, coords]);

  useEffect(() => {
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, []);

  return null;
}

function FlyToSelected({ selected }: { selected: Spot | null }) {
  const { map, ready } = useMap();
  useEffect(() => {
    if (!map || !ready || !selected) return;
    map.flyTo({
      center: [selected.lng, selected.lat],
      zoom: Math.max(map.getZoom(), 14),
      speed: 1.2,
    });
  }, [map, ready, selected]);
  return null;
}

function FlyToUserOnce({
  coords,
}: {
  coords: { lat: number; lng: number } | null;
}) {
  const { map, ready } = useMap();
  const doneRef = useRef(false);
  useEffect(() => {
    if (!map || !ready || !coords || doneRef.current) return;
    doneRef.current = true;
    map.easeTo({ center: [coords.lng, coords.lat], zoom: 12 });
  }, [map, ready, coords]);
  return null;
}

/**
 * 「現在地」ボタンが押されるたびに強制的にセンタリングする。
 * FlyToUserOnce が一度しか flyTo しない一方で、こちらは nonce が変わる度に実行される。
 */
function FlyToUserOnDemand({
  coords,
  nonce,
}: {
  coords: { lat: number; lng: number } | null;
  nonce: number;
}) {
  const { map, ready } = useMap();
  useEffect(() => {
    if (!map || !ready || !coords || nonce === 0) return;
    map.flyTo({
      center: [coords.lng, coords.lat],
      zoom: Math.max(map.getZoom(), 14),
      speed: 1.4,
    });
  }, [map, ready, coords, nonce]);
  return null;
}

export default function MapView() {
  const [allPoints, setAllPoints] = useState<LitePoint[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Spot | null>(null);
  const [hydrating, setHydrating] = useState(false);
  // モバイルではオーバーレイ UI を初期状態で畳んでおく（操作性優先）
  const [showLegend, setShowLegend] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [locateNonce, setLocateNonce] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [prefCounts, setPrefCounts] = useState<Array<{ prefecture: string; count: number }> | null>(null);
  const [showDistanceFilter, setShowDistanceFilter] = useState(false);
  const [distance, setDistance] = useState<DistanceFilterValue>({
    minKm: 0,
    maxKm: 1000,
  });
  const geo = useGeolocation({ auto: true });
  const t = useTranslations("map");
  const tLegend = useTranslations("legend");

  // 都道府県ごとの件数（ヒートマップ用）— 必要になった時点で取得
  useEffect(() => {
    if (!showHeatmap || prefCounts) return;
    let cancelled = false;
    fetch("/api/prefecture-counts")
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setPrefCounts(Array.isArray(j) ? j : []); })
      .catch(() => { if (!cancelled) setPrefCounts([]); });
    return () => { cancelled = true; };
  }, [showHeatmap, prefCounts]);

  // 近い神社の計算用に全 spot の lat/lng を一括取得
  useEffect(() => {
    let cancelled = false;
    fetch("/api/spots/geojson")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const pts: LitePoint[] = (j.features ?? [])
          .map((f: { geometry: { coordinates: [number, number] }; properties: { id: number; name: string } }) => ({
            id: f.properties.id,
            name: f.properties.name,
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
          }))
          .filter((p: LitePoint) => typeof p.lat === "number" && typeof p.lng === "number");
        setAllPoints(pts);
        setTotalCount(pts.length);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError("神社データの読み込みに失敗しました");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const userCoords = geo.coords
    ? { lat: geo.coords.lat, lng: geo.coords.lng, accuracy: geo.coords.accuracy }
    : null;

  // 現在地から近い 5 件（距離フィルタ適用）
  const nearby = useMemo(() => {
    if (!userCoords || allPoints.length === 0) return [];
    const minM = distance.minKm * 1000;
    const maxM = distance.maxKm * 1000;
    return allPoints
      .map((p) => ({
        point: p,
        d: haversineM(userCoords.lat, userCoords.lng, p.lat, p.lng),
      }))
      .filter(({ d }) => d >= minM && d <= maxM)
      .sort((a, b) => a.d - b.d)
      .slice(0, 8);
  }, [allPoints, userCoords, distance]);

  const handleLocate = useCallback(() => {
    geo.request();
    // 既にキャッシュ済みの coords があっても確実に再センタリングできるよう nonce を増やす
    setLocateNonce((n) => n + 1);
  }, [geo]);

  // クリック → 詳細 hydrate
  const handleSelect = useCallback(async (id: number) => {
    setHydrating(true);
    try {
      const spot = await api.getSpot(id);
      setSelected(spot);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "詳細の取得に失敗しました");
    } finally {
      setHydrating(false);
    }
  }, []);

  const handleSelectById = useCallback(
    (id: number) => {
      void handleSelect(id);
    },
    [handleSelect],
  );

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      <div className="relative flex-1">
        <MapProvider>
          <SpotClusterLayer
            onSelect={handleSelectById}
            selectedId={selected?.id ?? null}
          />
          <PrefectureHeatmapLayer visible={showHeatmap} data={prefCounts} />
          <FlyToSelected selected={selected} />
          <FlyToUserOnce coords={userCoords} />
          <FlyToUserOnDemand coords={userCoords} nonce={locateNonce} />
          <UserLocationMarker coords={userCoords} />
        </MapProvider>

        {/* 左上: 戻る導線 & 検索 & 現在地 & 件数（モバイルでも幅いっぱいは取らない） */}
        <div className="pointer-events-none absolute left-2 right-2 top-2 flex flex-col gap-2 md:right-auto md:left-3 md:top-3">
          {/* トップへの戻りリンク & 地図/一覧 トグル */}
          <div className="pointer-events-auto flex items-center gap-2 pr-12 md:pr-0">
            <Link
              href="/"
              aria-label={t("back")}
              className="inline-flex min-h-[36px] items-center rounded-md border border-border bg-washi/95 px-3 py-1.5 text-xs font-medium text-sumi shadow hover:bg-kinari active:bg-kinari"
            >
              {t("back")}
            </Link>
            {/* 地図/一覧 ビュートグル（Comfy 風）*/}
            <div className="inline-flex overflow-hidden rounded-md border border-border bg-washi/95 text-xs shadow">
              <span className="bg-vermilion px-3 py-1.5 font-semibold text-white">
                🗺 地図
              </span>
              <Link
                href="/search"
                className="px-3 py-1.5 text-sumi hover:bg-kinari active:bg-kinari"
              >
                ≣ 一覧
              </Link>
            </div>
          </div>
          {/* 検索バー（/search へ遷移） */}
          <div className="pointer-events-auto">
            <SearchBar variant="compact" />
          </div>
          <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-md border border-border bg-washi/95 px-2.5 py-2 text-xs shadow">
            <button
              type="button"
              onClick={handleLocate}
              className="min-h-[36px] rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-kinari active:bg-kinari"
            >
              {t("currentLocation")}
            </button>
            {nearby.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowNearby((v) => !v)}
                aria-expanded={showNearby}
                className="min-h-[36px] rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-kinari active:bg-kinari"
              >
                {t("nearbyShrines")} {showNearby ? "▲" : "▼"}
              </button>
            ) : null}
            {userCoords ? (
              <button
                type="button"
                onClick={() => setShowDistanceFilter((v) => !v)}
                aria-expanded={showDistanceFilter}
                className={
                  "min-h-[36px] rounded-md border px-3 py-1.5 text-xs font-medium " +
                  (distance.minKm > 0 || distance.maxKm < 1000
                    ? "border-vermilion bg-vermilion text-white hover:bg-vermilion/90"
                    : "border-border bg-white hover:bg-kinari")
                }
                title="距離で絞り込み"
              >
                📏 距離 {showDistanceFilter ? "▲" : "▼"}
              </button>
            ) : null}
            {geo.loading ? <span className="text-sumi/60">{t("acquiring")}</span> : null}
            {geo.error?.kind === "permission_denied" ? (
              <span className="text-vermilion">{t("permissionNeeded")}</span>
            ) : null}
            {geo.error?.kind === "insecure_origin" ? (
              <span className="text-vermilion" title="HTTPS required on mobile browsers">
                {t("insecureOrigin")}
              </span>
            ) : null}
            {geo.error?.kind === "unavailable" ? (
              <span className="text-vermilion">{t("unavailable")}</span>
            ) : null}
            {geo.error?.kind === "timeout" ? (
              <span className="text-vermilion">{t("timeout")}</span>
            ) : null}
            {userCoords?.accuracy ? (
              <span className="text-sumi/60">±{Math.round(userCoords.accuracy)}m</span>
            ) : null}
            {/* 都道府県ヒートマップトグル */}
            <button
              type="button"
              onClick={() => setShowHeatmap((v) => !v)}
              aria-pressed={showHeatmap}
              title="都道府県ごとの神社密度を表示"
              className={
                "min-h-[36px] rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm " +
                (showHeatmap
                  ? "border-vermilion bg-vermilion text-white hover:bg-vermilion/90"
                  : "border-border bg-white text-sumi hover:bg-kinari")
              }
            >
              🔥 都道府県
            </button>
            {/* Comfy 風: 条件(0) | XX,XXX件（地図では未絞り込みなので条件は常時 0）*/}
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-white/70 px-2 py-0.5 text-sumi/80">
              <span className="text-[10px] text-sumi/60">条件</span>
              <b className="tabular-nums text-sumi">(0)</b>
              <span className="text-sumi/30">|</span>
              <b className="tabular-nums text-vermilion-deep">
                {totalCount != null ? totalCount.toLocaleString() : "…"}
              </b>
              <span className="text-[10px] text-sumi/60">社</span>
            </span>
            {hydrating ? <span className="text-sumi/50">{t("detailLoading")}</span> : null}
            {loadError ? <span className="text-vermilion">{loadError}</span> : null}
          </div>

          {showDistanceFilter ? (
            <div className="pointer-events-auto w-full md:w-80">
              <DistanceHistogramFilter
                allPoints={allPoints}
                userCoords={userCoords}
                value={distance}
                onChange={setDistance}
              />
            </div>
          ) : null}

          {showNearby && nearby.length > 0 ? (
            <div className="pointer-events-auto max-h-56 w-full overflow-y-auto rounded-md border border-border bg-washi/95 p-2 text-xs shadow md:w-64">
              <p className="mb-1 font-semibold text-sumi/70">{t("nearbyShrines")}</p>
              <ul className="space-y-1">
                {nearby.map(({ point, d }) => (
                  <li key={point.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectById(point.id)}
                      className="flex w-full items-center justify-between gap-2 rounded px-2 py-2 text-left hover:bg-kinari active:bg-kinari"
                    >
                      <span className="truncate">{point.name}</span>
                      <span className="shrink-0 text-sumi/60">{formatDistance(d)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {/* 右下: 凡例トグル（モバイルは最小化された丸ボタン、タップで展開） */}
      {!selected ? (
        <div className="pointer-events-none absolute bottom-4 right-3 md:bottom-8">
          {showLegend ? (
            <div className="pointer-events-auto rounded-md border border-border bg-washi/95 px-3 py-2 text-[11px] shadow">
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="font-semibold text-sumi/70">{tLegend("title")}</p>
                <button
                  type="button"
                  onClick={() => setShowLegend(false)}
                  className="rounded px-1.5 py-0.5 text-sumi/60 hover:bg-kinari"
                  aria-label={tLegend("open")}
                >
                  ✕
                </button>
              </div>
              <ul className="space-y-1.5 text-sumi/80">
                <li className="flex items-center gap-2">
                  <img src="/icons/shrine/shrine-large.svg" alt="" className="h-7 w-7" />
                  <span>{tLegend("bigShrine")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <img src="/icons/shrine/shrine-medium.svg" alt="" className="h-5 w-5" />
                  <span>{tLegend("normalShrine")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <img src="/icons/shrine/shrine-small.svg" alt="" className="h-3 w-3" />
                  <span>{tLegend("smallShrine")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <img src="/icons/shrine/shrine-hokora.svg" alt="" className="h-5 w-5" />
                  <span>{tLegend("hokora")}</span>
                </li>
                <li className="flex items-center gap-2 pt-1">
                  <span
                    className="inline-block h-4 w-4 rounded-full border"
                    style={{ background: "#d17871", borderColor: "#F5EFE2", opacity: 0.75 }}
                  />
                  <span>{tLegend("cluster")}</span>
                </li>
              </ul>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLegend(true)}
              aria-label={t("openLegend")}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-washi/95 text-lg shadow hover:bg-kinari active:bg-kinari"
            >
              ?
            </button>
          )}
        </div>
      ) : null}

      {selected ? (
        <SpotDetailPanel
          spot={selected}
          userLocation={userCoords}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
