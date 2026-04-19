"use client";
/**
 * Leaflet ベースの地図コンポーネント (MapLibre の代替)。
 *
 * MapLibre は Next.js 15 のバンドラで Web Worker が壊れるため、
 * Leaflet を CDN 経由で読み込んでタイルを直接表示する。
 * マーカークラスタには Leaflet.markercluster を使用。
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

export default function MapLeaflet() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [total, setTotal] = useState<number | null>(null);

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
        const map = L.map(containerRef.current, {
          preferCanvas: true,
          zoomControl: false,
        }).setView([36.2, 137.0], 5);
        L.control.zoom({ position: "bottomright" }).addTo(map);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
        setStatus("ready");

        // 神社データを取得してクラスタ表示 (失敗時は最大3回リトライ)
        async function fetchGeoJson(): Promise<any> {
          for (let i = 0; i < 3; i++) {
            try {
              const r = await fetch("/api/spots/geojson", { cache: "no-store" });
              if (!r.ok) throw new Error("status " + r.status);
              const text = await r.text();
              return JSON.parse(text);
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

        for (const f of features) {
          const coords = f.geometry && f.geometry.coordinates;
          if (!coords || coords.length !== 2) continue;
          const [lng, lat] = coords;
          if (typeof lat !== "number" || typeof lng !== "number") continue;
          const name = (f.properties && f.properties.name) || "神社";
          const pref = (f.properties && f.properties.prefecture) || "";
          const id = f.properties && f.properties.id;
          const marker = L.marker([lat, lng], { icon: shrineIcon });
          marker.bindPopup(
            `<div style="font-size:13px"><strong>${name}</strong><br/>${pref}${id ? `<br/><a href="/shrines/spot-${id}" style="color:#C9302C">詳細へ →</a>` : ""}</div>`
          );
          cluster.addLayer(marker);
        }
        map.addLayer(cluster);
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

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" style={{ background: "#F5EFE2" }} />

      {/* 左上: 戻る & トグル */}
      <div className="pointer-events-none absolute left-2 right-2 top-2 flex flex-col gap-2 md:right-auto md:left-3 md:top-3" style={{ zIndex: 1000 }}>
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex min-h-[36px] items-center rounded-md border border-border bg-washi/95 px-3 py-1.5 text-xs font-medium text-sumi shadow hover:bg-kinari"
          >
            ← トップ
          </Link>
          <div className="inline-flex overflow-hidden rounded-md border border-border bg-washi/95 text-xs shadow">
            <span className="bg-vermilion px-3 py-1.5 font-semibold text-white">🗺 地図</span>
            <Link href="/search" className="px-3 py-1.5 text-sumi hover:bg-kinari">≣ 一覧</Link>
          </div>
          {total != null ? (
            <span className="rounded-md border border-border bg-washi/95 px-2 py-1 text-[11px] font-medium text-sumi shadow">
              {total.toLocaleString()} 社
            </span>
          ) : null}
        </div>
      </div>

      {status === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-washi/60" style={{ zIndex: 999 }}>
          <div className="rounded-md border border-border bg-white/90 px-4 py-3 text-xs text-sumi/70 shadow">地図を読み込んでいます…</div>
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
