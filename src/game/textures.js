// textures.js — Canvas로 그리는 텍스처들 (이미지 파일 없이 전부 코드로 만들어요)
import * as THREE from 'three';

const FONT = '"Pretendard", "Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function roundRectPath(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** 문제집 표지: "6학년 1학기 / 수학" (위쪽은 3D 눈이 붙는 자리라 비워 둬요) */
export function makeCoverTexture(cover) {
  const [c, g] = makeCanvas(256, 324);
  g.fillStyle = cover.color;
  g.fillRect(0, 0, 256, 324);
  g.fillStyle = 'rgba(0,0,0,0.22)'; // 책등 쪽 그림자
  g.fillRect(0, 0, 16, 324);
  g.strokeStyle = 'rgba(255,255,255,0.8)';
  g.lineWidth = 6;
  g.strokeRect(24, 10, 222, 304);

  // 제목 라벨
  g.fillStyle = '#fff8e1';
  roundRectPath(g, 38, 150, 194, 124, 12);
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = cover.spine;
  g.stroke();
  g.fillStyle = cover.spine;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `bold 26px ${FONT}`;
  g.fillText(cover.title, 135, 182);
  g.font = `bold 68px ${FONT}`;
  g.fillText(cover.subject, 135, 238);

  // 아래쪽 문구와 수학 기호 낙서
  g.fillStyle = '#ffffff';
  g.font = `bold 22px ${FONT}`;
  g.fillText('문제집', 135, 298);
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.font = `bold 34px ${FONT}`;
  g.fillText('÷', 62, 296);
  g.fillText('×', 208, 296);
  return toTexture(c);
}

/** 아파트 창문 무늬 (repX, repY = 반복 횟수) */
export function makeWindowTexture(wall, repX, repY) {
  const [c, g] = makeCanvas(128, 128);
  g.fillStyle = wall;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(0,0,0,0.08)';
  g.fillRect(0, 62, 128, 4);
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 2; i++) {
      const x = 12 + i * 60;
      const y = 10 + j * 62;
      g.fillStyle = '#7ec8f2';
      g.fillRect(x, y, 44, 40);
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillRect(x + 4, y + 4, 16, 14);
      g.fillStyle = '#eef7ff';
      g.fillRect(x - 2, y + 40, 48, 4);
    }
  }
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repX, repY);
  return t;
}

/** 간판: 글자만 써요 (로고 이미지는 쓰지 않아요) */
export function makeSignTexture(text, bg, fg, w = 512, h = 128) {
  const [c, g] = makeCanvas(w, h);
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = fg;
  g.lineWidth = 6;
  g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = fg;
  g.font = `bold ${Math.round(h * 0.56)}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 3);
  return toTexture(c);
}

let shadowTex = null;
/** 캐릭터 발밑의 동그란 그림자 */
export function getShadowTexture() {
  if (!shadowTex) {
    const [c, g] = makeCanvas(64, 64);
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(0,0,0,0.5)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    shadowTex = toTexture(c);
  }
  return shadowTex;
}

const markCache = {};
/** NPC 머리 위 느낌표: 'available'(노랑, 퀘스트 받기) / 'ready'(초록, 완료하러 가기) */
export function getMarkTexture(kind) {
  if (!markCache[kind]) {
    const [c, g] = makeCanvas(128, 128);
    g.fillStyle = kind === 'ready' ? '#4cd964' : '#ffd23f';
    g.strokeStyle = '#1f2a5c';
    g.lineWidth = 8;
    g.beginPath();
    g.arc(64, 64, 52, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = '#1f2a5c';
    g.font = `900 84px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('!', 64, 70);
    markCache[kind] = toTexture(c);
  }
  return markCache[kind];
}
