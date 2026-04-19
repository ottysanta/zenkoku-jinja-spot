"use client";
import { useState, useTransition } from "react";
import { api } from "@/lib/api";

/**
 * 手動 sync トリガボタン。
 * ソースごとに必要な引数が違うため、簡易パラメータ入力 UI を展開する。
 *  - osm: bbox
 *  - wikidata: limit/offset
 *  - mlit/gsi/jinjacho: file_path
 *  - google_places: query/lat/lng/radius
 *  - bunka/manual: 引数なし（trigger は空）
 */
export default function SyncTriggerButton({ sourceType }: { sourceType: string }) {
  const [open, setOpen] = useState(false);
  const [params, setParams] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const fields = fieldsFor(sourceType);

  const submit = () => {
    setMsg(null);
    const body: Record<string, unknown> = {};
    if (params.bbox) {
      const parts = params.bbox.split(",").map(Number);
      if (parts.length === 4 && parts.every(Number.isFinite)) {
        body.bbox = parts;
      }
    }
    if (params.file_path) body.file_path = params.file_path;
    if (params.query) body.query = params.query;
    if (params.lat) body.lat = Number(params.lat);
    if (params.lng) body.lng = Number(params.lng);
    if (params.radius_m) body.radius_m = Number(params.radius_m);
    if (params.limit) body.limit = Number(params.limit);

    startTransition(async () => {
      try {
        const res = await api.triggerSync(sourceType, body);
        setMsg(`queued: import #${res.source_import_id}`);
        setOpen(false);
      } catch (e) {
        setMsg(`failed: ${(e as Error).message}`);
      }
    });
  };

  if (!open) {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={() => setOpen(true)}
          className="rounded border border-vermilion bg-vermilion px-2 py-1 text-[10px] text-white hover:bg-vermilion-deep"
        >
          再取得
        </button>
        {msg ? <div className="text-[10px] text-sumi/60">{msg}</div> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {fields.map((f) => (
        <input
          key={f.name}
          placeholder={f.placeholder}
          className="w-40 rounded border border-border px-1 py-0.5 text-[10px]"
          value={params[f.name] ?? ""}
          onChange={(e) => setParams({ ...params, [f.name]: e.target.value })}
        />
      ))}
      <div className="flex gap-1">
        <button
          disabled={pending}
          onClick={submit}
          className="rounded bg-moss px-2 py-0.5 text-[10px] text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "..." : "実行"}
        </button>
        <button
          onClick={() => { setOpen(false); setMsg(null); }}
          className="rounded border border-border px-2 py-0.5 text-[10px]"
        >
          キャンセル
        </button>
      </div>
      {msg ? <div className="text-[10px] text-vermilion">{msg}</div> : null}
    </div>
  );
}

type Field = { name: string; placeholder: string };

function fieldsFor(src: string): Field[] {
  switch (src) {
    case "osm":
      return [{ name: "bbox", placeholder: "S,W,N,E 例: 35.5,139.5,35.8,139.9" }];
    case "wikidata":
      return [{ name: "limit", placeholder: "limit (例: 500)" }];
    case "mlit":
    case "gsi":
    case "jinjacho":
      return [{ name: "file_path", placeholder: "shrine_data/raw/xxx.geojson" }];
    case "google_places":
      return [
        { name: "query", placeholder: "query (例: 神社)" },
        { name: "lat", placeholder: "lat" },
        { name: "lng", placeholder: "lng" },
        { name: "radius_m", placeholder: "radius_m (例: 3000)" },
      ];
    default:
      return [];
  }
}
