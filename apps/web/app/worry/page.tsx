import type { Metadata } from "next";
import WorryClient from "./WorryClient";

export const metadata: Metadata = {
  title: "悩み別 神社診断 — あなたの悩みに寄り添う神様を",
  description:
    "職場・恋愛・家族・健康・金運・学業・厄除け──あなたの今の悩みに合わせて、ご利益を持つ全国の神社をご紹介します。",
  openGraph: {
    title: "悩み別 神社診断 — あなたの悩みに寄り添う神様を",
    description: "今のあなたの悩みに、静かに応えてくれる神様がいます。",
    type: "website",
  },
};

export default function WorryPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-vermilion/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-moss/5 blur-3xl" />
      </div>
      <WorryClient />
    </main>
  );
}
