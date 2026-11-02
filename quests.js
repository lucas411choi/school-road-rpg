// quests.js(game) — 퀘스트 진행 상태를 관리해요. 퀘스트 내용 자체는 data/quests.js 에 있어요.
//
// 상태: 'available'(아직 안 받음) → 'active'(진행 중) → 'done'(완료)
// 처치 수는 '무리(group)' 단위로 세요. 퀘스트를 받기 전에 먼저 처치했어도 인정돼요
// (그래서 문제집이 모자라 퀘스트를 못 깨는 일이 생기지 않아요).
import { QUESTS } from '../data/quests.js';

export class QuestSystem {
  constructor(hud) {
    this.hud = hud;
    this.onComplete = null; // (quest) => void — 보상 처리는 main.js 가 맡아요
    this.reset();
  }

  reset() {
    this.kills = {}; // { 무리이름: 처치 수 }
    this.status = {};
    for (const id of Object.keys(QUESTS)) this.status[id] = 'available';
    this.refresh();
  }

  progress(q) {
    return Math.min(q.target.count, this.kills[q.target.group] || 0);
  }
  isReady(q) {
    return this.status[q.id] === 'active' && this.progress(q) >= q.target.count;
  }
  allDone() {
    return Object.values(this.status).every((s) => s === 'done');
  }

  /** NPC 머리 위 표시: 'available'(노랑 !) / 'ready'(초록 !) / null */
  markFor(npcDef) {
    const q = QUESTS[npcDef.questId];
    if (!q) return null;
    if (this.status[q.id] === 'available') return 'available';
    return this.isReady(q) ? 'ready' : null;
  }

  /** 적이 쓰러질 때마다 불러요 */
  onEnemyKilled(enemy) {
    const n = (this.kills[enemy.group] = (this.kills[enemy.group] || 0) + 1);
    for (const q of Object.values(QUESTS)) {
      if (this.status[q.id] === 'active' && q.target.group === enemy.group && n === q.target.count) {
        this.hud.toast('✅ 목표 달성! 의뢰인에게 돌아가자');
      }
    }
    this.refresh();
  }

  /**
   * NPC와 대화할 때: 보여 줄 대사(lines)와, 대화가 끝난 뒤 실행할 일(after)을 돌려줘요.
   * 상태에 따라 대사가 달라져요 (수락 전 / 진행 중 / 완료 / 완료 후).
   */
  talk(npcDef) {
    const q = QUESTS[npcDef.questId];
    const st = this.status[q.id];
    if (st === 'available') {
      return {
        lines: q.dialogue.offer,
        after: () => {
          this.status[q.id] = 'active';
          this.hud.toast('📒 퀘스트를 받았어요!');
          this.refresh();
        },
      };
    }
    if (st === 'active') {
      if (this.isReady(q)) {
        return {
          lines: q.dialogue.complete,
          after: () => {
            this.status[q.id] = 'done';
            this.refresh();
            if (this.onComplete) this.onComplete(q);
          },
        };
      }
      return { lines: q.dialogue.progress, after: null };
    }
    return { lines: q.dialogue.done, after: null };
  }

  /** 화면 왼쪽 위에 보여 줄 줄 목록 */
  hudLines() {
    const lines = [];
    for (const q of Object.values(QUESTS)) {
      if (this.status[q.id] !== 'active') continue;
      const ready = this.isReady(q);
      lines.push({ text: `${q.title} (${this.progress(q)}/${q.target.count})${ready ? ' 완료! 돌아가자' : ''}`, ready });
    }
    if (lines.length === 0) {
      const all = this.allDone();
      lines.push({ text: all ? '학교 정문으로 가자! 🏫' : '! 표시가 있는 사람에게 말을 걸자', ready: all, hint: !all });
    }
    return lines;
  }

  refresh() {
    this.hud.setQuests(this.hudLines());
  }
}
