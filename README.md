# 📒 문제집이 살아났다! 등굣길 대소동 (초안)

나뭇가지 하나 들고, 살아난 문제집들을 물리치며 학교 정문까지 가는 **3D 쿼터뷰 액션 RPG**의 초안(프로토타입)이에요.
한 판(약 3~5분)을 처음부터 끝까지 플레이할 수 있어요.

- 기술: **Vite + Three.js(npm) + 바닐라 JavaScript**, 서버/DB 없는 정적 사이트
- 이미지/모델/소리 파일은 **하나도 없어요.** 캐릭터와 맵은 전부 코드로 만든 도형, 글씨/표지는 Canvas로 그려요.
- PC(키보드·마우스)와 모바일(터치) 모두 플레이할 수 있어요.

---

## 1. 내 컴퓨터에서 실행하기

1. **Node.js**를 설치해요 → <https://nodejs.org> 에서 **LTS** 버전. (설치 확인: 터미널에 `node -v`)
2. 터미널(윈도우는 PowerShell)을 열고 이 폴더로 이동해요.
   ```bash
   cd school-road-rpg
   ```
3. 필요한 도구를 설치해요. (처음 한 번만, 1~2분)
   ```bash
   npm install
   ```
4. 개발 서버를 켜요.
   ```bash
   npm run dev
   ```
5. 터미널에 나온 주소(보통 `http://localhost:5173`)를 브라우저로 열면 게임 시작!
   - 같은 와이파이의 폰에서 해 보려면 터미널의 **Network** 주소를 폰 브라우저에 입력해요.
6. 배포용으로 묶어 보려면:
   ```bash
   npm run build      # dist 폴더가 만들어져요
   npm run preview    # 만들어진 결과물을 미리 열어 봐요
   ```

---

## 2. GitHub에 올리기

### 방법 A — 웹에서 끌어다 놓기 (가장 쉬워요)
1. <https://github.com> 에 로그인 → 오른쪽 위 **+ → New repository**
2. 이름을 `school-road-rpg` 로 쓰고 **Create repository** (공개 여부는 아래 *참고* 를 읽고 정해요)
3. 만들어진 페이지의 **uploading an existing file** 링크를 눌러요.
4. 압축을 푼 폴더 **안에 있는 것들**(`src` 폴더, `index.html`, `package.json`, `vite.config.js`, `README.md` …)을 전부 끌어다 놓아요.
   - 폴더 자체가 아니라 **폴더 안의 내용물**이 저장소 맨 위에 보여야 해요. (`package.json` 이 맨 위에 보이면 성공)
   - `node_modules`, `dist` 폴더는 올리지 않아요. (아직 없을 거예요)
5. 아래쪽 **Commit changes** 버튼!

### 방법 B — 명령어로 올리기 (git이 설치되어 있다면)
```bash
cd school-road-rpg
git init
git add .
git commit -m "첫 번째 초안"
git branch -M main
git remote add origin https://github.com/내아이디/school-road-rpg.git
git push -u origin main
```

> 참고: Render는 **비공개(Private) 저장소**도 연결할 수 있어요. 나중에 친구 사진을 쓸 계획이라면 저장소를 Private 으로 만드는 걸 추천해요.

---

## 3. Render에 배포하기 (Static Site)

1. <https://render.com> 에 가입해요. (**GitHub로 가입**하면 연결이 쉬워요)
2. 대시보드에서 **New + → Static Site** 를 골라요.
3. GitHub 저장소 목록에서 `school-road-rpg` 를 선택해요. (권한을 물어보면 허용)
4. 아래처럼 입력해요. 나머지는 그대로 두면 돼요.

   | 칸 | 값 |
   |---|---|
   | Name | 마음대로 (주소에 쓰여요) |
   | Branch | `main` |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |

5. **Create Static Site** 를 누르면 빌드가 시작돼요. (1~3분)
6. 로그에 `Your site is live 🎉` 가 나오면, 위쪽의 `https://이름.onrender.com` 주소로 접속해요. 폰에서도 열어 보세요!

**고친 뒤 다시 배포하려면?** 코드를 고치고 GitHub에 다시 올리면(Commit/Push) Render가 알아서 새로 배포해요.

---

## 4. 조작법

| | PC | 모바일 |
|---|---|---|
| 이동 | `W A S D` 또는 방향키 (W = 화면 위쪽) | 왼쪽 아래 조이스틱 |
| 공격 | `스페이스바` 또는 마우스 클릭 | 오른쪽 아래 **공격** 버튼 |
| 대화 / 퀘스트 받기 | NPC 근처에서 `E` | NPC 근처에 나타나는 **대화** 버튼 |
| 대화 넘기기 | `E` / `스페이스바` / 대화창 클릭 | 대화창 터치 |

- 공격은 가장 가까운 적을 **자동으로 조준**해요.
- 머리 위에 노란 **!** 가 있는 사람에게 말을 걸어 퀘스트를 받아요. (초록 **!** = 완료하러 가자)
- 퀘스트 2개를 모두 끝내고 학교 정문까지 가면 클리어!

---

## 5. 숫자·내용을 바꾸고 싶다면

숫자는 모두 한곳에 모여 있어요. 파일을 고치고 저장하면 개발 서버에 바로 반영돼요.

| 바꾸고 싶은 것 | 파일 |
|---|---|
| 카메라 각도 / 거리 / 시야각(FOV) / 따라가는 속도 | `src/config.js` → `CAMERA` |
| 이동 속도, 무적 시간, 오토에임 거리 | `src/config.js` → `PLAYER`, `COMBAT` |
| 밝기, 화질(폰이 느리면 `maxPixelRatio`를 1로) | `src/config.js` → `RENDER` |
| 캐릭터(체력, 옷 색, 머리 모양) | `src/data/characters.js` |
| 무기(공격력, 쿨타임, 범위, 각도) | `src/data/weapons.js` |
| 적(체력, 공격력, 속도, 감지/유지 거리, 공격 간격) | `src/data/enemies.js` |
| NPC·퀘스트·대사·보상 | `src/data/quests.js` |
| 길 모양, 적 배치, 장애물, 건물, 간판 글자 | `src/data/stage.js` |

---

## 6. 폴더 구조

```
index.html          화면 뼈대 (HUD, 대화창, 터치 버튼, 시작/게임오버/클리어 화면)
package.json        필요한 도구 목록과 명령어
vite.config.js      Vite 설정
src/
  main.js           진입점, 게임 루프, 상태(title/playing/dialog/gameover/clear)
  config.js         카메라 / 밸런스 상수
  style.css         화면 스타일
  game/             scene(장면·조명) camera(쿼터뷰) input(키보드·마우스·터치)
                    world(맵·충돌) combat(전투) ai(적 두뇌) quests(퀘스트)
                    effects(공격 궤적·종이 파티클·데미지 숫자) textures(Canvas 그림)
  entities/         Player, Enemy, NPC, Projectile, models(코드로 조립하는 모델)
  data/             characters, weapons, enemies, pets(빈 배열), quests, stage
  ui/               hud, dialog, screens
```

---

## 7. 자주 겪는 문제

- **빌드가 실패해요 (Render)** → Build Command 가 `npm install && npm run build`, Publish Directory 가 `dist` 인지 확인해요. Node 버전 오류가 보이면 Render의 **Environment** 에 `NODE_VERSION` = `20` 을 추가해요.
- `vite` 가 `dependencies` 에 들어 있는 건 일부러예요. (Render 빌드에서 `devDependencies` 가 빠져 `vite: not found` 가 나는 일을 막아 줘요)
- **화면이 하얗게/까맣게 나와요** → 브라우저에서 `F12` → **Console** 탭의 빨간 글씨를 확인해요. (폰이라면 PC에서 같은 주소로 먼저 열어 봐요)
- **폰에서 버벅여요** → `src/config.js` 의 `RENDER.maxPixelRatio` 를 `1` 로 낮춰 봐요.
- **폰 화면이 너무 작게 보여요** → 폰을 **가로**로 돌려요. (세로일 땐 카메라가 자동으로 멀어져요)
- **개발 중 상태를 보고 싶어요** → 브라우저 콘솔에 `__game` 을 입력하면 게임 상태가 보여요.

---

## 8. 이번 초안에서 일부러 안 만든 것 (다음 단계)

친구 사진/얼굴 적용과 나머지 4명 캐릭터, 다른 무기·펫·다른 학년 문제집·보스전, 정교한 맵 디테일, 사운드, 저장 기능, 멀티플레이.
확장하기 쉽도록 `characters.js`(`faceTexture` 자리), `weapons.js`, `enemies.js`(확장 순서 주석), `pets.js`(빈 배열)에 자리를 마련해 두었어요.
