// combat.js — 전투 규칙: 플레이어의 부채꼴 공격(오토에임), 피해 처리
import { COMBAT, PLAYER } from '../config.js';
import { angleDiff } from './util.js';

/** 공격 시도. 쿨타임 중이면 아무 일도 안 일어나요. 공격이 나가면 true */
export function tryPlayerAttack(ctx) {
  const p = ctx.player;
  const w = p.weapon;
  if (!p.canAttack()) return false;

  // 오토에임: 가까운 적이 있으면 그쪽을 바라보고 휘둘러요 (모바일에서도 쉽게 맞추도록)
  let target = null;
  let best = COMBAT.autoAimRange;
  for (const e of ctx.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - p.x, e.z - p.z);
    if (d < best) {
      best = d;
      target = e;
    }
  }
  if (target) p.facing = Math.atan2(target.x - p.x, target.z - p.z);

  p.startSwing();
  ctx.effects.slash(p.x, p.z, p.facing, w);

  // 부채꼴 판정: 거리(적의 몸 크기 포함)와 각도를 검사해요
  const half = (w.arcDeg * Math.PI) / 180 / 2;
  for (const e of ctx.enemies) {
    if (e.dead) continue;
    const dx = e.x - p.x;
    const dz = e.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d - e.radius > w.range) continue;
    const spread = d > e.radius ? Math.asin(Math.min(1, e.radius / d)) : Math.PI; // 적의 몸 너비만큼 각도 보정
    if (Math.abs(angleDiff(p.facing, Math.atan2(dx, dz))) - spread > half) continue;
    damageEnemy(ctx, e, w.damage, p.x, p.z);
  }
  return true;
}

/** 적에게 피해: 깜빡임, 숫자 표시, 밀려남, 무리 깨우기, 쓰러짐 */
export function damageEnemy(ctx, e, dmg, fromX, fromZ) {
  e.hp = Math.max(0, e.hp - dmg);
  e.onHit();
  ctx.effects.floatText(e.x, e.parts.height + 0.5, e.z, String(dmg), 'dmg');

  // 살짝 밀려나요
  const dx = e.x - fromX;
  const dz = e.z - fromZ;
  const d = Math.hypot(dx, dz) || 1;
  ctx.world.move(e, (dx / d) * COMBAT.knockback, (dz / d) * COMBAT.knockback);

  ctx.wakeGroup(e.group);
  if (e.hp <= 0) {
    e.die();
    ctx.effects.paperBurst(e.x, 1.2, e.z); // 종이 조각이 흩어져요
    ctx.quests.onEnemyKilled(e);
  }
}

/** 플레이어에게 피해. 무적 시간이면 false (피해 없음) */
export function damagePlayer(ctx, amount) {
  const p = ctx.player;
  if (p.dead || p.invul > 0) return false;
  p.hp = Math.max(0, p.hp - amount);
  p.invul = PLAYER.invulnerableTime;
  ctx.hud.setHp(p.hp, p.maxHp);
  ctx.hud.hitFlash(); // 화면이 붉게 깜빡
  ctx.effects.floatText(p.x, 2.6, p.z, `-${amount}`, 'hurt');
  if (p.hp <= 0) {
    p.die();
    ctx.onPlayerDead();
  }
  return true;
}
