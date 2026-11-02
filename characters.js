// ============================================================
// characters.js — 캐릭터 정의 (데이터 기반)
//
// 새 캐릭터를 추가하려면 아래 배열에 객체 하나만 더 넣으면 돼요.
//  - playable: true 인 캐릭터가 게임에서 조종하는 주인공이에요 (이번 초안은 이도윤만).
//  - faceTexture: 나중에 친구 사진(얼굴 이미지 경로)을 넣을 자리예요. 지금은 null(비어 있음).
//  - look: 모델의 생김새(색, 머리 모양 등). src/entities/models.js 의 buildHuman 이 읽어요.
//
// ※ '유재석'은 연예인이 아니라 친구의 이름이에요.
//    연예인을 연상시키는 외형이나 대사는 넣지 않아요.
// ============================================================
import { PLAYER } from '../config.js';

export const CHARACTERS = [
  { id: 'yoo_jaeseok', name: '유재석', playable: false, faceTexture: null },

  {
    id: 'lee_doyoon',
    name: '이도윤',
    playable: true,
    maxHp: 100,
    moveSpeed: PLAYER.moveSpeed, // 이동속도는 config.js 의 PLAYER.moveSpeed 에서 조절
    weaponId: 'twig', // data/weapons.js 의 무기 id
    faceTexture: null,
    look: {
      skin: 0xffd7b3,
      hairStyle: 'parted', // 5:5 가르마 + 이마가 드러나게 양옆으로 넘긴 머리
      hair: 0x2b1d16, // 짙은 갈색~검정
      shirt: 0xffd93d, // 노란 티셔츠
      pants: 0x3a6fd8, // 파란 반바지
      shorts: true,
      shoes: 0xffffff,
      bag: 0xe8493b, // 빨간 책가방 (등교 중!)
    },
  },

  { id: 'choi_hangyeol', name: '최한결', playable: false, faceTexture: null },
  { id: 'lee_woojae', name: '이우재', playable: false, faceTexture: null },
  { id: 'shin_woobin', name: '신우빈', playable: false, faceTexture: null },
];

export const getPlayableCharacter = () => CHARACTERS.find((c) => c.playable);
