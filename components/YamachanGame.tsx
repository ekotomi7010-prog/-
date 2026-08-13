"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 「山ちゃんが飛ぶ!!」
 * ガラケー時代の「おばちゃんが飛ぶ」を下敷きにした、押しっぱなしで上昇/離すと落下する
 * 横スクロールフライトゲーム。一定距離を飛ぶとラスボス「フック」が登場する。
 */

const W = 800;
const H = 450;
const GROUND_Y = H - 40;
const CEIL_Y = 20;

const GRAVITY = 1500;
const THRUST = -2700;
const MAX_VY = 820;

const BOSS_DISTANCE = 2600; // メートル換算でここまで飛んだらボス出現
const BOSS_HP_MAX = 5;

type ObType = "takehiko" | "ebi" | "hashidate" | "yoshino" | "fuse";

interface Obstacle {
  type: ObType;
  x: number;
  y: number;
  vx: number;
  phase: number;
  cooldown: number;
  hit: boolean;
  passed: boolean;
}

interface Projectile {
  kind: "volleyball" | "note" | "cd";
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  toBoss?: boolean;
}

interface Item {
  kind: "clothes" | "cd" | "bento";
  x: number;
  y: number;
  r: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  text?: string;
}

type Mode = "title" | "encyclopedia" | "playing" | "boss" | "gameover" | "win" | "paused";

interface Bio {
  name: string;
  role: string;
  bullets: string[];
  color: string;
}

const BIOS: Bio[] = [
  {
    name: "山ちゃん",
    role: "主人公",
    bullets: ["白いタキシードがトレードマーク", "とにかくよく飛ぶ", "笑顔だけは一級品"],
    color: "#f5f0dc",
  },
  {
    name: "フック",
    role: "ラストボス",
    bullets: ["性格は怖い", "服が好き", "ギターボーカル", "ストレイテナーが好き"],
    color: "#2b2f3a",
  },
  {
    name: "エビちゃん",
    role: "山ちゃんの元カノ",
    bullets: ["ドラマー", "がりがり", "足が細い", "バットで殴ったら死ぬ"],
    color: "#e8c34a",
  },
  {
    name: "たけひこ",
    role: "バレーボール男子",
    bullets: ["元カノは平井", "ミットン", "芦田愛菜に似てる", "ギタリスト", "GANTZが好き"],
    color: "#6fa8dc",
  },
  {
    name: "ハシダテ",
    role: "ギターボーカル",
    bullets: [
      "ハンターハンターのグリードアイランド編をドッチ団平と勘違いしている",
      "急にデブになったり痩せたりする",
    ],
    color: "#c98a4b",
  },
  {
    name: "吉野",
    role: "ドラマー",
    bullets: [
      "鳥に似てる",
      "手首が固い",
      "ブサイク",
      "みんなに頭を殴られる",
      "メガネを壊されると「眼鏡はねえだろ!」ってキレる",
    ],
    color: "#8a8f98",
  },
  {
    name: "布施",
    role: "デポジット侍",
    bullets: [
      "南町田でキセルする",
      "ドラマー",
      "汐見という美容師に髪を切ってもらっている",
      "弁当箱を回収して回っている",
    ],
    color: "#7fb37f",
  },
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function YamachanGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<Mode>("title");
  const modeRef = useRef<Mode>("title");
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // ミュータブルなゲーム状態は ref に持たせて毎フレームの再レンダーを避ける
  const stateRef = useRef({
    player: { x: 150, y: H / 2, vy: 0, r: 20, lives: 3, invincible: 0, ammo: 0 },
    obstacles: [] as Obstacle[],
    projectiles: [] as Projectile[],
    items: [] as Item[],
    particles: [] as Particle[],
    distance: 0,
    scrollSpeed: 230,
    spawnTimer: 0,
    itemTimer: 0,
    holding: false,
    message: "",
    messageTimer: 0,
    boss: {
      x: W - 150,
      y: H / 2,
      hp: BOSS_HP_MAX,
      attackTimer: 1.2,
      pattern: 0,
      flinch: 0,
      enraged: false,
    },
    lastTime: 0,
  });

  function resetGame() {
    const s = stateRef.current;
    s.player = { x: 150, y: H / 2, vy: 0, r: 20, lives: 3, invincible: 1.2, ammo: 0 };
    s.obstacles = [];
    s.projectiles = [];
    s.items = [];
    s.particles = [];
    s.distance = 0;
    s.scrollSpeed = 230;
    s.spawnTimer = 1;
    s.itemTimer = 1.5;
    s.message = "";
    s.messageTimer = 0;
    s.boss = { x: W - 150, y: H / 2, hp: BOSS_HP_MAX, attackTimer: 1.6, pattern: 0, flinch: 0, enraged: false };
  }

  function showMessage(msg: string, dur = 1.6) {
    const s = stateRef.current;
    s.message = msg;
    s.messageTimer = dur;
  }

  function addParticles(x: number, y: number, color: string, count = 10) {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      s.particles.push({
        x,
        y,
        vx: rand(-160, 160),
        vy: rand(-220, -40),
        life: 0.6,
        maxLife: 0.6,
        color,
      });
    }
  }

  function loseLife(msg: string) {
    const s = stateRef.current;
    if (s.player.invincible > 0) return;
    s.player.lives -= 1;
    s.player.invincible = 1.4;
    addParticles(s.player.x, s.player.y, "#ff5c5c", 14);
    showMessage(msg);
    if (s.player.lives <= 0) {
      setMode("gameover");
    }
  }

  function instantDeath(msg: string) {
    const s = stateRef.current;
    if (s.player.invincible > 0) return;
    s.player.lives = 0;
    addParticles(s.player.x, s.player.y, "#ffd25c", 24);
    showMessage(msg, 2.2);
    setMode("gameover");
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    function onDown(e: Event) {
      e.preventDefault();
      stateRef.current.holding = true;
    }
    function onUp() {
      stateRef.current.holding = false;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        stateRef.current.holding = true;
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        stateRef.current.holding = false;
      }
    }

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function spawnObstacle() {
      const s = stateRef.current;
      const types: ObType[] = ["takehiko", "ebi", "hashidate", "yoshino", "fuse"];
      const weights = [3, 2, 3, 3, 1.4];
      let total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      let type: ObType = "takehiko";
      for (let i = 0; i < types.length; i++) {
        if (r < weights[i]) {
          type = types[i];
          break;
        }
        r -= weights[i];
      }
      const y = rand(CEIL_Y + 60, GROUND_Y - 60);
      s.obstacles.push({ type, x: W + 40, y, vx: -s.scrollSpeed, phase: Math.random() * Math.PI * 2, cooldown: rand(0.6, 1.2), hit: false, passed: false });
    }

    function spawnItem() {
      const s = stateRef.current;
      const kind: Item["kind"] = Math.random() < 0.55 ? "clothes" : Math.random() < 0.8 ? "cd" : "bento";
      const y = rand(CEIL_Y + 40, GROUND_Y - 40);
      s.items.push({ kind, x: W + 40, y, r: 12 });
    }

    function updatePlayer(dt: number) {
      const s = stateRef.current;
      const p = s.player;
      p.vy += (s.holding ? THRUST : GRAVITY) * dt;
      if (p.vy > MAX_VY) p.vy = MAX_VY;
      if (p.vy < -MAX_VY) p.vy = -MAX_VY;
      p.y += p.vy * dt;
      if (p.y < CEIL_Y) {
        p.y = CEIL_Y;
        p.vy = 0;
      }
      if (p.y > GROUND_Y) {
        p.y = GROUND_Y;
        loseLife("地面に激突！");
      }
      if (p.invincible > 0) p.invincible -= dt;
    }

    function updatePlaying(dt: number) {
      const s = stateRef.current;
      updatePlayer(dt);

      s.distance += s.scrollSpeed * dt * 0.06;
      s.scrollSpeed = Math.min(230 + s.distance * 0.18, 520);

      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) {
        spawnObstacle();
        s.spawnTimer = Math.max(1.5 - s.distance / 4000, 0.7) + Math.random() * 0.6;
      }
      s.itemTimer -= dt;
      if (s.itemTimer <= 0) {
        spawnItem();
        s.itemTimer = rand(1.1, 2.0);
      }

      // 障害物更新
      for (const ob of s.obstacles) {
        ob.x += ob.vx * dt;
        ob.phase += dt;
        if (ob.type === "takehiko") {
          ob.cooldown -= dt;
          if (ob.cooldown <= 0 && ob.x < W - 60 && ob.x > 80) {
            s.projectiles.push({ kind: "volleyball", x: ob.x, y: ob.y, vx: -420, vy: 0, r: 10 });
            ob.cooldown = 999;
          }
        }
        if (ob.type === "yoshino") {
          ob.y += Math.sin(ob.phase * 3) * 60 * dt;
        }

        const hbW = ob.type === "hashidate" ? 34 + Math.sin(ob.phase * 1.6) * 22 : 26;
        const dx = s.player.x - ob.x;
        const dy = s.player.y - ob.y;
        const dist = Math.hypot(dx, dy);
        if (!ob.hit && dist < hbW + s.player.r * 0.7) {
          ob.hit = true;
          if (ob.type === "ebi") {
            instantDeath("エビちゃんに接触…華奢すぎる衝撃で撃沈！");
          } else if (ob.type === "fuse") {
            s.player.ammo = Math.min(s.player.ammo + 1, 5);
            s.distance += 40;
            addParticles(ob.x, ob.y, "#7fb37f", 12);
            showMessage("デポジット侍・布施「弁当箱、回収！」南町田キセル成功で得点ボーナス！");
          } else if (ob.type === "hashidate" && Math.sin(ob.phase * 1.6) < -0.4) {
            addParticles(ob.x, ob.y, "#c98a4b", 8);
            showMessage("ハシダテが急に痩せた！スルー成功…ドッチ団平の話はまだ続いている");
          } else if (ob.type === "yoshino") {
            addParticles(ob.x, ob.y - 10, "#8a8f98", 10);
            showMessage("吉野「眼鏡はねえだろ！」メガネが粉砕！");
            loseLife("吉野にゲンコツを食らった！");
          } else {
            loseLife(ob.type === "takehiko" ? "たけひこに衝突！" : "ハシダテ（デブ状態）にぶつかった！");
          }
        }
      }
      s.obstacles = s.obstacles.filter((o) => o.x > -80);

      // 弾（バレーボール）
      for (const pr of s.projectiles) {
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;
      }
      s.projectiles = s.projectiles.filter((pr) => {
        if (pr.x < -40) return false;
        const dx = s.player.x - pr.x;
        const dy = s.player.y - pr.y;
        if (Math.hypot(dx, dy) < pr.r + s.player.r * 0.7) {
          loseLife("バレーボール直撃！");
          addParticles(pr.x, pr.y, "#ff8c3c", 8);
          return false;
        }
        return true;
      });

      // アイテム
      for (const it of s.items) {
        it.x -= s.scrollSpeed * dt;
      }
      s.items = s.items.filter((it) => {
        if (it.x < -30) return false;
        const dx = s.player.x - it.x;
        const dy = s.player.y - it.y;
        if (Math.hypot(dx, dy) < it.r + s.player.r * 0.7) {
          addParticles(it.x, it.y, it.kind === "clothes" ? "#f5f0dc" : it.kind === "cd" ? "#b0e0ff" : "#e0c060", 8);
          if (it.kind === "cd") {
            s.player.ammo = Math.min(s.player.ammo + 1, 5);
            showMessage("ストレイテナーのCDをゲット！(フックの私物…？)");
          } else if (it.kind === "clothes") {
            s.distance += 20;
            showMessage("お洒落な服をゲット！距離ボーナス！");
          } else {
            s.distance += 15;
          }
          return false;
        }
        return true;
      });

      // パーティクル
      updateParticles(dt);
      if (s.messageTimer > 0) s.messageTimer -= dt;

      if (s.distance >= BOSS_DISTANCE) {
        setMode("boss");
        showMessage("フック「…そこまでだ。」", 2);
      }
    }

    function updateParticles(dt: number) {
      const s = stateRef.current;
      for (const pt of s.particles) {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += 500 * dt;
        pt.life -= dt;
      }
      s.particles = s.particles.filter((p) => p.life > 0);
    }

    function updateBoss(dt: number) {
      const s = stateRef.current;
      updatePlayer(dt);
      if (s.player.x < W / 2 - 260) s.player.x += 200 * dt;
      s.player.x = Math.min(s.player.x, W / 2 - 260);

      const b = s.boss;
      b.enraged = b.hp <= BOSS_HP_MAX / 2;
      b.y = H / 2 + Math.sin(Date.now() / 900) * 60;
      if (b.flinch > 0) b.flinch -= dt;

      b.attackTimer -= dt;
      const interval = b.enraged ? 1.0 : 1.6;
      if (b.attackTimer <= 0 && b.flinch <= 0) {
        b.pattern = (b.pattern + 1) % 3;
        if (b.pattern === 0) {
          for (let i = -2; i <= 2; i++) {
            s.projectiles.push({ kind: "note", x: b.x, y: b.y + i * 34, vx: -360, vy: 0, r: 9 });
          }
        } else if (b.pattern === 1) {
          const dx = s.player.x - b.x;
          const dy = s.player.y - b.y;
          const len = Math.hypot(dx, dy) || 1;
          s.projectiles.push({ kind: "note", x: b.x, y: b.y, vx: (dx / len) * 380, vy: (dy / len) * 380, r: 11 });
        } else {
          for (let i = 0; i < 4; i++) {
            s.projectiles.push({ kind: "note", x: b.x, y: 60 + i * 100, vx: -340, vy: Math.sin(i) * 80, r: 9 });
          }
        }
        b.attackTimer = interval;
      }

      // 自動でCDを投げ返す
      if (s.player.ammo > 0) {
        s.player.ammo -= 1;
        s.projectiles.push({ kind: "cd", x: s.player.x, y: s.player.y, vx: 460, vy: 0, r: 10, toBoss: true });
      }

      for (const pr of s.projectiles) {
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;
      }
      s.projectiles = s.projectiles.filter((pr) => {
        if (pr.toBoss) {
          if (pr.x > W + 40) return false;
          const dx = b.x - pr.x;
          const dy = b.y - pr.y;
          if (Math.hypot(dx, dy) < 30 && b.flinch <= 0) {
            b.hp -= 1;
            b.flinch = 0.8;
            addParticles(b.x, b.y, "#ffd25c", 16);
            showMessage("フック「俺の服とCDに何しやがる…！」", 1.4);
            if (b.hp <= 0) {
              setMode("win");
            }
            return false;
          }
          return pr.x < W + 40;
        }
        if (pr.x < -40) return false;
        const dx = s.player.x - pr.x;
        const dy = s.player.y - pr.y;
        if (Math.hypot(dx, dy) < pr.r + s.player.r * 0.7) {
          loseLife("フックのギターノートを食らった！");
          addParticles(pr.x, pr.y, "#c9a6ff", 10);
          return false;
        }
        return true;
      });

      updateParticles(dt);
      if (s.messageTimer > 0) s.messageTimer -= dt;
    }

    function drawBackground() {
      const grad = ctx!.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#1a2140");
      grad.addColorStop(1, "#3c5a80");
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);

      ctx!.fillStyle = "rgba(255,255,255,0.5)";
      const t = Date.now() / 4000;
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 180 + t * 60) % (W + 200)) - 100;
        const cy = 60 + (i % 3) * 50;
        ctx!.beginPath();
        ctx!.ellipse(cx, cy, 34, 14, 0, 0, Math.PI * 2);
        ctx!.ellipse(cx + 24, cy + 4, 24, 12, 0, 0, Math.PI * 2);
        ctx!.fill();
      }

      // 遠景：荏田高等学校の校舎（パララックス、控えめに右へ流れる）
      const buildT = (Date.now() / 1000 * 20) % (W + 400);
      ctx!.save();
      ctx!.globalAlpha = 0.85;
      for (let i = -1; i < 2; i++) {
        const bx = ((W + 400) - buildT + i * (W + 400)) % (W + 800) - 400;
        ctx!.fillStyle = "#2c3446";
        ctx!.fillRect(bx, GROUND_Y - 90, 220, 104);
        ctx!.fillStyle = "#7fd1e0";
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 6; c++) {
            ctx!.fillRect(bx + 10 + c * 34, GROUND_Y - 78 + r * 28, 22, 16);
          }
        }
        ctx!.fillStyle = "#e8e2c8";
        ctx!.fillRect(bx + 60, GROUND_Y - 116, 100, 22);
        ctx!.strokeStyle = "#8a8360";
        ctx!.strokeRect(bx + 60, GROUND_Y - 116, 100, 22);
        ctx!.fillStyle = "#2c3446";
        ctx!.font = "bold 12px sans-serif";
        ctx!.textAlign = "center";
        ctx!.fillText("荏田高等学校", bx + 110, GROUND_Y - 100);
      }
      ctx!.restore();

      ctx!.fillStyle = "#25361f";
      ctx!.fillRect(0, GROUND_Y + 14, W, H - GROUND_Y - 14);
      ctx!.strokeStyle = "rgba(255,255,255,0.15)";
      ctx!.beginPath();
      ctx!.moveTo(0, GROUND_Y + 14);
      ctx!.lineTo(W, GROUND_Y + 14);
      ctx!.stroke();
      ctx!.strokeStyle = "rgba(255,255,255,0.1)";
      ctx!.beginPath();
      ctx!.moveTo(0, CEIL_Y - 4);
      ctx!.lineTo(W, CEIL_Y - 4);
      ctx!.stroke();
    }

    function label(text: string, x: number, y: number) {
      ctx!.font = "12px sans-serif";
      ctx!.textAlign = "center";
      ctx!.fillStyle = "rgba(0,0,0,0.55)";
      ctx!.fillText(text, x + 1, y + 1);
      ctx!.fillStyle = "#fff";
      ctx!.fillText(text, x, y);
    }

    function drawYamachan(x: number, y: number, flash: boolean) {
      ctx!.save();
      ctx!.translate(x, y);
      const tilt = Math.max(-0.4, Math.min(0.4, stateRef.current.player.vy / 1400));
      ctx!.rotate(tilt);
      if (flash && Math.floor(Date.now() / 90) % 2 === 0) ctx!.globalAlpha = 0.4;
      // 体（白タキシード）
      ctx!.fillStyle = "#f5f0dc";
      ctx!.beginPath();
      ctx!.ellipse(0, 10, 16, 20, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = "#d8cfa0";
      ctx!.lineWidth = 2;
      ctx!.stroke();
      // 顔
      ctx!.fillStyle = "#f2c49b";
      ctx!.beginPath();
      ctx!.arc(0, -12, 13, 0, Math.PI * 2);
      ctx!.fill();
      // 髪
      ctx!.fillStyle = "#1c1c1c";
      ctx!.beginPath();
      ctx!.arc(0, -18, 13, Math.PI, Math.PI * 2);
      ctx!.fill();
      // 笑顔
      ctx!.strokeStyle = "#7a4a2a";
      ctx!.lineWidth = 1.5;
      ctx!.beginPath();
      ctx!.arc(0, -8, 6, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx!.stroke();
      ctx!.fillStyle = "#222";
      ctx!.beginPath();
      ctx!.arc(-4, -14, 1.4, 0, Math.PI * 2);
      ctx!.arc(4, -14, 1.4, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    function drawObstacle(ob: Obstacle) {
      ctx!.save();
      ctx!.translate(ob.x, ob.y);
      switch (ob.type) {
        case "takehiko": {
          ctx!.fillStyle = "#6fa8dc";
          ctx!.beginPath();
          ctx!.ellipse(0, 6, 15, 18, 0, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.fillStyle = "#f2c49b";
          ctx!.beginPath();
          ctx!.arc(0, -14, 12, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.fillStyle = "#2b2b2b";
          ctx!.beginPath();
          ctx!.arc(0, -19, 12, Math.PI, Math.PI * 2);
          ctx!.fill();
          ctx!.fillStyle = "#ffcf5c";
          ctx!.beginPath();
          ctx!.arc(22, -6, 8, 0, Math.PI * 2);
          ctx!.stroke();
          ctx!.fill();
          label("たけひこ", 0, -36);
          break;
        }
        case "ebi": {
          ctx!.fillStyle = "#e8c34a";
          ctx!.strokeStyle = "#c9a020";
          ctx!.lineWidth = 4;
          ctx!.beginPath();
          ctx!.moveTo(0, -6);
          ctx!.lineTo(0, 22);
          ctx!.stroke();
          ctx!.beginPath();
          ctx!.moveTo(-8, 6);
          ctx!.lineTo(8, 6);
          ctx!.stroke();
          ctx!.beginPath();
          ctx!.moveTo(0, 22);
          ctx!.lineTo(-7, 34);
          ctx!.moveTo(0, 22);
          ctx!.lineTo(7, 34);
          ctx!.stroke();
          ctx!.fillStyle = "#f2c49b";
          ctx!.beginPath();
          ctx!.arc(0, -14, 10, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.fillStyle = "#e8c34a";
          ctx!.beginPath();
          ctx!.arc(0, -19, 10, Math.PI, Math.PI * 2);
          ctx!.fill();
          ctx!.fillRect(-14, -24, 5, 14);
          ctx!.fillRect(9, -24, 5, 14);
          label("エビちゃん", 0, -40);
          break;
        }
        case "hashidate": {
          const scale = 1 + Math.sin(ob.phase * 1.6) * 0.55;
          ctx!.scale(scale, scale);
          ctx!.fillStyle = "#c98a4b";
          ctx!.beginPath();
          ctx!.ellipse(0, 8, 18, 20, 0, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.fillStyle = "#f2c49b";
          ctx!.beginPath();
          ctx!.arc(0, -16, 11, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.strokeStyle = "#5a3a1a";
          ctx!.lineWidth = 3;
          ctx!.beginPath();
          ctx!.moveTo(-20, 4);
          ctx!.lineTo(20, -2);
          ctx!.stroke();
          ctx!.restore();
          ctx!.save();
          ctx!.translate(ob.x, ob.y);
          label("ハシダテ", 0, -40 - Math.max(0, Math.sin(ob.phase * 1.6) * 20));
          break;
        }
        case "yoshino": {
          ctx!.fillStyle = "#8a8f98";
          ctx!.beginPath();
          ctx!.ellipse(0, 6, 13, 16, 0, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.fillStyle = "#cfd3d8";
          ctx!.beginPath();
          ctx!.arc(0, -12, 10, 0, Math.PI * 2);
          ctx!.fill();
          // 鳥のようなくちばし
          ctx!.fillStyle = "#e0a030";
          ctx!.beginPath();
          ctx!.moveTo(9, -12);
          ctx!.lineTo(22, -9);
          ctx!.lineTo(9, -6);
          ctx!.fill();
          // メガネ
          ctx!.strokeStyle = "#222";
          ctx!.lineWidth = 1.5;
          ctx!.beginPath();
          ctx!.arc(-4, -12, 4, 0, Math.PI * 2);
          ctx!.arc(4, -12, 4, 0, Math.PI * 2);
          ctx!.stroke();
          label("吉野", 0, -34);
          break;
        }
        case "fuse": {
          ctx!.fillStyle = "#7fb37f";
          ctx!.beginPath();
          ctx!.ellipse(0, 6, 14, 17, 0, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.fillStyle = "#f2c49b";
          ctx!.beginPath();
          ctx!.arc(0, -14, 11, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.fillStyle = "#5a3a1a";
          ctx!.beginPath();
          ctx!.arc(0, -19, 11, Math.PI, Math.PI * 2);
          ctx!.fill();
          // 弁当箱
          ctx!.fillStyle = "#d6d6d6";
          ctx!.fillRect(14, 0, 14, 10);
          ctx!.strokeStyle = "#999";
          ctx!.strokeRect(14, 0, 14, 10);
          label("布施(デポジット侍)", 0, -36);
          break;
        }
      }
      ctx!.restore();
    }

    function drawProjectile(pr: Projectile) {
      ctx!.save();
      ctx!.translate(pr.x, pr.y);
      if (pr.kind === "volleyball") {
        ctx!.fillStyle = "#f2f2f2";
        ctx!.beginPath();
        ctx!.arc(0, 0, pr.r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.strokeStyle = "#c66";
        ctx!.stroke();
      } else if (pr.kind === "note") {
        ctx!.fillStyle = "#c9a6ff";
        ctx!.font = "18px sans-serif";
        ctx!.textAlign = "center";
        ctx!.fillText("♪", 0, 6);
      } else {
        ctx!.fillStyle = "#dfefff";
        ctx!.beginPath();
        ctx!.arc(0, 0, pr.r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = "#8fb8d6";
        ctx!.beginPath();
        ctx!.arc(0, 0, 3, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }

    function drawItem(it: Item) {
      ctx!.save();
      ctx!.translate(it.x, it.y);
      ctx!.font = "20px sans-serif";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      if (it.kind === "clothes") ctx!.fillText("👔", 0, 0);
      else if (it.kind === "cd") ctx!.fillText("💿", 0, 0);
      else ctx!.fillText("🍱", 0, 0);
      ctx!.restore();
    }

    function drawHook(enraged: boolean, flinch: number) {
      const s = stateRef.current;
      const b = s.boss;
      ctx!.save();
      ctx!.translate(b.x, b.y);
      if (flinch > 0) ctx!.translate(rand(-4, 4), rand(-4, 4));
      ctx!.fillStyle = enraged ? "#3a2030" : "#20232e";
      ctx!.beginPath();
      ctx!.ellipse(0, 14, 26, 34, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = "#888";
      ctx!.lineWidth = 3;
      ctx!.beginPath();
      ctx!.moveTo(0, -4);
      ctx!.lineTo(-6, 30);
      ctx!.moveTo(0, -4);
      ctx!.lineTo(6, 30);
      ctx!.stroke();
      ctx!.fillStyle = "#f2c49b";
      ctx!.beginPath();
      ctx!.arc(0, -22, 18, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = "#241c14";
      ctx!.beginPath();
      ctx!.arc(0, -28, 18, Math.PI, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = "#111";
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.arc(-7, -22, 6, 0, Math.PI * 2);
      ctx!.arc(7, -22, 6, 0, Math.PI * 2);
      ctx!.moveTo(-1, -22);
      ctx!.lineTo(1, -22);
      ctx!.stroke();
      ctx!.fillStyle = "#111";
      ctx!.fillRect(-9, -24, 4, 3);
      ctx!.fillRect(5, -24, 4, 3);
      // ギター
      ctx!.save();
      ctx!.translate(-30, 10);
      ctx!.rotate(-0.5);
      ctx!.fillStyle = "#8a4a2a";
      ctx!.beginPath();
      ctx!.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillRect(-2, -34, 4, 22);
      ctx!.restore();
      ctx!.restore();
      label("フック", b.x, b.y - 58);
    }

    function drawParticles() {
      const s = stateRef.current;
      for (const pt of s.particles) {
        ctx!.globalAlpha = Math.max(pt.life / pt.maxLife, 0);
        ctx!.fillStyle = pt.color;
        ctx!.beginPath();
        ctx!.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    function drawHUD() {
      const s = stateRef.current;
      ctx!.fillStyle = "#fff";
      ctx!.font = "bold 14px sans-serif";
      ctx!.textAlign = "left";
      ctx!.fillText("♥".repeat(Math.max(s.player.lives, 0)) + "♡".repeat(Math.max(3 - s.player.lives, 0)), 14, 26);
      ctx!.fillText(`飛距離: ${Math.floor(s.distance)}m`, 14, 46);
      ctx!.fillText(`CD: ${s.player.ammo}`, 14, 66);

      if (modeRef.current === "playing") {
        const pct = Math.min(s.distance / BOSS_DISTANCE, 1);
        ctx!.fillStyle = "rgba(255,255,255,0.25)";
        ctx!.fillRect(W - 220, 16, 200, 12);
        ctx!.fillStyle = "#ffd25c";
        ctx!.fillRect(W - 220, 16, 200 * pct, 12);
        ctx!.strokeStyle = "#fff";
        ctx!.strokeRect(W - 220, 16, 200, 12);
        ctx!.fillStyle = "#fff";
        ctx!.font = "11px sans-serif";
        ctx!.textAlign = "right";
        ctx!.fillText("フックまで", W - 20, 12);
      }
      if (modeRef.current === "boss") {
        const pct = Math.max(s.boss.hp / BOSS_HP_MAX, 0);
        ctx!.fillStyle = "rgba(255,255,255,0.25)";
        ctx!.fillRect(W - 260, 16, 240, 14);
        ctx!.fillStyle = "#ff5c5c";
        ctx!.fillRect(W - 260, 16, 240 * pct, 14);
        ctx!.strokeStyle = "#fff";
        ctx!.strokeRect(W - 260, 16, 240, 14);
        ctx!.fillStyle = "#fff";
        ctx!.font = "11px sans-serif";
        ctx!.textAlign = "right";
        ctx!.fillText("フック HP", W - 20, 12);
      }

      if (s.messageTimer > 0) {
        ctx!.textAlign = "center";
        ctx!.font = "bold 16px sans-serif";
        ctx!.fillStyle = "rgba(0,0,0,0.55)";
        ctx!.fillText(s.message, W / 2 + 1, 401);
        ctx!.fillStyle = "#fff";
        ctx!.fillText(s.message, W / 2, 400);
      }
    }

    function draw() {
      const s = stateRef.current;
      drawBackground();
      for (const it of s.items) drawItem(it);
      for (const ob of s.obstacles) drawObstacle(ob);
      for (const pr of s.projectiles) drawProjectile(pr);
      if (modeRef.current === "boss") drawHook(s.boss.enraged, s.boss.flinch);
      drawYamachan(s.player.x, s.player.y, s.player.invincible > 0);
      drawParticles();
      drawHUD();
    }

    function loop(t: number) {
      const s = stateRef.current;
      const dt = Math.min((t - (s.lastTime || t)) / 1000, 0.033);
      s.lastTime = t;

      if (modeRef.current === "playing") updatePlaying(dt);
      else if (modeRef.current === "boss") updateBoss(dt);
      else if (modeRef.current === "gameover" || modeRef.current === "win") {
        updateParticles(dt);
      }

      draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  function handleStart() {
    resetGame();
    setMode("playing");
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8 px-4">
      <h1 className="text-2xl font-bold tracking-wide">山ちゃんが飛ぶ!!</h1>
      <p className="text-xs text-gray-500">舞台：荏田高等学校</p>
      <p className="text-sm text-gray-400">
        押しっぱなし / タップ長押し / Space・↑キーで上昇。離すと落下します。
      </p>
      <div className="relative w-full max-w-3xl">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full h-auto rounded-lg border border-gray-700 touch-none select-none"
        />

        {mode === "title" && (
          <Overlay>
            <h2 className="text-3xl font-bold mb-1">山ちゃんが飛ぶ!!</h2>
            <p className="text-xs mb-2 text-gray-400">舞台：荏田高等学校</p>
            <p className="text-sm mb-6 text-gray-300">
              放課後の荏田高校の空を、ラスボス「フック」を目指してひたすら飛べ！
            </p>
            <button onClick={handleStart} className="btn-primary">
              スタート
            </button>
            <button onClick={() => setMode("encyclopedia")} className="btn-secondary mt-3">
              キャラクター図鑑
            </button>
          </Overlay>
        )}

        {mode === "encyclopedia" && (
          <Overlay>
            <h2 className="text-xl font-bold mb-3">キャラクター図鑑</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto text-left w-full max-w-2xl px-2">
              {BIOS.map((b) => (
                <div key={b.name} className="rounded-md border border-gray-600 p-3 bg-black/30">
                  <div className="font-bold" style={{ color: b.color }}>
                    {b.name}
                    <span className="ml-2 text-xs text-gray-400 font-normal">{b.role}</span>
                  </div>
                  <ul className="mt-1 text-xs text-gray-300 list-disc list-inside">
                    {b.bullets.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <button onClick={() => setMode("title")} className="btn-secondary mt-4">
              もどる
            </button>
          </Overlay>
        )}

        {mode === "gameover" && (
          <Overlay>
            <h2 className="text-3xl font-bold mb-2 text-red-400">GAME OVER</h2>
            <p className="text-sm mb-6 text-gray-300">
              飛距離: {Math.floor(stateRef.current.distance)}m
            </p>
            <button onClick={handleStart} className="btn-primary">
              もう一度飛ぶ
            </button>
            <button onClick={() => setMode("title")} className="btn-secondary mt-3">
              タイトルへ
            </button>
          </Overlay>
        )}

        {mode === "win" && (
          <Overlay>
            <h2 className="text-3xl font-bold mb-2 text-yellow-300">フック撃破！</h2>
            <p className="text-sm mb-4 text-gray-300">
              山ちゃん「…俺の勝ちだな。」
              <br />
              フック「…次の服、探しに行くか。」
            </p>
            <button onClick={handleStart} className="btn-primary">
              もう一度飛ぶ
            </button>
            <button onClick={() => setMode("encyclopedia")} className="btn-secondary mt-3">
              キャラクター図鑑
            </button>
          </Overlay>
        )}
      </div>

      <style jsx global>{`
        .btn-primary {
          padding: 10px 28px;
          border-radius: 9999px;
          background: #f5c542;
          color: #1a1a1a;
          font-weight: 700;
        }
        .btn-secondary {
          padding: 8px 22px;
          border-radius: 9999px;
          background: transparent;
          border: 1px solid #888;
          color: #eee;
        }
      `}</style>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-black/70 rounded-lg p-4">
      {children}
    </div>
  );
}
