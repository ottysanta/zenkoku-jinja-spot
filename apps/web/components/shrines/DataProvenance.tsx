import type { Spot } from "@/lib/api";

/**
 * 神社詳細ページ末尾に表示する「データ出典・鮮度」セクション。
 *
 * ユーザーに対して:
 *   - 何のソースを主としているか (primary_source)
 *   - 最後に外部同期したのはいつか (last_synced_at)
 *   - 鮮度ステータス (data_freshness_status)
 *   - 信頼度スコア (confidence_score)
 *   - 公的登録状況 (official_status)
 * を透明に開示する。
 */
export default function DataProvenance({ shrine }: { shrine: Spot }) {
  const primary = shrine.primary_source ?? shrine.source_layer ?? "unknown";
  const freshness = shrine.data_freshness_status ?? "unknown";
  const syncedAt = shrine.last_synced_at
    ? new Date(shrine.last_synced_at).toLocaleString("ja-JP")
    : "—";

  return (
    <section className="mt-10 rounded-md border border-border/60 bg-kinari/30 p-4 text-xs text-sumi/70">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-sumi/60">
        データ出典・鮮度
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-4">
        <DItem label="主ソース" value={SOURCE_LABEL[primary] ?? primary} />
        <DItem label="鮮度" value={<FreshnessPill status={freshness} />} />
        <DItem label="最終同期" value={syncedAt} />
        <DItem
          label="信頼度"
          value={shrine.confidence_score != null ? `${shrine.confidence_score}/100` : "—"}
        />
        {shrine.official_status ? (
          <DItem
            label="公的登録"
            value={OFFICIAL_LABEL[shrine.official_status] ?? shrine.official_status}
          />
        ) : null}
      </dl>
      <p className="mt-3 text-[10px] leading-relaxed text-sumi/50">
        本データは OSM / Wikidata / 国土数値情報 / 国土地理院 / 神社庁 / 管理者手動 などの
        複数ソースを統合して生成されています。Google Maps / Places 由来の情報は補助表示に限り、
        自社マスタの原本としては保存していません。誤りにお気づきの場合は地図ページの
        「情報修正」から申請してください。
      </p>
    </section>
  );
}

function DItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-[10px] uppercase tracking-wide text-sumi/50">{label}</dt>
      <dd className="mb-1">{value}</dd>
    </>
  );
}

function FreshnessPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    fresh: { label: "新鮮", cls: "bg-moss/15 text-moss" },
    aging: { label: "要更新", cls: "bg-amber-100 text-amber-800" },
    stale: { label: "古い", cls: "bg-vermilion/10 text-vermilion" },
    unknown: { label: "不明", cls: "bg-sumi/10 text-sumi/60" },
  };
  const tone = map[status] ?? map.unknown;
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${tone.cls}`}>
      {tone.label}
    </span>
  );
}

const SOURCE_LABEL: Record<string, string> = {
  manual: "手動登録（管理者検証）",
  bunka: "文化庁 宗教年鑑",
  jinjacho: "神社庁",
  mlit: "国土交通省 国土数値情報",
  gsi: "国土地理院 基盤地図",
  wikidata: "Wikidata",
  wikipedia: "Wikipedia",
  osm: "OpenStreetMap",
  google_places: "Google Places（補助）",
  unknown: "未指定",
};

const OFFICIAL_LABEL: Record<string, string> = {
  registered_ranked: "社格あり",
  registered_religious_corp: "宗教法人登録",
  unregistered: "非登録",
  unknown: "不明",
};
