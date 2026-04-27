import type { Metadata } from "next";
import OmikujiClient from "./OmikujiClient";

export const metadata: Metadata = {
  title: "今日のおみくじ — 守護神からの毎日のメッセージ",
  description: "1日1回引ける守護神からのおみくじ。あなたの五行属性に合わせた今日のメッセージをお届けします。",
  openGraph: {
    title: "今日のおみくじ — 守護神からの毎日のメッセージ",
    description: "1日1回、守護神様からの今日のメッセージを受け取りましょう。",
    type: "website",
  },
};

export default function OmikujiPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-8 md:py-12">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-vermilion/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-400/5 blur-3xl" />
      </div>
      <OmikujiClient />
    </main>
  );
}
