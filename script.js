const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const coinCount = document.querySelector("#coin-count");
const message = document.querySelector("#game-message");
const messageIcon = document.querySelector("#message-icon");
const messageTitle = document.querySelector("#message-title");
const messageCopy = document.querySelector("#message-copy");
const keys = new Set();
const touchInputs = new Set();

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WORLD_WIDTH = 2800;
const GRAVITY = 0.55;

const platforms = [
  { x: 0, y: 475, w: 440, h: 90 },
  { x: 510, y: 475, w: 365, h: 90 },
  { x: 945, y: 475, w: 445, h: 90 },
  { x: 1460, y: 475, w: 410, h: 90 },
  { x: 1940, y: 475, w: 390, h: 90 },
  { x: 2390, y: 475, w: 410, h: 90 },
  { x: 235, y: 380, w: 125, h: 18 },
  { x: 610, y: 375, w: 130, h: 18 },
  { x: 790, y: 320, w: 105, h: 18 },
  { x: 1080, y: 390, w: 125, h: 18 },
  { x: 1280, y: 335, w: 115, h: 18 },
  { x: 1575, y: 375, w: 130, h: 18 },
  { x: 1780, y: 315, w: 115, h: 18 },
  { x: 2045, y: 385, w: 120, h: 18 },
  { x: 2220, y: 325, w: 120, h: 18 },
  { x: 2490, y: 380, w: 120, h: 18 }
];

const coinSpots = [
  [290, 340], [668, 335], [836, 280], [1138, 350],
  [1338, 295], [1635, 335], [1837, 275], [2278, 285]
];

let player;
let coins;
let enemies;
let cameraX;
let state;
let lastTime = 0;
let jumpRequested = false;

function resetGame() {
  player = { x: 70, y: 410, w: 30, h: 42, vx: 0, vy: 0, grounded: false, facing: 1 };
  coins = coinSpots.map(([x, y]) => ({ x, y, collected: false, phase: Math.random() * Math.PI * 2 }));
  enemies = [
    { x: 690, y: 443, min: 635, max: 820, speed: 1.15, direction: 1 },
    { x: 1600, y: 443, min: 1510, max: 1810, speed: 1.35, direction: -1 },
    { x: 2110, y: 443, min: 1990, max: 2280, speed: 1.1, direction: 1 }
  ];
  cameraX = 0;
  state = "playing";
  jumpRequested = false;
  keys.clear();
  touchInputs.clear();
  coinCount.textContent = "0";
  message.hidden = true;
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update(delta) {
  if (state !== "playing") return;
  const step = Math.min(delta / 16.67, 2);
  const left = keys.has("ArrowLeft") || keys.has("a") || touchInputs.has("left");
  const right = keys.has("ArrowRight") || keys.has("d") || touchInputs.has("right");

  player.vx = (right - left) * 3.8;
  if (player.vx !== 0) player.facing = Math.sign(player.vx);
  if (jumpRequested && player.grounded) {
    player.vy = -11.5;
    player.grounded = false;
  }
  jumpRequested = false;

  const previousBottom = player.y + player.h;
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x + player.vx * step));
  player.vy = Math.min(player.vy + GRAVITY * step, 13);
  player.y += player.vy * step;
  player.grounded = false;

  for (const platform of platforms) {
    const horizontalOverlap = player.x + player.w > platform.x && player.x < platform.x + platform.w;
    if (horizontalOverlap && player.vy >= 0 && previousBottom <= platform.y && player.y + player.h >= platform.y) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.grounded = true;
    }
  }

  for (const coin of coins) {
    if (!coin.collected && overlaps(player, { x: coin.x - 12, y: coin.y - 12, w: 24, h: 24 })) {
      coin.collected = true;
      coinCount.textContent = String(coins.filter(item => item.collected).length);
    }
  }

  for (const enemy of enemies) {
    enemy.x += enemy.speed * enemy.direction * step;
    if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.direction *= -1;
    if (overlaps(player, { x: enemy.x, y: enemy.y, w: 32, h: 32 })) {
      finishGame(false);
      return;
    }
  }

  if (player.y > HEIGHT + 100) {
    finishGame(false);
    return;
  }
  if (player.x > 2690) finishGame(true);

  cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, player.x - WIDTH * 0.36));
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#83bce9");
  sky.addColorStop(1, "#d4e9f4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(255,255,255,0.44)";
  for (let i = 0; i < 7; i++) {
    const x = ((i * 197 - cameraX * 0.18) % (WIDTH + 180) + WIDTH + 180) % (WIDTH + 180) - 70;
    const y = 82 + (i % 3) * 72;
    drawCloud(x, y, 0.72 + (i % 2) * 0.25);
  }

  ctx.fillStyle = "#9bc8d8";
  for (let i = 0; i < 7; i++) {
    const x = i * 190 - (cameraX * 0.34 % 190);
    ctx.beginPath();
    ctx.moveTo(x - 100, 475);
    ctx.lineTo(x + 55, 295 + (i % 3) * 32);
    ctx.lineTo(x + 210, 475);
    ctx.fill();
  }
}

function drawCloud(x, y, scale) {
  ctx.beginPath();
  ctx.ellipse(x, y + 8 * scale, 37 * scale, 13 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 18 * scale, y + 2 * scale, 17 * scale, 15 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 3 * scale, y - 5 * scale, 22 * scale, 21 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 24 * scale, y + 2 * scale, 18 * scale, 15 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawWorld(time) {
  ctx.save();
  ctx.translate(-cameraX, 0);

  for (const platform of platforms) {
    ctx.fillStyle = platform.h > 20 ? "#55998e" : "#6eaa9b";
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = "#8bceb1";
    ctx.fillRect(platform.x, platform.y, platform.w, 7);
    ctx.fillStyle = "rgba(33, 87, 92, 0.18)";
    for (let x = platform.x + 14; x < platform.x + platform.w; x += 32) {
      ctx.fillRect(x, platform.y + 19, 9, 5);
    }
  }

  for (const coin of coins) {
    if (coin.collected) continue;
    const bob = Math.sin(time / 300 + coin.phase) * 4;
    ctx.fillStyle = "rgba(255, 202, 82, 0.26)";
    ctx.beginPath();
    ctx.arc(coin.x, coin.y + bob, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffcf62";
    ctx.beginPath();
    ctx.ellipse(coin.x, coin.y + bob, 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff0a8";
    ctx.fillRect(coin.x - 2, coin.y - 6 + bob, 2, 6);
  }

  for (const enemy of enemies) drawEnemy(enemy);
  drawGoal();
  drawPlayer();
  ctx.restore();
}

function drawEnemy(enemy) {
  ctx.fillStyle = "#e47772";
  ctx.beginPath();
  ctx.roundRect(enemy.x, enemy.y, 32, 30, [14, 14, 8, 8]);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(enemy.x + 7, enemy.y + 9, 6, 7);
  ctx.fillRect(enemy.x + 20, enemy.y + 9, 6, 7);
  ctx.fillStyle = "#273147";
  ctx.fillRect(enemy.x + (enemy.direction > 0 ? 10 : 8), enemy.y + 12, 3, 4);
  ctx.fillRect(enemy.x + (enemy.direction > 0 ? 23 : 21), enemy.y + 12, 3, 4);
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;
  ctx.fillStyle = "rgba(36, 68, 96, 0.18)";
  ctx.beginPath();
  ctx.ellipse(x + player.w / 2, y + player.h + 3, 17, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#304e75";
  ctx.fillRect(x + 4, y + 21, 22, 18);
  ctx.fillStyle = "#f4bd91";
  ctx.beginPath();
  ctx.roundRect(x + 5, y + 2, 21, 23, 7);
  ctx.fill();
  ctx.fillStyle = "#34466e";
  ctx.beginPath();
  ctx.roundRect(x + 3, y, 25, 10, [9, 9, 3, 3]);
  ctx.fill();
  ctx.fillStyle = "#263653";
  const eyeX = player.facing > 0 ? x + 20 : x + 9;
  ctx.fillRect(eyeX, y + 12, 3, 4);
  ctx.fillStyle = "#f2d579";
  ctx.fillRect(x + 7, y + 39, 8, 3);
  ctx.fillRect(x + 19, y + 39, 8, 3);
}

function drawGoal() {
  ctx.fillStyle = "#53647d";
  ctx.fillRect(2730, 365, 5, 110);
  ctx.fillStyle = "#ffdb79";
  ctx.beginPath();
  ctx.moveTo(2735, 367);
  ctx.lineTo(2785, 380);
  ctx.lineTo(2735, 394);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f7f5e9";
  ctx.beginPath();
  ctx.ellipse(2732, 475, 23, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

function finishGame(won) {
  state = won ? "won" : "lost";
  messageIcon.textContent = won ? "🏆" : "💫";
  messageTitle.textContent = won ? "ゴール！" : "もう一度！";
  const collected = coins.filter(coin => coin.collected).length;
  messageCopy.textContent = won
    ? `コインを ${collected} 枚集めました。空の冒険クリア！`
    : "敵にぶつかったか、足場から落ちてしまいました。";
  message.hidden = false;
}

function frame(time) {
  const delta = lastTime ? time - lastTime : 16.67;
  lastTime = time;
  update(delta);
  drawBackground();
  drawWorld(time);
  requestAnimationFrame(frame);
}

document.addEventListener("keydown", event => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (["ArrowLeft", "ArrowRight", " ", "ArrowUp"].includes(event.key)) event.preventDefault();
  if (!keys.has(key) && [" ", "ArrowUp", "w"].includes(key)) jumpRequested = true;
  keys.add(key);
});

document.addEventListener("keyup", event => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

window.addEventListener("blur", () => keys.clear());
document.querySelector("#restart-button").addEventListener("click", resetGame);
document.querySelector("#play-again-button").addEventListener("click", resetGame);

for (const button of document.querySelectorAll("[data-control]")) {
  const control = button.dataset.control;
  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    if (control === "jump") jumpRequested = true;
    else touchInputs.add(control);
  });
  const release = () => touchInputs.delete(control);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

resetGame();
requestAnimationFrame(frame);
