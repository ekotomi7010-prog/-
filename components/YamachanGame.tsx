"use client";

import { useEffect, useRef } from "react";
// ゲーム本体は素の JS。素の HTML 版とまったく同じコードを使い回している
import { createGame, W, H } from "@/lib/yamachan/core.js";

export default function YamachanGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = createGame(canvas);
    return () => game.destroy();
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8">
      <h1 className="text-xl font-bold tracking-wide">山ちゃんが飛ぶ!!</h1>
      <p className="text-xs text-gray-500">荏田高等学校 → 町田のファミマ</p>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-4xl h-auto touch-none select-none rounded-lg border border-gray-700"
      />
      <p className="text-xs text-gray-500">
        押しっぱなし / タップ長押し / Space・↑キーで上昇。離すと落下します。
      </p>
    </div>
  );
}
