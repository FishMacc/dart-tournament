import os from 'os';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/**/*.test.js'],
        // Never touch the real tournament backup while testing
        env: { DART_DATA_DIR: path.join(os.tmpdir(), `dart-tournament-test-${process.pid}`) },
    },
});
