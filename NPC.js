// NPC.js — 퀘스트를 주는 사람들. 머리 위에 느낌표(!)가 둥둥 떠 있어요.
import * as THREE from 'three';
import { buildHuman, poseHuman, makeBlobShadow } from './models.js';
import { getMarkTexture } from '../game/textures.js';
import { lerpAngle, damp, disposeTree } from '../game/util.js';

export class NPC {
  constructor(def, scene) {
    this.def = def;
    this.scene = scene;
    this.x = def.x;
    this.z = def.z;
    this.facing = def.facing ?? 0;
    this.radius = 0.6;
    this.t = Math.random() * 6;

    this.parts = buildHuman(def.look);
    this.root = this.parts.root;
    this.root.position.set(this.x, 0, this.z);
    this.root.rotation.y = this.facing;
    this.shadow = makeBlobShadow(0.8);
    this.shadow.position.set(this.x, 0.04, this.z);

    // 머리 위 표시: 노란 '!' = 퀘스트 받을 수 있음, 초록 '!' = 완료하러 가자
    this.marks = {};
    for (const kind of ['available', 'ready']) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: getMarkTexture(kind), transparent: true, depthTest: false }));
      sprite.scale.set(0.9, 0.9, 1);
      sprite.position.y = 2.9;
      sprite.renderOrder = 25;
      sprite.visible = false;
      this.root.add(sprite);
      this.marks[kind] = sprite;
    }
    scene.add(this.root, this.shadow);
  }

  /** kind: 'available' | 'ready' | null */
  setMark(kind) {
    for (const k of Object.keys(this.marks)) this.marks[k].visible = k === kind;
  }

  /** (x, z) 쪽을 바라봐요 */
  faceTo(x, z) {
    this.facing = Math.atan2(x - this.x, z - this.z);
  }

  update(dt) {
    this.t += dt;
    poseHuman(this.parts, this.t, 0, -1);
    this.parts.model.position.y = Math.sin(this.t * 2.2) * 0.02; // 숨 쉬는 듯한 움직임
    this.root.rotation.y = lerpAngle(this.root.rotation.y, this.facing, damp(8, dt));
    for (const k of Object.keys(this.marks)) {
      if (this.marks[k].visible) this.marks[k].position.y = 2.9 + Math.sin(this.t * 4) * 0.12;
    }
  }

  dispose() {
    this.scene.remove(this.root, this.shadow);
    disposeTree(this.root);
    disposeTree(this.shadow);
  }
}
