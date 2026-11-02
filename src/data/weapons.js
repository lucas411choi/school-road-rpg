// ============================================================
// weapons.js — 무기 정의 (데이터 기반)
// 새 무기(판타지/애니풍 등)를 추가하려면 이 객체에 항목을 하나 더 넣고,
// 모델은 src/entities/models.js 의 WEAPON_BUILDERS 에 만들어 넣으면 돼요.
// ============================================================

export const WEAPONS = {
  twig: {
    id: 'twig',
    // ※ UI에 이 이름 그대로 표시돼요. 한 글자도 바꾸지 마세요!
    name: '길에서 주웠는데 딱 봐도 쓸모없어 보이는 나뭇가지',
    type: 'melee', // 근접 무기
    damage: 10, // 공격력
    cooldown: 0.5, // 공격 쿨타임(초)
    range: 2.0, // 부채꼴 반경 (유닛)
    arcDeg: 100, // 부채꼴 각도 (도)
    swingTime: 0.28, // 휘두르는 동작 시간(초)
    slashColor: 0xfff3b0, // 휘두를 때 나오는 반투명 호 색
    model: 'twig', // models.js 의 WEAPON_BUILDERS 키
  },
};
