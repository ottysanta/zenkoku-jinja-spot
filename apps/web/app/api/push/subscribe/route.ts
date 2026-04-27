import { NextResponse } from "next/server";
import { savePushSubscription, deletePushSubscription } from "@/lib/shrine-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, clientId } = body as {
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
      clientId?: string;
    };
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
    }
    savePushSubscription({
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      clientId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { endpoint } = body as { endpoint: string };
    if (!endpoint) return NextResponse.json({ error: "missing endpoint" }, { status: 400 });
    deletePushSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
