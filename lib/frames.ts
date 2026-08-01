"use client";

import type { Segment } from "./types";

/** サムネイルの最大横幅（px）。大きすぎるとAPIに送るデータが重くなる */
const MAX_WIDTH = 480;
const JPEG_QUALITY = 0.72;

/** video 要素を指定時刻までシークして、seeked イベントを待つ */
function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`シークがタイムアウトしました (${time.toFixed(2)}s)`));
    }, 10000);

    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("動画のシークに失敗しました"));
    };
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };

    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = time;
  });
}

/** 動画ファイルを読み込んだ、オフスクリーンの video 要素を作る */
function loadVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";

    const onReady = () => {
      cleanup();
      resolve(video);
    };
    const onError = () => {
      cleanup();
      reject(new Error("動画を読み込めませんでした（対応していない形式かもしれません）"));
    };
    const cleanup = () => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("error", onError);
    };

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("error", onError);
  });
}

/**
 * 各区間の代表フレーム（開始・中間・終了の3枚）を canvas で JPEG 化して返す。
 * ffmpeg は使わず、ブラウザ内で完結させる。
 */
export async function extractSegmentFrames(
  videoUrl: string,
  segments: Segment[],
  onProgress?: (done: number, total: number) => void,
): Promise<string[][]> {
  const video = await loadVideo(videoUrl);
  const duration = video.duration;

  const scale = Math.min(1, MAX_WIDTH / (video.videoWidth || MAX_WIDTH));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round((video.videoWidth || MAX_WIDTH) * scale);
  canvas.height = Math.round((video.videoHeight || 270) * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas を初期化できませんでした");

  const total = segments.length * 3;
  let done = 0;
  const result: string[][] = [];

  try {
    for (const segment of segments) {
      const mid = (segment.start + segment.end) / 2;
      // 最終フレームちょうどはシークに失敗しやすいので、わずかに手前を狙う
      const last = Math.max(segment.start, Math.min(segment.end, duration) - 0.05);
      const times = [segment.start, mid, last];

      const frames: string[] = [];
      for (const time of times) {
        await seek(video, Math.max(0, Math.min(time, duration - 0.01)));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
        done += 1;
        onProgress?.(done, total);
      }
      result.push(frames);
    }
  } finally {
    video.removeAttribute("src");
    video.load();
  }

  return result;
}
