"use client";

import { useEffect, useState } from "react";
import { getClientId } from "@/lib/client-id";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "unsupported" | "default" | "granted" | "denied" | "loading";

export default function PushNotificationButton() {
  const [status, setStatus] = useState<Status>("unsupported");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC) {
      setStatus("unsupported");
      return;
    }
    const perm = Notification.permission;
    if (perm === "granted") {
      // 既に許可済みなら購読確認
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((sub) => {
          setStatus(sub ? "granted" : "default");
        }),
      );
    } else if (perm === "denied") {
      setStatus("denied");
    } else {
      setStatus("default");
    }
  }, []);

  async function subscribe() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), clientId: getClientId() }),
      });
      setStatus("granted");
    } catch {
      setStatus(Notification.permission === "denied" ? "denied" : "default");
    }
  }

  async function unsubscribe() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("default");
    } catch {
      setStatus("default");
    }
  }

  if (status === "unsupported") return null;

  if (status === "granted") {
    return (
      <button
        type="button"
        onClick={unsubscribe}
        className="inline-flex items-center gap-1.5 rounded-full border border-moss/40 bg-moss/10 px-4 py-2 text-xs font-semibold text-moss transition hover:bg-moss/20"
      >
        🔔 通知オン
        <span className="text-[10px] text-moss/60">（タップで解除）</span>
      </button>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-[11px] text-sumi/40 text-center">
        ブラウザの設定から通知を許可すると毎朝おみくじを受け取れます
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={subscribe}
      disabled={status === "loading"}
      className="inline-flex items-center gap-1.5 rounded-full border border-vermilion/40 bg-vermilion/8 px-4 py-2 text-xs font-semibold text-vermilion-deep transition hover:bg-vermilion/15 disabled:opacity-60"
    >
      {status === "loading" ? (
        <>
          <span className="h-3 w-3 animate-spin rounded-full border border-vermilion/40 border-t-vermilion-deep" />
          設定中…
        </>
      ) : (
        <>🔔 毎朝おみくじ通知を受け取る</>
      )}
    </button>
  );
}
