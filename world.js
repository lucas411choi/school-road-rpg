// world.js — 맵(도로·건물·나무·간판)을 만들고, 이동/충돌을 판정해요
import * as THREE from 'three';
import { STAGE } from '../data/stage.js';
import { mat, mesh, box } from './util.js';
import { makeWindowTexture, makeSignTexture } from './textures.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.walk = STAGE.walk;
    // 장애물은 사각형(AABB)으로 판정해요
    this.obstacles = STAGE.obstacles.map((o) => ({
      x1: o.x - o.w / 2, x2: o.x + o.w / 2, z1: o.z - o.d / 2, z2: o.z + o.d / 2,
    }));
    this.circles = []; // NPC처럼 서 있는 원형 장애물 (main.js 가 채워 넣어요)
    this._build();
  }

  // ==================== 이동 / 충돌 ====================
  _inWalk(x, z) {
    for (const r of this.walk) {
      if (x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2) return true;
    }
    return false;
  }

  /** 반지름 r인 원이 (x, z)에 서 있을 수 있나? (길 밖/장애물/NPC에 걸리면 false) */
  canStand(x, z, r) {
    const inside = this._inWalk(x - r, z - r) && this._inWalk(x + r, z - r) && this._inWalk(x - r, z + r) && this._inWalk(x + r, z + r);
    if (!inside) return false;
    for (const o of this.obstacles) {
      const cx = Math.max(o.x1, Math.min(x, o.x2));
      const cz = Math.max(o.z1, Math.min(z, o.z2));
      if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return false;
    }
    for (const c of this.circles) {
      if ((x - c.x) ** 2 + (z - c.z) ** 2 < (r + c.r) ** 2) return false;
    }
    return true;
  }

  /** e(x, z, radius)를 (dx, dz)만큼 움직여요. 한 축씩 시도해서 벽을 따라 미끄러져요 */
  move(e, dx, dz) {
    if (dx !== 0 && this.canStand(e.x + dx, e.z, e.radius)) e.x += dx;
    if (dz !== 0 && this.canStand(e.x, e.z + dz, e.radius)) e.z += dz;
  }

  /** 투사체 같은 작은 점이 벽/장애물에 막혔나? */
  pointBlocked(x, z) {
    return !this.canStand(x, z, 0.05);
  }

  // ==================== 맵 만들기 ====================
  _plane(w, d, color, x, y, z) {
    const m = mesh(new THREE.PlaneGeometry(w, d), mat(color), x, y, z);
    m.rotation.x = -Math.PI / 2;
    this.scene.add(m);
    return m;
  }

  _build() {
    const s = this.scene;
    // 바닥: 잔디, 도로, 인도, 광장, 운동장
    this._plane(500, 500, 0x8fd16a, 0, 0, -60);
    this._plane(14, 176, 0x6b7280, 0, 0.02, -48);
    this._plane(1.2, 176, 0xdad6c8, -6.4, 0.03, -48);
    this._plane(1.2, 176, 0xdad6c8, 6.4, 0.03, -48);
    this._plane(22, 28, 0xe6d9bd, 17, 0.035, -72); // GS25 앞 광장
    this._plane(60, 40, 0xe0cba0, 0, 0.03, -156); // 학교 운동장 (정문 바로 뒤)

    // 도로 가운데 점선 (InstancedMesh로 한 번에 그려요)
    const dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.25, 0.02, 2.2), mat(0xffffff), 24);
    const o = new THREE.Object3D();
    for (let i = 0; i < 24; i++) {
      o.position.set(0, 0.045, 8 - i * 6);
      o.updateMatrix();
      dashes.setMatrixAt(i, o.matrix);
    }
    dashes.frustumCulled = false;
    s.add(dashes);

    for (const b of STAGE.buildings) this._building(b);
    this._trees();
    for (const [x1, x2, z1, z2] of STAGE.hedges) {
      s.add(box(x2 - x1, 0.8, z2 - z1, 0x4aa84a, (x1 + x2) / 2, 0.4, (z1 + z2) / 2));
    }
    for (const ob of STAGE.obstacles) s.add(this._obstacleMesh(ob));
    this._entrance();
    this._store();
    this._schoolGate();
  }

  /** 창문 무늬가 있는 아파트/빌라 */
  _building({ x, z, w, d, h, wall }) {
    const side = (rep) => new THREE.MeshStandardMaterial({ map: makeWindowTexture(wall, rep, h / 4), roughness: 0.9, flatShading: true });
    // 박스의 면 순서: +x, -x, 위, 아래, +z, -z
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side(d / 4), side(d / 4), mat(0x8d99ae), mat(0x9aa5b1), side(w / 4), side(w / 4)]);
    m.position.set(x, h / 2, z);
    this.scene.add(m);
    this.scene.add(box(w * 0.25, 1.4, d * 0.3, 0xb8c2cc, x + w * 0.2, h + 0.7, z)); // 옥상 물탱크
  }

  /** 길가 나무 (줄기/잎을 각각 InstancedMesh 한 번씩) */
  _trees() {
    const pts = [];
    for (let z = 10; z > -134; z -= 7) {
      pts.push([-9.2, z]);
      if (!(z < -52 && z > -92)) pts.push([9.2, z]); // 광장 쪽은 비워 둬요
    }
    const n = pts.length;
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.25, 1.4, 6), mat(0x8a5a2b), n);
    const leaves = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, 3.4, 7), mat(0x3fae5a), n);
    const o = new THREE.Object3D();
    pts.forEach(([x, z], i) => {
      const k = 0.8 + ((i * 7) % 10) / 20; // 나무마다 크기를 조금씩 다르게 (0.8~1.25)
      o.position.set(x, 0.7 * k, z);
      o.scale.set(k, k, k);
      o.updateMatrix();
      trunks.setMatrixAt(i, o.matrix);
      o.position.set(x, 3.1 * k, z);
      o.updateMatrix();
      leaves.setMatrixAt(i, o.matrix);
    });
    trunks.frustumCulled = false;
    leaves.frustumCulled = false;
    this.scene.add(trunks, leaves);
  }

  /** 화단 / 벤치 / 파라솔 테이블 */
  _obstacleMesh(ob) {
    const g = new THREE.Group();
    g.position.set(ob.x, 0, ob.z);
    if (ob.type === 'planter') {
      g.add(box(ob.w, 0.6, ob.d, 0xb5651d, 0, 0.3, 0));
      g.add(box(ob.w - 0.25, 0.5, ob.d - 0.25, 0x4fb24f, 0, 0.8, 0));
      g.add(box(0.3, 0.3, 0.3, 0xff6fa8, -ob.w * 0.25, 1.15, 0));
      g.add(box(0.3, 0.3, 0.3, 0xffd23f, ob.w * 0.2, 1.15, 0.1));
    } else if (ob.type === 'bench') {
      g.add(box(ob.w, 0.12, ob.d, 0xc58b4e, 0, 0.5, 0));
      g.add(box(ob.w, 0.5, 0.1, 0xb07a40, 0, 0.8, -ob.d / 2 + 0.05));
      g.add(box(0.12, 0.5, ob.d * 0.8, 0x555b66, -ob.w / 2 + 0.2, 0.25, 0));
      g.add(box(0.12, 0.5, ob.d * 0.8, 0x555b66, ob.w / 2 - 0.2, 0.25, 0));
    } else if (ob.type === 'table') {
      g.add(mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 10), mat(0xffffff), 0, 0.85, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.85, 6), mat(0x777f8c), 0, 0.42, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), mat(0x777f8c), 0, 1.5, 0));
      g.add(mesh(new THREE.ConeGeometry(1.7, 0.6, 8), mat(0xff7a45), 0, 2.6, 0));
    }
    return g;
  }

  /** 단지 입구: 경비실, 단지 이름 간판, 차단기 */
  _entrance() {
    const s = this.scene;
    s.add(box(3.4, 2.8, 3.4, 0xd6dde6, -10.5, 1.4, 6)); // 경비실
    s.add(box(4.0, 0.3, 4.0, 0x35507a, -10.5, 2.95, 6));
    s.add(box(1.8, 1.0, 0.1, 0x9fd8ff, -10.5, 1.8, 7.72));
    s.add(box(0.3, 3.6, 0.3, 0x8b94a3, 8.2, 1.8, 12)); // 간판 기둥
    s.add(box(0.3, 3.6, 0.3, 0x8b94a3, 13.8, 1.8, 12));
    s.add(mesh(new THREE.PlaneGeometry(5.6, 1.3), new THREE.MeshBasicMaterial({ map: makeSignTexture(STAGE.texts.complex, '#ffffff', '#2f6fe4', 512, 120) }), 11, 3.8, 12.2));
    s.add(box(0.5, 1.4, 0.5, 0xffd23f, -7.4, 0.7, 14.6)); // 입구 차단기
    s.add(box(0.5, 1.4, 0.5, 0xffd23f, 7.4, 0.7, 14.6));
    s.add(box(14, 0.16, 0.16, 0xe5484d, 0, 1.1, 14.6));
  }

  /** GS25 편의점: 간판은 글자("GS25")만 써요 */
  _store() {
    const st = STAGE.store;
    const w = st.x2 - st.x1;
    const d = st.z2 - st.z1;
    const cx = (st.x1 + st.x2) / 2;
    const cz = (st.z1 + st.z2) / 2;
    const s = this.scene;
    s.add(box(w, 5.4, d, 0xf3f0e8, cx, 2.7, cz)); // 건물
    s.add(box(w + 0.6, 0.5, d + 0.6, 0x35507a, cx, 5.65, cz)); // 지붕
    s.add(mesh(new THREE.PlaneGeometry(w - 4, 2.4), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, roughness: 0.3, flatShading: true }), cx, 1.6, st.z2 + 0.03)); // 쇼윈도
    s.add(box(2.4, 2.5, 0.12, 0x6fa0c8, 17, 1.25, st.z2 + 0.06)); // 문
    s.add(mesh(new THREE.PlaneGeometry(w - 2, 1.5), new THREE.MeshBasicMaterial({ map: makeSignTexture(STAGE.texts.store, '#0a56b8', '#ffffff', 512, 128) }), cx, 4.4, st.z2 + 0.06)); // 간판
    s.add(box(w - 1, 0.2, 1.6, 0xff8a1f, cx, 3.3, st.z2 + 0.8)); // 차양
  }

  /** 학교 정문과 학교 건물 */
  _schoolGate() {
    const s = this.scene;
    const z = STAGE.gate.z;
    for (const sx of [-1, 1]) {
      s.add(box(1.6, 5.2, 1.6, 0xdfe6ee, sx * 8, 2.6, z)); // 기둥
      s.add(box(1.9, 0.4, 1.9, 0x5b6b82, sx * 8, 5.4, z));
      s.add(box(15, 1.3, 0.4, 0xb9c6d3, sx * 16.5, 0.65, z)); // 담장
    }
    s.add(box(17.6, 1.3, 1.2, 0x2f6fe4, 0, 5.0, z)); // 정문 위 가로보
    s.add(mesh(new THREE.PlaneGeometry(9, 1.2), new THREE.MeshBasicMaterial({ map: makeSignTexture(STAGE.texts.gate, '#fff3c4', '#1f2a5c', 512, 96) }), 0, 5.0, z + 0.62));
    this._building({ x: 0, z: z - 24, w: 46, d: 14, h: 12, wall: '#f4e1c2' }); // 학교 건물
  }
}
