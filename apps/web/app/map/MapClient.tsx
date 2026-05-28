"use client";

import dynamic from "next/dynamic";

const MapLeaflet = dynamic(() => import("@/components/map/MapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center" style={{ background: "#0D0A07" }}>
      <div className="text-center space-y-3">
        <div className="text-4xl animate-pulse">⛩</div>
        <p style={{ color: "rgba(220,202,168,0.6)", fontSize: "0.875rem" }}>地図を読み込んでいます…</p>
      </div>
    </div>
  ),
});

export default function MapClient() {
  return <MapLeaflet />;
}
