"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const padRef = useRef<HTMLDivElement | null>(null);
  const padLRef = useRef<HTMLDivElement | null>(null);
  const padRRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState("title");
  const [fs, setFs] = useState(false);
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = createGame(canvas, {
      controls: [padRef.current, padLRef.current, padRRef.current],
    });
    const id = window.setInterval(() => setMode(game.getMode()), 120);
    return () => {
      window.clearInterval(id);
      game.destroy();
    };
  }, []);

  // 全画面が外部要因で解除されたときに表示を戻す
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setFs(false);
    };
    const onResize = () =>
      setPortrait(window.matchMedia("(orientation: portrait)").matches);
    onResize();
    document.addEventListener("fullscreenchange", onFsChange);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  // iPhone の Safari は要素の全画面 API 非対応。その場合は CSS で画面いっぱいにする
  const enterFs = useCallback(async () => {
    const el = wrapRef.current;
    if (!el) return;
    try {
      await el.requestFullscreen?.({ navigationUI: "hide" });
    } catch {
      /* 使えなくても CSS 方式で続行 */
    }
    try {
      await (
        screen.orientation as ScreenOrientation & {
          lock?: (o: string) => Promise<void>;
        }
      )?.lock?.("landscape");
    } catch {
      /* iOS などは回転ロック不可。案内を出して対応 */
    }
    setFs(true);
  }, []);

  const exitFs = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* すでに解除済みなら何もしない */
    }
    try {
      screen.orientation?.unlock?.();
    } catch {
      /* 非対応環境は無視 */
    }
    setFs(false);
  }, []);

  const [label, hint] = PAD_TEXT[mode] ?? [
    "タップしてスタート",
    "ここを押している間ずっと上昇します",
  ];

  const thumbPad =
    "hidden touch-none select-none cursor-pointer fixed bottom-0 h-[46%] w-[30%] " +
    "items-end justify-center pb-4 text-xs font-bold tracking-wider text-white/70 " +
    "[text-shadow:0_1px_3px_rgba(0,0,0,.8)] active:text-white " +
    "bg-gradient-to-b from-transparent to-amber-400/20 active:to-amber-400/50";

  return (
    <div className="flex flex-col items-center gap-2 px-3 py-5">
      {!fs && (
        <>
          <h1 className="text-base font-bold tracking-wide sm:text-xl">山ちゃんが飛ぶ!!</h1>
          <p className="text-[10px] text-gray-500 sm:text-xs">荏田高等学校 → 町田のファミマ</p>
        </>
      )}

      <div
        ref={wrapRef}
        className={
          fs
            ? "fixed inset-0 z-[9999] flex items-center justify-center bg-black"
            : "flex w-full max-w-4xl flex-col gap-2"
        }
      >
        <div className={fs ? "flex h-full w-full items-center justify-center" : ""}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className={
              fs
                ? "aspect-[900/506] h-auto max-h-full w-auto max-w-full touch-none select-none"
                : "h-auto w-full touch-none select-none rounded-xl border border-gray-700"
            }
          />
        </div>

        {/* 通常時の操作バー */}
        <div
          ref={padRef}
          role="button"
          tabIndex={0}
          aria-label="上昇"
          className={
            (fs ? "hidden " : "flex ") +
            "min-h-[152px] cursor-pointer touch-none select-none flex-col items-center " +
            "justify-center gap-1 rounded-xl border border-gray-600 bg-gradient-to-b " +
            "from-slate-700 to-slate-900 font-bold tracking-wide text-gray-100 " +
            "active:from-amber-400 active:to-amber-500 active:text-gray-900 sm:min-h-[92px]"
          }
        >
          <span className="text-lg">{label}</span>
          <span className="text-[11px] font-medium text-gray-400">{hint}</span>
        </div>

        {/* 全画面時の左右サムパッド */}
        <div
          ref={padLRef}
          role="button"
          aria-label="上昇"
          className={thumbPad + (fs ? " !flex left-0 rounded-tr-3xl" : "")}
        >
          押しっぱなし
        </div>
        <div
          ref={padRRef}
          role="button"
          aria-label="上昇"
          className={thumbPad + (fs ? " !flex right-0 rounded-tl-3xl" : "")}
        >
          押しっぱなし
        </div>

        {fs && (
          <button
            onClick={exitFs}
            aria-label="全画面をやめる"
            className="fixed right-3 top-3 z-[3] h-10 w-10 rounded-full border border-white/30
                       bg-black/45 text-lg leading-none text-white"
          >
            ✕
          </button>
        )}

        {fs && portrait && (
          <div className="fixed inset-0 z-[2] flex flex-col items-center justify-center gap-3
                          bg-[#06080c]/95 text-center font-bold tracking-wide text-gray-100">
            <span className="text-5xl">📱</span>
            スマホを横にしてください
            <small className="text-xs font-medium text-gray-400">
              横向きにすると画面いっぱいで遊べます
            </small>
          </div>
        )}
      </div>

      {!fs && (
        <>
          <button
            onClick={enterFs}
            className="rounded-full border border-slate-600 bg-gradient-to-b from-amber-400
                       to-amber-500 px-6 py-3 text-sm font-extrabold tracking-wide text-gray-900"
          >
            ⛶ フルスクリーンで遊ぶ（横画面）
          </button>
          <p className="max-w-xl text-center text-[11px] leading-relaxed text-gray-500 sm:text-xs">
            <b className="text-gray-300">下のバーを押しっぱなし</b>で上昇、離すと落下。
            画面を直接タップしてもOK（Space・↑キーでも可）。CDを拾ってフックに投げ返せ。
          </p>
        </>
      )}
    </div>
  );
}
