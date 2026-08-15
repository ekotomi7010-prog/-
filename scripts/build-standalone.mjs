// lib/yamachan/*.js をそのまま 1 枚の HTML に固めて artifact/yamachan-game.html を作る。
// 友達に配るのはこの 1 ファイルだけで済むようにするためのもの。
// 使い方: node scripts/build-standalone.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

// 出力名は引数で変えられる。古いファイルと取り違えないよう版名を入れて配る用。
// --artifact を付けると、Artifact 公開用に doctype/html/head/body を外した形で出す。
const args = process.argv.slice(2);
const forArtifact = args.includes("--artifact");
const outName = args.find((a) => !a.startsWith("--")) || "artifact/yamachan-game.html";
const VERSION = "第2版 ステージ制";

// import / export 文を落として、素の <script> に流し込める形にする
function strip(src) {
  return src
    .replace(/^\s*import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, "")
    .replace(/^\s*export\s+(?=(const|function|let|var|class)\b)/gm, "")
    .replace(/^\s*export\s*\{[\s\S]*?\};?\s*$/gm, "")
    .trim();
}

const bundle = [
  "/* ── art.js ── */", strip(read("lib/yamachan/art.js")),
  "/* ── stages.js ── */", strip(read("lib/yamachan/stages.js")),
  "/* ── core.js ── */", strip(read("lib/yamachan/core.js")),
].join("\n\n");

const head = forArtifact ? "" : `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
`;
const openBody = forArtifact ? "" : "</head>\n<body>";
const closeBody = forArtifact ? "" : "</body>\n</html>";

const html = `${head}<title>山ちゃんが飛ぶ!!</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100svh;
    padding: 18px 14px calc(24px + env(safe-area-inset-bottom));
    background: radial-gradient(120% 90% at 50% 0%, #1d2333 0%, #0b0d13 70%);
    color: #e8eaf0;
    font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium",
                 "Yu Gothic", "Noto Sans JP", Meiryo, sans-serif;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    overscroll-behavior: none;
  }
  h1 { font-size: 19px; font-weight: 800; margin: 0; letter-spacing: .04em; text-align: center; }
  .ver {
    font-size: 11px; font-weight: 600; letter-spacing: .04em;
    color: #12141a; background: #f5c542;
    padding: 3px 8px; border-radius: 999px; margin-left: 8px;
    vertical-align: 3px; display: inline-block;
  }
  .sub { font-size: 11.5px; color: #8b93a3; margin: 0; letter-spacing: .06em; text-align: center; }
  .stage { width: 100%; max-width: 900px; display: flex; flex-direction: column; gap: 10px; }
  canvas {
    width: 100%; height: auto; display: block;
    border-radius: 12px;
    border: 1px solid #333a4a;
    box-shadow: 0 18px 46px rgba(0,0,0,.55);
    touch-action: none; user-select: none;
  }

  /* 親指で画面を隠さないための操作バー */
  .pad {
    width: 100%;
    min-height: 92px;
    border-radius: 14px;
    border: 1px solid #3d4657;
    background: linear-gradient(180deg, #2b3346 0%, #1b2130 100%);
    color: #e8eaf0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4px;
    font-weight: 800; font-size: 17px; letter-spacing: .05em;
    touch-action: none; user-select: none; -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
    transition: background .06s, transform .06s;
  }
  .pad small { font-weight: 500; font-size: 11.5px; color: #98a1b3; letter-spacing: .02em; }
  .pad:active {
    background: linear-gradient(180deg, #f5c542 0%, #d9a92c 100%);
    color: #17181d; transform: translateY(1px);
  }
  .pad:active small { color: #4a3d10; }

  .help {
    font-size: 12px; color: #8b93a3; margin: 2px 0 0; text-align: center; line-height: 1.7;
  }
  .help b { color: #cfd5e0; font-weight: 600; }

  .fsbtn {
    appearance: none; border: 1px solid #4a5568;
    background: linear-gradient(180deg, #f5c542 0%, #e0ac26 100%);
    color: #17181d; font-weight: 800; font-size: 15px; letter-spacing: .04em;
    padding: 12px 26px; border-radius: 999px; cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .fsbtn:active { transform: translateY(1px); }

  /* ── 全画面（横向き）モード ───────────────────────────── */
  .wrap.fs {
    position: fixed; inset: 0; z-index: 9999;
    background: #000;
    display: flex; align-items: center; justify-content: center;
    padding: 0; margin: 0;
  }
  .wrap.fs .stage { width: 100%; height: 100%; align-items: center; justify-content: center; }
  .wrap.fs canvas {
    width: auto; height: auto;
    max-width: 100%; max-height: 100%;
    aspect-ratio: 900 / 506;
    border-radius: 0; border: none; box-shadow: none;
  }
  .wrap.fs .pad { display: none; }

  /* 全画面時だけ出る左右のサムパッド */
  .fspad { display: none; }
  .wrap.fs .fspad {
    display: flex; align-items: flex-end; justify-content: center;
    position: fixed; bottom: 0; height: 46%; width: 30%;
    padding-bottom: calc(10px + env(safe-area-inset-bottom));
    background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(245,197,66,.16) 100%);
    color: rgba(255,255,255,.72); font-size: 12px; font-weight: 700;
    letter-spacing: .06em; text-shadow: 0 1px 3px rgba(0,0,0,.8);
    touch-action: none; user-select: none; -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent; cursor: pointer;
  }
  .wrap.fs .fspad.left  { left: 0;  border-top-right-radius: 26px; }
  .wrap.fs .fspad.right { right: 0; border-top-left-radius: 26px; }
  .wrap.fs .fspad:active {
    background: linear-gradient(180deg, rgba(245,197,66,.10) 0%, rgba(245,197,66,.50) 100%);
    color: #fff;
  }

  .exitfs { display: none; }
  .wrap.fs .exitfs {
    /* 回転案内より上に置く。縦のままでも全画面を抜けられるようにするため */
    display: block; position: fixed; z-index: 3;
    top: calc(8px + env(safe-area-inset-top)); right: calc(10px + env(safe-area-inset-right));
    width: 38px; height: 38px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,.3); background: rgba(0,0,0,.45);
    color: #fff; font-size: 19px; line-height: 1; cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  /* 全画面なのに縦向きのときの案内 */
  .rotate { display: none; }
  .wrap.fs .rotate {
    position: fixed; inset: 0; z-index: 2;
    background: rgba(6,8,12,.94);
    color: #e8eaf0; font-size: 17px; font-weight: 700; letter-spacing: .05em;
    display: none; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  }
  .wrap.fs.portrait .rotate { display: flex; }
  .rotate .ico { font-size: 46px; animation: tilt 1.6s ease-in-out infinite; }
  @keyframes tilt { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(90deg); } }
  @media (prefers-reduced-motion: reduce) { .rotate .ico { animation: none; } }
  .rotate small { font-weight: 500; font-size: 12.5px; color: #98a1b3; }

  /* スマホ縦向き：ゲームを上、操作バーを下に大きく取る */
  @media (max-width: 720px) {
    body { padding: 12px 10px calc(16px + env(safe-area-inset-bottom)); gap: 8px; }
    h1 { font-size: 16px; }
    .ver { font-size: 10px; padding: 2px 7px; }
    .sub, .help { font-size: 10.5px; }
    .pad { min-height: 152px; font-size: 19px; }
  }
  @media (max-width: 720px) and (orientation: landscape) {
    .pad { min-height: 76px; font-size: 16px; }
  }
</style>
${openBody}
  <h1>山ちゃんが飛ぶ!! <span class="ver">${VERSION}</span></h1>
  <p class="sub">荏田高等学校 → コープ → たまプラーザ → 南町田 → 境川 → 町田</p>
  <div class="wrap" id="wrap">
    <div class="stage">
      <canvas id="game"></canvas>
    </div>
    <div class="pad" id="pad" role="button" tabindex="0" aria-label="上昇">
      <span id="padLabel">タップしてスタート</span>
      <small id="padHint">ここを押している間ずっと上昇します</small>
    </div>
    <div class="fspad left"  id="padL" role="button" aria-label="上昇">押しっぱなし</div>
    <div class="fspad right" id="padR" role="button" aria-label="上昇">押しっぱなし</div>
    <button class="exitfs" id="exitFs" aria-label="全画面をやめる">✕</button>
    <div class="rotate" id="rotate">
      <span class="ico">📱</span>
      スマホを横にしてください
      <small>横向きにすると画面いっぱいで遊べます</small>
    </div>
  </div>

  <button class="fsbtn" id="fsBtn">⛶ フルスクリーンで遊ぶ（横画面）</button>

  <p class="help">
    <b>下のバーを押しっぱなし</b>で上昇、離すと落下。画面を直接タップしてもOK（Space / ↑ でも可）。<br>
    CDを拾ってフックに投げ返せ。
  </p>

<script>
(function () {
"use strict";

${bundle}

var pad = document.getElementById("pad");
var padL = document.getElementById("padL");
var padR = document.getElementById("padR");
var game = createGame(document.getElementById("game"), { controls: [pad, padL, padR] });

/* ── 全画面（横画面）まわり ──────────────────────────────
   iPhone の Safari は要素の全画面 API に対応していないので、
   その場合は CSS で画面いっぱいに広げる方式に自動で切り替える。 */
var wrap = document.getElementById("wrap");
var fsBtn = document.getElementById("fsBtn");
var exitFsBtn = document.getElementById("exitFs");

function isPortrait() {
  return window.matchMedia("(orientation: portrait)").matches;
}
function syncPortrait() {
  wrap.classList.toggle("portrait", wrap.classList.contains("fs") && isPortrait());
}

function enterFs() {
  var el = wrap;
  var req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (req) {
    try {
      var r = req.call(el, { navigationUI: "hide" });
      if (r && r.catch) r.catch(function () {});
    } catch (e) { /* 使えなければ CSS 方式で続行 */ }
  }
  if (screen.orientation && screen.orientation.lock) {
    try {
      var p = screen.orientation.lock("landscape");
      if (p && p.catch) p.catch(function () {});
    } catch (e) { /* iOS などは回転ロック不可。案内を出して対応 */ }
  }
  wrap.classList.add("fs");
  syncPortrait();
}

function exitFs() {
  var ex = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
  if (ex && (document.fullscreenElement || document.webkitFullscreenElement)) {
    try {
      var r = ex.call(document);
      if (r && r.catch) r.catch(function () {});
    } catch (e) {}
  }
  if (screen.orientation && screen.orientation.unlock) {
    try { screen.orientation.unlock(); } catch (e) {}
  }
  wrap.classList.remove("fs", "portrait");
}

fsBtn.addEventListener("click", enterFs);
exitFsBtn.addEventListener("click", exitFs);

// ブラウザ側の操作で全画面が解除されたときに表示を戻す
["fullscreenchange", "webkitfullscreenchange"].forEach(function (ev) {
  document.addEventListener(ev, function () {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      wrap.classList.remove("fs", "portrait");
    }
  });
});
window.addEventListener("orientationchange", function () { setTimeout(syncPortrait, 120); });
window.addEventListener("resize", syncPortrait);
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") wrap.classList.remove("fs", "portrait");
});

// 操作バーの文言を今の画面に合わせて出し分ける
var padLabel = document.getElementById("padLabel");
var padHint = document.getElementById("padHint");
var lastMode = null;
setInterval(function () {
  var m = game.getMode();
  if (m === lastMode) return;
  lastMode = m;
  if (m === "playing" || m === "boss") {
    padLabel.textContent = "押しっぱなしで上昇";
    padHint.textContent = "離すと落下します";
  } else if (m === "ency") {
    padLabel.textContent = "タップでもどる";
    padHint.textContent = "キャラクター図鑑";
  } else if (m === "gameover" || m === "win") {
    padLabel.textContent = "タップでもう一度";
    padHint.textContent = "荏田高校からやり直し";
  } else {
    padLabel.textContent = "タップしてスタート";
    padHint.textContent = "ここを押している間ずっと上昇します";
  }
}, 120);
})();
</script>
${closeBody}
`;

writeFileSync(join(root, outName), html);
console.log("built " + outName);
