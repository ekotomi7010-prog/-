// lib/yamachan/*.js をそのまま 1 枚の HTML に固めて artifact/yamachan-game.html を作る。
// 友達に配るのはこの 1 ファイルだけで済むようにするためのもの。
// 使い方: node scripts/build-standalone.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

// 出力名は引数で変えられる。古いファイルと取り違えないよう版名を入れて配る用。
const outName = process.argv[2] || "artifact/yamachan-game.html";
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

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>山ちゃんが飛ぶ!!</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100svh;
    padding: 22px 14px 34px;
    background: radial-gradient(120% 90% at 50% 0%, #1d2333 0%, #0b0d13 70%);
    color: #e8eaf0;
    font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium",
                 "Yu Gothic", "Noto Sans JP", Meiryo, sans-serif;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  h1 { font-size: 19px; font-weight: 800; margin: 0; letter-spacing: .04em; }
  .ver {
    font-size: 11px; font-weight: 600; letter-spacing: .04em;
    color: #12141a; background: #f5c542;
    padding: 3px 8px; border-radius: 999px; margin-left: 8px;
    vertical-align: 3px;
  }
  .sub { font-size: 11.5px; color: #8b93a3; margin: 0; letter-spacing: .06em; }
  canvas {
    width: 100%; max-width: 900px; height: auto; display: block;
    border-radius: 12px;
    border: 1px solid #333a4a;
    box-shadow: 0 18px 46px rgba(0,0,0,.55);
    touch-action: none; user-select: none;
  }
  .help {
    font-size: 12px; color: #8b93a3; margin: 2px 0 0; text-align: center; line-height: 1.7;
  }
  .help b { color: #cfd5e0; font-weight: 600; }
</style>
</head>
<body>
  <h1>山ちゃんが飛ぶ!! <span class="ver">${VERSION}</span></h1>
  <p class="sub">荏田高等学校 → コープ → たまプラーザ → 南町田 → 境川 → 町田</p>
  <canvas id="game"></canvas>
  <p class="help">
    <b>押しっぱなし</b>（タップ長押し / Space / ↑）で上昇、離すと落下。<br>
    CDを拾ってフックに投げ返せ。このファイル1つで動くので、そのまま友達に送れます。
  </p>

<script>
(function () {
"use strict";

${bundle}

createGame(document.getElementById("game"));
})();
</script>
</body>
</html>
`;

writeFileSync(join(root, outName), html);
console.log("built " + outName);
