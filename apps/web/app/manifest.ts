import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "神社マップ – 全国46,000社の守護神社を探す",
    short_name: "神社マップ",
    description: "全国46,000社の神社データベース。守護神社診断・地図検索・参拝記録。",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf7",
    theme_color: "#b91c1c",
    orientation: "portrait-primary",
    categories: ["lifestyle", "religion", "travel"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "守護神社診断",
        short_name: "診断",
        description: "生年月から守護神社を診断する",
        url: "/diagnose",
        icons: [{ src: "/icons/shortcut-diagnose.png", sizes: "96x96" }],
      },
      {
        name: "神社マップ",
        short_name: "マップ",
        description: "近くの神社を地図で探す",
        url: "/map",
        icons: [{ src: "/icons/shortcut-map.png", sizes: "96x96" }],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/diagnose.png",
        sizes: "390x844",
        type: "image/png",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form_factor: "narrow" as any,
        label: "守護神社診断",
      },
    ],
  };
}
