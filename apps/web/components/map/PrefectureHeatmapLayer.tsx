"use client";
/**
 * 都道府県別の神社件数をヒートマップ風に表示するレイヤー（Comfy 参考）。
 *
 * 2段構成:
 *   1) ポリゴン fill (都道府県形状の色塗り、GeoJSON 約 600KB)
 *   2) 中心点の件数ラベル（読みやすさ優先）
 *
 * - データ: /api/prefecture-counts + /japan-prefectures-simplified.geojson
 * - 色: 件数の階調で濃度 (vermilion 系)
 * - クリック: /search?prefecture=... へ遷移
 * - visible=false でレイヤーを非表示化（ソースは残す）
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Feature, FeatureCollection, Point } from "geojson";
import type maplibregl from "maplibre-gl";
import { useMap } from "./MapProvider";
import { PREFECTURE_CENTROIDS } from "@/lib/prefecture-centroids";

type CountRow = { prefecture: string; count: number };

type Props = {
  visible: boolean;
  data: CountRow[] | null;
};

const POLY_SOURCE = "pref-poly-source";
const POLY_FILL = "pref-poly-fill";
const POLY_LINE = "pref-poly-line";
const LABEL_SOURCE = "pref-counts-source";
const LABEL_LAYER = "pref-counts-label";

type PolyFC = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, unknown>;
    geometry: unknown;
  }>;
};

export default function PrefectureHeatmapLayer({ visible, data }: Props) {
  const { map, ready } = useMap();
  const router = useRouter();
  const installedRef = useRef(false);
  const routerRef = useRef(router);
  routerRef.current = router;
  const [poly, setPoly] = useState<PolyFC | null>(null);

  // ポリゴン GeoJSON を遅延ロード（visible=true になった時）
  useEffect(() => {
    if (!visible || poly) return;
    let cancelled = false;
    fetch("/japan-prefectures-simplified.geojson")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setPoly(j as PolyFC);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [visible, poly]);

  // 件数ラベル用の Point FeatureCollection
  const labelFc = useMemo<FeatureCollection<Point> | null>(() => {
    if (!data) return null;
    const byName = new Map(data.map((r) => [r.prefecture, r.count]));
    const features: Feature<Point>[] = PREFECTURE_CENTROIDS.map((p) => ({
      type: "Feature",
      properties: {
        name: p.name,
        count: byName.get(p.name) ?? 0,
      },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    }));
    return { type: "FeatureCollection", features };
  }, [data]);

  // 件数付きポリゴン FC
  const polyWithCount = useMemo<PolyFC | null>(() => {
    if (!poly || !data) return null;
    const byName = new Map(data.map((r) => [r.prefecture, r.count]));
    return {
      type: "FeatureCollection",
      features: poly.features.map((f) => {
        const nj =
          (f.properties?.nam_ja as string | undefined) ||
          (f.properties?.name as string | undefined) ||
          "";
        return {
          ...f,
          properties: {
            ...f.properties,
            name: nj,
            count: byName.get(nj) ?? 0,
          },
        };
      }),
    };
  }, [poly, data]);

  // ソース/レイヤーの追加・更新
  useEffect(() => {
    if (!map || !ready) return;
    if (!polyWithCount || !labelFc) return;

    const maxCount = Math.max(
      1,
      ...polyWithCount.features.map((f) => (f.properties?.count as number) ?? 0),
    );
    const scale = [
      "interpolate",
      ["linear"],
      ["get", "count"],
      0, "#fff3ee",
      Math.max(1, Math.round(maxCount * 0.15)), "#f5c7ba",
      Math.max(1, Math.round(maxCount * 0.4)), "#e9866f",
      Math.max(1, Math.round(maxCount * 0.7)), "#cf5242",
      maxCount, "#7a261b",
    ] as unknown as maplibregl.DataDrivenPropertyValueSpecification<string>;

    // ポリゴン
    const polySrc = map.getSource(POLY_SOURCE) as
      | maplibregl.GeoJSONSource
      | undefined;
    if (polySrc) {
      polySrc.setData(polyWithCount as unknown as GeoJSON.FeatureCollection);
    } else {
      map.addSource(POLY_SOURCE, {
        type: "geojson",
        data: polyWithCount as unknown as GeoJSON.FeatureCollection,
      });
    }
    if (!map.getLayer(POLY_FILL)) {
      map.addLayer({
        id: POLY_FILL,
        type: "fill",
        source: POLY_SOURCE,
        paint: {
          "fill-color": scale as maplibregl.ExpressionSpecification,
          "fill-opacity": 0.55,
        },
      });
      map.addLayer({
        id: POLY_LINE,
        type: "line",
        source: POLY_SOURCE,
        paint: {
          "line-color": "#7a261b",
          "line-width": 0.6,
          "line-opacity": 0.5,
        },
      });
    } else {
      map.setPaintProperty(
        POLY_FILL,
        "fill-color",
        scale as maplibregl.ExpressionSpecification,
      );
    }

    // ラベル
    const labelSrc = map.getSource(LABEL_SOURCE) as
      | maplibregl.GeoJSONSource
      | undefined;
    if (labelSrc) {
      labelSrc.setData(labelFc as unknown as GeoJSON.FeatureCollection);
    } else {
      map.addSource(LABEL_SOURCE, {
        type: "geojson",
        data: labelFc as unknown as GeoJSON.FeatureCollection,
      });
    }
    if (!map.getLayer(LABEL_LAYER)) {
      map.addLayer({
        id: LABEL_LAYER,
        type: "symbol",
        source: LABEL_SOURCE,
        layout: {
          "text-field": [
            "format",
            ["get", "name"], { "font-scale": 0.82 },
            "\n", {},
            ["to-string", ["get", "count"]],
            { "font-scale": 1.0, "text-color": "#6a1b10" },
          ],
          "text-size": 12,
          "text-anchor": "center",
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": "#2a1914",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.8,
        },
      });
    }
    installedRef.current = true;
  }, [map, ready, polyWithCount, labelFc]);

  // 可視性トグル
  useEffect(() => {
    if (!map || !ready || !installedRef.current) return;
    const v = visible ? "visible" : "none";
    for (const id of [POLY_FILL, POLY_LINE, LABEL_LAYER]) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", v);
    }
  }, [map, ready, visible]);

  // クリックで /search?prefecture=... に遷移
  useEffect(() => {
    if (!map || !ready) return;
    const onClick = (
      e: maplibregl.MapMouseEvent & {
        features?: Array<{ properties?: { name?: string; nam_ja?: string } }>;
      },
    ) => {
      const f = e.features?.[0];
      const name =
        (f?.properties?.name as string | undefined) ||
        (f?.properties?.nam_ja as string | undefined);
      if (!name) return;
      routerRef.current.push(`/search?prefecture=${encodeURIComponent(name)}`);
    };
    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };
    const layers = [POLY_FILL];
    for (const l of layers) {
      map.on("click", l, onClick);
      map.on("mouseenter", l, onEnter);
      map.on("mouseleave", l, onLeave);
    }
    return () => {
      for (const l of layers) {
        map.off("click", l, onClick);
        map.off("mouseenter", l, onEnter);
        map.off("mouseleave", l, onLeave);
      }
    };
  }, [map, ready]);

  return null;
}
