"use server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { api } from "@/lib/api";

function parseAmount(raw: FormDataEntryValue | null): number | null {
  if (!raw) return null;
  const n = parseInt(String(raw), 10);
  if (!Number.isFinite(n)) return null;
  if (n < 100 || n > 1_000_000) return null;
  return n;
}

/**
 * 奉納 Checkout セッションを発行して Stripe へリダイレクトする。
 * - ログイン任意。非ログインは匿名扱い。
 */
export async function startOfferingCheckout(spotId: number, formData: FormData) {
  const session = await auth();

  const itemIdRaw = formData.get("offering_item_id");
  const offeringItemId =
    itemIdRaw && String(itemIdRaw).length > 0 ? parseInt(String(itemIdRaw), 10) : null;
  const amount = parseAmount(formData.get("amount_jpy"));
  const message = String(formData.get("message") ?? "").trim() || null;
  const anonymous = formData.get("anonymous") === "on" || !session?.apiToken;

  if (!offeringItemId && amount === null) {
    throw new Error("金額を入力してください（100〜1,000,000円）");
  }

  const result = await api.createOfferingCheckout(
    spotId,
    {
      offering_item_id: offeringItemId,
      amount_jpy: offeringItemId ? null : amount,
      message,
      anonymous,
    },
    session?.apiToken ?? null,
  );

  redirect(result.checkout_url);
}
