import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "守護神社診断 | あなたに縁の深い神社を無料で診断",
  description:
    "生年月日から、産土神社・氏神神社・鎮守神社を無料で診断。全国31,247社のデータベースから、あなたと縁の深い神社を特定します。登録不要・約30秒で完了。",
  openGraph: {
    title: "守護神社診断 | あなたに縁の深い神社を無料で診断",
    description:
      "生年月日から、あなたに縁の深い守護神社を無料で診断。登録不要・約30秒で完了。",
    images: [{ url: "/images/guardian-ogp.webp", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "守護神社診断 | あなたに縁の深い神社を無料で診断",
    description:
      "生年月日から、あなたに縁の深い守護神社を無料で診断。登録不要・約30秒で完了。",
    images: ["/images/guardian-ogp.webp"],
  },
};

export default function GuardianLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
