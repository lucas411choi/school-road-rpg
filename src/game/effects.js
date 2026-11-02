// effects.js — 눈에 보이는 연출들
//  - slash: 무기를 휘두를 때 나오는 반투명 호(궤적)
//  - paperBurst: 문제집이 쓰러질 때 흩어지는 종이 조각
//  - floatText: 데미지 숫자처럼 화면에 떠올랐다 사라지는 글자
import * as THREE from 'three';
import { rand } from './util.js';

export class Effects {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.layer = document.getElementById('float-layer');
    this.arcs = new Map(); // 무기별 호 모양
    this.activeArc = null;
    this.slashT = -1;
    this.slashDur = 0.2;
    this.bits = [];
    this.bitGeo = new THREE.PlaneGeometry(0.28, 0.2);
    this.bitMats = [0xffffff, 0xfff3c4, 0xcfe3ff].map((c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    this._v = new THREE.Vector3();
  }

  // ---------- 무기 궤적 ----------
  _makeArc(w) {
    const half = (w.arcDeg * Math.PI) / 180 / 2;
    // 바닥에 눕힌 부채꼴 띠. 로컬 +X 방향이 가운데가 되게 만들어요
    const geo = new THREE.RingGeometry(w.range * 0.4, w.range * 1.15, 24, 1, -half, half * 2);
    const material = new THREE.MeshBasicMaterial({ color: w.slashColor, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false });
    const m = new THREE.Mesh(geo, material);
    m.rotation.x = -Math.PI / 2;
    const group = new THREE.Group();
    group.add(m);
    group.visible = false;
    this.scene.add(group);
    return { group, material, base: 0 };
  }

  /** (x, z)에서 facing 방향으로 휘두르는 호를 보여 줘요 */
  slash(x, z, facing, weapon) {
    let arc = this.arcs.get(weapon.id);
    if (!arc) {
      arc = this._makeArc(weapon);
      this.arcs.set(weapon.id, arc);
    }
    if (this.activeArc && this.activeArc !== arc) this.activeArc.group.visible = false;
    this.activeArc = arc;
    arc.base = facing - Math.PI / 2; // 로컬 +X → 월드에서 facing 방향
    arc.group.position.set(x, 0.12, z);
    arc.group.rotation.y = arc.base;
    arc.group.visible = true;
    this.slashT = 0;
  }

  // ---------- 종이 조각 ----------
  paperBurst(x, y, z) {
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(this.bitGeo, this.bitMats[i % 3]);
      m.position.set(x, y, z);
      m.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
      this.scene.add(m);
      this.bits.push({ m, vx: rand(-4, 4), vy: rand(3, 7), vz: rand(-4, 4), spin: rand(-12, 12), life: rand(0.7, 1.1), age: 0 });
    }
  }

  // ---------- 떠오르는 글자 ----------
  /** 월드 좌표 (x, y, z) 위치에서 글자가 떠올라요. cls: 'dmg' | 'hurt' | 'heal' */
  floatText(x, y, z, text, cls = 'dmg') {
    this.camera.updateMatrixWorld();
    this._v.set(x, y, z).project(this.camera);
    const el = document.createElement('div');
    el.className = `float ${cls}`;
    el.textContent = text;
    el.style.left = `${(this._v.x * 0.5 + 0.5) * window.innerWidth}px`;
    el.style.top = `${(-this._v.y * 0.5 + 0.5) * window.innerHeight}px`;
    this.layer.appendChild(el);
    const remove = () => el.remove();
    el.addEventListener('animationend', remove);
    setTimeout(remove, 1300);
  }

  update(dt) {
    // 공격 궤적: 살짝 쓸듯이 돌면서 사라져요
    if (this.slashT >= 0 && this.activeArc) {
      this.slashT += dt;
      const k = this.slashT / this.slashDur;
      if (k >= 1) {
        this.activeArc.group.visible = false;
        this.slashT = -1;
      } else {
        this.activeArc.material.opacity = 0.8 * (1 - k);
        this.activeArc.group.rotation.y = this.activeArc.base + (0.5 - k);
      }
    }
    // 종이 조각: 튀어 올랐다가 떨어지면서 작아져 사라져요
    for (let i = this.bits.length - 1; i >= 0; i--) {
      const b = this.bits[i];
      b.age += dt;
      b.vy -= 16 * dt;
      b.m.position.x += b.vx * dt;
      b.m.position.y = Math.max(0.05, b.m.position.y + b.vy * dt);
      b.m.position.z += b.vz * dt;
      b.m.rotation.x += b.spin * dt;
      b.m.rotation.z += b.spin * 0.7 * dt;
      const remain = b.life - b.age;
      if (remain < 0.25) b.m.scale.setScalar(Math.max(0.001, remain / 0.25));
      if (remain <= 0) {
        this.scene.remove(b.m);
        this.bits.splice(i, 1);
      }
    }
  }
}
