// models.js — 박스/구/원기둥으로 조립하는 로우폴리 모델들 (외부 파일 없음)
import * as THREE from 'three';
import { mat, mesh, box, shade } from '../game/util.js';
import { makeCoverTexture, getShadowTexture } from '../game/textures.js';

const PI = Math.PI;

/** 캐릭터 발밑의 동그란 그림자 (위치는 주인이 매 프레임 옮겨 줘요) */
export function makeBlobShadow(radius) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({ map: getShadowTexture(), transparent: true, depthWrite: false }),
  );
  m.rotation.x = -PI / 2;
  m.position.y = 0.04;
  m.renderOrder = 1;
  return m;
}

// ==================== 머리카락 / 모자 ====================

/**
 * 5:5 가르마 + 이마가 완전히 드러나게 양옆으로 넘긴 머리.
 * 정수리에서 갈라져 양옆으로 흘러내리는 '두 덩어리'로 만들어요.
 * 길이: 귀를 살짝 덮고, 목덜미에는 닿지 않아요.
 */
function buildPartedHair(R, color) {
  const g = new THREE.Group();
  const m = mat(color, { side: THREE.DoubleSide });
  const r = R * 1.08;
  const FRONT_GAP = 0.95; // 얼굴 쪽으로 비워 두는 각도(rad) → 이마와 관자놀이가 드러나요
  // SphereGeometry(반지름, 가로분할, 세로분할, phi시작, phi길이, theta시작, theta길이)
  //  phi: -π/2(뒤) → 0(왼쪽 -X) → π/2(앞 +Z) → π(오른쪽 +X) → 3π/2(뒤)
  //  theta: 0(정수리) → π/2(귀 높이) → π(턱 아래)
  for (const s of [-1, 1]) {
    // s = -1: 왼쪽 덩어리, s = +1: 오른쪽 덩어리
    const half = new THREE.Group();
    // ① 정수리 ~ 이마 위 헤어라인 (이마 아래로는 내려오지 않아요)
    half.add(mesh(new THREE.SphereGeometry(r, 10, 5, s < 0 ? -PI / 2 : PI / 2, PI, 0, PI * 0.29), m));
    // ② 양옆·뒤쪽 머리: 귀를 살짝 덮고(theta 0.62π까지) 목덜미 위에서 끝나요
    half.add(mesh(new THREE.SphereGeometry(r, 10, 6, s < 0 ? -PI / 2 : PI / 2 + FRONT_GAP, PI - FRONT_GAP, PI * 0.28, PI * 0.34), m));
    half.rotation.z = -s * 0.06; // 가르마 선이 살짝 벌어져 보이게
    g.add(half);
  }
  return g;
}

/** 짧은 머리 (알바생용) */
function buildShortHair(R, color) {
  const h = mesh(new THREE.SphereGeometry(R * 1.07, 10, 6, 0, PI * 2, 0, PI * 0.5), mat(color, { side: THREE.DoubleSide }));
  h.rotation.x = -0.25; // 앞쪽을 살짝 들어 올려 이마가 보이게
  return h;
}

/** 경비 아저씨 모자 */
function buildGuardCap(R) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(R * 0.8, R * 0.95, 0.24, 10), mat(0x1f2f5c), 0, R * 0.78, 0));
  g.add(box(0.62, 0.05, 0.34, 0x16224a, 0, R * 0.66, R * 0.88)); // 챙
  g.add(box(0.12, 0.1, 0.03, 0xffd23f, 0, R * 0.82, R * 0.92)); // 모자 배지
  return g;
}

// ==================== 사람 (주인공 / NPC 공용) ====================

/**
 * look 값으로 생김새를 바꿔요 (색, 머리 모양, 모자, 책가방 등).
 * 반환: { root, model, upper, head, arms, legs, hand }
 *  - arms[0] / legs[0] = 캐릭터의 오른쪽, hand = 오른손(무기를 붙이는 곳)
 */
export function buildHuman(look = {}) {
  const L = {
    skin: 0xffd7b3, hair: 0x2b1d16, hairStyle: 'none',
    shirt: 0xffd93d, sleeve: null, vest: null,
    pants: 0x3a6fd8, shorts: true, shoes: 0xffffff,
    bag: null, hat: null, mustache: false, faceTexture: null,
    ...look,
  };
  const root = new THREE.Group();
  const model = new THREE.Group(); // 통통 튀는 움직임용
  const upper = new THREE.Group(); // 상체(몸통·팔·머리): 공격할 때 몸을 비틀어요
  root.add(model);
  model.add(upper);
  const skinM = mat(L.skin);

  // 다리 (엉덩이 높이 0.62에서 회전)
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(s * 0.16, 0.62, 0);
    leg.add(mesh(new THREE.BoxGeometry(0.2, 0.6, 0.22), L.shorts ? skinM : mat(L.pants), 0, -0.3, 0));
    if (L.shorts) leg.add(box(0.25, 0.3, 0.27, L.pants, 0, -0.15, 0)); // 반바지
    leg.add(box(0.24, 0.12, 0.34, L.shoes, 0, -0.56, 0.05)); // 신발
    model.add(leg);
    legs.push(leg);
  }

  // 몸통 (티셔츠) + 조끼
  upper.add(box(0.64, 0.64, 0.36, L.shirt, 0, 0.94, 0));
  if (L.vest) upper.add(box(0.68, 0.5, 0.4, L.vest, 0, 0.9, 0));

  // 팔 (어깨에서 회전)
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.43, 1.2, 0);
    arm.add(box(0.2, 0.3, 0.2, L.sleeve ?? L.shirt, 0, -0.13, 0)); // 소매
    arm.add(mesh(new THREE.BoxGeometry(0.16, 0.36, 0.16), skinM, 0, -0.43, 0));
    upper.add(arm);
    arms.push(arm);
  }
  const hand = new THREE.Group();
  hand.position.set(0, -0.62, 0);
  arms[0].add(hand);

  // 책가방 (등 뒤) + 어깨끈
  if (L.bag) {
    upper.add(box(0.52, 0.6, 0.24, L.bag, 0, 0.97, -0.3));
    upper.add(box(0.46, 0.16, 0.26, shade(L.bag, 0.8), 0, 1.16, -0.3));
    for (const s of [-1, 1]) upper.add(box(0.07, 0.52, 0.04, shade(L.bag, 0.65), s * 0.17, 0.98, 0.19));
  }

  // 머리
  const head = new THREE.Group();
  head.position.set(0, 1.56, 0);
  upper.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.4, 12, 10), skinM));

  if (L.faceTexture) {
    // 나중에 친구 사진을 넣을 자리: 얼굴 앞에 사진 판을 붙여요
    const tex = new THREE.TextureLoader().load(L.faceTexture);
    tex.colorSpace = THREE.SRGBColorSpace;
    head.add(mesh(new THREE.PlaneGeometry(0.56, 0.56), new THREE.MeshBasicMaterial({ map: tex, transparent: true }), 0, -0.02, 0.4));
  } else {
    const ink = mat(0x2a2030);
    for (const s of [-1, 1]) {
      head.add(mesh(new THREE.BoxGeometry(0.08, 0.1, 0.05), ink, s * 0.15, 0.0, 0.37)); // 눈
      head.add(mesh(new THREE.BoxGeometry(0.13, 0.03, 0.04), ink, s * 0.15, 0.1, 0.37)); // 눈썹
    }
    head.add(box(0.12, 0.04, 0.04, 0xd9534f, 0, -0.14, 0.37)); // 입
    if (L.mustache) head.add(box(0.22, 0.05, 0.05, 0x3a2a22, 0, -0.07, 0.375)); // 콧수염
  }

  if (L.hairStyle === 'parted') head.add(buildPartedHair(0.4, L.hair));
  else if (L.hairStyle === 'short') head.add(buildShortHair(0.4, L.hair));
  if (L.hat === 'guard') head.add(buildGuardCap(0.4));

  return { root, model, upper, head, arms, legs, hand };
}

/**
 * 걷기/공격 모션을 코드로 만들어요.
 * swing: 공격 진행도 0~1 (공격 중이 아니면 -1)
 */
export function poseHuman(p, time, moveAmt, swing) {
  const w = Math.sin(time * 11) * 0.8 * moveAmt;
  p.legs[0].rotation.x = w;
  p.legs[1].rotation.x = -w;
  p.arms[1].rotation.x = -w * 0.9;
  if (swing >= 0) {
    const e = 1 - (1 - swing) * (1 - swing); // 처음엔 빠르고 끝에서 느리게
    p.arms[0].rotation.x = -2.7 + 2.4 * e; // 머리 위에서 앞으로 휘둘러요
    p.upper.rotation.y = 0.7 - 1.4 * e; // 몸도 오른쪽 → 왼쪽으로 비틀어요
  } else {
    p.arms[0].rotation.x += (w * 0.9 - p.arms[0].rotation.x) * 0.3; // 천천히 원래 자세로
    p.upper.rotation.y *= 0.75;
  }
  p.model.position.y = Math.abs(Math.sin(time * 11)) * 0.08 * moveAmt; // 걸을 때 통통
}

// ==================== 무기: 나뭇가지 ====================

/** 구부러진 나뭇가지: 원기둥 2개를 이어 붙이고 잔가지 하나 */
export function buildTwig() {
  const wood = mat(0x8a5a2b);
  const dark = mat(0x6b4220);
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.75, 5), wood, 0, 0.3, 0)); // 아래쪽 줄기
  const joint = new THREE.Group(); // 꺾이는 마디
  joint.position.set(0, 0.675, 0);
  joint.rotation.z = -0.4;
  joint.add(mesh(new THREE.CylinderGeometry(0.025, 0.045, 0.6, 5), wood, 0, 0.3, 0)); // 위쪽 줄기
  g.add(joint);
  const branch = new THREE.Group(); // 잔가지
  branch.position.set(0, 0.35, 0);
  branch.rotation.z = 0.9;
  branch.add(mesh(new THREE.CylinderGeometry(0.012, 0.03, 0.32, 5), dark, 0, 0.16, 0));
  g.add(branch);
  g.rotation.x = 1.9; // 손에 쥐었을 때의 기본 각도 (앞쪽 아래로 향해요)
  return g;
}

/** 무기 id → 모델 만드는 함수 (data/weapons.js 의 model 값과 연결) */
export const WEAPON_BUILDERS = { twig: buildTwig };

// ==================== 적: 살아난 문제집 ====================

const coverCache = new Map();
function getCover(cover) {
  const key = cover.title + cover.subject;
  if (!coverCache.has(key)) coverCache.set(key, makeCoverTexture(cover));
  return coverCache.get(key);
}

/** 두꺼운 문제집 몸통 + 표지(Canvas) + 화난 눈 + 짧은 팔다리 */
export function buildWorkbook(def) {
  const c = def.cover;
  const W = 1.5, H = 1.9, D = 0.7, LEG = 0.45;
  const root = new THREE.Group();
  const model = new THREE.Group();
  root.add(model);

  const pages = 0xfff7e0;
  const coverMat = new THREE.MeshStandardMaterial({ map: getCover(c), roughness: 0.8, flatShading: true });
  // 면 순서: +x(페이지), -x(책등), 위, 아래, +z(앞표지), -z(뒷표지)
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [mat(pages), mat(c.spine), mat(pages), mat(pages), coverMat, mat(c.color)]);
  body.position.y = LEG + H / 2;
  model.add(body);

  // 화난 눈 (표지 위쪽에 붙여요)
  const eyeY = LEG + H / 2 + 0.55;
  const eyeZ = D / 2 + 0.03;
  const white = mat(0xffffff);
  const black = mat(0x1a1a2e);
  for (const s of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.2, 8, 6), white, s * 0.36, eyeY, eyeZ);
    eye.scale.z = 0.45;
    model.add(eye);
    model.add(mesh(new THREE.SphereGeometry(0.09, 6, 5), black, s * 0.33, eyeY - 0.02, eyeZ + 0.08)); // 눈동자
    const brow = box(0.46, 0.1, 0.06, 0x1a1a2e, s * 0.36, eyeY + 0.26, eyeZ + 0.04);
    brow.rotation.z = s * 0.5; // 안쪽이 아래로 내려온 화난 눈썹
    model.add(brow);
  }

  // 짧은 팔다리 (연필 노랑)
  const limb = mat(0xffc83d);
  const shoe = mat(0x2b3a67);
  const legs = [];
  const arms = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(s * 0.4, LEG, 0);
    leg.add(mesh(new THREE.BoxGeometry(0.3, 0.45, 0.3), limb, 0, -0.22, 0));
    leg.add(mesh(new THREE.BoxGeometry(0.36, 0.14, 0.46), shoe, 0, -0.4, 0.06));
    model.add(leg);
    legs.push(leg);
    const arm = new THREE.Group();
    arm.position.set(s * (W / 2 + 0.12), LEG + 1.45, 0);
    arm.add(mesh(new THREE.BoxGeometry(0.24, 0.6, 0.24), limb, 0, -0.26, 0));
    model.add(arm);
    arms.push(arm);
  }
  return { root, model, body, legs, arms, height: LEG + H };
}
