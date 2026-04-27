import type { MetadataRoute } from "next";
import { api, spotSlug } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3030";
const SITEMAP_LIMIT = Number(process.env.SITEMAP_LIMIT || "2000");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 静的な主要ページ
  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,                   changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/map`,                changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/search`,             changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/diagnose`,           changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/omikuji`,            changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/diagnose/compat`,    changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/worry`,              changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/musubu`,             changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/learn`,              changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/offerings`,          changeFrequency: "weekly",  priority: 0.6 },
  ];

  try {
    const shrines = await api.listShrines(SITEMAP_LIMIT);
    for (const s of shrines) {
      entries.push({
        url: `${BASE}/shrines/${spotSlug(s)}`,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // API に繋がらないビルド（完全静的）でも最低限のサイトマップは出す
  }
  return entries;
}
