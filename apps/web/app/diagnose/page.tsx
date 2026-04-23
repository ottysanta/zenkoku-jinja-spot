import type { Metadata } from "next";
import DiagnoseClient from "./DiagnoseClient";

export const metadata: Metadata = {
  title: "守護神社診断 — あなたと縁深い神社を見つける",
  description:
    "生まれ年から干支・五行属性を導き出し、職場・家族・恋愛など人間関係の悩みに答えを持つ守護神社をご紹介します。全国46,000社のデータから、あなただけの守護神社を。",
  openGraph: {
    title: "守護神社診断 — あなたと縁深い神社を見つける",
    description: "生まれ年から干支・五行属性を導き出し、あなたの守護神社と人間関係のメッセージをお届けします。",
    type: "website",
  },
};

export default function DiagnosePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      {/* 背景装飾 */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-vermilion/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-moss/5 blur-3xl" />
      </div>

      <DiagnoseClient />
    </main>
  );
}
