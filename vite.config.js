import { defineConfig } from 'vite';

// Vite 설정 — 정적 사이트(Render Static Site)로 배포하기 위한 최소 설정이에요.
export default defineConfig({
  base: './', // 어느 주소에서 열어도 파일을 찾을 수 있게 상대 경로를 써요
  server: { host: true }, // 같은 와이파이의 폰에서도 개발 서버에 접속해 볼 수 있어요
  build: {
    outDir: 'dist', // Render의 Publish Directory(dist)와 같은 이름
    chunkSizeWarningLimit: 1000, // three.js가 커서 나오는 경고를 완화
  },
});
