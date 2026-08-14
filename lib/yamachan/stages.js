// ステージごとの背景。荏田高校から町田のファミマまで、実際のルート順に並べている。
import { INK, fillInk } from "./art.js";

export const STAGES = [
  { id: "eda",          name: "荏田高等学校",             from: 0,    sky: ["#8fc4e8", "#dcecf5"] },
  { id: "coop",         name: "コープ",                   from: 620,  sky: ["#7fb8e0", "#e3eef2"] },
  { id: "tamaplaza",    name: "たまプラーザ駅",           from: 1240, sky: ["#7aabd8", "#efe6dc"] },
  { id: "minamimachida",name: "南町田グランベリーモール駅", from: 1860, sky: ["#6f9ccc", "#f2ded0"] },
  { id: "sakaigawa",    name: "境川ぞいの道",             from: 2480, sky: ["#5f88bd", "#f6d8bd"] },
  { id: "machida",      name: "町田",                     from: 3300, sky: ["#3f5f96", "#e8a878"] },
];

export const BOSS_DISTANCE = 3700;

export function stageAt(dist) {
  let s = STAGES[0];
  for (const st of STAGES) if (dist >= st.from) s = st;
  return s;
}

function band(ctx, x, y, w, h, color, line) {
  ctx.beginPath(); ctx.rect(x, y, w, h);
  ctx.fillStyle = color; ctx.fill();
  if (line) {
    ctx.strokeStyle = line; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  }
}

function windows(ctx, x, y, cols, rows, cw, ch, gap, color) {
  ctx.fillStyle = color;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillRect(x + c * (cw + gap), y + r * (ch + gap), cw, ch);
    }
  }
}

function signboard(ctx, x, y, w, h, text, bg, fg, fontSize) {
  ctx.beginPath(); ctx.rect(x, y, w, h);
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.45)"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = fg;
  ctx.font = "bold " + (fontSize || 12) + "px sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + h / 2 + 0.5);
}

/* 木。学校と川沿いで使い回す */
function tree(ctx, x, groundY, h, tone) {
  ctx.fillStyle = tone || "#3f7a46";
  ctx.beginPath(); ctx.ellipse(x, groundY - h, h * 0.52, h * 0.46, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x - h * 0.34, groundY - h * 0.76, h * 0.34, h * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + h * 0.34, groundY - h * 0.78, h * 0.32, h * 0.29, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#5a4030";
  ctx.fillRect(x - 3, groundY - h * 0.62, 6, h * 0.62);
}

/* ── 各ステージの遠景 ─────────────────────────────────────── */

const painters = {
  eda(ctx, g) {
    const { W, groundY, scroll } = g;
    const unit = 460;
    const off = -(scroll * 0.45) % unit;
    for (let i = -1; i < W / unit + 2; i++) {
      const x = off + i * unit;
      // 校舎
      ctx.fillStyle = "#cfd6dc";
      ctx.fillRect(x, groundY - 132, 268, 132);
      ctx.fillStyle = "#b3bcc4";
      ctx.fillRect(x, groundY - 142, 268, 12);
      windows(ctx, x + 14, groundY - 118, 7, 3, 24, 20, 10, "#8fd0e6");
      // 昇降口
      ctx.fillStyle = "#7d868e";
      ctx.fillRect(x + 112, groundY - 44, 46, 44);
      signboard(ctx, x + 62, groundY - 168, 148, 24, "荏田高等学校", "#f0ead6", "#2c3446", 14);
      // 体育館
      ctx.fillStyle = "#c2c9cf";
      ctx.fillRect(x + 292, groundY - 96, 118, 96);
      ctx.fillStyle = "#a8b1b8";
      ctx.beginPath();
      ctx.moveTo(x + 286, groundY - 96); ctx.lineTo(x + 351, groundY - 122);
      ctx.lineTo(x + 416, groundY - 96); ctx.closePath(); ctx.fill();
      tree(ctx, x + 440, groundY, 54);
      tree(ctx, x + 268, groundY, 40, "#4b8a52");
    }
  },

  coop(ctx, g) {
    const { W, groundY, scroll } = g;
    const unit = 430;
    const off = -(scroll * 0.45) % unit;
    for (let i = -1; i < W / unit + 2; i++) {
      const x = off + i * unit;
      ctx.fillStyle = "#e6e1d4";
      ctx.fillRect(x, groundY - 118, 300, 118);
      ctx.fillStyle = "#cfc8b8";
      ctx.fillRect(x, groundY - 128, 300, 12);
      // 全面ガラス
      windows(ctx, x + 16, groundY - 88, 6, 2, 38, 30, 8, "#a9d8e8");
      // 入口の自動ドア
      ctx.fillStyle = "#8fb8c9";
      ctx.fillRect(x + 118, groundY - 52, 64, 52);
      ctx.strokeStyle = "#5d7c8a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 150, groundY - 52); ctx.lineTo(x + 150, groundY); ctx.stroke();
      signboard(ctx, x + 74, groundY - 156, 152, 28, "コープ", "#2f7bbf", "#ffffff", 18);
      // のぼり（試食）
      ctx.fillStyle = "#d94f4f";
      ctx.fillRect(x + 246, groundY - 92, 22, 74);
      ctx.fillStyle = "#fff"; ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("試", x + 257, groundY - 74);
      ctx.fillText("食", x + 257, groundY - 60);
      // カート置き場
      ctx.strokeStyle = "#9aa2aa"; ctx.lineWidth = 2.5;
      for (let c = 0; c < 3; c++) {
        const cx = x + 320 + c * 26;
        ctx.strokeRect(cx, groundY - 26, 20, 16);
        ctx.beginPath(); ctx.arc(cx + 4, groundY - 6, 3.5, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + 16, groundY - 6, 3.5, 0, Math.PI * 2); ctx.stroke();
      }
    }
  },

  tamaplaza(ctx, g) {
    const { W, groundY, scroll } = g;
    const unit = 560;
    const off = -(scroll * 0.45) % unit;
    for (let i = -1; i < W / unit + 2; i++) {
      const x = off + i * unit;
      // 高架のライン（看板より先に描かないと文字を潰してしまう）
      ctx.fillStyle = "#98a0a8";
      ctx.fillRect(x, groundY - 176, 330, 10);
      // 駅舎
      ctx.fillStyle = "#ded6c8";
      ctx.fillRect(x, groundY - 146, 330, 146);
      ctx.fillStyle = "#b9ac99";
      ctx.fillRect(x - 8, groundY - 158, 346, 16);
      windows(ctx, x + 18, groundY - 128, 8, 2, 28, 26, 10, "#9ecfe2");
      // 改札まわり
      ctx.fillStyle = "#f2efe6";
      ctx.fillRect(x + 40, groundY - 62, 250, 62);
      ctx.strokeStyle = "#c3bcae"; ctx.lineWidth = 2; ctx.strokeRect(x + 40, groundY - 62, 250, 62);
      // 駅名看板は高架の上に、はみ出さない幅で
      signboard(ctx, x + 66, groundY - 210, 198, 28, "たまプラーザ駅", "#f7f4ea", "#2b3a4a", 16);
      // ホーム上屋
      ctx.fillStyle = "#c8ccd2";
      ctx.fillRect(x + 356, groundY - 74, 96, 8);
      for (let p = 0; p < 3; p++) ctx.fillRect(x + 360 + p * 42, groundY - 66, 5, 66);
    }
  },

  minamimachida(ctx, g) {
    const { W, groundY, scroll } = g;
    const unit = 490;
    const off = -(scroll * 0.45) % unit;
    for (let i = -1; i < W / unit + 2; i++) {
      const x = off + i * unit;
      // モールの箱
      ctx.fillStyle = "#e8ddcc";
      ctx.fillRect(x, groundY - 124, 210, 124);
      ctx.fillStyle = "#d3c4ad";
      ctx.fillRect(x + 216, groundY - 96, 150, 96);
      windows(ctx, x + 16, groundY - 108, 5, 2, 30, 24, 10, "#bfe0ea");
      windows(ctx, x + 230, groundY - 82, 4, 2, 28, 22, 10, "#bfe0ea");
      signboard(ctx, x + 8, groundY - 156, 196, 26, "グランベリーモール", "#5a8f4a", "#ffffff", 13);
      signboard(ctx, x + 224, groundY - 128, 136, 24, "南町田", "#f7f4ea", "#2b3a4a", 14);
      // 改札の列（キセルの舞台）
      const gx = x + 380;
      ctx.fillStyle = "#f2efe6"; ctx.fillRect(gx - 10, groundY - 58, 96, 58);
      for (let k = 0; k < 3; k++) {
        const bx = gx + k * 30;
        ctx.fillStyle = "#cfd4da";
        ctx.fillRect(bx, groundY - 44, 12, 44);
        ctx.fillStyle = "#e0863a";
        ctx.fillRect(bx, groundY - 44, 12, 6);
      }
    }
  },

  sakaigawa(ctx, g) {
    const { W, groundY, scroll, t } = g;
    // 川の向こう岸（遠景の家並み）
    const unit = 300;
    const off = -(scroll * 0.32) % unit;
    for (let i = -1; i < W / unit + 2; i++) {
      const x = off + i * unit;
      ctx.fillStyle = "#b9c2c9";
      ctx.fillRect(x + 20, groundY - 150, 64, 42);
      ctx.fillStyle = "#a6b0b8";
      ctx.fillRect(x + 120, groundY - 138, 52, 30);
      ctx.fillStyle = "#c6cdd2";
      ctx.fillRect(x + 210, groundY - 146, 46, 38);
      tree(ctx, x + 96, groundY - 108, 30, "#4f7f52");
      tree(ctx, x + 262, groundY - 108, 26, "#456f48");
    }
    // ── 川の断面。両岸に舗装路があるのが分かる並びにする ──
    const farPathY  = groundY - 108;  // 向こう岸の舗装路
    const waterY    = groundY - 84;
    const nearPathY = groundY - 30;   // こちら側の舗装路

    band(ctx, 0, farPathY, W, 24, "#c9c3b6", "#a8a294");
    // 向こう岸のガードレール
    ctx.strokeStyle = "#dfe3e6"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, farPathY - 8); ctx.lineTo(W, farPathY - 8); ctx.stroke();
    ctx.strokeStyle = "#b6bcc0"; ctx.lineWidth = 2;
    for (let x = -(scroll * 0.6) % 46; x < W; x += 46) {
      ctx.beginPath(); ctx.moveTo(x, farPathY - 12); ctx.lineTo(x, farPathY); ctx.stroke();
    }
    // 護岸
    ctx.fillStyle = "#b0aa9c"; ctx.fillRect(0, farPathY + 24, W, 8);
    // 水面
    const wg = ctx.createLinearGradient(0, waterY, 0, nearPathY);
    wg.addColorStop(0, "#5f97a8"); wg.addColorStop(1, "#3d6f83");
    ctx.fillStyle = wg; ctx.fillRect(0, waterY, W, nearPathY - waterY);
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      const y = waterY + 10 + k * 9;
      const shift = -(scroll * (0.8 + k * 0.1) + Math.sin(t * 1.4 + k) * 6) % 120;
      for (let x = shift; x < W; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + 34, y);
        ctx.stroke();
      }
    }
    // こちら側の護岸と舗装路
    ctx.fillStyle = "#b0aa9c"; ctx.fillRect(0, nearPathY - 8, W, 8);
    band(ctx, 0, nearPathY, W, groundY - nearPathY, "#cdc7ba", "#a8a294");
    // 白線
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 2.5;
    ctx.setLineDash([26, 20]);
    ctx.beginPath();
    ctx.moveTo(-(scroll * 1.0) % 46, nearPathY + 14);
    ctx.lineTo(W, nearPathY + 14);
    ctx.stroke();
    ctx.setLineDash([]);
    // こちら側のガードレール（手前なので大きめ）
    ctx.strokeStyle = "#e6eaec"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, nearPathY - 20); ctx.lineTo(W, nearPathY - 20); ctx.stroke();
    ctx.strokeStyle = "#bcc2c6"; ctx.lineWidth = 3;
    for (let x = -(scroll * 1.0) % 58; x < W; x += 58) {
      ctx.beginPath(); ctx.moveTo(x, nearPathY - 24); ctx.lineTo(x, nearPathY - 4); ctx.stroke();
    }
  },

  machida(ctx, g) {
    const { W, groundY, scroll } = g;
    const unit = 250;
    const off = -(scroll * 0.4) % unit;
    for (let i = -1; i < W / unit + 2; i++) {
      const x = off + i * unit;
      const h = 150 + ((i % 3) * 34);
      ctx.fillStyle = i % 2 ? "#4d5566" : "#5a6273";
      ctx.fillRect(x, groundY - h, 120, h);
      windows(ctx, x + 12, groundY - h + 14, 4, Math.floor(h / 34), 18, 16, 8, "#ffd98a");
      ctx.fillStyle = "#434a58";
      ctx.fillRect(x + 140, groundY - h * 0.72, 84, h * 0.72);
      windows(ctx, x + 150, groundY - h * 0.72 + 12, 3, Math.floor(h / 46), 16, 14, 8, "#ffcf7a");
    }
  },
};

export function drawStageBackground(ctx, stageId, g) {
  const st = STAGES.find((s) => s.id === stageId) || STAGES[0];
  const grad = ctx.createLinearGradient(0, 0, 0, g.H);
  grad.addColorStop(0, st.sky[0]);
  grad.addColorStop(1, st.sky[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, g.W, g.H);

  // 雲
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 190 - g.scroll * 0.12) % (g.W + 240)) - 120;
    const cy = 42 + (i % 3) * 44;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 38, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 28, cy + 5, 26, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 26, cy + 6, 22, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  (painters[stageId] || painters.eda)(ctx, g);

  // 地面（川ステージは painter 側で描き切っている）
  if (stageId !== "sakaigawa") {
    ctx.fillStyle = stageId === "machida" ? "#2f3440" : "#6f8a53";
    ctx.fillRect(0, g.groundY, g.W, g.H - g.groundY);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, g.groundY, g.W, 5);
  }
}

/* ── 道中に一度だけ出るランドマーク ───────────────────────── */

export const LANDMARKS = [
  { id: "kaisatsu",  dist: 2180, w: 150, label: "南町田グランベリーモール駅" },
  { id: "taishodo",  dist: 2900, w: 190, label: "大正堂" },
  { id: "famima",    dist: 3640, w: 190, label: "ファミリーマート" },
];

export function drawLandmark(ctx, id, x, groundY) {
  if (id === "kaisatsu") {
    // 改札。布施のキセル演出の舞台
    ctx.fillStyle = "#f4f1e6";
    ctx.fillRect(x, groundY - 104, 150, 104);
    ctx.strokeStyle = "#c9c2b2"; ctx.lineWidth = 2;
    ctx.strokeRect(x, groundY - 104, 150, 104);
    signboard(ctx, x + 8, groundY - 130, 134, 22, "改札口", "#3f7a4f", "#ffffff", 13);
    for (let k = 0; k < 3; k++) {
      const bx = x + 18 + k * 44;
      ctx.fillStyle = "#d3d8de"; ctx.fillRect(bx, groundY - 52, 16, 52);
      ctx.strokeStyle = "#9aa2aa"; ctx.strokeRect(bx, groundY - 52, 16, 52);
      ctx.fillStyle = "#e0863a"; ctx.fillRect(bx, groundY - 52, 16, 7);
      // 開いたフラップ
      ctx.fillStyle = "#8fb8c9";
      ctx.fillRect(bx + 16, groundY - 40, 4, 22);
    }
  } else if (id === "taishodo") {
    // 赤い大正堂
    ctx.fillStyle = "#b8322c";
    ctx.fillRect(x, groundY - 130, 190, 130);
    ctx.fillStyle = "#9d2a24";
    ctx.fillRect(x - 8, groundY - 142, 206, 14);
    windows(ctx, x + 16, groundY - 112, 5, 2, 26, 24, 10, "#f2d9c8");
    ctx.fillStyle = "#7f221d";
    ctx.fillRect(x + 70, groundY - 48, 52, 48);
    signboard(ctx, x + 30, groundY - 176, 130, 30, "大正堂", "#f3ece0", "#b8322c", 20);
    ctx.fillStyle = "#f3ece0";
    ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("家具のデパート", x + 95, groundY - 138);
  } else if (id === "famima") {
    // ファミマ（フック戦の舞台）
    ctx.fillStyle = "#f7f5ee";
    ctx.fillRect(x, groundY - 118, 190, 118);
    ctx.fillStyle = "#e8e4d8";
    ctx.fillRect(x - 6, groundY - 132, 202, 16);
    // 緑と青のストライプ
    ctx.fillStyle = "#3f8f4f"; ctx.fillRect(x - 6, groundY - 132, 202, 6);
    ctx.fillStyle = "#3f6fbf"; ctx.fillRect(x - 6, groundY - 126, 202, 6);
    windows(ctx, x + 12, groundY - 100, 4, 1, 38, 56, 8, "#cfe6f2");
    ctx.fillStyle = "#b9d9e8";
    ctx.fillRect(x + 76, groundY - 62, 46, 62);
    signboard(ctx, x + 20, groundY - 162, 150, 26, "ファミリーマート", "#ffffff", "#2f6f3f", 13);
    // 明かり
    ctx.fillStyle = "rgba(255,235,170,0.30)";
    ctx.beginPath();
    ctx.moveTo(x + 6, groundY - 100); ctx.lineTo(x + 184, groundY - 100);
    ctx.lineTo(x + 210, groundY); ctx.lineTo(x - 20, groundY);
    ctx.closePath(); ctx.fill();
  }
}
