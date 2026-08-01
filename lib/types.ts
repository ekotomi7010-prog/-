export type SegmentStatus = "idle" | "loading" | "done" | "error";

export type Segment = {
  /** 0 始まりの区間番号 */
  index: number;
  /** 区間の開始秒 */
  start: number;
  /** 区間の終了秒 */
  end: number;
  /** 開始・中間・終了の代表フレーム（data URL 形式の JPEG） */
  frames: string[];
  /** Claude が生成した解説（日本語） */
  description?: string;
  status: SegmentStatus;
  error?: string;
};

/** 動画の長さと区切り間隔から、区間の配列を作る */
export function buildSegments(duration: number, interval: number): Segment[] {
  const segments: Segment[] = [];
  const count = Math.max(1, Math.ceil(duration / interval));

  for (let i = 0; i < count; i++) {
    const start = i * interval;
    const end = Math.min(duration, start + interval);
    // 端数が極端に短い（0.2秒未満）区間は作らない
    if (end - start < 0.2 && segments.length > 0) break;
    segments.push({ index: i, start, end, frames: [], status: "idle" });
  }

  return segments;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}
