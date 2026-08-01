"use client";

import { useEffect, useRef } from "react";
import type { Segment } from "@/lib/types";
import { formatTime } from "@/lib/types";

type Props = {
  src: string;
  activeSegment: Segment | null;
  playbackRate: number;
  mirrored: boolean;
  onDuration: (duration: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onMirroredChange: (mirrored: boolean) => void;
  onClearActive: () => void;
};

const RATES = [0.25, 0.5, 1];

export default function VideoPanel({
  src,
  activeSegment,
  playbackRate,
  mirrored,
  onDuration,
  onPlaybackRateChange,
  onMirroredChange,
  onClearActive,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // rAF ループから最新の区間を参照するための ref（再購読なしで値だけ差し替える）
  const segmentRef = useRef<Segment | null>(activeSegment);
  segmentRef.current = activeSegment;

  // 再生速度は state の変化に追従させる
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate, src]);

  // 区間が選ばれたら、その頭に飛んで再生を始める
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSegment) return;
    video.currentTime = activeSegment.start;
    video.playbackRate = playbackRate;
    void video.play().catch(() => {
      /* ユーザー操作前の自動再生ブロックは無視してよい */
    });
    // playbackRate は上の effect が面倒を見るので、依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSegment?.index, activeSegment?.start, src]);

  // timeupdate は 4回/秒 程度しか発火しないので、ループ判定は rAF で回す
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const video = videoRef.current;
      const segment = segmentRef.current;
      if (video && segment && !video.paused && video.currentTime >= segment.end - 0.02) {
        video.currentTime = segment.start;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          muted
          loop={!activeSegment}
          className="max-h-[60vh] w-full"
          style={{ transform: mirrored ? "scaleX(-1)" : undefined }}
          onLoadedMetadata={(e) => onDuration(e.currentTarget.duration)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
          <span className="px-2 text-xs text-white/50">速度</span>
          {RATES.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => onPlaybackRateChange(rate)}
              className={[
                "rounded-lg px-3 py-1 text-sm transition",
                playbackRate === rate ? "bg-sky-500 text-white" : "text-white/70 hover:bg-white/10",
              ].join(" ")}
            >
              {rate}x
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onMirroredChange(!mirrored)}
          className={[
            "rounded-xl border px-3 py-2 text-sm transition",
            mirrored
              ? "border-sky-400 bg-sky-500/20 text-sky-200"
              : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10",
          ].join(" ")}
        >
          左右反転（鏡像）{mirrored ? "：ON" : "：OFF"}
        </button>

        {activeSegment ? (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span className="rounded-lg bg-sky-500/20 px-2 py-1 text-sky-200">
              区間 {activeSegment.index + 1} をループ中（
              {formatTime(activeSegment.start)}〜{formatTime(activeSegment.end)}）
            </span>
            <button
              type="button"
              onClick={onClearActive}
              className="underline underline-offset-2 hover:text-white"
            >
              解除
            </button>
          </div>
        ) : (
          <span className="text-sm text-white/40">区間をクリックするとループ再生します</span>
        )}
      </div>
    </div>
  );
}
