// scene.js — 렌더러, 장면(Scene), 조명을 만들어요
import * as THREE from 'three';
import { RENDER } from '../config.js';

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, RENDER.maxPixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(RENDER.sky);
  // 하늘빛 + 땅빛이 섞인 은은한 전체 조명
  scene.add(new THREE.HemisphereLight(0xdff3ff, 0x8a8a70, RENDER.hemiIntensity));
  // 카메라 쪽(+Z) 위에서 비추는 햇빛: 화면에 보이는 면이 예쁘게 밝아져요
  const sun = new THREE.DirectionalLight(0xfff1d6, RENDER.sunIntensity);
  sun.position.set(-25, 45, 30);
  scene.add(sun);
  return scene;
}
