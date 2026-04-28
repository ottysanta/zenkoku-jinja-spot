import type { Metadata } from "next";
import PalmClient from "./PalmClient";

export const metadata: Metadata = {
  title: "AI手相鑑定 — 手のひらから運命を読む",
  description: "手のひらの写真をアップロードするだけで、AIが生命線・知能線・感情線・運命線を鑑定。神道の視点から開運アドバイスもお届けします。無料3回。",
};

export default function PalmPage() {
  return <PalmClient />;
}
