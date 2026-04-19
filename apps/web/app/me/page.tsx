import type { Metadata } from "next";
import MyPageClient from "./MyPageClient";

export const metadata: Metadata = {
  title: "マイページ",
  description: "ブックマーク、参拝履歴、奉納履歴、投稿などをまとめて確認できます。",
  robots: { index: false, follow: false },
};

export default function MyPage() {
  return <MyPageClient />;
}
