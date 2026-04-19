"use client";
/**
 * 距離のヒストグラム付き 2つまみレンジスライダー（Comfy 参考 / Phase B-2 完全版）。
 *
 * - 入力: allPoints (全神社 lat/lng) + userCoords (現在地)
 * - 距離バケツ: 1km, 3km, 5km, 10km, 30km, 60km, 100km, ∞
 * - UI: ヒストグラムバー + 2つの range input を重ねて描画
 * - 親に onChange(min, max) で km 範囲を通知
 */
import { useMemo, useState, useEffect, useCallback } from "react";
import { haversineM } from "@/lib/geo";

export type DistanceFilterValue = {
  minKm: number;
  maxKm: number;
};

type LitePoint = { id: number; name: string; lat: number; lng: number };

type Props = {
  allPoints: LitePoint[];
  userCoords: { lat: number; lng: number } | null;
  value: DistanceFilterValue;
  onChange: (v: DistanceFilterValue) => void;
};

/** バケツ上端 (km)。上限は ∞ 扱い。 */
const BUCKETS = [1, 3, 5, 10, 30, 60, 100, 300, 1000];

export default function DistanceHistogramFilter({
  allPoints,
  userCoords,
  value,
  onChange,
}: Props) {
  // バケツごとの件数
  const histogram = useMemo(() => {
    if (!userCoords) return BUCKETS.map(() => 0);
    const bins = BUCKETS.map(() => 0);
    for (const p of allPoints) {
      const d = haversineM(userCoords.lat, userCoords.lng, p.lat, p.lng) / 1000;
      for (let i = 0; i < BUCKETS.length; i++) {
        if (d <= BUCKETS[i]) {
          bins[i]++;
          break;
        }
      }
    }
    return bins;
  }, [allPoints, userCoords]);

  const maxBin = Math.max(1, ...histogram);
  const minIdx = Math.max(
    0,
    BUCKETS.findIndex((b) => b >= value.minKm),
  );
  const maxIdx = Math.max(
    0,
    BUCKETS.findIndex((b) => b >= value.maxKm),
  );

  const [localMin, setLocalMin] = useState(minIdx);
  const [localMax, setLocalMax] = useState(
    maxIdx >= 0 ? maxIdx : BUCKETS.length - 1,
  );

  // 親の value が変わった時（解除など）に同期
  useEffect(() => {
    setLocalMin(minIdx);
    setLocalMax(maxIdx >= 0 ? maxIdx : BUCKETS.length - 1);
  }, [minIdx, maxIdx]);

  const commit = useCallback(
    (lo: number, hi: number) => {
      const a = Math.min(lo, hi);
      const b = Math.max(lo, hi);
      const minKm = a === 0 ? 0 : BUCKETS[a - 1];
      const maxKm = BUCKETS[b];
      onChange({ minKm, maxKm });
    },
    [onChange],
  );

  const fmt = (km: number) => {
    if (km === 0) return "0";
    if (km >= 1000) return "∞";
    if (km < 1) return `${km}km`;
    return `${km}km`;
  };

  return (
    <div className="rounded-md border border-border bg-washi/95 p-3 text-xs shadow">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-semibold text-vermilion-deep">
          現在地からの距離で絞り込み
        </h3>
        <button
          type="button"
          onClick={() => commit(0, BUCKETS.length - 1)}
          className="text-[10px] text-sumi/60 underline hover:text-sumi"
        >
          全解除
        </button>
      </div>
      {!userCoords ? (
        <p className="text-sumi/60">
          現在地を許可するとヒストグラムが表示されます。
        </p>
      ) : (
        <>
          {/* ヒストグラム */}
          <div className="mt-1 flex h-12 items-end gap-[1px]">
            {histogram.map((n, i) => {
              const h = Math.round((n / maxBin) * 100);
              const inRange = i >= Math.min(localMin, localMax) && i <= Math.max(localMin, localMax);
              return (
                <div
                  key={i}
                  className="flex-1"
                  title={`≤ ${fmt(BUCKETS[i])} : ${n} 社`}
                >
                  <div
                    style={{ height: `${Math.max(3, h)}%` }}
                    className={
                      "rounded-t-sm transition-colors " +
                      (inRange ? "bg-vermilion" : "bg-vermilion/25")
                    }
                  />
                </div>
              );
            })}
          </div>
          {/* ラベル */}
          <div className="mt-0.5 flex gap-[1px] text-[9px] text-sumi/55">
            {BUCKETS.map((k, i) => (
              <span key={i} className="flex-1 text-center">
                {fmt(k)}
              </span>
            ))}
          </div>

          {/* つまみ */}
          <div className="relative mt-3 h-5">
            {/* 背景トラック */}
            <span className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded bg-sumi/15" />
            {/* 選択範囲 */}
            <span
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-vermilion"
              style={{
                left: `${(Math.min(localMin, localMax) / (BUCKETS.length - 1)) * 100}%`,
                right: `${100 - (Math.max(localMin, localMax) / (BUCKETS.length - 1)) * 100}%`,
              }}
            />
            <input
              type="range"
              min={0}
              max={BUCKETS.length - 1}
              step={1}
              value={localMin}
              onChange={(e) => setLocalMin(Number(e.target.value))}
              onMouseUp={() => commit(localMin, localMax)}
              onTouchEnd={() => commit(localMin, localMax)}
              className="pointer-events-auto absolute inset-x-0 top-0 h-5 w-full appearance-none bg-transparent"
              aria-label="下限"
            />
            <input
              type="range"
              min={0}
              max={BUCKETS.length - 1}
              step={1}
              value={localMax}
              onChange={(e) => setLocalMax(Number(e.target.value))}
              onMouseUp={() => commit(localMin, localMax)}
              onTouchEnd={() => commit(localMin, localMax)}
              className="pointer-events-auto absolute inset-x-0 top-0 h-5 w-full appearance-none bg-transparent"
              aria-label="上限"
            />
          </div>
          <p className="mt-2 text-[11px] text-sumi/70">
            <b className="text-vermilion-deep">
              {fmt(
                Math.min(localMin, localMax) === 0
                  ? 0
                  : BUCKETS[Math.min(localMin, localMax) - 1],
              )}{" "}
              〜 {fmt(BUCKETS[Math.max(localMin, localMax)])}
            </b>{" "}
            の範囲
          </p>
          <style>
            {`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 14px; height: 14px; border-radius: 50%;
                background: #cf5242; border: 2px solid #fff;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2); cursor: pointer;
              }
              input[type="range"]::-moz-range-thumb {
                width: 14px; height: 14px; border-radius: 50%;
                background: #cf5242; border: 2px solid #fff;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2); cursor: pointer;
              }
              input[type="range"]::-webkit-slider-runnable-track { background: transparent; }
              input[type="range"]::-moz-range-track { background: transparent; }
            `}
          </style>
        </>
      )}
    </div>
  );
}
