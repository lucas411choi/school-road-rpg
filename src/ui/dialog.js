// dialog.js — NPC 대화창. 클릭/터치하거나 E·스페이스를 누르면 다음 줄로 넘어가요.
export class Dialog {
  constructor() {
    this.el = document.getElementById('dialog');
    this.nameEl = document.getElementById('dialog-name');
    this.textEl = document.getElementById('dialog-text');
    this.nextEl = document.getElementById('dialog-next');
    this.lines = [];
    this.index = 0;
    this.isOpen = false;
    this.onClose = null;
    this.openedAt = 0;
    this.el.addEventListener('click', () => this.next());
  }

  /** speaker = 말하는 사람 이름, lines = 대사 배열, onClose = 대화가 끝나면 실행 */
  show(speaker, lines, onClose) {
    this.nameEl.textContent = speaker;
    this.lines = lines;
    this.index = 0;
    this.onClose = onClose;
    this.isOpen = true;
    this.openedAt = performance.now();
    this._render();
  }

  next() {
    if (!this.isOpen) return;
    if (performance.now() - this.openedAt < 250) return; // 대화를 연 그 클릭이 바로 넘기지 않게
    this.index++;
    if (this.index >= this.lines.length) {
      this.isOpen = false;
      const cb = this.onClose;
      this.onClose = null;
      if (cb) cb();
    } else {
      this._render();
    }
  }

  _render() {
    this.textEl.textContent = this.lines[this.index];
    this.nextEl.textContent = this.index < this.lines.length - 1 ? '다음 ▶' : '닫기 ✔';
  }
}
