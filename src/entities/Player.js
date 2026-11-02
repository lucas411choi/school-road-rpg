// Player.js — 주인공 (캐릭터 데이터 + 무기 데이터로 만들어져요)
import { PLAYER } from '../config.js';
import { buildHuman, poseHuman, makeBlobShadow, WEAPON_BUILDERS } from './models.js';
import { lerp, lerpAngle, damp, disposeTree } from '../game/util.js';

export class Player {
  constructor(charData, weapon, scene) {
    this.char = charData;
    this.weapon = weapon;
    this.scene = scene;
    this.radius = PLAYER.radius;
    this.maxHp = charData.maxHp;
    this.moveSpeed = charData.moveSpeed;

    this.parts = buildHuman({ ...charData.look, faceTexture: charData.faceTexture });
    this.root = this.parts.root;
    this.root.rotation.order = 'YXZ'; // 먼저 방향을 돌리고, 그 다음 앞으로 쓰러지게
    const buildWeapon = WEAPON_BUILDERS[weapon.model];
    if (buildWeapon) this.parts.hand.add(buildWeapon());
    this.shadow = makeBlobShadow(0.9);
    scene.add(this.root, this.shadow);

    this.reset(0, 0);
  }

  /** 시작 위치로 되돌리고 체력을 가득 채워요 */
  reset(x, z) {
    this.x = x;
    this.z = z;
    this.facing = Math.PI; // 화면 위쪽(-Z)을 바라봐요
    this.hp = this.maxHp;
    this.dead = false;
    this.fallT = 0;
    this.time = 0;
    this.moveAmt = 0;
    this.attackCd = 0; // 공격 쿨타임
    this.swingT = -1; // 휘두르는 중이면 0~1, 아니면 -1
    this.invul = 0; // 무적 시간
  }

  canAttack() {
    return this.attackCd <= 0 && !this.dead;
  }

  /** 공격 동작 시작 (피해 판정은 game/combat.js 가 해요) */
  startSwing() {
    this.attackCd = this.weapon.cooldown;
    this.swingT = 0;
  }

  heal(n) {
    this.hp = Math.min(this.maxHp, this.hp + n);
  }

  die() {
    this.dead = true;
    this.swingT = -1;
  }

  /** move = 월드 기준 이동 방향 {x, z} (길이 0~1) */
  update(dt, move, world) {
    this.time += dt;
    this.attackCd -= dt;
    this.invul -= dt;

    const len = Math.hypot(move.x, move.z);
    const moving = !this.dead && len > 0.05;
    if (moving) {
      const k = Math.min(len, 1);
      const sp = this.moveSpeed * k * dt;
      world.move(this, (move.x / len) * sp, (move.z / len) * sp);
      // 휘두르는 중이 아니면 이동 방향으로 몸을 돌려요
      if (this.swingT < 0) this.facing = lerpAngle(this.facing, Math.atan2(move.x, move.z), damp(PLAYER.turnSpeed, dt));
    }
    this.moveAmt = lerp(this.moveAmt, moving ? Math.min(len, 1) : 0, damp(12, dt));

    if (this.swingT >= 0) {
      this.swingT += dt / this.weapon.swingTime;
      if (this.swingT >= 1) this.swingT = -1;
    }
    poseHuman(this.parts, this.time, this.moveAmt, this.swingT);

    // 쓰러지는 연출
    if (this.dead) this.fallT = Math.min(1, this.fallT + dt / 0.45);
    this.root.position.set(this.x, this.fallT * 0.35, this.z);
    this.root.rotation.y = this.facing;
    this.root.rotation.x = this.fallT * (Math.PI / 2);
    // 맞은 직후 무적 시간에는 깜빡여요
    this.root.visible = this.dead || this.invul <= 0 || Math.floor(this.time * 18) % 2 === 0;
    this.shadow.position.set(this.x, 0.04, this.z);
  }

  dispose() {
    this.scene.remove(this.root, this.shadow);
    disposeTree(this.root);
    disposeTree(this.shadow);
  }
}
