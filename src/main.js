// ============================================================
// main.js — 진입점 + 게임 루프
//
// 게임 상태(state)는 5가지예요:
//   'title'    시작 화면  →  '게임 시작'을 누르면 'playing'
//   'playing'  플레이 중  →  NPC에게 말을 걸면 'dialog', HP 0이면 'gameover', 정문 도착(+퀘스트 완료)이면 'clear'
//   'dialog'   NPC 대화 중 (게임 시간이 잠깐 멈춰요)
//   'gameover' 게임오버 화면  →  '다시 도전'
//   'clear'    클리어 화면
// 상태가 바뀌면 body 의 data-state 가 바뀌고, 보이는 화면은 style.css 가 알아서 바꿔 줘요.
// ============================================================
import './style.css';
import { PLAYER } from './config.js';
import { STAGE } from './data/stage.js';
import { ENEMIES } from './data/enemies.js';
import { NPCS } from './data/quests.js';
import { WEAPONS } from './data/weapons.js';
import { getPlayableCharacter } from './data/characters.js';
import { createRenderer, createScene } from './game/scene.js';
import { FollowCamera } from './game/camera.js';
import { Input } from './game/input.js';
import { World } from './game/world.js';
import { QuestSystem } from './game/quests.js';
import { Effects } from './game/effects.js';
import { tryPlayerAttack } from './game/combat.js';
import { updateEnemyAI, separateEnemies } from './game/ai.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { NPC } from './entities/NPC.js';
import { Hud } from './ui/hud.js';
import { Dialog } from './ui/dialog.js';
import { Screens } from './ui/screens.js';

// ---------- 준비 ----------
const canvas = document.getElementById('game-canvas');
const renderer = createRenderer(canvas);
const scene = createScene();
const cam = new FollowCamera();
const input = new Input(canvas);
const hud = new Hud();
const dialog = new Dialog();
const effects = new Effects(scene, cam.camera);
const world = new World(scene);
const quests = new QuestSystem(hud);
const ZERO = { x: 0, z: 0 };

/** 게임 전체 상태를 담는 보따리. 각 시스템이 이걸 받아서 일해요. */
const ctx = {
  state: 'title',
  scene, camera: cam.camera, world, input, hud, effects, quests,
  player: null,
  enemies: [],
  npcs: [],
  projectiles: [],
  zoneId: null, // 지금 있는 구간 (구간 이름 알림용)
  deadTimer: 0, // 쓰러진 뒤 게임오버 화면까지 기다리는 시간
  gateWarnCd: 0, // 정문 안내 문구를 너무 자주 띄우지 않게
  /** 같은 무리의 문제집을 모두 깨워요 */
  wakeGroup(group) {
    for (const e of this.enemies) if (e.group === group && !e.dead) e.wake();
  },
  onPlayerDead() {
    this.deadTimer = 1.1;
  },
};
window.__game = ctx; // 개발 중 브라우저 콘솔에서 __game 으로 상태를 들여다볼 수 있어요
ctx.step = (dt) => update(dt); // (개발/테스트용) 시간을 dt초만큼 직접 진행

function setState(state) {
  ctx.state = state;
  document.body.dataset.state = state;
  if (state !== 'playing') document.body.classList.remove('near-npc');
}

// ---------- 레벨 만들기 / 정리 ----------
function clearLevel() {
  for (const e of ctx.enemies) e.dispose();
  for (const n of ctx.npcs) n.dispose();
  for (const p of ctx.projectiles) p.dispose();
  if (ctx.player) ctx.player.dispose();
  ctx.enemies.length = 0;
  ctx.npcs.length = 0;
  ctx.projectiles.length = 0;
  world.circles.length = 0;
}

function buildLevel() {
  clearLevel();
  const character = getPlayableCharacter();
  const weapon = WEAPONS[character.weaponId];
  const player = new Player(character, weapon, scene);
  player.reset(STAGE.start.x, STAGE.start.z);
  ctx.player = player;

  for (const g of STAGE.enemyGroups) {
    for (const [x, z] of g.points) ctx.enemies.push(new Enemy(ENEMIES[g.enemy], x, z, g.group, scene, cam.camera));
  }
  for (const def of NPCS) {
    const npc = new NPC(def, scene);
    ctx.npcs.push(npc);
    world.circles.push({ x: npc.x, z: npc.z, r: npc.radius }); // NPC는 지나갈 수 없어요
  }

  quests.reset();
  hud.setName(character.name);
  hud.setHp(player.hp, player.maxHp);
  hud.setWeapon(weapon.name);
  cam.snap(player.x, player.z);
  ctx.zoneId = null;
  ctx.deadTimer = 0;
  ctx.gateWarnCd = 0;
}

function startGame() {
  buildLevel();
  setState('playing');
  input.flush();
}

// 퀘스트 보상: 체력 회복 + "퀘스트 완료!" 연출
quests.onComplete = (q) => {
  const p = ctx.player;
  const before = p.hp;
  p.heal(q.reward.heal);
  hud.setHp(p.hp, p.maxHp);
  effects.floatText(p.x, 2.6, p.z, `+${Math.round(p.hp - before)}`, 'heal');
  hud.banner('🎉 퀘스트 완료!');
};

// ---------- 대화 ----------
function findNearNpc() {
  const p = ctx.player;
  let near = null;
  let best = PLAYER.interactRange;
  for (const n of ctx.npcs) {
    const d = Math.hypot(n.x - p.x, n.z - p.z);
    if (d <= best) {
      best = d;
      near = n;
    }
  }
  return near;
}

function startDialog(npc) {
  const { lines, after } = quests.talk(npc.def);
  npc.faceTo(ctx.player.x, ctx.player.z);
  setState('dialog');
  input.flush();
  dialog.show(npc.def.name, lines, () => {
    if (after) after();
    input.flush();
    setState('playing');
  });
}

// ---------- 매 프레임 갱신 ----------
function updatePlaying(dt) {
  const p = ctx.player;

  // 공격: 버튼을 누르고 있거나, 방금 눌렀다면 쿨타임이 끝나는 순간 나가요
  if (!p.dead && (input.attackHeld() || input.attackBuffer > 0) && p.canAttack()) {
    tryPlayerAttack(ctx);
    input.attackBuffer = 0;
  }

  // NPC 근처: E 키 안내(PC) / 대화 버튼(모바일)
  const near = p.dead ? null : findNearNpc();
  document.body.classList.toggle('near-npc', !!near);
  if (near && input.takeInteract()) {
    startDialog(near);
    return;
  }

  // 구간이 바뀌면 이름을 알려 줘요
  const zone = STAGE.zones.find((z) => p.z <= z.from && p.z > z.to);
  if (zone && zone.id !== ctx.zoneId) {
    ctx.zoneId = zone.id;
    hud.toast(`📍 ${zone.name}`);
  }

  // 학교 정문 도착: 퀘스트를 모두 끝냈으면 클리어!
  ctx.gateWarnCd -= dt;
  if (!p.dead && p.z <= STAGE.gate.triggerZ) {
    if (quests.allDone()) {
      setState('clear');
      return;
    }
    if (ctx.gateWarnCd <= 0) {
      hud.toast('🚧 아직 끝내지 못한 퀘스트가 있어! 먼저 해결하자');
      ctx.gateWarnCd = 3;
    }
  }

  // 쓰러졌으면 잠깐 뒤에 게임오버 화면
  if (p.dead) {
    ctx.deadTimer -= dt;
    if (ctx.deadTimer <= 0) setState('gameover');
  }
}

function update(dt) {
  input.update(dt);
  const state = ctx.state;
  const p = ctx.player;

  if (state === 'dialog') {
    // 대화 중에는 게임 시간이 멈춰요. E / 스페이스 / 대화창 클릭으로 다음 줄
    if (input.takeInteract() || input.takeSpace()) {
      input.attackKey = false; // 스페이스를 누른 채로 대화가 끝나도 바로 공격하지 않게
      dialog.next();
    }
    for (const n of ctx.npcs) n.update(dt);
  } else {
    const playing = state === 'playing';
    p.update(dt, playing ? input.getMove() : ZERO, world);
    for (const e of ctx.enemies) {
      if (playing) updateEnemyAI(e, dt, ctx);
      e.update(dt);
    }
    if (playing) separateEnemies(ctx);
    for (let i = ctx.projectiles.length - 1; i >= 0; i--) {
      const pr = ctx.projectiles[i];
      if (!playing || !pr.update(dt, ctx)) {
        pr.dispose();
        ctx.projectiles.splice(i, 1);
      }
    }
    for (const n of ctx.npcs) {
      n.setMark(quests.markFor(n.def));
      n.update(dt);
    }
    if (playing) updatePlaying(dt);
  }

  effects.update(dt);
  cam.update(dt, p.x, p.z);
  input.endFrame();
}

// ---------- 게임 루프 ----------
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05); // 탭을 잠깐 떠났다 와도 한 번에 튀지 않게
  last = now;
  update(dt);
  renderer.render(scene, cam.camera);
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  cam.resize(w, h);
}
window.addEventListener('resize', onResize);

// ---------- 시작! ----------
onResize();
buildLevel();
setState('title');
new Screens({ onStart: startGame, onRetry: startGame, onRestart: startGame });
requestAnimationFrame(frame);
