// ai.js — 문제집의 행동 두뇌
//  1) 플레이어가 감지 거리 안에 들어오면 추적 시작 (같은 무리도 함께 깨어나요)
//  2) 일정 거리(약 6~7)를 유지하면서
//  3) 약 1.8초 간격으로 ÷ 를 플레이어 방향으로 발사
//  4) 플레이어가 너무 가까이 오면 뒤로 살짝 물러남
import { lerp, lerpAngle, damp, randInt } from './util.js';
import { Projectile } from '../entities/Projectile.js';

export function updateEnemyAI(e, dt, ctx) {
  if (e.dead) return;
  const def = e.def;
  const p = ctx.player;
  e.stun = Math.max(0, e.stun - dt);
  e.shootCd -= dt;

  const dx = p.x - e.x;
  const dz = p.z - e.z;
  const d = Math.max(Math.hypot(dx, dz), 0.0001);

  // 1) 아직 못 봤으면 감지 거리만 확인해요
  if (!e.aggro) {
    if (!p.dead && d <= def.detectRange) ctx.wakeGroup(e.group);
    if (!e.aggro) {
      e.moveAmt = 0;
      return;
    }
  }

  // 플레이어 쪽을 바라봐요
  e.facing = lerpAngle(e.facing, Math.atan2(dx, dz), damp(10, dt));

  let speed = 0;
  if (e.stun <= 0 && !p.dead) {
    const [keepMin, keepMax] = def.keepDistance;
    let dir = 0; // +1: 다가감, -1: 물러남
    if (d > keepMax) {
      dir = 1;
      speed = def.moveSpeed;
    } else if (d < def.tooCloseDistance) {
      dir = -1; // 4) 너무 가까움 → 뒤로 물러나요
      speed = def.retreatSpeed;
    } else if (d < keepMin) {
      dir = -1; // 거리 유지: 천천히 물러나요
      speed = def.retreatSpeed * 0.5;
    }
    if (dir !== 0) ctx.world.move(e, (dx / d) * dir * speed * dt, (dz / d) * dir * speed * dt);

    // 3) 발사
    if (e.shootCd <= 0 && d <= def.detectRange + 2) {
      shoot(e, dx / d, dz / d, ctx);
      e.shootCd = def.attackInterval;
    }
  }
  e.moveAmt = lerp(e.moveAmt, speed > 0 ? 1 : 0, damp(10, dt));
}

function shoot(e, ux, uz, ctx) {
  const def = e.def;
  const dmg = randInt(def.damage[0], def.damage[1]); // 6 또는 7
  const off = e.radius + 0.2;
  ctx.projectiles.push(new Projectile(e.x + ux * off, e.z + uz * off, ux, uz, def.projectile, dmg, ctx.scene));
}

/** 적끼리, 그리고 적과 플레이어가 겹쳐서 뭉치지 않게 살짝 밀어내요 */
export function separateEnemies(ctx) {
  const list = ctx.enemies;
  const p = ctx.player;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a.dead) continue;

    // 플레이어와 겹치면 적을 밀어내요
    let dx = a.x - p.x;
    let dz = a.z - p.z;
    let d = Math.hypot(dx, dz);
    const minP = a.radius * 0.8 + p.radius;
    if (d < minP && d > 0.001) ctx.world.move(a, (dx / d) * (minP - d), (dz / d) * (minP - d));

    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      if (b.dead) continue;
      dx = b.x - a.x;
      dz = b.z - a.z;
      d = Math.hypot(dx, dz);
      const min = a.radius + b.radius;
      if (d < min && d > 0.001) {
        const push = (min - d) / 2;
        ctx.world.move(a, (-dx / d) * push, (-dz / d) * push);
        ctx.world.move(b, (dx / d) * push, (dz / d) * push);
      }
    }
  }
}
