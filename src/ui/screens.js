// screens.js — 시작 / 게임오버 / 클리어 화면의 버튼 연결
// 어떤 화면을 보여 줄지는 body 의 data-state 값으로 정해져요 (main.js 의 setState, style.css 참고)
export class Screens {
  constructor({ onStart, onRetry, onRestart }) {
    this._bind('btn-start', onStart);
    this._bind('btn-retry', onRetry);
    this._bind('btn-restart', onRestart);
  }

  _bind(id, handler) {
    const btn = document.getElementById(id);
    btn.addEventListener('click', () => {
      btn.blur(); // 버튼에 포커스가 남아 스페이스/엔터가 또 눌리는 일을 막아요
      handler();
    });
  }
}
