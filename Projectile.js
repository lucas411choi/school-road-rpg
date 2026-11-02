// Projectile.js — 문제집이 쏘는 나누기(÷) 기호. 일직선으로 날아가요.
import * as THREE from 'three';
import { mat, mesh, disposeTree } from '../game/util.js';
import { damagePlayer } from '../game/combat.js';

export class Projectile {
  /** (x, z)에서 (dirX, dirZ) 방향으로 발사. def = enemies.js 의 projectile, damage = 이번 발의 피해량 */
  constructor(x, z, dirX, dirZ, def, damage, scene) {
    this.x = x;
    this.z = z;
    this.dx = dirX;
    this.dz = dirZ;
    this.def = def;
    this.damage = damage;
    this.radius = def.radius;
    this.travelled = 0;
    this.scene = scene;

    // ÷ 모양: 가운데 막대 + 위아래 점 두 개 (바닥과 나란히 눕혀서 위에서 보면 ÷ 로 보여요)
    const m = mat(def.color, { emissive: def.color, emissiveIntensity: 0.6 });
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(1.0, 0.22, 0.22), m));
    for (const s of [-1, 1]) g.add(mesh(new THREE.SphereGeometry(0.2, 8, 6), m, 0, 0, s * 0.45));
    g.position.set(x, 1.1, z);
    this.root = g;
    scene.add(g);
  }

  /** 계속 날아가면 true, 사라져야 하면 false */
  update(dt, ctx) {
    const step = this.def.speed * dt;
    this.x += this.dx * step;
    this.z += this.dz * step;
    this.travelled += step;
    this.root.position.x = this.x;
    this.root.position.z = this.z;
    this.root.rotation.y += dt * 8; // 빙글빙글

    if (this.travelled > this.def.maxDistance) return false; // 너무 멀리 날아감
    if (ctx.world.pointBlocked(this.x, this.z)) return false; // 벽/장애물에 부딪힘

    const p = ctx.player;
    if (!p.dead && Math.hypot(p.x - this.x, p.z - this.z) < p.radius + this.radius) {
      if (damagePlayer(ctx, this.damage)) return false; // 맞았으면 사라져요 (무적 중이면 그냥 통과)
    }
    return true;
  }

  dispose() {
    this.scene.remove(this.root);
    disposeTree(this.root);
  }
}
