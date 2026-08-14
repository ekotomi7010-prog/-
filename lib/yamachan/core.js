// 「山ちゃんが飛ぶ!!」本体。UI もぜんぶ canvas に描くので、
// React からも素の HTML からも createGame(canvas) を呼ぶだけで動く。
import {
  INK, drawActor, speech, drawCD, drawShoe, CD_KINDS,
  drawYamachan, drawHook, drawAoki, drawEbi, drawTakehiko,
  drawHashidate, drawYoshino, drawFuse, drawCoop,
} from "./art.js";
import {
  STAGES, BOSS_DISTANCE, stageAt, drawStageBackground, LANDMARKS, drawLandmark,
} from "./stages.js";

export const W = 900;
export const H = 506;
const GROUND_Y = H - 46;
const CEIL_Y = 18;

const GRAVITY = 1450;
const THRUST = -2650;
const MAX_VY = 840;
const BOSS_HP_MAX = 6;

const rand = (a, b) => Math.random() * (b - a) + a;

/* ── キャラ定義 ───────────────────────────────────────────── */

const ENEMY_DEFS = {
  yoshino:   { draw: drawYoshino,   size: 74, label: "吉野",   r: 24 },
  takehiko:  { draw: drawTakehiko,  size: 78, label: "たけひこ", r: 25 },
  hashidate: { draw: drawHashidate, size: 82, label: "ハシダテ", r: 26 },
  ebi:       { draw: drawEbi,       size: 76, label: "エビちゃん", r: 22 },
  fuse:      { draw: drawFuse,      size: 76, label: "布施",   r: 24 },
  aoki:      { draw: drawAoki,      size: 80, label: "青木先生", r: 25 },
  coop:      { draw: drawCoop,      size: 78, label: "コープの店員", r: 25 },
};

// ステージごとに誰が出るか（重み付き）
const SPAWN_TABLE = {
  eda:           [["yoshino", 3], ["takehiko", 3], ["hashidate", 2.4], ["aoki", 2]],
  coop:          [["coop", 4], ["aoki", 2.4], ["yoshino", 2]],
  tamaplaza:     [["ebi", 2.4], ["takehiko", 3], ["hashidate", 2.4], ["aoki", 1.6]],
  minamimachida: [["fuse", 2.2], ["ebi", 2.4], ["coop", 2], ["hashidate", 2.4]],
  sakaigawa:     [["yoshino", 2.6], ["takehiko", 2.6], ["hashidate", 2.4], ["ebi", 2.2], ["aoki", 2.2], ["fuse", 1.4]],
  machida:       [["aoki", 2.6], ["ebi", 2.4], ["yoshino", 2.4]],
};

export const BIOS = [
  { key: "yamachan", name: "山ちゃん", role: "主人公", draw: drawYamachan,
    tags: ["結婚式の白タキシード", "とにかくよく飛ぶ", "笑顔だけは一級品"] },
  { key: "hook", name: "フック", role: "ラストボス", draw: drawHook,
    tags: ["性格は怖い", "服が好き", "ギターボーカル", "ストレイテナーが好き"] },
  { key: "aoki", name: "青木先生", role: "教師", draw: drawAoki,
    tags: ["ちょび髭・ベストセーター", "「ヤマウラーー！！！」"] },
  { key: "ebi", name: "エビちゃん", role: "元カノ", draw: drawEbi,
    tags: ["ドラマー", "がりがり・足が細い", "バットで殴ったら死ぬ"] },
  { key: "takehiko", name: "たけひこ", role: "ギタリスト", draw: drawTakehiko,
    tags: ["ギター", "元カノは平井／ミットン", "芦田愛菜・GANTZ好き"] },
  { key: "hashidate", name: "ハシダテ", role: "ギターボーカル", draw: drawHashidate,
    tags: ["パーマ・すね毛処理", "「もてたい！」", "グリードアイランドをドッチ団平と勘違い"] },
  { key: "yoshino", name: "吉野", role: "ドラマー", draw: drawYoshino,
    tags: ["鳥に似てる・手首が固い", "「眼鏡はねえだろ！」"] },
  { key: "fuse", name: "布施", role: "デポジット侍", draw: drawFuse,
    tags: ["南町田でキセル", "汐見に髪を切ってもらう", "弁当箱を回収"] },
  { key: "coop", name: "コープの店員", role: "スーパー", draw: drawCoop,
    tags: ["試食で攻撃してくる"] },
];

/* ── 本体 ─────────────────────────────────────────────────── */

export function createGame(canvas) {
  const ctx = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;

  let mode = "title";
  let raf = 0;
  let last = 0;
  let time = 0;
  let buttons = [];

  const S = {
    player: { x: 190, y: H / 2, vy: 0, r: 21, lives: 3, inv: 0, ammo: 0, hurt: 0 },
    enemies: [], shots: [], items: [], parts: [], marks: [],
    dist: 0, scroll: 0, speed: 250,
    spawnT: 0, itemT: 0,
    holding: false,
    msg: "", msgT: 0,
    stageId: "eda", stageBanner: 0, stageBannerName: "",
    landmarks: [], firedLandmarks: {},
    kiseru: 0,
    shoes: 0,
    boss: { x: W - 170, y: H / 2, hp: BOSS_HP_MAX, atk: 1.6, pat: 0, flinch: 0, enraged: false },
    best: 0,
  };

  function reset() {
    S.player = { x: 190, y: H / 2, vy: 0, r: 21, lives: 3, inv: 1.2, ammo: 0, hurt: 0 };
    S.enemies = []; S.shots = []; S.items = []; S.parts = []; S.marks = [];
    S.dist = 0; S.scroll = 0; S.speed = 250;
    S.spawnT = 1.1; S.itemT = 1.4;
    S.msg = ""; S.msgT = 0;
    S.stageId = "eda"; S.stageBanner = 2.2; S.stageBannerName = "荏田高等学校";
    S.landmarks = LANDMARKS.map((l) => ({ ...l, x: null, done: false }));
    S.firedLandmarks = {};
    S.kiseru = 0; S.shoes = 0; S.throwT = 0;
    S.boss = { x: W - 170, y: H / 2, hp: BOSS_HP_MAX, atk: 1.8, pat: 0, flinch: 0, enraged: false };
  }

  function say(text, dur) { S.msg = text; S.msgT = dur || 1.8; }

  // 演出まわりのタイマーはボス戦でも止めない
  function tickTimers(dt) {
    if (S.stageBanner > 0) S.stageBanner -= dt;
    if (S.kiseru > 0) S.kiseru -= dt;
    if (S.msgT > 0) S.msgT -= dt;
  }

  function puff(x, y, color, n) {
    for (let i = 0; i < (n || 10); i++) {
      S.parts.push({ x, y, vx: rand(-170, 170), vy: rand(-230, -40), life: 0.65, max: 0.65, color });
    }
  }

  /* 頭上に一言出す用の小さなマーク */
  function mark(x, y, text, dur) {
    S.marks.push({ x, y, text, life: dur || 1.3, max: dur || 1.3 });
  }

  function hurt(text) {
    const p = S.player;
    if (p.inv > 0) return;
    p.lives -= 1; p.inv = 1.5; p.hurt = 0.5;
    puff(p.x, p.y, "#ff5c5c", 14);
    say(text);
    if (p.lives <= 0) die();
  }

  function die() {
    S.best = Math.max(S.best, Math.floor(S.dist));
    mode = "gameover";
  }

  function instantDeath(text) {
    const p = S.player;
    if (p.inv > 0) return;
    p.lives = 0;
    puff(p.x, p.y, "#ffd25c", 24);
    say(text, 2.4);
    die();
  }

  /* ── スポーン ──────────────────────────────────────────── */

  function pickEnemy() {
    const table = SPAWN_TABLE[S.stageId] || SPAWN_TABLE.eda;
    let total = 0; for (const e of table) total += e[1];
    let r = Math.random() * total;
    for (const e of table) { if (r < e[1]) return e[0]; r -= e[1]; }
    return table[0][0];
  }

  function spawnEnemy() {
    const type = pickEnemy();
    const def = ENEMY_DEFS[type];
    const y = rand(CEIL_Y + 70, GROUND_Y - 70);
    S.enemies.push({
      type, def, x: W + 60, y, y0: y,
      phase: Math.random() * Math.PI * 2,
      cool: rand(0.5, 1.3),
      hit: false, said: false,
      vx: -S.speed * rand(0.95, 1.12),
    });
  }

  function spawnItem() {
    const roll = Math.random();
    const y = rand(CEIL_Y + 50, GROUND_Y - 50);
    if (roll < 0.22) {
      S.items.push({ kind: "shoe", x: W + 40, y, r: 20 });
    } else {
      const keys = Object.keys(CD_KINDS);
      const cd = keys[Math.floor(Math.random() * keys.length)];
      S.items.push({ kind: "cd", cd, x: W + 40, y, r: 15 });
    }
  }

  /* ── 更新 ──────────────────────────────────────────────── */

  function updatePlayer(dt) {
    const p = S.player;
    p.vy += (S.holding ? THRUST : GRAVITY) * dt;
    p.vy = Math.max(-MAX_VY, Math.min(MAX_VY, p.vy));
    p.y += p.vy * dt;
    if (p.y < CEIL_Y + p.r) { p.y = CEIL_Y + p.r; p.vy = 0; }
    if (p.y > GROUND_Y - p.r) {
      p.y = GROUND_Y - p.r; p.vy = 0;
      hurt("地面に激突！");
    }
    if (p.inv > 0) p.inv -= dt;
    if (p.hurt > 0) p.hurt -= dt;
  }

  function updateParts(dt) {
    for (const q of S.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 520 * dt; q.life -= dt; }
    S.parts = S.parts.filter((q) => q.life > 0);
    for (const m of S.marks) { m.y -= 16 * dt; m.life -= dt; }
    S.marks = S.marks.filter((m) => m.life > 0);
  }

  function updateStage() {
    const st = stageAt(S.dist);
    if (st.id !== S.stageId) {
      S.stageId = st.id;
      S.stageBanner = 2.4;
      S.stageBannerName = st.name;
    }
  }

  function updateLandmarks(dt) {
    for (const l of S.landmarks) {
      if (l.x === null) {
        if (S.dist >= l.dist - 260) l.x = W + 40;
      } else {
        l.x -= S.speed * dt;
        if (!l.done && l.x < S.player.x - 30) {
          l.done = true;
          if (l.id === "kaisatsu") {
            S.kiseru = 3.0;
            S.player.ammo = Math.min(S.player.ammo + 2, 8);
            say("布施「デポジット侍、通ります」— キセルで改札突破！CD＋2", 2.6);
          } else if (l.id === "taishodo") {
            say("赤い大正堂を通過。家具のデパート。", 2.0);
          }
        }
      }
    }
    S.landmarks = S.landmarks.filter((l) => l.x === null || l.x > -260);
  }

  function updateItems(dt, speed) {
    for (const it of S.items) it.x -= speed * dt;
    S.items = S.items.filter((it) => {
      if (it.x < -40) return false;
      const p = S.player;
      if (Math.hypot(p.x - it.x, p.y - it.y) < it.r + p.r * 0.85) {
        if (it.kind === "cd") {
          p.ammo = Math.min(p.ammo + 1, 8);
          puff(it.x, it.y, "#b0e0ff", 8);
          say(CD_KINDS[it.cd].jp + "のCDをゲット！フックに投げ返せる");
        } else {
          S.shoes += 1;
          S.dist += 34;
          puff(it.x, it.y, "#f5c542", 10);
          say("BANGSで買ったフレッドペリーの靴をゲット！");
        }
        return false;
      }
      return true;
    });
  }

  function updatePlaying(dt) {
    updatePlayer(dt);
    S.dist += S.speed * dt * 0.075;
    S.scroll += S.speed * dt;
    S.speed = Math.min(250 + S.dist * 0.055, 470);
    updateStage();
    updateLandmarks(dt);
    tickTimers(dt);

    S.spawnT -= dt;
    if (S.spawnT <= 0) {
      spawnEnemy();
      S.spawnT = Math.max(1.45 - S.dist / 5200, 0.68) + Math.random() * 0.55;
    }
    S.itemT -= dt;
    if (S.itemT <= 0) { spawnItem(); S.itemT = rand(1.0, 1.9); }

    // 敵
    for (const e of S.enemies) {
      e.x += e.vx * dt;
      e.phase += dt;
      const p = S.player;

      if (e.type === "yoshino") {
        e.y = e.y0 + Math.sin(e.phase * 2.6) * 42;
      } else if (e.type === "aoki") {
        // 山ちゃんを見つけると突っ込んでくる
        if (e.x < W - 130) {
          e.y += Math.sign(p.y - e.y) * 62 * dt;
          if (!e.said) { e.said = true; mark(e.x, e.y - 52, "ヤマウラーー！！！", 1.8); }
        }
      } else if (e.type === "takehiko") {
        e.cool -= dt;
        if (e.cool <= 0 && e.x < W - 60 && e.x > 100) {
          S.shots.push({ kind: "pick", x: e.x - 16, y: e.y, vx: -430, vy: 0, r: 9 });
          e.cool = 999;
        }
      } else if (e.type === "coop") {
        e.cool -= dt;
        if (e.cool <= 0 && e.x < W - 60 && e.x > 100) {
          for (let i = -1; i <= 1; i++) {
            S.shots.push({ kind: "sample", x: e.x - 18, y: e.y, vx: -380, vy: i * 70, r: 8 });
          }
          e.cool = 999;
        }
      } else if (e.type === "hashidate") {
        if (!e.said && e.x < W - 120) { e.said = true; mark(e.x, e.y - 56, "もてたい！", 1.5); }
      } else if (e.type === "fuse") {
        e.y = e.y0 + Math.sin(e.phase * 1.4) * 16;
      }

      // 当たり判定
      const swell = e.type === "hashidate" ? 1 + Math.sin(e.phase * 1.7) * 0.42 : 1;
      e.swell = swell;
      const rr = e.def.r * swell;
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (!e.hit && d < rr + p.r * 0.78) {
        e.hit = true;
        if (e.type === "ebi") {
          instantDeath("エビちゃんに接触…華奢すぎる衝撃で撃沈！");
        } else if (e.type === "fuse") {
          S.player.ammo = Math.min(S.player.ammo + 2, 8);
          S.dist += 26;
          puff(e.x, e.y, "#7fb37f", 12);
          mark(e.x, e.y - 46, "弁当箱、回収！", 1.4);
          say("デポジット侍・布施からCDを2枚もらった！");
        } else if (e.type === "hashidate" && swell < 0.72) {
          puff(e.x, e.y, "#c98a4b", 8);
          say("ハシダテが急に痩せた！すり抜け成功");
        } else if (e.type === "yoshino") {
          e.glassesBroken = true;
          puff(e.x, e.y - 10, "#cfd3d8", 12);
          mark(e.x, e.y - 46, "眼鏡はねえだろ！", 1.6);
          hurt("吉野にぶつかってメガネを割った！");
        } else if (e.type === "aoki") {
          puff(e.x, e.y, "#7a6a4a", 10);
          hurt("青木先生に捕まった！");
        } else if (e.type === "coop") {
          hurt("試食トレーに突っ込んだ！");
        } else {
          hurt(e.type === "takehiko" ? "たけひこのギターに激突！" : "ハシダテ（デブ状態）にぶつかった！");
        }
      }
    }
    S.enemies = S.enemies.filter((e) => e.x > -90);

    // 弾
    for (const s of S.shots) { s.x += s.vx * dt; s.y += s.vy * dt; }
    S.shots = S.shots.filter((s) => {
      if (s.x < -40 || s.x > W + 80) return false;
      const p = S.player;
      if (Math.hypot(p.x - s.x, p.y - s.y) < s.r + p.r * 0.75) {
        puff(s.x, s.y, s.kind === "sample" ? "#e0713f" : "#d9534f", 8);
        hurt(s.kind === "sample" ? "試食の串が刺さった！" : "たけひこのピックが直撃！");
        return false;
      }
      return true;
    });

    updateItems(dt, S.speed);
    updateParts(dt);

    if (S.dist >= BOSS_DISTANCE) {
      mode = "boss";
      // ファミマはボス演出側で描くので、道中のランドマークは片付ける
      S.enemies = []; S.shots = []; S.landmarks = [];
      S.kiseru = 0; S.stageBanner = 0;
      say("フック「…そこまでだ。」", 2.2);
    }
  }

  function updateBoss(dt) {
    updatePlayer(dt);
    S.scroll += 40 * dt;
    const b = S.boss;
    const p = S.player;
    p.x += (200 - p.x) * Math.min(1, dt * 2);

    b.enraged = b.hp <= BOSS_HP_MAX / 2;
    b.y = H / 2 + Math.sin(time * 1.1) * 66;
    if (b.flinch > 0) b.flinch -= dt;

    b.atk -= dt;
    if (b.atk <= 0 && b.flinch <= 0) {
      b.pat = (b.pat + 1) % 3;
      if (b.pat === 0) {
        for (let i = -2; i <= 2; i++) {
          S.shots.push({ kind: "note", x: b.x - 30, y: b.y + i * 38, vx: -370, vy: 0, r: 10 });
        }
      } else if (b.pat === 1) {
        const dx = p.x - b.x, dy = p.y - b.y;
        const len = Math.hypot(dx, dy) || 1;
        S.shots.push({ kind: "note", x: b.x - 30, y: b.y, vx: (dx / len) * 400, vy: (dy / len) * 400, r: 12 });
      } else {
        for (let i = 0; i < 4; i++) {
          S.shots.push({ kind: "note", x: b.x - 30, y: 70 + i * 110, vx: -350, vy: Math.sin(i * 1.7) * 90, r: 10 });
        }
      }
      b.atk = b.enraged ? 0.95 : 1.55;
    }

    // フックと高さが合ったときだけ投げる。むやみに撃ち尽くさないように
    const aligned = Math.abs(p.y - b.y) < 105;
    if (p.ammo > 0 && S.throwT <= 0 && aligned) {
      p.ammo -= 1;
      const keys = Object.keys(CD_KINDS);
      S.shots.push({
        kind: "cd", cd: keys[Math.floor(Math.random() * keys.length)],
        x: p.x + 20, y: p.y, vx: 520, vy: 0, r: 12, mine: true, spin: 0,
      });
      S.throwT = 0.34;
    }
    if (S.throwT > 0) S.throwT -= dt;

    // ボス戦中もCDは流れてくる（弾切れで詰まないように）
    S.itemT -= dt;
    if (S.itemT <= 0) {
      const keys = Object.keys(CD_KINDS);
      S.items.push({
        kind: "cd", cd: keys[Math.floor(Math.random() * keys.length)],
        x: W + 40, y: rand(CEIL_Y + 60, GROUND_Y - 60), r: 15,
      });
      S.itemT = rand(1.5, 2.4);
    }
    updateItems(dt, 210);

    for (const s of S.shots) {
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.spin !== undefined) s.spin += dt * 14;
    }
    S.shots = S.shots.filter((s) => {
      if (s.mine) {
        if (s.x > W + 60) return false;
        if (Math.hypot(b.x - s.x, b.y - s.y) < 52 && b.flinch <= 0) {
          b.hp -= 1; b.flinch = 0.75;
          puff(b.x, b.y, "#ffd25c", 18);
          say("フック「俺の服とCDに何しやがる…！」", 1.5);
          if (b.hp <= 0) { S.best = Math.max(S.best, Math.floor(S.dist)); mode = "win"; }
          return false;
        }
        return true;
      }
      if (s.x < -40) return false;
      if (Math.hypot(p.x - s.x, p.y - s.y) < s.r + p.r * 0.75) {
        puff(s.x, s.y, "#c9a6ff", 10);
        hurt("フックのギターが火を噴いた！");
        return false;
      }
      return true;
    });

    updateParts(dt);
    tickTimers(dt);
  }

  /* ── 描画 ──────────────────────────────────────────────── */

  function shadowText(text, x, y, font, color, align) {
    ctx.font = font;
    ctx.textAlign = align || "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillText(text, x + 1.5, y + 1.5);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function button(id, x, y, w, h, label, primary) {
    buttons.push({ id, x, y, w, h });
    const hot = true;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, h / 2); else ctx.rect(x, y, w, h);
    ctx.fillStyle = primary ? "#f5c542" : "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.strokeStyle = primary ? "#c9a02f" : "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = primary ? "#1a1a1a" : "#f0f0f0";
    ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h / 2 + 0.5);
    return hot;
  }

  function drawShotG(s) {
    ctx.save(); ctx.translate(s.x, s.y);
    if (s.kind === "pick") {
      ctx.beginPath();
      ctx.moveTo(-9, -8); ctx.lineTo(9, -5); ctx.lineTo(0, 10);
      ctx.closePath();
      ctx.fillStyle = "#d9534f"; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();
    } else if (s.kind === "sample") {
      ctx.strokeStyle = "#c9a06a"; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(10, -8); ctx.lineTo(-6, 6); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#e0713f"; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
    } else if (s.kind === "note") {
      ctx.fillStyle = "#7a4fd0";
      ctx.beginPath(); ctx.ellipse(-3, 5, 6, 4.6, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(2, -10, 2.6, 15);
      ctx.beginPath(); ctx.moveTo(4.6, -10); ctx.quadraticCurveTo(13, -7, 10, 0);
      ctx.lineTo(4.6, -4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1;
      ctx.stroke();
    } else if (s.kind === "cd") {
      ctx.rotate(s.spin || 0);
      drawCD(ctx, s.cd, 13);
    }
    ctx.restore();
  }

  function drawItemG(it) {
    ctx.save(); ctx.translate(it.x, it.y);
    const bob = Math.sin(time * 3 + it.x * 0.02) * 3;
    ctx.translate(0, bob);
    if (it.kind === "cd") {
      ctx.rotate(time * 1.6);
      drawCD(ctx, it.cd, 15);
    } else {
      ctx.scale(0.34, 0.34);
      drawShoe(ctx, false);
      ctx.scale(1 / 0.34, 1 / 0.34);
      ctx.fillStyle = "#f5c542";
      ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("BANGS", 0, -18);
    }
    ctx.restore();
  }

  function drawWorld() {
    drawStageBackground(ctx, S.stageId, { W, H, groundY: GROUND_Y, scroll: S.scroll, t: time });

    for (const l of S.landmarks) {
      if (l.x !== null) drawLandmark(ctx, l.id, l.x, GROUND_Y);
    }
    if (mode === "boss") drawLandmark(ctx, "famima", W - 250, GROUND_Y);

    for (const it of S.items) drawItemG(it);

    for (const e of S.enemies) {
      const size = e.def.size * (e.swell || 1);
      drawActor(ctx, e.def.draw, e.x, e.y, size, { glassesBroken: e.glassesBroken });
      ctx.font = "11px sans-serif"; ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText(e.def.label, e.x + 1, e.y - size * 0.52 + 1);
      ctx.fillStyle = "#fff";
      ctx.fillText(e.def.label, e.x, e.y - size * 0.52);
    }

    if (mode === "boss") {
      const b = S.boss;
      const jx = b.flinch > 0 ? rand(-5, 5) : 0;
      drawActor(ctx, drawHook, b.x + jx, b.y, 168, { enraged: b.enraged, scaleX: -1 });
      shadowText("フック", b.x, b.y - 96, "bold 15px sans-serif", "#fff");
    }

    for (const s of S.shots) drawShotG(s);

    const p = S.player;
    const blink = p.inv > 0 && Math.floor(time * 12) % 2 === 0;
    if (!blink) {
      const tilt = Math.max(-0.42, Math.min(0.42, p.vy / 1500));
      drawActor(ctx, drawYamachan, p.x, p.y, 92, {
        rotate: tilt, thrust: S.holding, hurt: p.hurt > 0,
      });
    }

    for (const q of S.parts) {
      ctx.globalAlpha = Math.max(q.life / q.max, 0);
      ctx.fillStyle = q.color;
      ctx.beginPath(); ctx.arc(q.x, q.y, 4.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const m of S.marks) {
      ctx.globalAlpha = Math.min(1, m.life / 0.4);
      speech(ctx, m.x, m.y, m.text, Math.max(70, m.text.length * 13), 12);
      ctx.globalAlpha = 1;
    }

    // キセル演出
    if (S.kiseru > 0) {
      ctx.globalAlpha = Math.min(1, S.kiseru / 0.6);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, H / 2 - 46, W, 92);
      shadowText("キ セ ル 成 功", W / 2, H / 2 - 8, "bold 34px sans-serif", "#ffd94a");
      shadowText("南町田グランベリーモール駅 — 改札突破", W / 2, H / 2 + 24, "bold 15px sans-serif", "#fff");
      ctx.globalAlpha = 1;
    }
  }

  function drawHUD() {
    // ライフ
    for (let i = 0; i < 3; i++) {
      const x = 22 + i * 26, y = 28;
      ctx.beginPath();
      ctx.moveTo(x, y + 4);
      ctx.bezierCurveTo(x - 10, y - 6, x - 2, y - 12, x, y - 5);
      ctx.bezierCurveTo(x + 2, y - 12, x + 10, y - 6, x, y + 4);
      ctx.closePath();
      ctx.fillStyle = i < S.player.lives ? "#e8434a" : "rgba(0,0,0,0.25)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 1.6; ctx.stroke();
    }
    shadowText(Math.floor(S.dist) + " m", 22, 56, "bold 17px sans-serif", "#fff", "left");

    // CD 所持
    for (let i = 0; i < Math.min(S.player.ammo, 8); i++) {
      ctx.save(); ctx.translate(28 + i * 20, 78); drawCD(ctx, "straightener", 8); ctx.restore();
    }
    if (S.player.ammo === 0) {
      shadowText("CDなし", 22, 84, "12px sans-serif", "rgba(255,255,255,0.75)", "left");
    }
    if (S.shoes > 0) {
      shadowText("👟 ×" + S.shoes, 22, 106, "bold 13px sans-serif", "#ffe08a", "left");
    }

    if (mode === "playing") {
      // ルート進捗
      const bw = 300, bx = W - bw - 24, by = 26;
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(bx, by, bw, 9);
      const pct = Math.min(S.dist / BOSS_DISTANCE, 1);
      ctx.fillStyle = "#ffd25c"; ctx.fillRect(bx, by, bw * pct, 9);
      ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1.4;
      ctx.strokeRect(bx, by, bw, 9);
      // 駅マーカー
      STAGES.forEach((st) => {
        const mx = bx + bw * Math.min(st.from / BOSS_DISTANCE, 1);
        ctx.fillStyle = S.dist >= st.from ? "#fff" : "rgba(255,255,255,0.5)";
        ctx.fillRect(mx - 1, by - 3, 2, 15);
      });
      shadowText(stageAt(S.dist).name, W - 24, by - 8, "bold 13px sans-serif", "#fff", "right");
      shadowText("町田のファミマまで", bx, by - 8, "11px sans-serif", "rgba(255,255,255,0.85)", "left");
    }

    if (mode === "boss") {
      const bw = 320, bx = W - bw - 24, by = 26;
      ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(bx, by, bw, 13);
      ctx.fillStyle = "#e8434a";
      ctx.fillRect(bx, by, bw * Math.max(S.boss.hp / BOSS_HP_MAX, 0), 13);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6; ctx.strokeRect(bx, by, bw, 13);
      shadowText("フック", W - 24, by - 8, "bold 13px sans-serif", "#fff", "right");
      if (S.player.ammo === 0) {
        shadowText("流れてくるCDを拾え！", W / 2, H - 64, "bold 15px sans-serif", "#ffb0b0");
      } else if (Math.abs(S.player.y - S.boss.y) >= 105) {
        shadowText("フックと高さを合わせろ！", W / 2, H - 64, "bold 15px sans-serif", "#ffe08a");
      }
    }

    // ステージ名バナー
    if (S.stageBanner > 0) {
      const a = Math.min(1, S.stageBanner / 0.5);
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 120, W, 62);
      shadowText(S.stageBannerName, W / 2, 162, "bold 30px sans-serif", "#fff");
      ctx.globalAlpha = 1;
    }

    if (S.msgT > 0) {
      ctx.globalAlpha = Math.min(1, S.msgT / 0.4);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      const w = ctx.measureText(S.msg).width;
      ctx.fillRect(W / 2 - 300, H - 44, 600, 30);
      shadowText(S.msg, W / 2, H - 23, "bold 16px sans-serif", "#fff");
      ctx.globalAlpha = 1;
    }
  }

  /* ── 画面 ──────────────────────────────────────────────── */

  function screenTitle() {
    drawStageBackground(ctx, "eda", { W, H, groundY: GROUND_Y, scroll: time * 40, t: time });
    ctx.fillStyle = "rgba(8,10,16,0.62)";
    ctx.fillRect(0, 0, W, H);

    drawActor(ctx, drawYamachan, W / 2 - 250, H / 2 + 30, 190, {
      rotate: Math.sin(time * 1.5) * 0.12, thrust: Math.sin(time * 3) > 0,
    });
    drawActor(ctx, drawHook, W / 2 + 265, H / 2 + 34, 175, { scaleX: -1 });

    shadowText("山ちゃんが飛ぶ!!", W / 2, 132, "bold 52px sans-serif", "#ffffff");
    shadowText("荏田高等学校 → 町田のファミマ", W / 2, 166, "bold 16px sans-serif", "#ffd25c");
    shadowText("押しっぱなしで上昇、離すと落下。Space / ↑ でも可",
      W / 2, 196, "14px sans-serif", "rgba(255,255,255,0.82)");

    button("start", W / 2 - 110, 236, 220, 52, "スタート", true);
    button("ency", W / 2 - 110, 300, 220, 44, "キャラクター図鑑", false);

    shadowText("CDを集めてフックに投げ返せ", W / 2, H - 34, "13px sans-serif", "rgba(255,255,255,0.7)");
  }

  function screenEncyclopedia() {
    ctx.fillStyle = "#151319"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i < 12; i++) ctx.fillRect(0, i * 44, W, 18);

    shadowText("キャラクター図鑑", W / 2, 44, "bold 24px sans-serif", "#fff");

    const cols = 5, cw = 168, ch = 176;
    const x0 = (W - cols * cw) / 2 + cw / 2;
    BIOS.forEach((b, i) => {
      const cx = x0 + (i % cols) * cw;
      const cy = 96 + Math.floor(i / cols) * ch;
      ctx.fillStyle = "rgba(255,255,255,0.045)";
      ctx.fillRect(cx - cw / 2 + 6, cy - 34, cw - 12, ch - 16);
      ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 1;
      ctx.strokeRect(cx - cw / 2 + 6, cy - 34, cw - 12, ch - 16);
      drawActor(ctx, b.draw, cx, cy + 22, 96, { scaleX: b.key === "hook" ? -1 : 1 });
      shadowText(b.name, cx, cy + 84, "bold 14px sans-serif", "#fff");
      shadowText(b.role, cx, cy + 100, "10px sans-serif", "#ffd25c");
      ctx.fillStyle = "rgba(255,255,255,0.62)";
      ctx.font = "10px sans-serif"; ctx.textAlign = "center";
      b.tags.slice(0, 2).forEach((t, k) => {
        const s = t.length > 15 ? t.slice(0, 14) + "…" : t;
        ctx.fillText(s, cx, cy + 116 + k * 13);
      });
    });

    button("back", W / 2 - 90, H - 52, 180, 40, "もどる", false);
  }

  function screenGameOver() {
    drawWorld();
    ctx.fillStyle = "rgba(6,6,10,0.78)"; ctx.fillRect(0, 0, W, H);

    shadowText("荏田高等学校　退学", W / 2, 152, "bold 44px sans-serif", "#ff6b6b");

    // 退学のはんこ
    ctx.save();
    ctx.translate(W / 2 + 320, 116); ctx.rotate(-0.24);
    ctx.strokeStyle = "#d0342c"; ctx.lineWidth = 4;
    ctx.strokeRect(-46, -30, 92, 60);
    ctx.fillStyle = "#d0342c";
    ctx.font = "bold 30px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("退学", 0, 2);
    ctx.restore();

    shadowText("→ 田奈高校へ", W / 2, 200, "bold 30px sans-serif", "#ffd25c");
    shadowText("飛距離 " + Math.floor(S.dist) + " m ／ " + stageAt(S.dist).name + "で力尽きた",
      W / 2, 240, "15px sans-serif", "rgba(255,255,255,0.85)");
    if (S.best > Math.floor(S.dist)) {
      shadowText("自己ベスト " + S.best + " m", W / 2, 264, "13px sans-serif", "rgba(255,255,255,0.6)");
    }

    button("retry", W / 2 - 110, 300, 220, 50, "もう一度飛ぶ", true);
    button("title", W / 2 - 110, 362, 220, 42, "タイトルへ", false);
  }

  function screenWin() {
    drawWorld();
    ctx.fillStyle = "rgba(6,6,10,0.74)"; ctx.fillRect(0, 0, W, H);
    shadowText("フック撃破！", W / 2, 138, "bold 50px sans-serif", "#ffd94a");
    shadowText("町田のファミマ前、決着。", W / 2, 176, "bold 17px sans-serif", "#fff");
    shadowText("山ちゃん「…俺の勝ちだな。」", W / 2, 214, "16px sans-serif", "rgba(255,255,255,0.9)");
    shadowText("フック「…次の服、探しに行くか。」", W / 2, 240, "16px sans-serif", "rgba(255,255,255,0.9)");
    shadowText("飛距離 " + Math.floor(S.dist) + " m ／ 靴 " + S.shoes + " 足",
      W / 2, 274, "14px sans-serif", "rgba(255,255,255,0.7)");
    button("retry", W / 2 - 110, 306, 220, 50, "もう一度飛ぶ", true);
    button("ency", W / 2 - 110, 368, 220, 42, "キャラクター図鑑", false);
  }

  /* ── ループ ────────────────────────────────────────────── */

  function frame(t) {
    const dt = Math.min((t - (last || t)) / 1000, 0.033);
    last = t; time += dt;

    if (mode === "playing") updatePlaying(dt);
    else if (mode === "boss") updateBoss(dt);
    else if (mode === "gameover" || mode === "win") updateParts(dt);

    buttons = [];
    if (mode === "title") screenTitle();
    else if (mode === "ency") screenEncyclopedia();
    else if (mode === "gameover") screenGameOver();
    else if (mode === "win") screenWin();
    else { drawWorld(); drawHUD(); }

    raf = requestAnimationFrame(frame);
  }

  /* ── 入力 ──────────────────────────────────────────────── */

  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (W / r.width),
      y: (e.clientY - r.top) * (H / r.height),
    };
  }

  function hitButton(pt) {
    for (const b of buttons) {
      if (pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) return b.id;
    }
    return null;
  }

  function activate(id) {
    if (id === "start" || id === "retry") { reset(); mode = "playing"; }
    else if (id === "ency") mode = "ency";
    else if (id === "back" || id === "title") mode = "title";
  }

  function onDown(e) {
    e.preventDefault();
    if (mode === "playing" || mode === "boss") { S.holding = true; return; }
    const id = hitButton(toCanvas(e));
    if (id) activate(id);
  }
  function onUp() { S.holding = false; }

  function onKeyDown(e) {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      if (mode === "playing" || mode === "boss") S.holding = true;
      else if (mode === "title") { reset(); mode = "playing"; }
      else if (mode === "gameover" || mode === "win") { reset(); mode = "playing"; }
      else if (mode === "ency") mode = "title";
    }
    if (e.code === "Escape" && mode === "ency") mode = "title";
  }
  function onKeyUp(e) {
    if (e.code === "Space" || e.code === "ArrowUp") S.holding = false;
  }
  function onMove(e) {
    if (mode === "playing" || mode === "boss") { canvas.style.cursor = "default"; return; }
    canvas.style.cursor = hitButton(toCanvas(e)) ? "pointer" : "default";
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  reset();
  mode = "title";
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
  };
}
