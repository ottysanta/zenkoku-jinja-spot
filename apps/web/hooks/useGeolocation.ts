"use client";
/**
 * GPS 取得フック。
 *
 * - 初回レンダ時は何もしない（UX: 無断で許可ダイアログを出さない）。
 * - Permissions API で state === 'granted' ならサイレントに取得。
 * - それ以外は request() を呼んだときに初めて getCurrentPosition。
 */
import { useCallback, useEffect, useState } from "react";

export type Coords = {
  lat: number;
  lng: number;
  accuracy?: number;
  at: number; // epoch ms
};

export type GeoError =
  | { kind: "unsupported" }
  | { kind: "insecure_origin" } // http:// で LAN アクセスしている場合（iOS/Android は弾く）
  | { kind: "permission_denied" }
  | { kind: "unavailable" }
  | { kind: "timeout" }
  | { kind: "unknown"; message: string };

type State = {
  coords: Coords | null;
  error: GeoError | null;
  loading: boolean;
  permission: PermissionState | "unknown";
};

function mapError(e: GeolocationPositionError): GeoError {
  switch (e.code) {
    case e.PERMISSION_DENIED: return { kind: "permission_denied" };
    case e.POSITION_UNAVAILABLE: return { kind: "unavailable" };
    case e.TIMEOUT: return { kind: "timeout" };
    default: return { kind: "unknown", message: e.message };
  }
}

export function useGeolocation(opts: { auto?: boolean } = {}) {
  const { auto = true } = opts;
  const [state, setState] = useState<State>({
    coords: null,
    error: null,
    loading: false,
    permission: "unknown",
  });

  const request = useCallback((options?: PositionOptions) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, error: { kind: "unsupported" } }));
      return;
    }
    // HTTPS でない (かつ localhost でもない) と iOS/Android Chrome は Geolocation を拒否するので
    // ユーザーに分かりやすくヒントを出す。
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setState((s) => ({ ...s, error: { kind: "insecure_origin" } }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState((s) => ({
          ...s,
          loading: false,
          error: null,
          coords: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            at: pos.timestamp,
          },
        }));
      },
      (err) => {
        setState((s) => ({ ...s, loading: false, error: mapError(err) }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 10_000,
        ...options,
      },
    );
  }, []);

  // Permissions API を軽く覗いて、許可済みならサイレントに fetch
  useEffect(() => {
    if (!auto) return;
    if (typeof navigator === "undefined") return;
    const perms = (navigator as Navigator & {
      permissions?: { query: (d: { name: PermissionName }) => Promise<PermissionStatus> };
    }).permissions;
    if (!perms?.query) return;
    let cancelled = false;
    perms
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        setState((s) => ({ ...s, permission: status.state }));
        if (status.state === "granted") {
          request();
        }
        status.onchange = () => {
          setState((s) => ({ ...s, permission: status.state }));
        };
      })
      .catch(() => {
        // 古いブラウザ等: 黙って諦める
      });
    return () => { cancelled = true; };
  }, [auto, request]);

  return { ...state, request };
}
