/**
 * GA4 イベントトラッキングヘルパー
 * NEXT_PUBLIC_GA_ID が設定されていない場合は全て no-op
 */

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params ?? {});
}

/** 診断完了 */
export function trackDiagnosisComplete(params: {
  element: string;
  typeName: string;
  worry: string;
}) {
  trackEvent("diagnosis_complete", params);
}

/** おみくじを引いた */
export function trackOmikujiDraw(fortune: string) {
  trackEvent("omikuji_draw", { fortune });
}

/** シェアボタンクリック */
export function trackShareClick(source: "diagnosis" | "omikuji" | "compat") {
  trackEvent("share_click", { source });
}

/** LINE CTAクリック */
export function trackLineCta(source: "diagnosis" | "omikuji") {
  trackEvent("line_cta_click", { source });
}

/** ブックマーク追加 */
export function trackBookmark(kind: "want" | "like", spotId: number) {
  trackEvent("bookmark_add", { kind, spot_id: spotId });
}
