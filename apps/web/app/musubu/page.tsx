import type { Metadata } from "next";
import MusubuClient from "./MusubuClient";

export const metadata: Metadata = {
  title: "神社が教えてくれた、人間関係の本質 — 縁を結ぶ",
  description:
    "なぜ、神社に行くと少し楽になるのか。職場・家族・恋愛——すべての人間関係の悩みの裏に、あなたが気づいていない「縁の法則」があります。",
  robots: { index: false },
};

export default function MusubuPage() {
  return (
    <main className="overflow-x-hidden">
      <MusubuClient />
    </main>
  );
}
