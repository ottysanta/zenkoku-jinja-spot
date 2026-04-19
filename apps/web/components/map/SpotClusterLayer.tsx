"use client";
/**
 * 全 spot を MapLibre のクラスタリング GeoJSON source で一括表示。
 *
 * 設計:
 *   - flagship（manual, 31社）は別 source で常時表示（大型の金色シンボル）
 *   - それ以外（OSM / Wikidata / Jinjacho）は cluster 対象
 *   - ズーム拡大時は個別アイコンで分散表示、アイコンは rank_class で階層化
 *     (large=主要 / medium=普通 / small=地図のみ / hokora=祠・末社)
 *
 * UI 原則:
 *   - 和紙ベージュ（#F5EFE2）基調に朱色・金色のアクセント
 *   - 広域でも情報過多にならないよう、低ズームは点に縮退（maxzoom=8 の円レイヤー）
 *   - zoom>=8 では 4 種類のカスタム SVG アイコンで規模を視覚化
 */
import { useEffect, useRef } from "react";
import type { MapGeoJSONFeature, GeoJSONSource } from "maplibre-gl";
import { useMap } from "./MapProvider";

const SRC_FLAGSHIP = "spots-flagship-src";
const SRC_ALL = "spots-all-src";
const L_CLUSTER = "spots-cluster";
const L_CLUSTER_INNER = "spots-cluster-inner";
const L_POINT_OSM = "spots-point-osm";
const L_POINT_WIKIDATA = "spots-point-wikidata";
const L_POINT_TORII = "spots-point-torii";
const L_FLAGSHIP = "spots-flagship";
const L_FLAGSHIP_INNER = "spots-flagship-inner";
const L_FLAGSHIP_TORII = "spots-flagship-torii";
const L_SELECTED = "spots-selected";

// 規模別の色 (大: 金, 中: 朱, 小: 和紙クリーム)。いずれも濃紅ボーダーで可読性を確保。
const RANK_COLOR_LARGE = "#d4a017";
const RANK_COLOR_MEDIUM = "#c9302c";
const RANK_COLOR_SMALL = "#f3e7cf";
const RANK_COLOR_HOKORA = "#8b6f47";
const RANK_BORDER = "#5a1a16";

// MapLibre に登録するアイコン名 ↔ 公開パス（viewBox に合わせたサイズ）
const ICON_DEFS: Array<{ id: string; url: string; size: number }> = [
  { id: "shrine-large", url: "/icons/shrine/shrine-large.svg", size: 80 },
  { id: "shrine-medium", url: "/icons/shrine/shrine-medium.svg", size: 48 },
  { id: "shrine-small", url: "/icons/shrine/shrine-small.svg", size: 24 },
  { id: "shrine-hokora", url: "/icons/shrine/shrine-hokora.svg", size: 40 },
];

/**
 * SVG を fetch → Blob → Image → createImageBitmap で読み込み、map.addImage する。
 * @2x で登録すれば MapLibre が自動で retina スケーリングしてくれる。
 */
async function loadIconImage(
  map: maplibregl.Map,
  id: string,
  url: string,
  size: number,
): Promise<void> {
  if (map.hasImage(id)) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`icon fetch failed: ${url}`);
  const svgText = await res.text();
  // devicePixelRatio を考慮して最大 2x で描画
  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
  const canvas = document.createElement("canvas");
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const objectUrl = URL.createObjectURL(blob);
  try {
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve();
      };
      img.onerror = (e) => reject(e);
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (!map.hasImage(id)) {
    map.addImage(
      id,
      { width: data.width, height: data.height, data: new Uint8Array(data.data.buffer) },
      { pixelRatio: dpr },
    );
  }
}

type Props = {
  onSelect: (id: number) => void;
  selectedId: number | null;
  onCountChange?: (total: number) => void;
};

export default function SpotClusterLayer({ onSelect, selectedId, onCountChange }: Props) {
  const { map, ready } = useMap();
  const installedRef = useRef(false);

  useEffect(() => {
    if (!map || !ready) return;
    if (installedRef.current) return;

    let cancelled = false;

    const install = async () => {
      // アイコンは並列で先に読み込む（個別失敗しても他は使える）
      await Promise.allSettled(
        ICON_DEFS.map((d) => loadIconImage(map, d.id, d.url, d.size)),
      );
      if (cancelled || !map.getStyle()) return;

      const res = await fetch("/api/spots/geojson");
      if (!res.ok) return;
      const data = (await res.json()) as {
        type: "FeatureCollection";
        features: Array<{
          type: "Feature";
          id: number;
          geometry: { type: "Point"; coordinates: [number, number] };
          properties: {
            id: number;
            name: string;
            source_layer: string | null;
            prefecture: string | null;
            featured: number;
            rank_class?: "large" | "medium" | "small" | "hokora";
          };
        }>;
      };
      if (cancelled || !map.getStyle()) return;

      if (onCountChange && Array.isArray(data.features)) {
        onCountChange(data.features.length);
      }

      const flagship = {
        type: "FeatureCollection" as const,
        features: data.features.filter((f) => f.properties.featured === 1),
      };
      const others = {
        type: "FeatureCollection" as const,
        features: data.features.filter((f) => f.properties.featured !== 1),
      };

      // ソース登録
      if (!map.getSource(SRC_FLAGSHIP)) {
        map.addSource(SRC_FLAGSHIP, { type: "geojson", data: flagship });
      }
      if (!map.getSource(SRC_ALL)) {
        map.addSource(SRC_ALL, {
          type: "geojson",
          data: others,
          cluster: true,
          clusterRadius: 44,
          clusterMaxZoom: 13,
        });
      }

      // --- クラスタ (OSM/Wikidata まとめて) ---
      if (!map.getLayer(L_CLUSTER)) {
        map.addLayer({
          id: L_CLUSTER,
          type: "circle",
          source: SRC_ALL,
          filter: ["has", "point_count"],
          paint: {
            // 件数で円サイズを平方根的に調整（10〜22px）
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              2, 10,
              20, 13,
              100, 16,
              500, 19,
              2000, 22,
            ],
            // 件数で色を vermilion 系の 3 段階
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              2, "#e8a39e",
              50, "#d17871",
              300, "#b85450",
              1500, "#8e2d27",
            ],
            "circle-opacity": 0.72,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#F5EFE2",
          },
        });
      }
      // クラスタの内側（中心に小さな白点＝視線誘導）
      if (!map.getLayer(L_CLUSTER_INNER)) {
        map.addLayer({
          id: L_CLUSTER_INNER,
          type: "circle",
          source: SRC_ALL,
          filter: ["has", "point_count"],
          paint: {
            "circle-radius": 2,
            "circle-color": "#F5EFE2",
            "circle-opacity": 0.9,
          },
        });
      }

      // --- 未クラスタの個別ポイント ---
      // 低ズーム (<=8) では SVG アイコンはコスト高なので、規模別の色付き円で間引く。
      if (!map.getLayer(L_POINT_WIKIDATA)) {
        map.addLayer({
          id: L_POINT_WIKIDATA,
          type: "circle",
          source: SRC_ALL,
          maxzoom: 8,
          filter: ["all", ["!", ["has", "point_count"]]],
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              6, [
                "case",
                ["==", ["get", "rank_class"], "large"], 4,
                ["==", ["get", "rank_class"], "medium"], 3,
                ["==", ["get", "rank_class"], "hokora"], 2,
                2,
              ],
              8, [
                "case",
                ["==", ["get", "rank_class"], "large"], 8,
                ["==", ["get", "rank_class"], "medium"], 6,
                ["==", ["get", "rank_class"], "hokora"], 3,
                4,
              ],
            ],
            "circle-color": [
              "case",
              ["==", ["get", "rank_class"], "large"], RANK_COLOR_LARGE,
              ["==", ["get", "rank_class"], "medium"], RANK_COLOR_MEDIUM,
              ["==", ["get", "rank_class"], "hokora"], RANK_COLOR_HOKORA,
              RANK_COLOR_SMALL,
            ],
            "circle-stroke-width": 1.2,
            "circle-stroke-color": RANK_BORDER,
            "circle-opacity": 0.9,
          },
        });
      }
      // zoom >= 8 ではカスタム SVG アイコンで「どの規模の神社か」を一目で分かるように。
      if (!map.getLayer(L_POINT_TORII)) {
        map.addLayer({
          id: L_POINT_TORII,
          type: "symbol",
          source: SRC_ALL,
          minzoom: 8,
          filter: ["all", ["!", ["has", "point_count"]]],
          layout: {
            "icon-image": [
              "match",
              ["get", "rank_class"],
              "large", "shrine-large",
              "medium", "shrine-medium",
              "hokora", "shrine-hokora",
              "shrine-small", // default (small)
            ],
            // viewBox が異なる（large=80, medium=48, small=24, hokora=40）ので
            // icon-size は「実寸ピクセル ≒ viewBox * icon-size」で揃える。
            //   - 広域 (z=8) では small=14px / medium=20px / large=36px / hokora=18px 相当
            //   - 詳細 (z=16) では small=24px / medium=40px / large=60px / hokora=36px 相当
            "icon-size": [
              "interpolate", ["linear"], ["zoom"],
              8, [
                "case",
                ["==", ["get", "rank_class"], "large"], 0.45,
                ["==", ["get", "rank_class"], "medium"], 0.42,
                ["==", ["get", "rank_class"], "hokora"], 0.45,
                0.6,
              ],
              14, [
                "case",
                ["==", ["get", "rank_class"], "large"], 0.7,
                ["==", ["get", "rank_class"], "medium"], 0.75,
                ["==", ["get", "rank_class"], "hokora"], 0.8,
                0.95,
              ],
              19, [
                "case",
                ["==", ["get", "rank_class"], "large"], 0.95,
                ["==", ["get", "rank_class"], "medium"], 1.0,
                ["==", ["get", "rank_class"], "hokora"], 1.05,
                1.2,
              ],
            ],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "icon-anchor": "bottom",
            // 大きい神社を手前に描画
            "symbol-sort-key": [
              "case",
              ["==", ["get", "rank_class"], "large"], 0,
              ["==", ["get", "rank_class"], "medium"], 1,
              ["==", ["get", "rank_class"], "small"], 2,
              3,
            ],
          },
        });
      }
      // 旧 OSM 専用レイヤーは互換のため無効化（残置しない。
      // クリックハンドラが参照するため、ダミーの空フィルタレイヤーを立てる。）
      if (!map.getLayer(L_POINT_OSM)) {
        map.addLayer({
          id: L_POINT_OSM,
          type: "circle",
          source: SRC_ALL,
          filter: ["==", ["get", "id"], -9999],
          paint: { "circle-radius": 0, "circle-opacity": 0 },
        });
      }

      // --- Flagship（常時表示・最上位）---
      // 低ズームはリング円でシグナリング、zoom>=8 はアイコンに切り替え
      if (!map.getLayer(L_FLAGSHIP)) {
        map.addLayer({
          id: L_FLAGSHIP,
          type: "circle",
          source: SRC_FLAGSHIP,
          maxzoom: 8,
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              3, 6,
              5, 8,
              8, 10,
            ],
            "circle-color": RANK_COLOR_LARGE,
            "circle-opacity": 0.92,
            "circle-stroke-width": 2,
            "circle-stroke-color": RANK_BORDER,
          },
        });
      }
      // 内側の点（低ズーム時のコントラスト強化）
      if (!map.getLayer(L_FLAGSHIP_INNER)) {
        map.addLayer({
          id: L_FLAGSHIP_INNER,
          type: "circle",
          source: SRC_FLAGSHIP,
          maxzoom: 8,
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              3, 2,
              5, 2.5,
              8, 3,
            ],
            "circle-color": RANK_BORDER,
          },
        });
      }
      // Flagship 専用の large アイコン（zoom >= 8）
      if (!map.getLayer(L_FLAGSHIP_TORII)) {
        map.addLayer({
          id: L_FLAGSHIP_TORII,
          type: "symbol",
          source: SRC_FLAGSHIP,
          minzoom: 8,
          layout: {
            "icon-image": "shrine-large",
            "icon-size": [
              "interpolate", ["linear"], ["zoom"],
              8, 0.5,
              14, 0.8,
              18, 1.1,
            ],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "icon-anchor": "bottom",
          },
        });
      }

      // --- 選択状態（両ソースに跨るので、id で全体から探す別レイヤー）---
      if (!map.getLayer(L_SELECTED)) {
        map.addLayer({
          id: L_SELECTED,
          type: "circle",
          source: SRC_ALL,
          filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], -1]],
          paint: {
            "circle-radius": 18,
            "circle-color": "rgba(212, 160, 23, 0)",
            "circle-stroke-width": 3,
            "circle-stroke-color": RANK_COLOR_LARGE,
          },
        });
      }

      installedRef.current = true;
    };

    install();
    return () => {
      cancelled = true;
    };
  }, [map, ready, onCountChange]);

  // クリックハンドラ
  useEffect(() => {
    if (!map || !ready) return;

    const onClusterClick = (e: maplibregl.MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
      const feats = e.features;
      if (!feats || feats.length === 0) return;
      const f = feats[0];
      const clusterId = f.properties?.cluster_id as number | undefined;
      if (clusterId == null) return;
      const src = map.getSource(SRC_ALL) as GeoJSONSource | undefined;
      if (!src) return;
      src.getClusterExpansionZoom(clusterId).then((zoom) => {
        const geom = f.geometry as GeoJSON.Point;
        map.easeTo({ center: geom.coordinates as [number, number], zoom });
      });
    };
    const onPointClick = (e: maplibregl.MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
      const feats = e.features;
      if (!feats || feats.length === 0) return;
      const id = feats[0].properties?.id;
      if (typeof id === "number") onSelect(id);
    };
    const setPointer = () => { map.getCanvas().style.cursor = "pointer"; };
    const clearPointer = () => { map.getCanvas().style.cursor = ""; };

    const pointLayers = [L_POINT_WIKIDATA, L_POINT_TORII, L_FLAGSHIP, L_FLAGSHIP_TORII];
    map.on("click", L_CLUSTER, onClusterClick);
    for (const lid of pointLayers) map.on("click", lid, onPointClick);
    for (const lid of [L_CLUSTER, ...pointLayers]) {
      map.on("mouseenter", lid, setPointer);
      map.on("mouseleave", lid, clearPointer);
    }

    return () => {
      map.off("click", L_CLUSTER, onClusterClick);
      for (const lid of pointLayers) map.off("click", lid, onPointClick);
      for (const lid of [L_CLUSTER, ...pointLayers]) {
        map.off("mouseenter", lid, setPointer);
        map.off("mouseleave", lid, clearPointer);
      }
    };
  }, [map, ready, onSelect]);

  // 選択ハイライト filter 更新
  useEffect(() => {
    if (!map || !ready) return;
    if (!map.getLayer(L_SELECTED)) return;
    map.setFilter(L_SELECTED, [
      "all",
      ["!", ["has", "point_count"]],
      ["==", ["get", "id"], selectedId ?? -1],
    ]);
  }, [map, ready, selectedId]);

  return null;
}
