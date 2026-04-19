"use client";
/**
 * Spot をマーカーで地図に表示する。
 *
 * MVP 方針:
 *   - 小規模（〜数千件）なので DOM マーカー（maplibregl.Marker）で素直に描画。
 *   - クラスタリング / GeoJSON source 化は後続（パフォーマンス要件が出てから）。
 */
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { Spot } from "@/lib/api";
import { useMap } from "./MapProvider";

type Props = {
  spots: Spot[];
  onSelect?: (spot: Spot) => void;
  selectedId?: number | null;
};

// Map 側と同じ規模判定ロジック（confidence_score → shrine_rank → photo_url の順）
const LARGE_RANK_KEYWORDS = ["別表神社", "官幣大社", "国幣大社"];
function rankClass(s: Spot): "large" | "medium" | "small" {
  const score = typeof s.confidence_score === "number" ? s.confidence_score : null;
  if (score != null) {
    if (score >= 80) return "large";
    if (score >= 60) return "medium";
    return "small";
  }
  if (s.shrine_rank && LARGE_RANK_KEYWORDS.some((k) => s.shrine_rank!.includes(k))) {
    return "large";
  }
  if (s.photo_url) return "medium";
  return "small";
}

// Tailwind ではなくインラインで色指定（SpotClusterLayer と色を揃える）
const RANK_STYLES: Record<"large" | "medium" | "small", { size: number; bg: string; fg: string; border: string }> = {
  large:  { size: 36, bg: "#d4a017", fg: "#5a1a16", border: "#5a1a16" },
  medium: { size: 30, bg: "#c9302c", fg: "#ffffff", border: "#5a1a16" },
  small:  { size: 24, bg: "#f3e7cf", fg: "#5a1a16", border: "#5a1a16" },
};

export default function SpotMarkers({ spots, onSelect, selectedId }: Props) {
  const { map, ready } = useMap();
  const markersRef = useRef<Map<number, maplibregl.Marker>>(new Map());

  useEffect(() => {
    if (!map || !ready) return;
    const current = markersRef.current;

    const nextIds = new Set<number>();
    for (const s of spots) {
      if (typeof s.lat !== "number" || typeof s.lng !== "number") continue;
      nextIds.add(s.id);
      const rc = rankClass(s);
      const style = RANK_STYLES[rc];
      let marker = current.get(s.id);
      if (!marker) {
        const el = document.createElement("button");
        el.type = "button";
        el.className =
          "relative block -translate-y-1 rounded-full border-2 shadow " +
          "focus:outline-none focus:ring-2 focus:ring-gold";
        el.style.width = `${style.size}px`;
        el.style.height = `${style.size}px`;
        el.style.background = style.bg;
        el.style.borderColor = style.border;
        el.style.color = style.fg;
        el.setAttribute("aria-label", `${s.name} を選択`);
        el.setAttribute("data-rank", rc);
        el.innerHTML =
          `<span class="absolute inset-0 flex items-center justify-center font-serif" style="font-size:${Math.round(style.size * 0.55)}px">⛩</span>`;
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          onSelect?.(s);
        });
        marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([s.lng, s.lat])
          .addTo(map);
        current.set(s.id, marker);
      } else {
        marker.setLngLat([s.lng, s.lat]);
        // 規模が変わった場合に備えて再適用
        const el = marker.getElement();
        if (el.getAttribute("data-rank") !== rc) {
          el.style.width = `${style.size}px`;
          el.style.height = `${style.size}px`;
          el.style.background = style.bg;
          el.style.borderColor = style.border;
          el.style.color = style.fg;
          el.setAttribute("data-rank", rc);
          const glyph = el.querySelector("span");
          if (glyph) (glyph as HTMLElement).style.fontSize = `${Math.round(style.size * 0.55)}px`;
        }
      }
      // 選択強調
      const el = marker.getElement();
      if (selectedId === s.id) {
        el.classList.add("ring-2", "ring-gold", "scale-110");
      } else {
        el.classList.remove("ring-2", "ring-gold", "scale-110");
      }
    }
    // 差分削除
    for (const [id, marker] of current) {
      if (!nextIds.has(id)) {
        marker.remove();
        current.delete(id);
      }
    }
  }, [map, ready, spots, onSelect, selectedId]);

  // アンマウント時に全削除
  useEffect(() => {
    const current = markersRef.current;
    return () => {
      for (const [, marker] of current) marker.remove();
      current.clear();
    };
  }, []);

  return null;
}
