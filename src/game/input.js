// input.js — 키보드(PC) + 마우스 + 터치(모바일) 입력을 하나로 모아요
import { CAMERA } from '../config.js';

const KEY_DIRS = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

export class Input {
  constructor(canvas) {
    this.dirs = { up: false, down: false, left: false, right: false };
    this.stick = { x: 0, y: 0 }; // 가상 조이스틱 (오른쪽 +x, 위쪽 +y)
    this.attackKey = false; // 스페이스바 누르는 중
    this.attackMouse = false; // 마우스 왼쪽 버튼 누르는 중
    this.attackBtn = false; // 모바일 공격 버튼 누르는 중
    this.attackBuffer = 0; // 방금 눌렀다면 잠깐(초) 기억해요 → 짧게 톡 눌러도 공격이 나가요
    this.interactQueued = false; // E / Enter / '대화' 버튼
    this.spaceQueued = false; // 스페이스를 새로 눌렀는지 (대화창 넘기기용)
    this._move = { x: 0, z: 0 };

    // 터치 기기면 화면에 조이스틱/버튼을 보여 줘요
    this.isTouch = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 0;
    document.body.classList.toggle('touch', this.isTouch);

    this._bindKeyboard();
    this._bindMouse(canvas);
    this._bindTouch();
  }

  // ---------- 게임에서 가져다 쓰는 함수들 ----------
  attackHeld() {
    return this.attackKey || this.attackMouse || this.attackBtn;
  }

  /** 화면 기준 이동 방향 → 월드 방향 (W = 화면 위쪽). 길이는 0~1 */
  getMove() {
    let sx = (this.dirs.right ? 1 : 0) - (this.dirs.left ? 1 : 0) + this.stick.x;
    let sy = (this.dirs.up ? 1 : 0) - (this.dirs.down ? 1 : 0) + this.stick.y;
    const len = Math.hypot(sx, sy);
    if (len > 1) {
      sx /= len;
      sy /= len;
    }
    const yaw = (CAMERA.yawDeg * Math.PI) / 180; // 카메라 요가 0이면 (x, -y)
    this._move.x = Math.cos(yaw) * sx - Math.sin(yaw) * sy;
    this._move.z = -Math.sin(yaw) * sx - Math.cos(yaw) * sy;
    return this._move;
  }

  takeInteract() {
    const v = this.interactQueued;
    this.interactQueued = false;
    return v;
  }
  takeSpace() {
    const v = this.spaceQueued;
    this.spaceQueued = false;
    return v;
  }
  update(dt) {
    this.attackBuffer = Math.max(0, this.attackBuffer - dt);
  }
  /** 한 프레임이 끝날 때: 안 쓰인 '눌림' 신호는 버려요 */
  endFrame() {
    this.interactQueued = false;
    this.spaceQueued = false;
  }
  /** 화면이 바뀔 때 (게임 시작, 대화 끝 등) 남은 신호를 정리 */
  flush() {
    this.interactQueued = false;
    this.spaceQueued = false;
    this.attackBuffer = 0;
  }

  // ---------- 키보드 ----------
  _bindKeyboard() {
    const inGame = () => document.body.dataset.state === 'playing' || document.body.dataset.state === 'dialog';
    window.addEventListener('keydown', (e) => {
      const dir = KEY_DIRS[e.code];
      if (dir) {
        this.dirs[dir] = true;
        if (inGame()) e.preventDefault();
      } else if (e.code === 'Space') {
        if (!e.repeat) {
          this.attackKey = true;
          this.attackBuffer = 0.15;
          this.spaceQueued = true;
        }
        if (inGame()) e.preventDefault();
      } else if ((e.code === 'KeyE' || e.code === 'Enter') && !e.repeat) {
        this.interactQueued = true;
      }
    });
    window.addEventListener('keyup', (e) => {
      const dir = KEY_DIRS[e.code];
      if (dir) this.dirs[dir] = false;
      else if (e.code === 'Space') this.attackKey = false;
    });
    // 창을 벗어나면 눌려 있던 키를 모두 놓은 걸로 처리
    window.addEventListener('blur', () => {
      this.dirs.up = this.dirs.down = this.dirs.left = this.dirs.right = false;
      this.attackKey = this.attackMouse = false;
    });
  }

  // ---------- 마우스 (왼쪽 클릭 = 공격) ----------
  _bindMouse(canvas) {
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      this.attackMouse = true;
      this.attackBuffer = 0.15;
    });
    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse') this.attackMouse = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    // 모바일: 두 손가락 확대 / 길게 눌러 나오는 메뉴가 게임을 방해하지 않게
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    if (this.isTouch) document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // ---------- 터치 (왼쪽 아래 조이스틱, 오른쪽 아래 공격/대화 버튼) ----------
  _bindTouch() {
    const zone = document.getElementById('stick-zone');
    const base = document.getElementById('stick-base');
    const knob = document.getElementById('stick-knob');
    let pid = null;

    const updateStick = (e) => {
      const r = base.getBoundingClientRect();
      const radius = r.width / 2;
      let dx = e.clientX - (r.left + radius);
      let dy = e.clientY - (r.top + radius);
      const len = Math.hypot(dx, dy);
      if (len > radius) {
        dx = (dx / len) * radius;
        dy = (dy / len) * radius;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const sx = dx / radius;
      const sy = -dy / radius; // 화면 위쪽이 +
      const dead = Math.hypot(sx, sy) < 0.15; // 살짝 건드린 건 무시
      this.stick.x = dead ? 0 : sx;
      this.stick.y = dead ? 0 : sy;
    };
    const endStick = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      this.stick.x = this.stick.y = 0;
      knob.style.transform = 'translate(0px, 0px)';
    };
    zone.addEventListener('pointerdown', (e) => {
      if (pid !== null) return;
      pid = e.pointerId;
      zone.setPointerCapture(pid);
      updateStick(e);
      e.preventDefault();
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId === pid) updateStick(e);
    });
    zone.addEventListener('pointerup', endStick);
    zone.addEventListener('pointercancel', endStick);

    // 공격 버튼: 누르고 있으면 계속 공격
    const atk = document.getElementById('btn-attack');
    const releaseAtk = () => {
      this.attackBtn = false;
      atk.classList.remove('pressed');
    };
    atk.addEventListener('pointerdown', (e) => {
      this.attackBtn = true;
      this.attackBuffer = 0.15;
      atk.classList.add('pressed');
      atk.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    atk.addEventListener('pointerup', releaseAtk);
    atk.addEventListener('pointercancel', releaseAtk);

    // 대화 버튼 (NPC 근처에서만 나타나요)
    document.getElementById('btn-talk').addEventListener('pointerdown', (e) => {
      this.interactQueued = true;
      e.preventDefault();
    });
  }
}
