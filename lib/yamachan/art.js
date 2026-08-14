// 「山ちゃんが飛ぶ!!」の絵まわり。
// キャラクターは「頭の中心が原点・足元が y=185 前後」の共通座標で描く。
// ゲーム中は drawActor() が縮小と中心合わせをまとめて面倒を見る。

export const INK = "#1b1b1b";

/* ── 基本ヘルパー ─────────────────────────────────────────── */

export function ink(ctx, lw) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw === undefined ? 2.4 : lw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

export function fillInk(ctx, color, lw) {
  ctx.fillStyle = color;
  ctx.fill();
  ink(ctx, lw);
}

function rrect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  else { ctx.beginPath(); ctx.rect(x, y, w, h); }
}

function faceShape(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(-r, -2);
  ctx.bezierCurveTo(-r, -r * 1.2, r, -r * 1.2, r, -2);
  ctx.bezierCurveTo(r, r * 0.6, r * 0.5, r * 1.1, 0, r * 1.16);
  ctx.bezierCurveTo(-r * 0.5, r * 1.1, -r, r * 0.6, -r, -2);
  ctx.closePath();
}

function eye(ctx, x, y, w, h, look) {
  look = look || 0;
  ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#fff"; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + look, y + h * 0.08, w * 0.56, h * 0.72, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#2b2b2b"; ctx.fill();
  ctx.beginPath(); ctx.arc(x - w * 0.22 + look, y - h * 0.32, w * 0.24, 0, Math.PI * 2);
  ctx.fillStyle = "#fff"; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, Math.PI * 1.02, Math.PI * 1.98);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.stroke();
}

function eyeSmile(ctx, x, y, w) {
  ctx.beginPath(); ctx.arc(x, y + 4, w, Math.PI * 1.12, Math.PI * 1.88);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.stroke();
}

function eyeSharp(ctx, x, y, w, h, dir) {
  ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#fff"; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y, w * 0.5, h * 0.85, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#1f1f1f"; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - w * 1.15, y - h * (dir > 0 ? 1.1 : 0.5));
  ctx.lineTo(x + w * 1.15, y - h * (dir > 0 ? 0.5 : 1.1));
  ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.lineCap = "round"; ctx.stroke();
}

function brow(ctx, x, y, w, tilt, lw) {
  ctx.beginPath();
  ctx.moveTo(x - w, y + tilt);
  ctx.lineTo(x + w, y - tilt);
  ctx.strokeStyle = INK; ctx.lineWidth = lw || 3; ctx.lineCap = "round"; ctx.stroke();
}

function nose(ctx, x, y) {
  ctx.beginPath();
  ctx.moveTo(x - 2, y); ctx.lineTo(x + 1.5, y + 3);
  ctx.strokeStyle = "#a9755a"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke();
}

function mouthGrin(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x, y + h * 2.1, x + w, y);
  ctx.quadraticCurveTo(x, y + h * 0.35, x - w, y);
  ctx.closePath();
  ctx.fillStyle = "#7d3a3a"; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - w * 0.82, y + h * 0.12);
  ctx.quadraticCurveTo(x, y + h * 0.55, x + w * 0.82, y + h * 0.12);
  ctx.lineTo(x + w * 0.82, y + h * 0.02);
  ctx.quadraticCurveTo(x, y + h * 0.3, x - w * 0.82, y + h * 0.02);
  ctx.closePath();
  ctx.fillStyle = "#fff"; ctx.fill();
}

function mouthSmile(ctx, x, y, w) {
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x, y + w * 0.9, x + w, y);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.stroke();
}

function mouthFlat(ctx, x, y, w) {
  ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x + w, y);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.stroke();
}

function blush(ctx, x, y) {
  ctx.strokeStyle = "rgba(226,110,110,0.85)"; ctx.lineWidth = 1.6; ctx.lineCap = "round";
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 4 - 3, y - 2);
    ctx.lineTo(x + i * 4 + 1, y + 4);
    ctx.stroke();
  }
}

function ear(ctx, x, y) {
  ctx.beginPath(); ctx.ellipse(x, y, 4, 6, 0, 0, Math.PI * 2);
  fillInk(ctx, "#f0c096", 2);
}

function hairShine(ctx, x, y, w, h, color) {
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, -0.35, 0, Math.PI * 2);
  ctx.fillStyle = color || "rgba(255,255,255,0.4)";
  ctx.fill();
}

/* 吹き出し。ゲーム中はキャラの頭上に出す */
export function speech(ctx, x, y, text, w, fontSize) {
  const fs = fontSize || 12;
  const h = fs * 2.2;
  w = w || 76;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2);
  ctx.lineTo(x + w / 2, y - h / 2);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.lineTo(x - w / 2 + 16, y + h / 2);
  ctx.lineTo(x - w / 2 + 6, y + h / 2 + 9);
  ctx.lineTo(x - w / 2 + 8, y + h / 2);
  ctx.lineTo(x - w / 2, y + h / 2);
  ctx.closePath();
  fillInk(ctx, "#fff", 2.2);
  ctx.fillStyle = INK;
  ctx.font = "bold " + fs + "px sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

/* ── キャラクター ─────────────────────────────────────────── */

export function drawYamachan(ctx, opts) {
  opts = opts || {};
  const SKIN = "#f7cba4", WHITE = "#fdfbf2", WSHADE = "#e6e0cd";
  ctx.beginPath();
  ctx.moveTo(-22, 96); ctx.lineTo(-24, 176); ctx.lineTo(-6, 176); ctx.lineTo(-3, 100);
  ctx.lineTo(3, 100); ctx.lineTo(6, 176); ctx.lineTo(24, 176); ctx.lineTo(22, 96);
  ctx.closePath(); fillInk(ctx, WHITE, 2.4);
  ctx.beginPath(); ctx.ellipse(-15, 182, 13, 8, 0, 0, Math.PI * 2); fillInk(ctx, "#efeade", 2.4);
  ctx.beginPath(); ctx.ellipse(15, 182, 13, 8, 0, 0, Math.PI * 2); fillInk(ctx, "#efeade", 2.4);
  // 燕尾
  ctx.beginPath();
  ctx.moveTo(-26, 60); ctx.quadraticCurveTo(-36, 100, -22, 126); ctx.lineTo(-10, 92); ctx.closePath();
  fillInk(ctx, WSHADE, 2.2);
  ctx.beginPath();
  ctx.moveTo(26, 60); ctx.quadraticCurveTo(36, 100, 22, 126); ctx.lineTo(10, 92); ctx.closePath();
  fillInk(ctx, WSHADE, 2.2);
  // 上着
  ctx.beginPath();
  ctx.moveTo(-30, 44); ctx.quadraticCurveTo(-34, 78, -28, 102);
  ctx.lineTo(28, 102); ctx.quadraticCurveTo(34, 78, 30, 44);
  ctx.quadraticCurveTo(0, 32, -30, 44); ctx.closePath();
  fillInk(ctx, WHITE, 2.6);
  // 白ベスト
  ctx.beginPath();
  ctx.moveTo(-13, 44); ctx.lineTo(0, 96); ctx.lineTo(13, 44); ctx.quadraticCurveTo(0, 38, -13, 44);
  ctx.closePath(); fillInk(ctx, "#f4efdd", 2);
  // ラペル
  ctx.beginPath();
  ctx.moveTo(-4, 36); ctx.lineTo(-26, 50); ctx.lineTo(-12, 82); ctx.lineTo(-2, 48); ctx.closePath();
  fillInk(ctx, "#f0ead6", 2.2);
  ctx.beginPath();
  ctx.moveTo(4, 36); ctx.lineTo(26, 50); ctx.lineTo(12, 82); ctx.lineTo(2, 48); ctx.closePath();
  fillInk(ctx, "#f0ead6", 2.2);
  // アスコットタイ
  ctx.beginPath();
  ctx.moveTo(-9, 38); ctx.quadraticCurveTo(0, 56, 9, 38); ctx.quadraticCurveTo(0, 33, -9, 38);
  ctx.closePath(); fillInk(ctx, "#ffffff", 2.2);
  // ブートニア（白百合）
  ctx.save(); ctx.translate(-21, 56);
  [[0, -5], [5, -1], [3, 5], [-3, 5], [-5, -1]].forEach((p) => {
    ctx.beginPath();
    ctx.ellipse(p[0], p[1], 3.4, 4.6, Math.atan2(p[1], p[0]) + Math.PI / 2, 0, Math.PI * 2);
    fillInk(ctx, "#ffffff", 1.6);
  });
  ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, Math.PI * 2); fillInk(ctx, "#f2d14e", 1.4);
  ctx.restore();
  // 腕
  const armUp = opts.thrust ? -26 : 0;
  ctx.beginPath();
  ctx.moveTo(-28, 50); ctx.quadraticCurveTo(-48, 62 + armUp, -46, 88 + armUp * 1.6);
  ctx.strokeStyle = INK; ctx.lineWidth = 15; ctx.lineCap = "round"; ctx.stroke();
  ctx.strokeStyle = WHITE; ctx.lineWidth = 11; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(28, 50); ctx.quadraticCurveTo(50, 44, 52, 20);
  ctx.strokeStyle = INK; ctx.lineWidth = 15; ctx.stroke();
  ctx.strokeStyle = WHITE; ctx.lineWidth = 11; ctx.stroke();
  ctx.beginPath(); ctx.arc(-46, 92 + armUp * 1.6, 7, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.beginPath(); ctx.arc(53, 14, 7.5, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.beginPath(); ctx.rect(-8, 24, 16, 16); fillInk(ctx, "#e8b892", 2.2);
  ear(ctx, -30, 4); ear(ctx, 30, 4);
  faceShape(ctx, 30); fillInk(ctx, SKIN, 2.6);
  // 黒髪
  ctx.beginPath();
  ctx.moveTo(-31, 2);
  ctx.bezierCurveTo(-34, -30, -14, -40, 2, -38);
  ctx.bezierCurveTo(22, -37, 33, -24, 31, 2);
  ctx.lineTo(24, -4);
  ctx.bezierCurveTo(20, -16, 4, -20, -6, -12);
  ctx.bezierCurveTo(-12, -7, -18, -6, -24, -10);
  ctx.lineTo(-31, 2); ctx.closePath();
  fillInk(ctx, "#1f1f1f", 2.4);
  hairShine(ctx, 8, -26, 12, 4, "rgba(255,255,255,0.32)");
  if (opts.hurt) {
    ctx.beginPath(); ctx.moveTo(-18, -8); ctx.lineTo(-6, 4); ctx.moveTo(-6, -8); ctx.lineTo(-18, 4);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -8); ctx.lineTo(18, 4); ctx.moveTo(18, -8); ctx.lineTo(6, 4);
    ctx.stroke();
  } else {
    eyeSmile(ctx, -12, -2, 8);
    eyeSmile(ctx, 12, -2, 8);
    brow(ctx, -12, -14, 8, -1.5, 2.6);
    brow(ctx, 12, -14, 8, 1.5, 2.6);
  }
  nose(ctx, 0, 6);
  mouthGrin(ctx, 0, 12, 12, 7);
  blush(ctx, -21, 8); blush(ctx, 21, 8);
}

export function drawHook(ctx, opts) {
  opts = opts || {};
  const SKIN = "#f2c49b", SUIT = opts.enraged ? "#3a2030" : "#23262f";
  const SUIT2 = opts.enraged ? "#4a2a3c" : "#2f3340";
  ctx.beginPath();
  ctx.moveTo(-22, 98); ctx.lineTo(-24, 176); ctx.lineTo(-6, 176); ctx.lineTo(-3, 102);
  ctx.lineTo(3, 102); ctx.lineTo(6, 176); ctx.lineTo(24, 176); ctx.lineTo(22, 98);
  ctx.closePath(); fillInk(ctx, SUIT, 2.4);
  ctx.beginPath(); ctx.ellipse(-15, 182, 13, 8, 0, 0, Math.PI * 2); fillInk(ctx, "#15171c", 2.4);
  ctx.beginPath(); ctx.ellipse(15, 182, 13, 8, 0, 0, Math.PI * 2); fillInk(ctx, "#15171c", 2.4);
  ctx.beginPath();
  ctx.moveTo(-31, 44); ctx.quadraticCurveTo(-35, 80, -29, 106);
  ctx.lineTo(29, 106); ctx.quadraticCurveTo(35, 80, 31, 44);
  ctx.quadraticCurveTo(0, 32, -31, 44); ctx.closePath();
  fillInk(ctx, SUIT, 2.6);
  ctx.beginPath();
  ctx.moveTo(-12, 40); ctx.lineTo(0, 92); ctx.lineTo(12, 40); ctx.quadraticCurveTo(0, 35, -12, 40);
  ctx.closePath(); fillInk(ctx, "#f4f4f2", 2.2);
  ctx.beginPath();
  ctx.moveTo(-5, 40); ctx.lineTo(5, 40); ctx.lineTo(4, 86); ctx.lineTo(0, 94); ctx.lineTo(-4, 86);
  ctx.closePath(); fillInk(ctx, "#8f95a1", 2.2);
  ctx.beginPath();
  ctx.moveTo(-4, 34); ctx.lineTo(-27, 50); ctx.lineTo(-13, 84); ctx.lineTo(-2, 46); ctx.closePath();
  fillInk(ctx, SUIT2, 2.2);
  ctx.beginPath();
  ctx.moveTo(4, 34); ctx.lineTo(27, 50); ctx.lineTo(13, 84); ctx.lineTo(2, 46); ctx.closePath();
  fillInk(ctx, SUIT2, 2.2);
  // ギター
  ctx.save(); ctx.translate(-44, 96); ctx.rotate(-0.42);
  ctx.beginPath(); ctx.ellipse(0, 0, 20, 25, 0, 0, Math.PI * 2); fillInk(ctx, "#8b4a28", 2.4);
  ctx.beginPath(); ctx.ellipse(0, -6, 6, 6, 0, 0, Math.PI * 2); fillInk(ctx, "#2a1810", 2);
  ctx.beginPath(); ctx.rect(-4, -66, 8, 44); fillInk(ctx, "#6b3a1e", 2.2);
  ctx.beginPath(); ctx.rect(-6, -76, 12, 12); fillInk(ctx, "#2a1810", 2.2);
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(-29, 50); ctx.quadraticCurveTo(-46, 66, -42, 92);
  ctx.strokeStyle = INK; ctx.lineWidth = 15; ctx.lineCap = "round"; ctx.stroke();
  ctx.strokeStyle = SUIT; ctx.lineWidth = 11; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(29, 50); ctx.quadraticCurveTo(46, 66, 40, 92);
  ctx.strokeStyle = INK; ctx.lineWidth = 15; ctx.stroke();
  ctx.strokeStyle = SUIT; ctx.lineWidth = 11; ctx.stroke();
  ctx.beginPath(); ctx.arc(-42, 96, 7, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.beginPath(); ctx.arc(40, 96, 7, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.beginPath(); ctx.rect(-8, 24, 16, 16); fillInk(ctx, "#e0ab84", 2.2);
  ear(ctx, -30, 4); ear(ctx, 30, 4);
  faceShape(ctx, 30); fillInk(ctx, SKIN, 2.6);
  ctx.beginPath();
  ctx.moveTo(-32, 8);
  ctx.bezierCurveTo(-38, -28, -16, -42, 2, -40);
  ctx.bezierCurveTo(24, -39, 34, -22, 32, 6);
  ctx.lineTo(26, -2);
  ctx.bezierCurveTo(24, -14, 16, -20, 6, -18);
  ctx.bezierCurveTo(-6, -16, -14, -4, -20, 6);
  ctx.bezierCurveTo(-24, 0, -28, 2, -32, 8);
  ctx.closePath(); fillInk(ctx, "#231a12", 2.4);
  ctx.beginPath();
  ctx.moveTo(-20, 6); ctx.bezierCurveTo(-26, 16, -28, 24, -26, 30);
  ctx.lineTo(-18, 22); ctx.bezierCurveTo(-16, 14, -16, 8, -14, 2);
  ctx.closePath(); fillInk(ctx, "#231a12", 2.2);
  hairShine(ctx, 10, -28, 11, 3.6, "rgba(255,255,255,0.22)");
  brow(ctx, -13, -14, 9, -4.5, 3.4);
  brow(ctx, 13, -14, 9, 4.5, 3.4);
  eyeSharp(ctx, -12, -1, 7, 5.5, 1);
  eyeSharp(ctx, 12, -1, 7, 5.5, -1);
  rrect(ctx, -23, -9, 22, 17, 3);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke();
  rrect(ctx, 1, -9, 22, 17, 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-1, -2); ctx.lineTo(1, -2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-23, -3); ctx.lineTo(-30, -1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(23, -3); ctx.lineTo(30, -1); ctx.stroke();
  nose(ctx, 0, 8);
  mouthFlat(ctx, 0, 16, 8);
  ctx.strokeStyle = "rgba(30,30,30,0.5)"; ctx.lineWidth = 2;
  [-52, -44, 44, 52].forEach((x) => {
    ctx.beginPath(); ctx.moveTo(x, -44); ctx.lineTo(x, -22); ctx.stroke();
  });
}

export function drawAoki(ctx) {
  const SKIN = "#f2c49b", VEST = "#7a6a4a", SHIRT = "#f2f0e6";
  ctx.beginPath();
  ctx.moveTo(-20, 98); ctx.lineTo(-22, 174); ctx.lineTo(-5, 174); ctx.lineTo(-2, 102);
  ctx.lineTo(2, 102); ctx.lineTo(5, 174); ctx.lineTo(22, 174); ctx.lineTo(20, 98);
  ctx.closePath(); fillInk(ctx, "#4a4438", 2.4);
  ctx.beginPath(); ctx.ellipse(-14, 180, 12, 7, 0, 0, Math.PI * 2); fillInk(ctx, "#2a2620", 2.4);
  ctx.beginPath(); ctx.ellipse(14, 180, 12, 7, 0, 0, Math.PI * 2); fillInk(ctx, "#2a2620", 2.4);
  ctx.beginPath();
  ctx.moveTo(-26, 44); ctx.quadraticCurveTo(-29, 76, -25, 102);
  ctx.lineTo(25, 102); ctx.quadraticCurveTo(29, 76, 26, 44);
  ctx.quadraticCurveTo(0, 33, -26, 44); ctx.closePath();
  fillInk(ctx, SHIRT, 2.6);
  ctx.beginPath();
  ctx.moveTo(-24, 52); ctx.quadraticCurveTo(-27, 78, -23, 100);
  ctx.lineTo(23, 100); ctx.quadraticCurveTo(27, 78, 24, 52);
  ctx.lineTo(12, 46); ctx.lineTo(0, 68); ctx.lineTo(-12, 46);
  ctx.closePath(); fillInk(ctx, VEST, 2.4);
  ctx.beginPath();
  ctx.moveTo(-4, 40); ctx.lineTo(4, 40); ctx.lineTo(3, 66); ctx.lineTo(0, 72); ctx.lineTo(-3, 66);
  ctx.closePath(); fillInk(ctx, "#a83f3f", 2.2);
  ctx.beginPath(); ctx.moveTo(-3, 36); ctx.lineTo(-14, 46); ctx.lineTo(-4, 48); ctx.closePath();
  fillInk(ctx, "#fff", 2);
  ctx.beginPath(); ctx.moveTo(3, 36); ctx.lineTo(14, 46); ctx.lineTo(4, 48); ctx.closePath();
  fillInk(ctx, "#fff", 2);
  ctx.beginPath(); ctx.moveTo(-25, 52); ctx.quadraticCurveTo(-44, 44, -48, 16);
  ctx.strokeStyle = INK; ctx.lineWidth = 14; ctx.lineCap = "round"; ctx.stroke();
  ctx.strokeStyle = VEST; ctx.lineWidth = 10; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(25, 52); ctx.quadraticCurveTo(42, 66, 38, 92);
  ctx.strokeStyle = INK; ctx.lineWidth = 14; ctx.stroke();
  ctx.strokeStyle = VEST; ctx.lineWidth = 10; ctx.stroke();
  ctx.beginPath(); ctx.arc(-49, 10, 7.5, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.beginPath(); ctx.arc(38, 96, 7, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.beginPath(); ctx.rect(-7, 24, 14, 16); fillInk(ctx, "#e0ab84", 2.2);
  ear(ctx, -28, 4); ear(ctx, 28, 4);
  ctx.save(); ctx.scale(0.94, 1.06);
  faceShape(ctx, 29); fillInk(ctx, SKIN, 2.6);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-29, 0);
  ctx.bezierCurveTo(-31, -26, -12, -36, 4, -34);
  ctx.bezierCurveTo(22, -32, 30, -20, 29, 0);
  ctx.lineTo(23, -6);
  ctx.bezierCurveTo(20, -18, 2, -22, -8, -14);
  ctx.lineTo(-29, 0); ctx.closePath();
  fillInk(ctx, "#2b2b2b", 2.4);
  hairShine(ctx, 8, -24, 10, 3.2, "rgba(255,255,255,0.28)");
  brow(ctx, -12, -15, 8, -5, 3.4);
  brow(ctx, 12, -15, 8, 5, 3.4);
  eye(ctx, -12, -2, 7, 6.5, 0);
  eye(ctx, 12, -2, 7, 6.5, 0);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(-12, -2, 10, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(12, -2, 10, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(2, -2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-22, -3); ctx.lineTo(-29, -1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(22, -3); ctx.lineTo(29, -1); ctx.stroke();
  nose(ctx, 0, 8);
  rrect(ctx, -6, 12, 12, 6, 2); fillInk(ctx, "#2b2b2b", 2);
  ctx.beginPath(); ctx.ellipse(0, 26, 9, 8, 0, 0, Math.PI * 2); fillInk(ctx, "#7d3a3a", 2.4);
  ctx.beginPath(); ctx.ellipse(0, 30, 4.5, 3, 0, 0, Math.PI * 2); ctx.fillStyle = "#c96a6a"; ctx.fill();
  ctx.strokeStyle = "#d33"; ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(24, -30); ctx.lineTo(34, -30); ctx.moveTo(29, -35); ctx.lineTo(29, -25);
  ctx.moveTo(26, -35); ctx.lineTo(32, -25); ctx.moveTo(32, -35); ctx.lineTo(26, -25);
  ctx.stroke();
}

export function drawEbi(ctx) {
  const SKIN = "#f7cba4", HAIR = "#e8c34a";
  ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-8, 96); ctx.lineTo(-12, 172); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, 96); ctx.lineTo(12, 172); ctx.stroke();
  ctx.strokeStyle = SKIN; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(-8, 96); ctx.lineTo(-12, 172); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, 96); ctx.lineTo(12, 172); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-13, 178, 10, 7, 0, 0, Math.PI * 2); fillInk(ctx, "#2c2c34", 2.2);
  ctx.beginPath(); ctx.ellipse(13, 178, 10, 7, 0, 0, Math.PI * 2); fillInk(ctx, "#2c2c34", 2.2);
  ctx.beginPath();
  ctx.moveTo(-19, 44); ctx.quadraticCurveTo(-16, 76, -21, 100);
  ctx.lineTo(21, 100); ctx.quadraticCurveTo(16, 76, 19, 44);
  ctx.quadraticCurveTo(0, 34, -19, 44); ctx.closePath();
  fillInk(ctx, "#e2789f", 2.6);
  ctx.beginPath(); ctx.moveTo(-20, 74); ctx.lineTo(20, 74);
  ctx.strokeStyle = "#c25c81"; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-19, 50); ctx.quadraticCurveTo(-38, 44, -44, 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(19, 50); ctx.quadraticCurveTo(38, 46, 45, 26); ctx.stroke();
  ctx.strokeStyle = SKIN; ctx.lineWidth = 6.5;
  ctx.beginPath(); ctx.moveTo(-19, 50); ctx.quadraticCurveTo(-38, 44, -44, 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(19, 50); ctx.quadraticCurveTo(38, 46, 45, 26); ctx.stroke();
  ctx.beginPath(); ctx.arc(-45, 18, 6, 0, Math.PI * 2); fillInk(ctx, SKIN, 2);
  ctx.beginPath(); ctx.arc(46, 22, 6, 0, Math.PI * 2); fillInk(ctx, SKIN, 2);
  ctx.strokeStyle = INK; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-45, 18); ctx.lineTo(-62, -14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(46, 22); ctx.lineTo(62, -10); ctx.stroke();
  ctx.strokeStyle = "#d8b47a"; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(-45, 18); ctx.lineTo(-62, -14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(46, 22); ctx.lineTo(62, -10); ctx.stroke();
  ctx.beginPath(); ctx.rect(-6, 24, 12, 14); fillInk(ctx, "#eec096", 2.2);
  faceShape(ctx, 29); fillInk(ctx, SKIN, 2.6);
  ctx.beginPath();
  ctx.moveTo(-30, -2); ctx.bezierCurveTo(-44, 24, -42, 64, -32, 86);
  ctx.lineTo(-18, 74); ctx.bezierCurveTo(-24, 44, -24, 18, -20, -2);
  ctx.closePath(); fillInk(ctx, "#d9b23f", 2.4);
  ctx.beginPath();
  ctx.moveTo(30, -2); ctx.bezierCurveTo(44, 24, 42, 64, 32, 86);
  ctx.lineTo(18, 74); ctx.bezierCurveTo(24, 44, 24, 18, 20, -2);
  ctx.closePath(); fillInk(ctx, "#d9b23f", 2.4);
  ctx.beginPath();
  ctx.moveTo(-31, 4);
  ctx.bezierCurveTo(-36, -30, -14, -42, 2, -40);
  ctx.bezierCurveTo(22, -38, 33, -22, 31, 4);
  ctx.lineTo(24, -2);
  ctx.bezierCurveTo(22, -16, 10, -22, 2, -18);
  ctx.bezierCurveTo(-8, -14, -12, -4, -16, 4);
  ctx.bezierCurveTo(-22, -2, -27, 0, -31, 4);
  ctx.closePath(); fillInk(ctx, HAIR, 2.4);
  hairShine(ctx, 6, -26, 13, 4, "rgba(255,255,255,0.5)");
  brow(ctx, -12, -14, 7, -1, 2.6);
  brow(ctx, 12, -14, 7, 1, 2.6);
  eye(ctx, -12, -1, 7.5, 8, 0);
  ctx.beginPath(); ctx.arc(12, 2, 8, Math.PI * 1.12, Math.PI * 1.88);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
  nose(ctx, 0, 8);
  mouthSmile(ctx, 0, 14, 7);
  blush(ctx, -21, 8); blush(ctx, 21, 8);
}

export function drawTakehiko(ctx) {
  const SKIN = "#f2c49b", TEE = "#6fa8dc";
  ctx.beginPath();
  ctx.moveTo(-20, 96); ctx.lineTo(-22, 174); ctx.lineTo(-5, 174); ctx.lineTo(-2, 100);
  ctx.lineTo(2, 100); ctx.lineTo(5, 174); ctx.lineTo(22, 174); ctx.lineTo(20, 96);
  ctx.closePath(); fillInk(ctx, "#3a4152", 2.4);
  ctx.beginPath(); ctx.ellipse(-14, 180, 12, 7, 0, 0, Math.PI * 2); fillInk(ctx, "#e8e4d8", 2.4);
  ctx.beginPath(); ctx.ellipse(14, 180, 12, 7, 0, 0, Math.PI * 2); fillInk(ctx, "#e8e4d8", 2.4);
  ctx.beginPath();
  ctx.moveTo(-28, 44); ctx.quadraticCurveTo(-31, 76, -26, 100);
  ctx.lineTo(26, 100); ctx.quadraticCurveTo(31, 76, 28, 44);
  ctx.quadraticCurveTo(0, 33, -28, 44); ctx.closePath();
  fillInk(ctx, TEE, 2.6);
  // ギター
  ctx.save(); ctx.translate(6, 84); ctx.rotate(-0.3);
  ctx.beginPath(); ctx.ellipse(0, 0, 22, 17, 0, 0, Math.PI * 2); fillInk(ctx, "#d9534f", 2.6);
  ctx.beginPath(); ctx.ellipse(2, -2, 5, 5, 0, 0, Math.PI * 2); fillInk(ctx, "#2a1810", 2);
  ctx.beginPath(); ctx.rect(-3, -70, 7, 54); fillInk(ctx, "#c9a06a", 2.4);
  ctx.beginPath(); ctx.rect(-5.5, -82, 11, 13); fillInk(ctx, "#2a1810", 2.2);
  ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 0.9;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(i * 1.4, -68); ctx.lineTo(i * 1.4, 6); ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 14; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-27, 52); ctx.quadraticCurveTo(-40, 70, -26, 82); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(27, 52); ctx.quadraticCurveTo(40, 74, 24, 90); ctx.stroke();
  ctx.strokeStyle = TEE; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(-27, 52); ctx.quadraticCurveTo(-40, 70, -26, 82); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(27, 52); ctx.quadraticCurveTo(40, 74, 24, 90); ctx.stroke();
  ctx.beginPath(); ctx.arc(-24, 84, 7, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.beginPath(); ctx.arc(22, 92, 7, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.beginPath(); ctx.rect(-7, 24, 14, 16); fillInk(ctx, "#e0ab84", 2.2);
  ear(ctx, -30, 4); ear(ctx, 30, 4);
  faceShape(ctx, 30); fillInk(ctx, SKIN, 2.6);
  ctx.beginPath();
  ctx.moveTo(-32, -2);
  ctx.bezierCurveTo(-42, -24, -22, -44, 0, -42);
  ctx.bezierCurveTo(24, -40, 40, -22, 32, -2);
  ctx.lineTo(26, -13); ctx.lineTo(20, -4); ctx.lineTo(14, -15); ctx.lineTo(8, -5);
  ctx.lineTo(2, -16); ctx.lineTo(-5, -5); ctx.lineTo(-12, -15); ctx.lineTo(-19, -4);
  ctx.lineTo(-25, -13); ctx.closePath();
  fillInk(ctx, "#2b2b2b", 2.4);
  [[-34, -14, -46, -26], [34, -14, 46, -26], [-16, -40, -22, -54], [16, -40, 22, -54]].forEach((s) => {
    ctx.beginPath(); ctx.moveTo(s[0], s[1]);
    ctx.quadraticCurveTo((s[0] + s[2]) / 2 - 4, (s[1] + s[3]) / 2, s[2], s[3]);
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.stroke();
    ctx.strokeStyle = "#2b2b2b"; ctx.lineWidth = 4; ctx.stroke();
  });
  hairShine(ctx, 8, -28, 11, 3.4, "rgba(255,255,255,0.26)");
  eyeSmile(ctx, -12, 3, 8);
  eyeSmile(ctx, 12, 3, 8);
  nose(ctx, 0, 10);
  mouthGrin(ctx, 0, 16, 10, 6);
}

export function drawHashidate(ctx, opts) {
  opts = opts || {};
  const SKIN = "#f2c49b", TEE = "#c98a4b";
  ctx.beginPath();
  ctx.moveTo(-22, 96); ctx.lineTo(-24, 132); ctx.lineTo(-6, 132); ctx.lineTo(-3, 100);
  ctx.lineTo(3, 100); ctx.lineTo(6, 132); ctx.lineTo(24, 132); ctx.lineTo(22, 96);
  ctx.closePath(); fillInk(ctx, "#4a5468", 2.4);
  ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-15, 130); ctx.lineTo(-16, 170); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(15, 130); ctx.lineTo(16, 170); ctx.stroke();
  ctx.strokeStyle = SKIN; ctx.lineWidth = 8.5;
  ctx.beginPath(); ctx.moveTo(-15, 130); ctx.lineTo(-16, 170); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(15, 130); ctx.lineTo(16, 170); ctx.stroke();
  // 未処理の左脚だけすね毛
  ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 1.4; ctx.lineCap = "round";
  for (let i = 0; i < 7; i++) {
    const yy = 138 + i * 4.5;
    ctx.beginPath(); ctx.moveTo(-19, yy); ctx.lineTo(-23, yy - 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, yy + 2); ctx.lineTo(-8, yy - 1); ctx.stroke();
  }
  ctx.beginPath(); ctx.ellipse(-16, 176, 11, 7, 0, 0, Math.PI * 2); fillInk(ctx, "#e8e4d8", 2.2);
  ctx.beginPath(); ctx.ellipse(16, 176, 11, 7, 0, 0, Math.PI * 2); fillInk(ctx, "#e8e4d8", 2.2);
  ctx.beginPath(); ctx.ellipse(16, 148, 2.4, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-32, 44); ctx.quadraticCurveTo(-40, 78, -30, 102);
  ctx.lineTo(30, 102); ctx.quadraticCurveTo(40, 78, 32, 44);
  ctx.quadraticCurveTo(0, 32, -32, 44); ctx.closePath();
  fillInk(ctx, TEE, 2.6);
  ctx.strokeStyle = INK; ctx.lineWidth = 15; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-30, 52); ctx.quadraticCurveTo(-48, 68, -44, 94); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(30, 52); ctx.quadraticCurveTo(50, 48, 52, 24); ctx.stroke();
  ctx.strokeStyle = TEE; ctx.lineWidth = 11;
  ctx.beginPath(); ctx.moveTo(-30, 52); ctx.quadraticCurveTo(-48, 68, -44, 94); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(30, 52); ctx.quadraticCurveTo(50, 48, 52, 24); ctx.stroke();
  ctx.beginPath(); ctx.arc(-44, 98, 7, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.beginPath(); ctx.arc(53, 18, 7.5, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.save(); ctx.translate(56, 6); ctx.rotate(0.3);
  ctx.beginPath(); ctx.rect(-6, -16, 12, 20); fillInk(ctx, "#4aa3c9", 2.2);
  ctx.beginPath(); ctx.rect(-7, -20, 14, 5); fillInk(ctx, "#dfe4ea", 2.2);
  ctx.restore();
  ctx.beginPath(); ctx.rect(-8, 24, 16, 16); fillInk(ctx, "#e0ab84", 2.2);
  ear(ctx, -31, 4); ear(ctx, 31, 4);
  faceShape(ctx, 31); fillInk(ctx, SKIN, 2.6);
  // パーマ
  ctx.beginPath();
  ctx.moveTo(-33, 6); ctx.bezierCurveTo(-38, -26, -18, -44, 0, -42);
  ctx.bezierCurveTo(20, -40, 38, -24, 33, 8);
  ctx.bezierCurveTo(20, -6, -20, -6, -33, 6);
  ctx.closePath(); fillInk(ctx, "#4a3218", 2.4);
  [[-28, -14], [-19, -28], [-6, -36], [8, -36], [21, -27], [29, -13], [-24, -2], [26, -2]].forEach((c) => {
    ctx.beginPath(); ctx.arc(c[0], c[1], 8.5, 0, Math.PI * 2);
    fillInk(ctx, "#4a3218", 2.2);
    ctx.beginPath(); ctx.arc(c[0] - 2.5, c[1] - 2.5, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fill();
  });
  brow(ctx, -13, -10, 8, -1, 2.8);
  brow(ctx, 13, -10, 8, 1, 2.8);
  eye(ctx, -13, 2, 7.5, 7.5, 1);
  eye(ctx, 13, 2, 7.5, 7.5, -1);
  nose(ctx, 0, 12);
  mouthGrin(ctx, 0, 18, 11, 7);
  blush(ctx, -22, 12); blush(ctx, 22, 12);
}

export function drawYoshino(ctx, opts) {
  opts = opts || {};
  const SKIN = "#f4d0b0";
  ctx.beginPath();
  ctx.moveTo(-20, 96); ctx.lineTo(-22, 174); ctx.lineTo(-5, 174); ctx.lineTo(-2, 100);
  ctx.lineTo(2, 100); ctx.lineTo(5, 174); ctx.lineTo(22, 174); ctx.lineTo(20, 96);
  ctx.closePath(); fillInk(ctx, "#3d434e", 2.4);
  ctx.beginPath(); ctx.ellipse(-14, 180, 12, 7, 0, 0, Math.PI * 2); fillInk(ctx, "#8a8f98", 2.4);
  ctx.beginPath(); ctx.ellipse(14, 180, 12, 7, 0, 0, Math.PI * 2); fillInk(ctx, "#8a8f98", 2.4);
  ctx.beginPath();
  ctx.moveTo(-27, 44); ctx.quadraticCurveTo(-30, 76, -26, 100);
  ctx.lineTo(26, 100); ctx.quadraticCurveTo(30, 76, 27, 44);
  ctx.quadraticCurveTo(0, 33, -27, 44); ctx.closePath();
  fillInk(ctx, "#9aa0aa", 2.6);
  ctx.strokeStyle = INK; ctx.lineWidth = 14; ctx.lineCap = "round"; ctx.lineJoin = "miter";
  ctx.beginPath(); ctx.moveTo(-26, 52); ctx.lineTo(-42, 62); ctx.lineTo(-40, 40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(26, 52); ctx.lineTo(42, 62); ctx.lineTo(40, 40); ctx.stroke();
  ctx.strokeStyle = "#9aa0aa"; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(-26, 52); ctx.lineTo(-42, 62); ctx.lineTo(-40, 40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(26, 52); ctx.lineTo(42, 62); ctx.lineTo(40, 40); ctx.stroke();
  ctx.beginPath(); ctx.arc(-40, 36, 6.5, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.beginPath(); ctx.arc(40, 36, 6.5, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.strokeStyle = INK; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-40, 36); ctx.lineTo(-52, 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40, 36); ctx.lineTo(52, 6); ctx.stroke();
  ctx.strokeStyle = "#d8b47a"; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(-40, 36); ctx.lineTo(-52, 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40, 36); ctx.lineTo(52, 6); ctx.stroke();
  ctx.strokeStyle = "#d33"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-40, 36, 12, -0.4, 1.2); ctx.stroke();
  ctx.beginPath(); ctx.arc(40, 36, 12, 1.9, 3.5); ctx.stroke();
  ctx.beginPath(); ctx.rect(-7, 24, 14, 16); fillInk(ctx, "#e6bd99", 2.2);
  ear(ctx, -29, 4); ear(ctx, 29, 4);
  ctx.save(); ctx.scale(0.92, 1.08);
  faceShape(ctx, 29); fillInk(ctx, SKIN, 2.6);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-30, 4);
  ctx.bezierCurveTo(-38, -26, -18, -40, 0, -38);
  ctx.bezierCurveTo(20, -36, 38, -24, 30, 6);
  ctx.bezierCurveTo(18, -8, -18, -8, -30, 4);
  ctx.closePath(); fillInk(ctx, "#6b6f78", 2.4);
  [[-30, -10, -44, -20], [-16, -34, -22, -50], [0, -40, 2, -56], [16, -34, 24, -48],
   [30, -10, 44, -18], [-24, -24, -36, -34], [24, -24, 36, -32]].forEach((s) => {
    ctx.beginPath(); ctx.moveTo(s[0], s[1]);
    ctx.quadraticCurveTo((s[0] + s[2]) / 2 + 3, (s[1] + s[3]) / 2 - 3, s[2], s[3]);
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.stroke();
    ctx.strokeStyle = "#6b6f78"; ctx.lineWidth = 3.8; ctx.stroke();
  });
  brow(ctx, -12, -14, 7, 3, 3);
  brow(ctx, 12, -14, 7, -3, 3);
  eye(ctx, -12, -2, 6.5, 6, 0);
  eye(ctx, 12, -2, 6.5, 6, 0);
  if (!opts.glassesBroken) {
    ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    rrect(ctx, -22, -10, 20, 16, 2); ctx.stroke();
    rrect(ctx, 2, -10, 20, 16, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(2, -3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-22, -4); ctx.lineTo(-28, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, -4); ctx.lineTo(28, -2); ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-7, 10); ctx.lineTo(14, 15); ctx.lineTo(-7, 21); ctx.closePath();
  fillInk(ctx, "#e0a030", 2.4);
  ctx.beginPath(); ctx.moveTo(-7, 15.5); ctx.lineTo(13, 15.5);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
}

export function drawFuse(ctx) {
  const SKIN = "#f2c49b", TOP = "#6f9f6f";
  ctx.beginPath();
  ctx.moveTo(-20, 96); ctx.lineTo(-22, 174); ctx.lineTo(-5, 174); ctx.lineTo(-2, 100);
  ctx.lineTo(2, 100); ctx.lineTo(5, 174); ctx.lineTo(22, 174); ctx.lineTo(20, 96);
  ctx.closePath(); fillInk(ctx, "#33383f", 2.4);
  ctx.beginPath(); ctx.ellipse(-14, 180, 12, 7, 0, 0, Math.PI * 2); fillInk(ctx, "#20242a", 2.4);
  ctx.beginPath(); ctx.ellipse(14, 180, 12, 7, 0, 0, Math.PI * 2); fillInk(ctx, "#20242a", 2.4);
  ctx.beginPath();
  ctx.moveTo(-28, 44); ctx.quadraticCurveTo(-31, 76, -27, 100);
  ctx.lineTo(27, 100); ctx.quadraticCurveTo(31, 76, 28, 44);
  ctx.quadraticCurveTo(0, 33, -28, 44); ctx.closePath();
  fillInk(ctx, TOP, 2.6);
  ctx.strokeStyle = INK; ctx.lineWidth = 14; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-27, 54); ctx.quadraticCurveTo(-36, 76, -20, 84); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(27, 54); ctx.quadraticCurveTo(36, 76, 20, 84); ctx.stroke();
  ctx.strokeStyle = TOP; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(-27, 54); ctx.quadraticCurveTo(-36, 76, -20, 84); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(27, 54); ctx.quadraticCurveTo(36, 76, 20, 84); ctx.stroke();
  ctx.beginPath(); ctx.rect(-22, 66, 44, 13); fillInk(ctx, "#dcdcdc", 2.4);
  ctx.beginPath(); ctx.rect(-18, 54, 36, 13); fillInk(ctx, "#c9ccd2", 2.4);
  ctx.beginPath(); ctx.rect(-13, 42, 26, 13); fillInk(ctx, "#dcdcdc", 2.4);
  ctx.beginPath(); ctx.arc(-20, 88, 7, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.beginPath(); ctx.arc(20, 88, 7, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.save(); ctx.translate(40, 44); ctx.rotate(-0.25);
  ctx.beginPath(); ctx.rect(-11, -7, 22, 14); fillInk(ctx, "#f4e9c8", 2.2);
  ctx.fillStyle = INK; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("140", 0, 2.5);
  ctx.restore();
  ctx.beginPath(); ctx.rect(-7, 24, 14, 16); fillInk(ctx, "#e0ab84", 2.2);
  ear(ctx, -29, 4); ear(ctx, 29, 4);
  faceShape(ctx, 29); fillInk(ctx, SKIN, 2.6);
  ctx.beginPath();
  ctx.moveTo(-30, 2);
  ctx.bezierCurveTo(-33, -28, -12, -40, 4, -38);
  ctx.bezierCurveTo(24, -36, 32, -22, 30, 2);
  ctx.lineTo(23, -4);
  ctx.bezierCurveTo(20, -18, 0, -24, -10, -14);
  ctx.bezierCurveTo(-16, -8, -24, -6, -30, 2);
  ctx.closePath(); fillInk(ctx, "#241f1a", 2.4);
  hairShine(ctx, 9, -26, 13, 4, "rgba(255,255,255,0.42)");
  ctx.beginPath(); ctx.moveTo(-7, -32); ctx.lineTo(-2, -20);
  ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2; ctx.stroke();
  brow(ctx, -12, -14, 7, -1, 2.8);
  brow(ctx, 12, -14, 7, 1, 2.8);
  eyeSharp(ctx, -12, -1, 6.5, 5, 0);
  eyeSharp(ctx, 12, -1, 6.5, 5, 0);
  nose(ctx, 0, 8);
  mouthFlat(ctx, 0, 16, 7);
}

export function drawCoop(ctx) {
  const SKIN = "#f2c49b", APRON = "#e8ebf0", UNI = "#4d7ec8";
  ctx.beginPath();
  ctx.moveTo(-20, 96); ctx.lineTo(-22, 174); ctx.lineTo(-5, 174); ctx.lineTo(-2, 100);
  ctx.lineTo(2, 100); ctx.lineTo(5, 174); ctx.lineTo(22, 174); ctx.lineTo(20, 96);
  ctx.closePath(); fillInk(ctx, "#3a4152", 2.4);
  ctx.beginPath(); ctx.ellipse(-14, 180, 12, 7, 0, 0, Math.PI * 2); fillInk(ctx, "#e8e4d8", 2.4);
  ctx.beginPath(); ctx.ellipse(14, 180, 12, 7, 0, 0, Math.PI * 2); fillInk(ctx, "#e8e4d8", 2.4);
  ctx.beginPath();
  ctx.moveTo(-28, 44); ctx.quadraticCurveTo(-31, 76, -27, 100);
  ctx.lineTo(27, 100); ctx.quadraticCurveTo(31, 76, 28, 44);
  ctx.quadraticCurveTo(0, 33, -28, 44); ctx.closePath();
  fillInk(ctx, UNI, 2.6);
  ctx.beginPath();
  ctx.moveTo(-16, 44); ctx.lineTo(-20, 100); ctx.lineTo(20, 100); ctx.lineTo(16, 44);
  ctx.quadraticCurveTo(0, 38, -16, 44); ctx.closePath();
  fillInk(ctx, APRON, 2.4);
  ctx.beginPath(); ctx.moveTo(-20, 72); ctx.lineTo(20, 72);
  ctx.strokeStyle = "#b9c0cc"; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = "#d33"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("試食", 0, 62);
  ctx.strokeStyle = INK; ctx.lineWidth = 14; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-27, 52); ctx.quadraticCurveTo(-44, 56, -46, 34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(27, 52); ctx.quadraticCurveTo(42, 70, 34, 90); ctx.stroke();
  ctx.strokeStyle = UNI; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(-27, 52); ctx.quadraticCurveTo(-44, 56, -46, 34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(27, 52); ctx.quadraticCurveTo(42, 70, 34, 90); ctx.stroke();
  ctx.beginPath(); ctx.arc(-47, 30, 7, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.beginPath(); ctx.arc(34, 94, 7, 0, Math.PI * 2); fillInk(ctx, SKIN, 2.2);
  ctx.save(); ctx.translate(-50, 18);
  ctx.beginPath(); ctx.ellipse(0, 0, 24, 8, 0, 0, Math.PI * 2); fillInk(ctx, "#cfd4dc", 2.4);
  [-13, -4, 5, 14].forEach((x, i) => {
    ctx.beginPath(); ctx.arc(x, -4, 4.2, 0, Math.PI * 2);
    fillInk(ctx, i % 2 ? "#e0713f" : "#d9a441", 1.8);
    ctx.beginPath(); ctx.moveTo(x, -8); ctx.lineTo(x + 2, -16);
    ctx.strokeStyle = "#c9a06a"; ctx.lineWidth = 1.8; ctx.stroke();
  });
  ctx.restore();
  ctx.beginPath(); ctx.rect(-7, 24, 14, 16); fillInk(ctx, "#e0ab84", 2.2);
  ear(ctx, -29, 4); ear(ctx, 29, 4);
  faceShape(ctx, 29); fillInk(ctx, SKIN, 2.6);
  ctx.beginPath();
  ctx.moveTo(-30, 2); ctx.bezierCurveTo(-34, -30, -12, -40, 2, -38);
  ctx.bezierCurveTo(22, -36, 32, -22, 30, 2);
  ctx.bezierCurveTo(18, -12, -18, -12, -30, 2);
  ctx.closePath(); fillInk(ctx, "#4a3a2a", 2.4);
  ctx.beginPath(); ctx.arc(0, -34, 11, 0, Math.PI * 2); fillInk(ctx, "#4a3a2a", 2.4);
  ctx.beginPath();
  ctx.moveTo(-31, -6); ctx.quadraticCurveTo(0, -30, 31, -6);
  ctx.quadraticCurveTo(0, -18, -31, -6); ctx.closePath();
  fillInk(ctx, "#f4f6fa", 2.4);
  hairShine(ctx, 8, -20, 9, 3, "rgba(255,255,255,0.3)");
  brow(ctx, -12, -12, 7, -1, 2.6);
  brow(ctx, 12, -12, 7, 1, 2.6);
  eyeSmile(ctx, -12, 0, 7.5);
  eyeSmile(ctx, 12, 0, 7.5);
  nose(ctx, 0, 8);
  mouthGrin(ctx, 0, 14, 9, 5);
}

/* ── アイテム ─────────────────────────────────────────────── */

export const CD_KINDS = {
  straightener: { label: "STRAIGHTENER", jp: "ストレイテナー", color: "#2f4f7f" },
  bandapart:    { label: "the band apart", jp: "バンアパ",     color: "#7a3030" },
  ajikan:       { label: "ASIAN KUNG-FU",  jp: "アジカン",     color: "#2f6b4a" },
};

export function drawCD(ctx, kind, r) {
  const k = CD_KINDS[kind] || CD_KINDS.straightener;
  r = r || 62;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  fillInk(ctx, "#e9edf2", r > 30 ? 3 : 1.6);
  const g = ctx.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, "rgba(120,200,255,0.55)");
  g.addColorStop(0.35, "rgba(255,255,255,0.05)");
  g.addColorStop(0.6, "rgba(255,170,220,0.45)");
  g.addColorStop(1, "rgba(160,255,200,0.5)");
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.61, 0, Math.PI * 2);
  fillInk(ctx, k.color, r > 30 ? 2.6 : 1.4);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
  fillInk(ctx, "#f4f1e8", r > 30 ? 2.4 : 1.2);
  if (r > 30) {
    ctx.fillStyle = "#fff"; ctx.textAlign = "center";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(k.label, 0, -20);
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(k.jp, 0, 26);
  }
}

export function drawShoe(ctx, withTag) {
  ctx.save(); ctx.translate(0, 6);
  ctx.beginPath();
  ctx.moveTo(-64, 20);
  ctx.quadraticCurveTo(-64, 2, -44, -6);
  ctx.lineTo(-14, -16);
  ctx.lineTo(20, -20);
  ctx.quadraticCurveTo(34, -22, 40, -34);
  ctx.quadraticCurveTo(52, -32, 56, -10);
  ctx.quadraticCurveTo(60, 8, 58, 20);
  ctx.closePath(); fillInk(ctx, "#fbfaf5", 3);
  ctx.beginPath();
  ctx.moveTo(-64, 20);
  ctx.quadraticCurveTo(-64, 2, -44, -6);
  ctx.quadraticCurveTo(-34, 6, -32, 20);
  ctx.closePath(); fillInk(ctx, "#f1eee4", 2.4);
  ctx.beginPath(); ctx.ellipse(30, -24, 15, 7, -0.22, 0, Math.PI * 2);
  fillInk(ctx, "#e6e2d6", 2.4);
  ctx.beginPath();
  ctx.moveTo(-12, -15); ctx.lineTo(18, -19); ctx.lineTo(22, -4); ctx.lineTo(-8, 0);
  ctx.closePath(); fillInk(ctx, "#f1eee4", 2.2);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const x = -8 + i * 10, dy = -i * 1.2;
    ctx.beginPath(); ctx.moveTo(x, -12 + dy); ctx.lineTo(x + 9, -2 + dy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 9, -13 + dy); ctx.lineTo(x, -3 + dy); ctx.stroke();
  }
  ctx.fillStyle = INK;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath(); ctx.arc(-9 + k * 10, -13 - k * 1.2, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-1 + k * 10, -2 - k * 1.2, 1.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(-66, 18);
  ctx.quadraticCurveTo(-70, 30, -56, 34);
  ctx.lineTo(50, 34);
  ctx.quadraticCurveTo(62, 32, 60, 18);
  ctx.closePath(); fillInk(ctx, "#ffffff", 2.8);
  ctx.beginPath(); ctx.moveTo(-64, 25); ctx.lineTo(58, 25);
  ctx.strokeStyle = "#c9ccd2"; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = "#1d3f7a"; ctx.lineWidth = 3.2; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-26, 8); ctx.quadraticCurveTo(6, 2, 40, 4); ctx.stroke();
  ctx.strokeStyle = "#b03636";
  ctx.beginPath(); ctx.moveTo(-26, 14); ctx.quadraticCurveTo(6, 8, 40, 10); ctx.stroke();
  ctx.save(); ctx.translate(40, -6);
  ctx.strokeStyle = "#1f5c3d"; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(0, 0, 8.5, Math.PI * 0.62, Math.PI * 2.38); ctx.stroke();
  for (let j = 0; j < 9; j++) {
    const a = Math.PI * 0.62 + j * 0.2;
    ctx.save();
    ctx.translate(Math.cos(a) * 8.5, Math.sin(a) * 8.5);
    ctx.rotate(a + Math.PI / 2);
    ctx.beginPath(); ctx.ellipse(0, 0, 3.2, 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#1f5c3d"; ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
  if (withTag) {
    ctx.save(); ctx.translate(-36, -52); ctx.rotate(-0.16);
    rrect(ctx, -32, -13, 64, 26, 4); fillInk(ctx, "#f5c542", 2.6);
    ctx.fillStyle = INK; ctx.font = "bold 15px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("BANGS", 0, 5.5);
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-24, -40); ctx.lineTo(-14, -26); ctx.stroke();
  }
}

/* ── ゲーム内での配置ヘルパー ─────────────────────────────── */
// キャラ絵は縦 230 くらい。size(px) に収まるよう縮めて中心を合わせる。
export function drawActor(ctx, drawFn, x, y, size, opts) {
  const s = size / 230;
  ctx.save();
  ctx.translate(x, y);
  if (opts && opts.rotate) ctx.rotate(opts.rotate);
  if (opts && opts.scaleX) ctx.scale(opts.scaleX, 1);
  ctx.scale(s, s);
  ctx.translate(0, -70);
  drawFn(ctx, opts || {});
  ctx.restore();
}
