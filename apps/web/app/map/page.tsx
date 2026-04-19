import type { Metadata } from "next";
import MapLeaflet from "@/components/map/MapLeaflet";

export const metadata: Metadata = {
  title: "神社を地図で探す",
  description: "現在地から神社を検索。参拝チェックイン・レビュー閲覧が可能。",
};

export default function MapPage() {
  return (
    <main className="h-[calc(100dvh-2.5rem)] bg-washi">
      <MapLeaflet />
    </main>
  );
}
