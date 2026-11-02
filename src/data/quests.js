// ============================================================
// quests.js — NPC와 퀘스트 정의 (데이터 기반)
//
// NPC 하나 = 퀘스트 하나(questId). 새 NPC/퀘스트는 항목만 추가하면 돼요.
// 퀘스트 목표의 group 은 src/data/stage.js 의 enemyGroups.group 이름과 같아야 해요.
// 대사(dialogue)는 상황에 따라 달라져요:
//   offer    : 퀘스트를 받기 전 (수락하면 퀘스트 시작)
//   progress : 퀘스트 진행 중
//   complete : 목표를 채우고 돌아왔을 때 (끝나면 보상 지급)
//   done     : 퀘스트를 끝낸 뒤
// ============================================================

export const NPCS = [
  {
    id: 'guard',
    name: '단지 경비 아저씨',
    x: -4.8,
    z: 3.5,
    facing: 0, // 0이면 화면 아래쪽(플레이어 쪽)을 바라봐요
    questId: 'q_guard',
    look: { skin: 0xf2c9a0, hairStyle: 'none', hat: 'guard', shirt: 0x2f4a86, pants: 0x25365e, shorts: false, shoes: 0x222222, mustache: true },
  },
  {
    id: 'clerk',
    name: 'GS25 알바생',
    x: 17,
    z: -81.5,
    facing: 0,
    questId: 'q_clerk',
    look: { skin: 0xffd7b3, hairStyle: 'short', hair: 0x6b3b1e, shirt: 0xffffff, vest: 0x2a7fd4, pants: 0x3b3b4f, shorts: false, shoes: 0x333333 },
  },
];

export const QUESTS = {
  q_guard: {
    id: 'q_guard',
    title: '단지 안의 수상한 문제집을 처치해라',
    target: { group: 'complex', count: 3 }, // 'complex' 무리의 문제집 3마리
    reward: { heal: 30 }, // 보상: 체력 30 회복
    dialogue: {
      offer: [
        '어이쿠, 등교하는 길이냐? 큰일 났다, 큰일!',
        '어젯밤부터 단지 안을 문제집들이 돌아다녀. 표지에 "6학년 1학기 수학"이라고 쓰여 있더라.',
        '눈이 시뻘겋게 화가 났어. 아무도 안 풀어줘서 삐졌나 봐!',
        '문제집 3마리만 처치해 주겠니? 아저씨는 초소를 비울 수가 없단다!',
      ],
      progress: [
        '문제집들은 아직이냐? 아저씨는 계속 초소에서 떨고 있다…',
        '조심해라! ÷ 기호에 맞으면 의외로 아프단다. 나눗셈은 무서워!',
      ],
      complete: [
        '오오! 단지가 조용해졌구나! 네가 해냈구나!',
        '고맙다! 이 비타민 음료를 마셔라. 아저씨가 몰래 숨겨둔 거란다.',
        '(체력이 30 회복됐다!)',
      ],
      done: ['학교 가는 길 조심해라! 늦으면 교문 앞에서 선생님한테 걸린단다!'],
    },
  },

  q_clerk: {
    id: 'q_clerk',
    title: '편의점 앞을 막고 있는 문제집을 처치해라',
    target: { group: 'gs25', count: 3 },
    reward: { heal: 30 },
    dialogue: {
      offer: [
        '어서 오세요… 아니, 오지 마세요! 아니, 오세요! 아무튼 큰일 났어요!',
        '편의점 앞에 문제집들이 줄을 서서 안 비켜요. 손님이 한 명도 못 들어와요!',
        '삼각김밥보다 수학 문제집이 더 많은 건 태어나서 처음 봐요.',
        '문제집 3마리만 처치해 주세요! 보답으로 따끈한 삼각김밥 드릴게요!',
      ],
      progress: [
        '아직도 입구를 막고 있어요! 손님 대신 연산 문제만 가득해요…',
        '저쪽 문제집들 보이죠? 한 번만 더 부탁해요!',
      ],
      complete: [
        '와아! 길이 뚫렸어요! 드디어 손님이… 아직 아무도 없네요.',
        '그래도 감사해요! 이 삼각김밥 드세요. 방금 데웠어요!',
        '(체력이 30 회복됐다!)',
      ],
      done: ['학교는 저 위쪽이에요. 지각하지 마세요! 저는 계속 알바해야 하지만요…'],
    },
  },
};
