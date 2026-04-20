"use client";
/**
 * 神社掲載申請フォーム（クライアント）。
 *
 * - 「Google で住所から緯度経度を拾う」までは現状実装せず、
 *   任意入力 + 手動検索補助（Google マップへのリンク）でお願いする。
 * - 送信に成功したら受付番号とお礼画面に遷移。
 * - ハニーポット (company フィールド) で bot 投稿を弾く。
 */
import { useMemo, useState } from "react";
import { PREFECTURES } from "@/lib/prefectures";
import { getClientId } from "@/lib/client-id";

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; id: number }
  | { kind: "error"; message: string };

const SHRINE_TYPES: string[] = [
  "神社",
  "神宮",
  "大社",
  "八幡",
  "稲荷",
  "天満宮",
  "八坂",
  "諏訪",
  "その他",
];

const ROLES: string[] = ["宮司", "禰宜", "権禰宜", "総代", "氏子", "崇敬会", "ご近所の愛好家", "その他"];

export default function SubmitShrineForm() {
  const [form, setForm] = useState({
    name: "",
    name_kana: "",
    prefecture: "",
    city: "",
    address: "",
    lat: "",
    lng: "",
    deity: "",
    shrine_type: "神社",
    website: "",
    photo_url: "",
    contact_name: "",
    contact_role: "宮司",
    contact_email: "",
    contact_phone: "",
    evidence_url: "",
    note: "",
    company: "", // honeypot — 見せない
  });
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  const googleMapUrl = useMemo(() => {
    const q =
      [form.prefecture, form.city, form.address, form.name].filter(Boolean).join(" ").trim();
    if (!q) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }, [form.prefecture, form.city, form.address, form.name]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind === "submitting") return;
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/submit-shrine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, client_id: getClientId() }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: number; error?: string };
      if (!res.ok) {
        setState({ kind: "error", message: body.error || "申請に失敗しました" });
        return;
      }
      setState({ kind: "success", id: body.id ?? 0 });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message || "通信に失敗しました" });
    }
  }

  if (state.kind === "success") {
    return (
      <div className="rounded-lg border border-vermilion/30 bg-white p-6 text-sm">
        <p className="mb-2 text-lg font-semibold text-vermilion-deep">申請を受け付けました</p>
        <p className="text-sumi/80">
          受付番号:{" "}
          <span className="rounded bg-washi px-2 py-0.5 font-mono text-sumi">#{state.id}</span>
        </p>
        <p className="mt-3 text-sumi/80">
          編集部で内容を確認のうえ、通常 3〜7 営業日以内にご登録のメールアドレスへご連絡いたします。
          追加情報が必要な場合は、いただいた連絡先へお尋ねすることがあります。
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="/" className="rounded border border-border bg-washi px-3 py-1.5 text-xs hover:bg-kinari">
            トップに戻る
          </a>
          <a
            href="/submit-shrine"
            className="rounded border border-border bg-washi px-3 py-1.5 text-xs hover:bg-kinari"
            onClick={(e) => {
              e.preventDefault();
              setState({ kind: "idle" });
              setForm((f) => ({
                ...f,
                name: "",
                name_kana: "",
                address: "",
                lat: "",
                lng: "",
                deity: "",
                note: "",
              }));
            }}
          >
            別の神社を申請する
          </a>
        </div>
      </div>
    );
  }

  const submitting = state.kind === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 神社の情報 */}
      <fieldset className="space-y-4 rounded-lg border border-border bg-white p-4">
        <legend className="px-2 text-sm font-semibold text-sumi">■ 神社の情報</legend>

        <Field label="神社名" required>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="例) 眞名井神社"
            className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
          />
        </Field>

        <Field label="よみがな (ひらがな)">
          <input
            type="text"
            value={form.name_kana}
            onChange={(e) => update("name_kana", e.target.value)}
            placeholder="例) まないじんじゃ"
            className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="都道府県">
            <select
              value={form.prefecture}
              onChange={(e) => update("prefecture", e.target.value)}
              className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
            >
              <option value="">選択してください</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="市区町村">
            <input
              type="text"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="例) 宮津市"
              className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <Field label="住所">
          <input
            type="text"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="例) 京都府宮津市中野"
            className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="緯度 (lat)" hint="日本の範囲: 20〜46">
            <input
              type="number"
              step="any"
              value={form.lat}
              onChange={(e) => update("lat", e.target.value)}
              placeholder="例) 35.57"
              className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
            />
          </Field>
          <Field label="経度 (lng)" hint="日本の範囲: 122〜154">
            <input
              type="number"
              step="any"
              value={form.lng}
              onChange={(e) => update("lng", e.target.value)}
              placeholder="例) 135.20"
              className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
            />
          </Field>
        </div>
        {googleMapUrl ? (
          <p className="text-[11px] text-sumi/60">
            👉{" "}
            <a
              href={googleMapUrl}
              target="_blank"
              rel="noreferrer"
              className="text-vermilion-deep underline"
            >
              Google マップで住所を確認
            </a>
            （該当ピンを右クリックすると緯度経度をコピーできます）
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="神社の形式">
            <select
              value={form.shrine_type}
              onChange={(e) => update("shrine_type", e.target.value)}
              className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
            >
              {SHRINE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="主な御祭神">
            <input
              type="text"
              value={form.deity}
              onChange={(e) => update("deity", e.target.value)}
              placeholder="例) 豊受大神"
              className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <Field label="公式サイト URL">
          <input
            type="url"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
            placeholder="https://..."
            className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
          />
        </Field>

        <Field label="代表的な写真の URL" hint="本殿・鳥居・境内の写真など。ご自身で撮影された写真 or 掲載許可のある写真をお願いします。">
          <input
            type="url"
            value={form.photo_url}
            onChange={(e) => update("photo_url", e.target.value)}
            placeholder="https://..."
            className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
          />
        </Field>
      </fieldset>

      {/* 連絡先 */}
      <fieldset className="space-y-4 rounded-lg border border-border bg-white p-4">
        <legend className="px-2 text-sm font-semibold text-sumi">■ ご連絡先</legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="ご担当者名" required>
            <input
              required
              type="text"
              value={form.contact_name}
              onChange={(e) => update("contact_name", e.target.value)}
              placeholder="山田太郎"
              className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
            />
          </Field>

          <Field label="立場">
            <select
              value={form.contact_role}
              onChange={(e) => update("contact_role", e.target.value)}
              className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="メールアドレス" required>
            <input
              required
              type="email"
              value={form.contact_email}
              onChange={(e) => update("contact_email", e.target.value)}
              placeholder="example@example.com"
              className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
            />
          </Field>
          <Field label="電話番号（任意）">
            <input
              type="tel"
              value={form.contact_phone}
              onChange={(e) => update("contact_phone", e.target.value)}
              placeholder="075-xxx-xxxx"
              className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
            />
          </Field>
        </div>
      </fieldset>

      {/* 補足 */}
      <fieldset className="space-y-4 rounded-lg border border-border bg-white p-4">
        <legend className="px-2 text-sm font-semibold text-sumi">■ 補足</legend>

        <Field
          label="証憑資料の URL（任意）"
          hint="宗教法人番号、登記情報サイト、神社庁ページなど、神社の実在が確認できるページ URL をいただけると審査が早まります。"
        >
          <input
            type="url"
            value={form.evidence_url}
            onChange={(e) => update("evidence_url", e.target.value)}
            placeholder="https://..."
            className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
          />
        </Field>

        <Field label="メッセージ / 補足情報（任意）">
          <textarea
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
            placeholder="ご由緒、特色、期間限定の授与品、季節の見どころなどを自由にご記入ください。"
            rows={5}
            className="w-full rounded border border-border bg-washi px-3 py-2 text-sm"
          />
        </Field>

        {/* ハニーポット: スクリーンリーダーからも隠し、CSSだけに依存しない */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
          className="hidden"
          style={{ position: "absolute", left: "-9999px" }}
        />
      </fieldset>

      {state.kind === "error" ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <a href="/" className="text-xs text-sumi/60 hover:underline">
          キャンセル
        </a>
        <button
          type="submit"
          disabled={submitting}
          className={
            "rounded-md px-6 py-2.5 text-sm font-semibold text-white shadow transition " +
            (submitting
              ? "bg-sumi/40"
              : "bg-vermilion-deep hover:bg-vermilion")
          }
        >
          {submitting ? "送信中…" : "申請を送信する"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-sumi/80">
        {label}
        {required ? <span className="ml-1 text-vermilion-deep">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-sumi/60">{hint}</span> : null}
    </label>
  );
}
