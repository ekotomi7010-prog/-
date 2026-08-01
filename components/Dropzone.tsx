"use client";

import { useRef, useState } from "react";

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

export default function Dropzone({ onFile, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setMessage("動画ファイル（mp4 など）を選んでください。");
      return;
    }
    setMessage(null);
    onFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (disabled) return;
          accept(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition",
          dragging
            ? "border-sky-400 bg-sky-400/10"
            : "border-white/15 bg-white/[0.03] hover:border-white/30",
          disabled ? "pointer-events-none opacity-50" : "",
        ].join(" ")}
      >
        <p className="text-lg font-medium">動画をドラッグ＆ドロップ</p>
        <p className="text-sm text-white/50">またはクリックしてファイルを選択（mp4 / 10秒程度）</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0] ?? undefined)}
      />

      {message && <p className="mt-2 text-sm text-rose-400">{message}</p>}
    </div>
  );
}
