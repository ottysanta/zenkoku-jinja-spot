/**
 * MapLibre スタイル定義。
 *
 * - NEXT_PUBLIC_MAP_STYLE が URL なら、その style を使う（MapTiler などを想定）
 * - 未設定時は OSM ラスタタイルの最小スタイルを組み立てる（開発 / セルフホスト用）
 *
 * 注意:
 *   OpenStreetMap のタイルは高トラフィック利用不可。
 *   本番運用では必ず MapTiler 等に切替える。
 */
import type { StyleSpecification } from "maplibre-gl";

const OSM_ATTR =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function defaultOsmRasterStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution: OSM_ATTR,
        maxzoom: 19,
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#F5EFE2" } },
      { id: "osm", type: "raster", source: "osm" },
    ],
  };
}

export function resolveMapStyle(): string | StyleSpecification {
  const url = process.env.NEXT_PUBLIC_MAP_STYLE;
  if (url && url.trim()) return url.trim();
  return defaultOsmRasterStyle();
}
