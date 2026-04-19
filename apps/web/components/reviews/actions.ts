"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { api } from "@/lib/api";

function parseScore(v: FormDataEntryValue | null): number | null {
  if (!v) return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export async function submitReview(spotId: number, formData: FormData) {
  const session = await auth();
  if (!session?.apiToken) throw new Error("auth required");

  await api.upsertReview(
    spotId,
    {
      score_overall: parseScore(formData.get("score_overall")),
      score_atmosphere: parseScore(formData.get("score_atmosphere")),
      score_manners: parseScore(formData.get("score_manners")),
      score_access: parseScore(formData.get("score_access")),
      score_facilities: parseScore(formData.get("score_facilities")),
      body: String(formData.get("body") ?? "").trim() || null,
      visited_at: String(formData.get("visited_at") ?? "") || null,
    },
    session.apiToken,
  );

  // ISR キャッシュを無効化（shrine 詳細のみ）
  revalidatePath(`/shrines`, "layout");
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.apiToken) return;
  await api.markAllRead(session.apiToken);
  revalidatePath("/notifications");
}
