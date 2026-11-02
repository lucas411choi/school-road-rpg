// util.js — 여러 곳에서 쓰는 작은 도우미 함수들
import * as THREE from 'three';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1)); // a 이상 b 이하의 정수

/** 각도 a에서 b로 가는 가장 짧은 차이 (-π ~ π) */
export function angleDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
export const lerpAngle = (a, b, t) => a + angleDiff(a, b) * t;

/** 프레임 속도와 상관없이 일정하게 느껴지는 부드러운 보간 계수 */
export const damp = (rate, dt) => 1 - Math.exp(-rate * dt);

/** 로우폴리 느낌의 기본 재질 (면이 각져 보이는 flatShading) */
export function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, flatShading: true, ...opts });
}

export function mesh(geometry, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  return m;
}

/** 박스 하나를 바로 만들어요 (가로, 높이, 깊이, 색, 위치) */
export function box(w, h, d, color, x = 0, y = 0, z = 0) {
  return mesh(new THREE.BoxGeometry(w, h, d), mat(color), x, y, z);
}

/** 색을 어둡게(f<1) 또는 밝게(f>1) */
export function shade(color, f) {
  return new THREE.Color(color).multiplyScalar(f).getHex();
}

/** 장면에서 뺀 물체의 지오메트리/재질 메모리 정리 (텍스처는 공유하므로 건드리지 않아요) */
export function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.geometry && !o.isSprite) o.geometry.dispose(); // 스프라이트의 지오메트리는 모두가 같이 쓰는 거라 건드리지 않아요
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
  });
}
