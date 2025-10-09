import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Vitest configuration for the backend
    // This empty config prevents Vitest from loading the root vite.config.ts
    setupFiles: ['./test/setup.ts'],
  },
});