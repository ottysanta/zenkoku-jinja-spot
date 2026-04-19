"use client";
/**
 * MapLibre GL のライフサイクル管理。
 * - map インスタンスを children から useMap() で参照できるようにする
 * - StrictMode の二重マウントでもリークしないよう useEffect で必ず remove()
 */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { resolveMapStyle } from "./mapStyle";

type MapCtx = {
  map: MapLibreMap | null;
  ready: boolean;
};

const Ctx = createContext<MapCtx>({ map: null, ready: false });

export function useMap(): MapCtx {
  return useContext(Ctx);
}

type Props = {
  initialCenter?: [number, number];  // [lng, lat]
  initialZoom?: number;
  className?: string;
  children?: React.ReactNode;
};

// 日本の重心付近（本州中央）
const DEFAULT_CENTER: [number, number] = [137.0, 36.2];

export default function MapProvider({
  initialCenter = DEFAULT_CENTER,
  initialZoom = 5,
  className,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const m = new maplibregl.Map({
      container: containerRef.current,
      style: resolveMapStyle(),
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    m.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "bottom-right",
    );
    const onLoad = () => setReady(true);
    m.once("load", onLoad);
    m.once("idle", onLoad);  // load が発火しない場合の fallback
    m.on("error", (e) => console.error("[maplibre] error:", e));
    // さらに fallback: 5 秒後に強制的に ready 化
    const fallbackTimer = setTimeout(() => setReady(true), 5000);
    mapRef.current = m;

    // 初期ロード時に container のレイアウトが確定する前に map が作成されると
    // MapLibre が viewport を h:0 と誤認識してタイルをロードしない。
    // ResizeObserver で container のサイズ変化を監視し、都度 resize を呼ぶ。
    const ro = new ResizeObserver(() => { try { m.resize(); } catch {} });
    ro.observe(containerRef.current);
    // さらに setTimeout で多段 resize (念のため)
    const resizeTimers = [50, 250, 1000, 2500].map((ms) =>
      setTimeout(() => { try { m.resize(); } catch {} }, ms)
    );

    return () => {
      clearTimeout(fallbackTimer);
      resizeTimers.forEach(clearTimeout);
      ro.disconnect();
      setReady(false);
      mapRef.current = null;
      m.remove();
    };
    // 初期値は mount 時のみ使用。props 変更では再生成しない（URL 連動は後続）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={className ?? "relative h-full w-full"}>
      <div ref={containerRef} className="h-full w-full" />
      {/* maplibre-gl.css が Next.js ビルドで剥がれた場合の保険 */}
      <style>{`
        .maplibregl-map { position: relative; overflow: hidden; }
        .maplibregl-canvas-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .maplibregl-canvas-container.maplibregl-interactive { cursor: grab; }
        .maplibregl-canvas { position: absolute; top: 0; left: 0; }
        .maplibregl-canvas:focus { outline: none; }
        .maplibregl-control-container { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 2; }
        .maplibregl-control-container > * { pointer-events: auto; }
        .maplibregl-ctrl-top-right, .maplibregl-ctrl-bottom-right { position: absolute; right: 10px; }
        .maplibregl-ctrl-top-right { top: 10px; }
        .maplibregl-ctrl-bottom-right { bottom: 10px; }
        .maplibregl-ctrl-top-left, .maplibregl-ctrl-bottom-left { position: absolute; left: 10px; }
        .maplibregl-ctrl-top-left { top: 10px; }
        .maplibregl-ctrl-bottom-left { bottom: 10px; }
        .maplibregl-ctrl { background: rgba(255,255,255,0.95); border-radius: 4px; box-shadow: 0 0 0 1px rgba(0,0,0,0.1); }
        .maplibregl-ctrl-group button { width: 30px; height: 30px; background: transparent; border: 0; cursor: pointer; display: block; }
      `}</style>

      {/* 初期ロード中のスケルトン。タイル画像が載るまでに数秒かかることがあるので
          何も見えない真っ白な状態を避けるためのカバー */}
      {!ready ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-washi/80"
        >
          <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-white/90 px-5 py-4 text-xs text-sumi/70 shadow">
            <span
              className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-vermilion-deep/40 border-t-vermilion-deep"
              role="status"
            />
            <span>地図を読み込んでいます…</span>
          </div>
        </div>
      ) : null}
      <Ctx.Provider value={{ map: mapRef.current, ready }}>
        {ready ? children : null}
      </Ctx.Provider>
    </div>
  );
}
