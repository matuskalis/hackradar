import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Git worktrees created for parallel agents live under .claude and carry
    // their own copy of the suite; running it from here resolves @/ against
    // the wrong tree.
    exclude: ['**/node_modules/**', '**/.claude/**', '**/.next/**'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
})
