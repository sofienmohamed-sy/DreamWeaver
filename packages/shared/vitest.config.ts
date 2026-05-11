import { defineConfig } from 'vitest/config';

// LEARN: Vitest reuses Vite's resolver, so it can read TS source
// directly with no extra build step. We point `include` at src so
// tests live next to the code they exercise.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/__tests__/**/*.test.ts'],
    environment: 'node',
  },
});
