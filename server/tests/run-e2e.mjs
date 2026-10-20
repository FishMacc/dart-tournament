#!/usr/bin/env node
// Runs the socket-level end-to-end scripts against a throwaway server:
// own port, own temporary data folder, so a real tournament is never touched.
//   npm run test:e2e
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPTS = ['e2e.manual.js', 'e2e_full_tournament.js', 'e2e_odd_players.js'];
const PORT = Number(process.env.E2E_PORT) || 3999;
const SERVER_URL = `http://localhost:${PORT}`;

async function waitForServer(timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            if ((await fetch(`${SERVER_URL}/api/health`)).ok) return;
        } catch { /* not up yet */ }
        await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error(`Server did not start on port ${PORT}`);
}

let failed = 0;
for (const script of SCRIPTS) {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dart-e2e-'));
    const server = spawn(process.execPath, ['src/server.js'], {
        cwd: serverDir,
        env: { ...process.env, PORT: String(PORT), DART_DATA_DIR: dataDir, NO_BROWSER: '1' },
        stdio: 'ignore',
    });
    try {
        await waitForServer();
        console.log(`\n▶ ${script}`);
        const result = spawnSync(process.execPath, [path.join('tests', script)], {
            cwd: serverDir,
            env: { ...process.env, SERVER_URL },
            stdio: 'inherit',
        });
        if (result.status !== 0) failed++;
    } finally {
        // Wait until the port is free again before the next script starts its server
        const exited = new Promise((resolve) => server.once('exit', resolve));
        server.kill();
        await exited;
        fs.rmSync(dataDir, { recursive: true, force: true });
    }
}

console.log(failed ? `\n❌ ${failed} of ${SCRIPTS.length} e2e scripts failed` : `\n✅ All ${SCRIPTS.length} e2e scripts passed`);
process.exit(failed ? 1 : 0);
