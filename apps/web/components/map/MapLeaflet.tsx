"use client";
/**
 * Leaflet ベースの地図コンポーネント (全機能版)。
 * - OSM タイル + Leaflet.markercluster で 46,000 社をクラスタ表示
 * - 📍 現在地ボタン + 近くの神社リスト
 * - ご利益フィルタチップ (縁結び/金運 等)
 * - マーカークリック → 詳細パネル (SpotDetailPanel) 表示
 * - 都道府県ヒートマップトグル
 * - 距離ヒストグラムフィルタ
 * - 凡例 (?) ボタン
 * - 検索バー (compact)
 */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, type Spot, ApiError } from "@/lib/api";
import SpotDetailPanel from "./SpotDetailPanel";
import SearchBar from "../search/SearchBar";

declare global {
  interface Window {
    L: any;
  }
}

const CDN = {
  leafletCss: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  leafletJs: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  clusterCss1: "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css",
  clusterCss2: "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css",
  clusterJs: "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js",
};

function loadCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("load failed: " + src));
    document.head.appendChild(s);
  });
}

type LitePoint = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  prefecture?: string | null;
  // benefit search index (from name keyword hints)
};

// ご利益ごとのキーワードヒント (祭神・神社名に含まれるパターン)
const BENEFIT_HINTS: Record<string, string[]> = {
  縁結び: ["大国", "出雲", "氷川", "八重垣", "大神"],
  金運: ["稲荷", "大黒", "弁財", "市杵島"],
  商売繁盛: ["稲荷", "宇迦", "恵比寿", "大黒"],
  合格祈願: ["天満", "天神", "菅原"],
  健康: ["少彦", "薬"],
  厄除け: ["八坂", "素戔嗚", "牛頭"],
  交通安全: ["猿田彦", "道祖"],
  勝負運: ["八幡", "諏訪", "鹿島", "香取"],
};
const BENEFIT_EMOJI: Record<string, string> = {
  縁結び: "💕",
  金運: "🪙",
  商売繁盛: "💰",
  合格祈願: "📚",
  健康: "🌿",
  厄除け: "🧿",
  交通安全: "🚙",
  勝負運: "⚔",
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const la1 = (lat1 * Math.PI) / 180;
  const la2 = (lat2 * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export default function MapLeaflet() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const clusterRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const heatmapLayerRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "tiles" | "pins" | "ready" | "error">("loading");
  const [total, setTotal] = useState<number | null>(null);
  const [allPoints, setAllPoints] = useState<LitePoint[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Spot | null>(null);
  const [hydrating, setHydrating] = useState(false);
  const [benefitFilter, setBenefitFilter] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [prefCounts, setPrefCounts] = useState<Array<{ prefecture: string; count: number }> | null>(null);
  const [maxKm, setMaxKm] = useState<number>(50);
  // モバイル視認性向上: 検索 + ご利益フィルタは初期非表示
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  // 初期化: Leaflet + クラスタ
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        loadCss(CDN.leafletCss);
        loadCss(CDN.clusterCss1);
        loadCss(CDN.clusterCss2);
        await loadScript(CDN.leafletJs);
        await loadScript(CDN.clusterJs);
        if (cancelled) return;
        if (!containerRef.current || !window.L) {
          setStatus("error");
          return;
        }
        const L = window.L;
        const map = L.map(containerRef.current, { preferCanvas: true, zoomControl: false }).setView([36.2, 137.0], 5);
        L.control.zoom({ position: "bottomright" }).addTo(map);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
        setStatus("tiles");

        async function fetchGeoJson(): Promise<any> {
          for (let i = 0; i < 3; i++) {
            try {
              const r = await fetch("/api/spots/geojson", { cache: "no-store" });
              if (!r.ok) throw new Error("status " + r.status);
              return await r.json();
            } catch (e) {
              console.warn("[MapLeaflet] fetch retry " + (i + 1), e);
              await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
            }
          }
          throw new Error("geojson fetch failed after retries");
        }
        const geojson = await fetchGeoJson();
        if (cancelled) return;
        const features = (geojson && geojson.features) || [];
        setTotal(features.length);

        setStatus("pins");
        await new Promise((res) => setTimeout(res, 0));

        const lite: LitePoint[] = [];
        for (const f of features) {
          const coords = f.geometry && f.geometry.coordinates;
          if (!coords || coords.length !== 2) continue;
          const [lng, lat] = coords;
          if (typeof lat !== "number" || typeof lng !== "number") continue;
          const name = (f.properties && f.properties.name) || "神社";
          const pref = (f.properties && f.properties.prefecture) || "";
          const id = f.properties && f.properties.id;
          lite.push({ id, name, lat, lng, prefecture: pref });
        }
        if (!cancelled) setAllPoints(lite);
        setStatus("ready");
      } catch (e) {
        console.error("[MapLeaflet]", e);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
    };
  }, []);

  // フィルタ変更時にクラスタを差し替える
  useEffect(() => {
    if (status !== "ready" || !window.L || !mapRef.current) return;
    const L = window.L;
    const map = mapRef.current;
    if (clusterRef.current) {
      try { map.removeLayer(clusterRef.current); } catch {}
    }
    const cluster = (L as any).markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 100,
      maxClusterRadius: 60,
      showCoverageOnHover: false,
    });
    const shrineIcon = L.divIcon({
      className: "shrine-pin",
      html: '<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#C9302C;border:2px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.3)"></span>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    const hints = benefitFilter ? BENEFIT_HINTS[benefitFilter] || [] : [];
    const filtered = benefitFilter
      ? allPoints.filter((p) => hints.some((h) => p.name.includes(h)))
      : allPoints;
    for (const p of filtered) {
      const marker = L.marker([p.lat, p.lng], { icon: shrineIcon });
      marker.on("click", () => handleSelect(p.id));
      cluster.addLayer(marker);
    }
    map.addLayer(cluster);
    clusterRef.current = cluster;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPoints, benefitFilter, status]);

  // 都道府県ヒートマップ
  useEffect(() => {
    if (!showHeatmap) {
      if (heatmapLayerRef.current && mapRef.current) {
        try { mapRef.current.removeLayer(heatmapLayerRef.current); } catch {}
        heatmapLayerRef.current = null;
      }
      return;
    }
    if (!prefCounts) {
      fetch("/api/prefecture-counts")
        .then((r) => r.json())
        .then((j) => { if (Array.isArray(j)) setPrefCounts(j); })
        .catch(() => {});
      return;
    }
    if (!window.L || !mapRef.current) return;
    const L = window.L;
    const map = mapRef.current;
    if (heatmapLayerRef.current) {
      try { map.removeLayer(heatmapLayerRef.current); } catch {}
    }
    // 簡易ヒートマップ: 各都道府県の代表点に半径可変の円を描く
    const max = Math.max(...prefCounts.map((d) => d.count));
    const group = L.layerGroup();
    // 代表点マッピング (簡略化: 内部で計算せず、代表緯度経度を埋め込み)
    const REPS: Record<string, [number, number]> = {
      北海道: [43.2, 142.9], 青森県: [40.8, 140.7], 岩手県: [39.7, 141.2],
      宮城県: [38.3, 140.9], 秋田県: [39.7, 140.1], 山形県: [38.2, 140.4],
      福島県: [37.4, 140.5], 茨城県: [36.3, 140.4], 栃木県: [36.6, 139.9],
      群馬県: [36.4, 139.1], 埼玉県: [35.9, 139.6], 千葉県: [35.6, 140.2],
      東京都: [35.7, 139.7], 神奈川県: [35.4, 139.3], 新潟県: [37.9, 139.0],
      富山県: [36.7, 137.2], 石川県: [36.6, 136.7], 福井県: [36.0, 136.2],
      山梨県: [35.7, 138.6], 長野県: [36.2, 138.0], 岐阜県: [35.9, 137.0],
      静岡県: [34.9, 138.4], 愛知県: [35.2, 137.0], 三重県: [34.7, 136.5],
      滋賀県: [35.0, 136.0], 京都府: [35.2, 135.6], 大阪府: [34.7, 135.5],
      兵庫県: [35.0, 134.7], 奈良県: [34.4, 135.8], 和歌山県: [33.8, 135.4],
      鳥取県: [35.4, 133.9], 島根県: [35.1, 132.9], 岡山県: [34.9, 133.7],
      広島県: [34.5, 132.7], 山口県: [34.3, 131.4], 徳島県: [33.9, 134.3],
      香川県: [34.3, 133.9], 愛媛県: [33.6, 132.9], 高知県: [33.3, 133.5],
      福岡県: [33.6, 130.5], 佐賀県: [33.3, 130.2], 長崎県: [32.8, 129.9],
      熊本県: [32.7, 130.8], 大分県: [33.2, 131.4], 宮崎県: [32.0, 131.3],
      鹿児島県: [31.5, 130.6], 沖縄県: [26.5, 127.9],
    };
    for (const d of prefCounts) {
      const rep = REPS[d.prefecture];
      if (!rep) continue;
      const radius = Math.sqrt(d.count / max) * 40000;
      const circle = L.circle(rep, {
        radius, color: "#C9302C", fillColor: "#d17871", fillOpacity: 0.25, weight: 1,
      });
      circle.bindTooltip(`${d.prefecture}: ${d.count.toLocaleString()} 社`, { sticky: true });
      group.addLayer(circle);
    }
    group.addTo(map);
    heatmapLayerRef.current = group;
  }, [showHeatmap, prefCounts]);

  async function handleSelect(id: number) {
    setHydrating(true);
    try {
      const spot = await api.getSpot(id);
      setSelected(spot);
      if (mapRef.current) {
        try {
          mapRef.current.flyTo([spot.lat, spot.lng], 14, { duration: 0.8 });
        } catch {}
      }
    } catch (e) {
      console.error("[MapLeaflet] getSpot", e);
      if (e instanceof ApiError) {
        alert("詳細の取得に失敗しました: " + e.message);
      } else {
        alert("詳細の取得に失敗しました");
      }
    } finally {
      setHydrating(false);
    }
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      setLocError("この端末では位置情報が使えません");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });
        const L = window.L;
        const map = mapRef.current;
        if (L && map) {
          if (userMarkerRef.current) {
            try { userMarkerRef.current.remove(); } catch {}
          }
          const icon = L.divIcon({
            className: "user-pin",
            html: '<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 2px #2563eb"></span>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });
          userMarkerRef.current = L.marker([lat, lng], { icon }).addTo(map);
          map.flyTo([lat, lng], 12, { duration: 0.8 });
        }
      },
      (err) => {
        setLocating(false);
        setLocError(
          err.code === 1
            ? "位置情報の利用が許可されていません"
            : "位置情報の取得に失敗しました"
        );
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 }
    );
  }

  const nearby = useMemo(() => {
    if (!userCoords || allPoints.length === 0) return [];
    return allPoints
      .map((p) => ({ p, d: haversineKm(userCoords.lat, userCoords.lng, p.lat, p.lng) }))
      .filter(({ d }) => d <= maxKm)
      .sort((a, b) => a.d - b.d)
      .slice(0, 8);
  }, [userCoords, allPoints, maxKm]);

  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      <div className="relative flex-1">
      <div ref={containerRef} className="h-full w-full" style={{ background: "#F5EFE2" }} />

      {/* 左上: コントロール群 */}
      <div className="pointer-events-none absolute left-2 right-2 top-2 flex flex-col gap-2 md:right-auto md:left-3 md:top-3 md:max-w-sm" style={{ zIndex: 1000 }}>
        {/* 1 行目: 戻る + 地図/一覧 + 現在地 + 件数 */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <Link href="/" className="inline-flex min-h-[36px] items-center rounded-md border border-border bg-washi/95 px-3 py-1.5 text-xs font-medium text-sumi shadow hover:bg-kinari active:bg-kinari">← トップ</Link>
          <div className="inline-flex overflow-hidden rounded-md border border-border bg-washi/95 text-xs shadow">
            <span className="bg-vermilion px-3 py-1.5 font-semibold text-white">🗺 地図</span>
            <Link href="/search" className="px-3 py-1.5 text-sumi hover:bg-kinari">≣ 一覧</Link>
          </div>
          <button
            type="button"
            onClick={handleLocate}
            disabled={locating}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-md border border-border bg-washi/95 px-3 py-1.5 text-xs font-medium text-sumi shadow hover:bg-kinari active:bg-kinari disabled:opacity-50"
            style={{ touchAction: "manipulation" }}
          >📍 {locating ? "取得中…" : "現在地"}</button>
          {total != null ? (
            <span className="rounded-md border border-border bg-washi/95 px-2 py-1 text-[11px] font-medium text-sumi shadow">
              {total.toLocaleString()} 社
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setShowHeatmap((v) => !v)}
            className={`inline-flex min-h-[36px] items-center rounded-md border px-3 py-1.5 text-xs font-medium shadow active:bg-kinari ${showHeatmap ? 'border-vermilion bg-vermilion text-white' : 'border-border bg-washi/95 text-sumi hover:bg-kinari'}`}
            style={{ touchAction: "manipulation" }}
          >🔥 密度</button>
          <button
            type="button"
            onClick={() => setShowSearchPanel((v) => !v)}
            className={`inline-flex min-h-[36px] items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium shadow active:bg-kinari ${showSearchPanel ? 'border-vermilion bg-vermilion text-white' : 'border-border bg-washi/95 text-sumi hover:bg-kinari'}`}
            style={{ touchAction: "manipulation" }}
          >🔍 {benefitFilter ? `${benefitFilter}で絞込中` : '検索・絞込'}</button>
        </div>

        {/* 検索バー (トグル表示) */}
        {showSearchPanel ? (
          <div className="pointer-events-auto">
            <SearchBar variant="compact" />
          </div>
        ) : null}

        {/* ご利益フィルタチップ (トグル表示) */}
        {showSearchPanel ? (
        <div className="pointer-events-auto flex flex-wrap gap-1.5 rounded-md border border-border bg-washi/95 px-2 py-2 text-[11px] shadow">
          <span className="py-1 text-sumi/60">ご利益:</span>
          {Object.keys(BENEFIT_HINTS).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBenefitFilter((v) => (v === b ? null : b))}
              className={`inline-flex min-h-[28px] items-center gap-0.5 rounded-full border px-2.5 py-0.5 active:bg-kinari ${benefitFilter === b ? 'border-vermilion bg-vermilion text-white' : 'border-border bg-white text-sumi hover:bg-kinari'}`}
              style={{ touchAction: "manipulation" }}
            >
              {BENEFIT_EMOJI[b]}{b}
            </button>
          ))}
          {benefitFilter ? (
            <button
              type="button"
              onClick={() => setBenefitFilter(null)}
              className="rounded-full border border-border bg-white px-2 py-0.5 text-sumi/60 hover:bg-kinari"
            >× 解除</button>
          ) : null}
        </div>
        ) : null}

        {locError ? (
          <div className="pointer-events-auto rounded-md border border-vermilion bg-white px-3 py-2 text-[11px] text-vermilion-deep shadow">
            {locError}
          </div>
        ) : null}

        {/* 距離フィルタ + 近くの神社 */}
        {userCoords ? (
          <div className="pointer-events-auto rounded-md border border-border bg-washi/95 px-3 py-2 text-xs shadow">
            <label className="flex items-center justify-between gap-2 pb-1 text-[11px] text-sumi/70">
              <span>半径 {maxKm} km 以内</span>
              <input
                type="range" min="1" max="200" value={maxKm}
                onChange={(e) => setMaxKm(Number(e.target.value))}
                className="w-32"
              />
            </label>
            {nearby.length > 0 ? (
              <div className="max-h-[40vh] overflow-y-auto">
                <p className="mb-1 font-semibold text-sumi">📍 近くの神社 ({nearby.length})</p>
                <ul className="space-y-1">
                  {nearby.map(({ p, d }) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(p.id)}
                        className="flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left hover:bg-kinari active:bg-kinari"
                        style={{ touchAction: "manipulation" }}
                      >
                        <span className="truncate text-sumi">{p.name}</span>
                        <span className="shrink-0 text-sumi/60">
                          {d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sumi/60">{maxKm}km 以内に神社がありません</p>
            )}
          </div>
        ) : null}
      </div>

      {/* 右下: 凡例 (?) */}
      {!selected ? (
        <div className="pointer-events-none absolute bottom-[90px] right-3" style={{ zIndex: 1000 }}>
          {showLegend ? (
            <div className="pointer-events-auto rounded-md border border-border bg-washi/95 px-3 py-2 text-[11px] shadow">
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="font-semibold text-sumi/70">凡例</p>
                <button type="button" onClick={() => setShowLegend(false)} className="rounded px-1.5 py-0.5 text-sumi/60 hover:bg-kinari">✕</button>
              </div>
              <ul className="space-y-1.5 text-sumi/80">
                <li className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-vermilion-deep border-2 border-white"/> 神社</li>
                <li className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded-full border border-white" style={{ background: "#d17871", opacity: 0.75 }}/> クラスタ</li>
                <li className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full bg-blue-600 border-2 border-white"/> 現在地</li>
              </ul>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLegend(true)}
              aria-label="凡例を開く"
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-washi/95 text-lg shadow hover:bg-kinari active:bg-kinari"
              style={{ touchAction: "manipulation" }}
            >?</button>
          )}
        </div>
      ) : null}

      </div>

      {/* 詳細パネル (デスクトップはサイドペイン、モバイルはボトムドロワー) */}
      {selected ? (
        <SpotDetailPanel
          spot={selected}
          userLocation={userCoords ? { lat: userCoords.lat, lng: userCoords.lng } : null}
          onClose={() => setSelected(null)}
        />
      ) : null}
      {hydrating && !selected ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ zIndex: 1001 }}>
          <div className="rounded-md bg-white/95 px-4 py-3 text-xs text-sumi shadow-lg">神社詳細を取得中…</div>
        </div>
      ) : null}

      {status !== "ready" && status !== "error" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-washi/60" style={{ zIndex: 999 }}>
          <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-white/95 px-6 py-5 text-center shadow-lg">
            <span className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-vermilion/20 border-t-vermilion-deep" role="status" aria-label="読み込み中"/>
            <div>
              <p className="font-serif text-sm font-semibold text-sumi">NOW LOADING...</p>
              <p className="mt-1 text-xs text-sumi/70">
                {status === "loading" ? "地図タイルを準備中…" : null}
                {status === "tiles" ? "神社データを取得中… (約 46,000 社)" : null}
                {status === "pins" ? "神社をマップに配置中…" : null}
              </p>
              <p className="mt-1 text-[10px] text-sumi/40">しばらくお待ちください</p>
            </div>
          </div>
        </div>
      ) : null}
      {status === "error" ? (
        <div className="absolute bottom-4 left-4 right-4 rounded-md border border-vermilion bg-white px-3 py-2 text-xs text-sumi shadow" style={{ zIndex: 999 }}>
          地図の読み込みに失敗しました。ページを再読み込みしてください。
        </div>
      ) : null}
    </div>
  );
}
