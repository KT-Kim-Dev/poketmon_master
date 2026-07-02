import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages base 경로 자동 계산
 * - username.github.io 저장소 → /
 * - username/repo-name       → /repo-name/
 * - VITE_BASE 환경 변수로 override 가능
 */
function resolveBase() {
  if (process.env.VITE_BASE) {
    return process.env.VITE_BASE.endsWith('/')
      ? process.env.VITE_BASE
      : `${process.env.VITE_BASE}/`;
  }

  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  if (!repo) return '/';
  if (repo.endsWith('.github.io')) return '/';
  return `/${repo}/`;
}

export default defineConfig({
  plugins: [react()],
  base: resolveBase(),
});
