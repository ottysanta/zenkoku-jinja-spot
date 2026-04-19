import type { Metadata } from "next";
import MapView from "@/components/map/MapView";

export const metadata: Metadata = {
  title: "神社を地図で探す",
  description: "現在地から神社を検索。参拝チェックイン・レビュー閲覧が可能。",
};

/**
 * /map 画面（Phase 1c）
 *
 * MapLibre GL + React での正式実装。Phase 0b の iframe 版は /legacy-map に残している
 * （緊急退避用。本画面で不具合があった場合の切替先）。
 */
export default function MapPage() {
  return (
    <main className="h-[calc(100dvh-2.5rem)] bg-washi">
      <MapView />
    </main>
  );
}
