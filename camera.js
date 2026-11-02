// camera.js — FIFA 같은 쿼터뷰 카메라
// 각도·거리·FOV는 전부 config.js 의 CAMERA 에서 조절해요. 플레이어가 카메라를 돌릴 수는 없어요.
import * as THREE from 'three';
import { CAMERA } from '../config.js';
import { clamp, damp } from './util.js';

export class FollowCamera {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);
    this.focus = new THREE.Vector3(0, CAMERA.lookHeight, 0); // 카메라가 바라보는 점 (주인공을 부드럽게 따라가요)
    this.distance = CAMERA.distance;
    this.pitch = THREE.MathUtils.degToRad(CAMERA.pitchDeg);
    this.yaw = THREE.MathUtils.degToRad(CAMERA.yawDeg);
  }

  /** 화면 크기가 바뀔 때 호출 */
  resize(width, height) {
    const aspect = width / height;
    this.camera.aspect = aspect;
    // 세로 화면(모바일)은 가로 폭이 좁아서, 카메라를 자동으로 멀리 빼 줘요
    const halfV = Math.tan(THREE.MathUtils.degToRad(CAMERA.fov / 2));
    const needed = CAMERA.minViewWidth / 2 / (halfV * aspect);
    this.distance = clamp(Math.max(CAMERA.distance, needed), CAMERA.distance, CAMERA.maxDistance);
    this.camera.updateProjectionMatrix();
  }

  /** 곧바로 해당 위치로 (부드럽게 따라가지 않고) */
  snap(x, z) {
    this.focus.set(x, CAMERA.lookHeight, z);
  }

  update(dt, targetX, targetZ) {
    const k = damp(CAMERA.followLerp, dt);
    this.focus.x += (targetX - this.focus.x) * k;
    this.focus.z += (targetZ - this.focus.z) * k;
    const cp = Math.cos(this.pitch);
    const sp = Math.sin(this.pitch);
    const d = this.distance;
    this.camera.position.set(
      this.focus.x + Math.sin(this.yaw) * cp * d,
      this.focus.y + sp * d,
      this.focus.z + Math.cos(this.yaw) * cp * d,
    );
    this.camera.lookAt(this.focus);
  }
}
