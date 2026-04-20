import type { Metadata } from "next";
import { auth } from "@/auth";
import MyPageClient from "./MyPageClient";

export const metadata: Metadata = {
  title: "マイページ",
  description: "ブックマーク、参拝履歴、奉納履歴、投稿などをまとめて確認できます。",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const session = await auth().catch(() => null);
  const user =
    session?.user?.email
      ? {
          email: session.user.email,
          name: session.user.name ?? null,
          image: session.user.image ?? null,
        }
      : null;
  return <MyPageClient user={user} />;
}
