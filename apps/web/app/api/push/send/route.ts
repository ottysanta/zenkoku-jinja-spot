import { matchesSecret } from "@/lib/security/shared-secret";
import { NextResponse } from "next/server";
import webpush from "web-push";
import { listPushSubscriptions, deletePushSubscription } from "@/lib/shrine-db";

const VAPID_PUBLIC  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_EMAIL   = process.env.VAPID_EMAIL ?? "mailto:admin@example.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

/** POST /api/push/send
 * Body: { title: string; body: string; url?: string; secret: string }
 * secret は PUSH_SEND_SECRET 環境変数と照合（簡易保護）
 */
export async function POST(req: Request) {
  const expectedSecret = process.env.PUSH_SEND_SECRET;
  if (!expectedSecret || !VAPID_PUBLIC || !VAPID_PRIVATE) {
    return NextResponse.json({ error: "Push sending is not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { title, body: msgBody, url, secret } = body as {
      title: string;
      body: string;
      url?: string;
      secret: string;
    };

    if (!matchesSecret(secret, expectedSecret)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Do not permit notification links to arbitrary external destinations.
    if (typeof title !== "string" || !title.trim() || title.length > 100 ||
        typeof msgBody !== "string" || msgBody.length > 500 ||
        (url !== undefined && (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//") || /[\\\r\n]/.test(url)))) {
      return NextResponse.json({ error: "invalid notification" }, { status: 400 });
    }
    const subs = listPushSubscriptions();
    const payload = JSON.stringify({ title, body: msgBody, url: url ?? "/omikuji" });

    let sent = 0;
    let failed = 0;
    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
          sent++;
        } catch (err: unknown) {
          // 410 Gone = subscription expired → 削除
          if (
            err &&
            typeof err === "object" &&
            "statusCode" in err &&
            (err as { statusCode: number }).statusCode === 410
          ) {
            deletePushSubscription(sub.endpoint);
          }
          failed++;
        }
      }),
    );

    return NextResponse.json({ ok: true, sent, failed, total: subs.length });
  } catch (e) {
    return NextResponse.json({ error: "notification failed" }, { status: 500 });
  }
}
