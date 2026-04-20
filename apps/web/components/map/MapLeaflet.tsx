"use client";
/**
 * Leaflet ベースの地図コンポーネント。
 * - OSM タイル + Leaflet.markercluster で 46,000 社をクラスタ表示
 * - 「現在地」ボタン: geolocation API でユーザー位置へジャンプ + 近くの神社を表示
 */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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

type LitePoint = { id: number; name: string; lat: number; lng: number; prefecture?: string | null };

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
  const userMarkerRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "tiles" | "pins" | "ready" | "error">("loading");
  const [total, setTotal] = useState<number | null>(null);
  const [allPoints, setAllPoints] = useState<LitePoint[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

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

        // 神社データを取得 (失敗時最大3回リトライ)
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
          const marker = L.marker([lat, lng], { icon: shrineIcon });
          marker.bindPopup(
            `<div style="font-size:13px"><strong>${name}</strong><br/>${pref}${id ? `<br/><a href="/shrines/spot-${id}" style="color:#C9302C">詳細へ →</a>` : ""}</div>`
          );
          cluster.addLayer(marker);
        }
        if (!cancelled) setAllPoints(lite);
        map.addLayer(cluster);
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

  // 現在地取得
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
          // 既存マーカーを差し替え
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
          map.setView([lat, lng], 12);
        }
      },
      (err) => {
        setLocating(false);
        setLocError(
          err.code === 1
            ? "位置情報の利用が許可されていません (設定から許可してください)"
            : "位置情報の取得に失敗しました"
        );
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 }
    );
  }

  // 現在地から近い 8 社
  const nearby = useMemo(() => {
    if (!userCoords || allPoints.length === 0) return [];
    return allPoints
      .map((p) => ({ p, d: haversineKm(userCoords.lat, userCoords.lng, p.lat, p.lng) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 8);
  }, [userCoords, allPoints]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" style={{ background: "#F5EFE2" }} />

      {/* 左上: 戻る & トグル & 現在地ボタン */}
      <div className="pointer-events-none absolute left-2 right-2 top-2 flex flex-col gap-2 md:right-auto md:left-3 md:top-3" style={{ zIndex: 1000 }}>
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex min-h-[36px] items-center rounded-md border border-border bg-washi/95 px-3 py-1.5 text-xs font-medium text-sumi shadow hover:bg-kinari active:bg-kinari"
          >
            ← トップ
          </Link>
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
          >
            📍 {locating ? "取得中…" : "現在地"}
          </button>
          {total != null ? (
            <span className="rounded-md border border-border bg-washi/95 px-2 py-1 text-[11px] font-medium text-sumi shadow">
              {total.toLocaleString()} 社
            </span>
          ) : null}
        </div>
        {locError ? (
          <div className="pointer-events-auto rounded-md border border-vermilion bg-white px-3 py-2 text-[11px] text-vermilion-deep shadow">
            {locError}
          </div>
        ) : null}
        {/* 近くの神社リスト */}
        {userCoords && nearby.length > 0 ? (
          <div className="pointer-events-auto max-h-[45vh] overflow-y-auto rounded-md border border-border bg-washi/95 px-3 py-2 text-xs shadow">
            <p className="mb-1 font-semibold text-sumi">📍 近くの神社 (上位 8 社)</p>
            <ul className="space-y-1">
              {nearby.map(({ p, d }) => (
                <li key={p.id}>
                  <Link
                    href={`/shrines/spot-${p.id}`}
                    className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-kinari active:bg-kinari"
                  >
                    <span className="truncate text-sumi">{p.name}</span>
                    <span className="shrink-0 text-sumi/60">
                      {d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {status !== "ready" && status !== "error" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-washi/60" style={{ zIndex: 999 }}>
          <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-white/95 px-6 py-5 text-center shadow-lg">
            <span
              className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-vermilion/20 border-t-vermilion-deep"
              role="status"
              aria-label="読み込み中"
            />
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
