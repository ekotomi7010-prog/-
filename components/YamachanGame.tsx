"use client";

import { useEffect, useRef, useState } from "react";
// ゲーム本体は素の JS。素の HTML 版とまったく同じコードを使い回している
import { createGame, W, H } from "@/lib/yamachan/core.js";

const PAD_TEXT: Record<string, [string, string]> = {
  playing: ["押しっぱなしで上昇", "離すと落下します"],
  boss: ["押しっぱなしで上昇", "離すと落下します"],
  ency: ["タップでもどる", "キャラクター図鑑"],
  gameover: ["タップでもう一度", "荏田高校からやり直し"],
  win: ["タップでもう一度", "荏田高校からやり直し"],
};

export default function YamachanGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState("title");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = createGame(canvas, { controls: padRef.current });
    const id = window.setInterval(() => setMode(game.getMode()), 120);
    return () => {
      window.clearInterval(id);
      game.destroy();
    };
  }, []);

  const [label, hint] = PAD_TEXT[mode] ?? [
    "タップしてスタート",
    "ここを押している間ずっと上昇します",
  ];

  return (
    <div className="flex flex-col items-center gap-2 px-3 py-5">
      <h1 className="text-base font-bold tracking-wide sm:text-xl">山ちゃんが飛ぶ!!</h1>
      <p className="text-[10px] text-gray-500 sm:text-xs">荏田高等学校 → 町田のファミマ</p>

      <div className="flex w-full max-w-4xl flex-col gap-2">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="h-auto w-full touch-none select-none rounded-xl border border-gray-700"
        />
        {/* 親指で画面を隠さないための操作バー */}
        <div
          ref={padRef}
          role="button"
          tabIndex={0}
          aria-label="上昇"
          className="flex min-h-[152px] cursor-pointer touch-none select-none flex-col items-center
                     justify-center gap-1 rounded-xl border border-gray-600
                     bg-gradient-to-b from-slate-700 to-slate-900 font-bold tracking-wide
                     text-gray-100 active:from-amber-400 active:to-amber-500 active:text-gray-900
                     sm:min-h-[92px]"
        >
          <span className="text-lg">{label}</span>
          <span className="text-[11px] font-medium text-gray-400">{hint}</span>
        </div>
      </div>

      <p className="max-w-xl text-center text-[11px] leading-relaxed text-gray-500 sm:text-xs">
        <b className="text-gray-300">下のバーを押しっぱなし</b>で上昇、離すと落下。
        画面を直接タップしてもOK（Space・↑キーでも可）。CDを拾ってフックに投げ返せ。
      </p>
    </div>
  );
}
