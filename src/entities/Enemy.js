// Enemy.js — 살아난 문제집. 모습/움직임/체력바를 담당해요.
// (무엇을 할지 정하는 '두뇌'는 game/ai.js, 맞았을 때 처리는 game/combat.js)
import * as THREE from 'three';
import { COMBAT } from '../config.js';
import { buildWorkbook, makeBlobShadow } from './models.js';
import { disposeTree } from '../game/util.js';

export class Enemy {
  constructor(def, x, z, group, scene, camera) {
    this.def = def;
    this.group = group; // 같은 무리 이름 (퀘스트 집계, 무리 깨우기에 써요)
    this.scene = scene;
    this.camera = camera;
    this.x = x;
    this.z = z;
    this.facing = 0;
    this.radius = def.radius;
    this.maxHp = def.maxHp;
    this.hp = def.maxHp;
    this.aggro = false; // 플레이어를 발견했나?
    this.dead = false;
    this.shootCd = 0; // 다음 발사까지 남은 시간
    this.stun = 0; // 맞고 멈춰 있는 시간
    this.flashT = 0; // 흰색으로 번쩍이는 남은 시간
    this.popT = 0; // 맞았을 때 통통 커지는 연출 시간
    this.moveAmt = 0; // 움직이는 정도 (모션용)
    this.flashing = false;
    this.t = Math.random() * 10;

    this.parts = buildWorkbook(def);
    this.root = this.parts.root;
    this.shadow = makeBlobShadow(1.2);

    // 번쩍임 효과를 줄 재질 목록 (체력바를 붙이기 전에 모아요)
    const set = new Set();
    this.root.traverse((o) => {
      if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => set.add(m));
    });
    this.flashMats = [...set];

    // 머리 위 체력바: 카메라를 항상 바라보는 작은 판자 2장
    this.bar = new THREE.Group();
    this.bar.position.y = this.parts.height + 0.75;
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.26), new THREE.MeshBasicMaterial({ color: 0x2a1f3d, transparent: true, depthTest: false }));
    const fillGeo = new THREE.PlaneGeometry(1.5, 0.16);
    fillGeo.translate(0.75, 0, 0); // 왼쪽 끝을 기준으로 줄어들게
    this.fill = new THREE.Mesh(fillGeo, new THREE.MeshBasicMaterial({ color: 0x59e06b, transparent: true, depthTest: false }));
    this.fill.position.set(-0.75, 0, 0.01);
    bg.renderOrder = 20;
    this.fill.renderOrder = 21;
    this.bar.add(bg, this.fill);
    this.root.add(this.bar);

    scene.add(this.root, this.shadow);
    this._place();
  }

  _place() {
    this.root.position.set(this.x, 0, this.z);
    this.parts.model.rotation.y = this.facing;
    this.shadow.position.set(this.x, 0.04, this.z);
  }

  /** 플레이어를 발견! (첫 발사까지 잠깐 기다려요) */
  wake() {
    if (this.aggro || this.dead) return;
    this.aggro = true;
    this.shootCd = this.def.firstShotDelay;
  }

  /** 맞았을 때의 연출 (체력 계산은 combat.js 에서 해요) */
  onHit() {
    this.flashT = COMBAT.flashTime;
    this.popT = 0.15;
    this.stun = COMBAT.hitStun;
    this.shootCd = Math.max(this.shootCd, 0.6); // 맞으면 공격 준비가 늦어져요
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.fill.scale.x = Math.max(0.001, ratio);
    this.fill.material.color.setHex(ratio > 0.5 ? 0x59e06b : ratio > 0.25 ? 0xffd23f : 0xff5c6c);
  }

  update(dt) {
    if (this.dead) return;
    this.t += dt;
    const p = this.parts;

    // 걸을 때 통통 튀는 모션 (가만히 있어도 살짝 숨 쉬듯 움직여요)
    const moving = this.moveAmt > 0.1;
    p.model.position.y = moving ? Math.abs(Math.sin(this.t * 9)) * 0.3 * this.moveAmt : Math.abs(Math.sin(this.t * 2.5)) * 0.05;
    // 발사 직전에 몸을 부풀려서 '곧 쏜다!'를 알려줘요
    const charge = this.aggro && this.shootCd > 0 && this.shootCd < 0.35 ? 1 - this.shootCd / 0.35 : 0;
    this.popT = Math.max(0, this.popT - dt);
    const s = 1 + charge * 0.12 + Math.sin((this.popT / 0.15) * Math.PI) * 0.15;
    p.model.scale.set(s, s, s);
    const w = Math.sin(this.t * 9) * 0.7 * this.moveAmt;
    p.legs[0].rotation.x = w;
    p.legs[1].rotation.x = -w;
    p.arms[0].rotation.x = -w;
    p.arms[1].rotation.x = w;

    // 맞으면 흰색으로 번쩍!
    this.flashT = Math.max(0, this.flashT - dt);
    const f = this.flashT > 0;
    if (f !== this.flashing) {
      this.flashing = f;
      for (const m of this.flashMats) m.emissive.setHex(f ? 0xffffff : 0x000000);
    }

    this._place();
    this.bar.quaternion.copy(this.camera.quaternion); // 체력바는 항상 카메라를 향해요
  }

  die() {
    this.dead = true;
    this.scene.remove(this.root, this.shadow);
  }

  dispose() {
    this.scene.remove(this.root, this.shadow);
    disposeTree(this.root);
    disposeTree(this.shadow);
  }
}
