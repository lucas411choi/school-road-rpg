// hud.js — 화면 위에 겹쳐 보이는 정보(체력바, 퀘스트, 무기 이름, 알림 등)
// 화면 뼈대는 index.html 에, 모양은 src/style.css 에 있어요.
export class Hud {
  constructor() {
    const $ = (id) => document.getElementById(id);
    this.nameEl = $('hud-name');
    this.hpFill = $('hp-fill');
    this.hpText = $('hp-text');
    this.questList = $('quest-list');
    this.weaponEl = $('weapon-name');
    this.toastEl = $('toast');
    this.bannerEl = $('banner');
    this.flashEl = $('hit-flash');
    this._toastTimer = 0;
  }

  setName(name) {
    this.nameEl.textContent = name;
  }

  setHp(hp, max) {
    this.hpFill.style.width = `${Math.max(0, (hp / max) * 100)}%`;
    this.hpText.textContent = `HP ${Math.ceil(hp)} / ${max}`;
  }

  /** 장착 무기 이름 (줄바꿈은 CSS가 알아서 해 줘요) */
  setWeapon(name) {
    this.weaponEl.textContent = name;
  }

  /** lines = [{ text, ready, hint }]  (hint = 체크박스 없는 안내 줄) */
  setQuests(lines) {
    this.questList.replaceChildren();
    for (const l of lines) {
      const div = document.createElement('div');
      div.className = 'quest-line' + (l.ready ? ' ready' : '') + (l.hint ? ' hint' : '');
      div.textContent = l.text;
      this.questList.appendChild(div);
    }
  }

  /** 잠깐 떴다 사라지는 알림 */
  toast(text, ms = 2400) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), ms);
  }

  /** 가운데 크게 나오는 연출 글자 (예: 퀘스트 완료!) */
  banner(text) {
    this.bannerEl.textContent = text;
    this.bannerEl.classList.remove('show');
    void this.bannerEl.offsetWidth; // 애니메이션을 처음부터 다시 시작
    this.bannerEl.classList.add('show');
  }

  /** 맞았을 때 화면 테두리가 붉게 깜빡 */
  hitFlash() {
    this.flashEl.classList.remove('on');
    void this.flashEl.offsetWidth;
    this.flashEl.classList.add('on');
  }
}
