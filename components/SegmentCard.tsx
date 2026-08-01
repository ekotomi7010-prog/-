"use client";

import type { Segment } from "@/lib/types";
import { formatTime } from "@/lib/types";

type Props = {
  segment: Segment;
  active: boolean;
  onSelect: () => void;
  onGenerate: () => void;
};

const LABELS = ["開始", "中間", "終了"];

export default function SegmentCard({ segment, active, onSelect, onGenerate }: Props) {
  return (
    <div
      className={[
        "rounded-2xl border p-4 transition",
        active ? "border-sky-400 bg-sky-400/10" : "border-white/10 bg-white/[0.03]",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* サムネイル：クリックでその区間だけループ再生 */}
        <button
          type="button"
          onClick={onSelect}
          className="shrink-0 text-left"
          title="クリックでこの区間をループ再生"
        >
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-sm font-semibold">区間 {segment.index + 1}</span>
            <span className="text-xs text-white/45">
              {formatTime(segment.start)} 〜 {formatTime(segment.end)}
            </span>
          </div>
          <div className="flex gap-1.5">
            {segment.frames.length > 0 ? (
              segment.frames.map((frame, i) => (
                <figure key={i} className="w-24 sm:w-28">
                  {/* 抽出済みの data URL を表示するだけなので next/image は使わない */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frame}
                    alt={`区間${segment.index + 1}の${LABELS[i] ?? i + 1}フレーム`}
                    className="aspect-video w-full rounded-lg border border-white/10 object-cover"
                  />
                  <figcaption className="mt-1 text-center text-[10px] text-white/40">
                    {LABELS[i] ?? `${i + 1}枚目`}
                  </figcaption>
                </figure>
              ))
            ) : (
              <div className="flex h-16 w-full items-center justify-center rounded-lg border border-dashed border-white/10 px-6 text-xs text-white/35">
                フレーム抽出待ち
              </div>
            )}
          </div>
        </button>

        {/* 解説エリア */}
        <div className="min-w-0 flex-1">
          {segment.status === "done" && segment.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">
              {segment.description}
            </p>
          ) : segment.status === "loading" ? (
            <p className="text-sm text-white/50">解説を生成中…</p>
          ) : segment.status === "error" ? (
            <div className="space-y-2">
              <p className="text-sm text-rose-400">{segment.error}</p>
              <button
                type="button"
                onClick={onGenerate}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10"
              >
                再試行
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onGenerate}
              disabled={segment.frames.length === 0}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs transition hover:bg-white/10 disabled:opacity-40"
            >
              この区間の解説を生成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
