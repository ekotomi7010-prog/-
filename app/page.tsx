"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import SegmentCard from "@/components/SegmentCard";
import VideoPanel from "@/components/VideoPanel";
import { extractSegmentFrames } from "@/lib/frames";
import { buildSegments, type Segment } from "@/lib/types";

const DEFAULT_INTERVAL = 2;

export default function Home() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [duration, setDuration] = useState(0);

  // 入力中の値と、実際に適用されている値を分けておく
  const [intervalInput, setIntervalInput] = useState(String(DEFAULT_INTERVAL));
  const [interval, setInterval] = useState(DEFAULT_INTERVAL);

  const [segments, setSegments] = useState<Segment[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [mirrored, setMirrored] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);

  const urlRef = useRef<string | null>(null);
  // 非同期処理の途中で最新の区間一覧を参照するための ref
  const segmentsRef = useRef<Segment[]>(segments);
  segmentsRef.current = segments;

  const handleFile = useCallback((file: File) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;

    setVideoUrl(url);
    setFileName(file.name);
    setDuration(0);
    setSegments([]);
    setActiveIndex(null);
    setError(null);
  }, []);

  // ページを離れるときに object URL を解放する
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  // 動画の長さが分かったら（＝区切り間隔が変わったら）区間を作り直してフレームを抽出する
  useEffect(() => {
    if (!videoUrl || duration <= 0) return;

    let cancelled = false;
    const next = buildSegments(duration, interval);

    setSegments(next);
    setActiveIndex(null);
    setExtracting(true);
    setProgress({ done: 0, total: next.length * 3 });
    setError(null);

    extractSegmentFrames(videoUrl, next, (done, total) => {
      if (!cancelled) setProgress({ done, total });
    })
      .then((frames) => {
        if (cancelled) return;
        setSegments(next.map((segment, i) => ({ ...segment, frames: frames[i] ?? [] })));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "フレームの抽出に失敗しました。");
      })
      .finally(() => {
        if (!cancelled) setExtracting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [videoUrl, duration, interval]);

  const generate = useCallback(
    async (index: number) => {
      const target = segmentsRef.current.find((s) => s.index === index);
      if (!target || target.frames.length === 0) return;

      setSegments((prev) =>
        prev.map((s) => (s.index === index ? { ...s, status: "loading", error: undefined } : s)),
      );

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: target.frames,
            label: `区間 ${index + 1}`,
            startTime: target.start,
            endTime: target.end,
          }),
        });
        const data = (await response.json()) as { description?: string; error?: string };
        if (!response.ok) throw new Error(data.error ?? `生成に失敗しました (${response.status})`);

        setSegments((prev) =>
          prev.map((s) =>
            s.index === index ? { ...s, status: "done", description: data.description } : s,
          ),
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : "生成に失敗しました。";
        setSegments((prev) =>
          prev.map((s) => (s.index === index ? { ...s, status: "error", error: message } : s)),
        );
      }
    },
    [],
  );

  // 生成できた区間から順に表示されるよう、先頭から1区間ずつ処理する
  const generateAll = useCallback(async () => {
    setGeneratingAll(true);
    try {
      for (const segment of segments) {
        if (segment.status === "done") continue;
        await generate(segment.index);
      }
    } finally {
      setGeneratingAll(false);
    }
  }, [segments, generate]);

  const applyInterval = () => {
    const value = Number(intervalInput);
    if (!Number.isFinite(value) || value < 0.5 || value > 30) {
      setError("区切り間隔は 0.5 〜 30 秒で指定してください。");
      return;
    }
    setError(null);
    setInterval(value);
  };

  const activeSegment = activeIndex === null ? null : (segments[activeIndex] ?? null);
  const busy = extracting || generatingAll;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">ダンス練習アプリ</h1>
        <p className="mt-1 text-sm text-white/50">
          動画を一定間隔で区切り、区間ごとに動きの解説を生成します（フェーズ0 / MVP）
        </p>
      </header>

      {!videoUrl && <Dropzone onFile={handleFile} />}

      {videoUrl && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="truncate text-sm text-white/60">{fileName}</p>
            <button
              type="button"
              onClick={() => {
                if (urlRef.current) URL.revokeObjectURL(urlRef.current);
                urlRef.current = null;
                setVideoUrl(null);
                setSegments([]);
                setDuration(0);
              }}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10"
            >
              別の動画を読み込む
            </button>
          </div>

          <VideoPanel
            src={videoUrl}
            activeSegment={activeSegment}
            playbackRate={playbackRate}
            mirrored={mirrored}
            onDuration={setDuration}
            onPlaybackRateChange={setPlaybackRate}
            onMirroredChange={setMirrored}
            onClearActive={() => setActiveIndex(null)}
          />

          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <label className="text-sm">
              <span className="mb-1 block text-white/60">区切り間隔（秒）</span>
              <input
                type="number"
                min={0.5}
                max={30}
                step={0.5}
                value={intervalInput}
                onChange={(e) => setIntervalInput(e.target.value)}
                className="w-28 rounded-lg border border-white/15 bg-black/40 px-3 py-2 outline-none focus:border-sky-400"
              />
            </label>
            <button
              type="button"
              onClick={applyInterval}
              disabled={busy}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-40"
            >
              この間隔で区切り直す
            </button>
            <button
              type="button"
              onClick={generateAll}
              disabled={busy || segments.length === 0 || segments[0].frames.length === 0}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400 disabled:opacity-40"
            >
              {generatingAll ? "解説を生成中…" : "全区間の解説を生成"}
            </button>
            {duration > 0 && (
              <span className="text-xs text-white/40">
                長さ {duration.toFixed(1)} 秒 / {segments.length} 区間
              </span>
            )}
          </div>

          {extracting && (
            <p className="text-sm text-white/50">
              フレームを抽出中… {progress.done} / {progress.total}
            </p>
          )}
          {error && <p className="text-sm text-rose-400">{error}</p>}

          <div className="space-y-3">
            {segments.map((segment) => (
              <SegmentCard
                key={segment.index}
                segment={segment}
                active={activeIndex === segment.index}
                onSelect={() => setActiveIndex(segment.index)}
                onGenerate={() => void generate(segment.index)}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
