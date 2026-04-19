"use client";
import { useEffect } from "react";
import { addRecent } from "@/app/me/MyPageClient";

export default function TrackRecentVisit({
  spot,
}: {
  spot: {
    id: number;
    name: string;
    slug: string | null;
    prefecture: string | null;
    shrine_type: string | null;
    photo_url?: string | null;
  };
}) {
  useEffect(() => {
    addRecent({
      id: spot.id,
      name: spot.name,
      slug: spot.slug,
      prefecture: spot.prefecture,
      shrine_type: spot.shrine_type,
      photo_url: spot.photo_url ?? null,
    });
  }, [spot.id, spot.name, spot.slug, spot.prefecture, spot.shrine_type, spot.photo_url]);
  return null;
}
