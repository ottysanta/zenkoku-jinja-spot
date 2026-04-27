import type { Metadata } from "next";
import CompatClient from "./CompatClient";

export const metadata: Metadata = {
  title: "五行相性診断 — ふたりの縁を読み解く",
  description: "木・火・土・金・水の五行属性から、相生・相克の関係でふたりの縁と相性を読み解きます。恋愛・仕事・友人関係の深い理解に。",
  openGraph: {
    title: "五行相性診断 — ふたりの縁を読み解く",
    description: "五行の「相生・相克」でふたりの関係の本質を読み解きます。",
    type: "website",
  },
};

export default function CompatPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-8 md:py-12">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-vermilion/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-400/5 blur-3xl" />
      </div>
      <CompatClient />
    </main>
  );
}
