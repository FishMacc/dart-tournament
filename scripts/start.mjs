#!/usr/bin/env node
// One-command start: installs missing dependencies, builds the client when
// needed, starts the server and opens the browser.
//   node scripts/start.mjs [--no-browser]
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = path.join(root, 'server');
const clientDir = path.join(root, 'client');
const PORT = Number(process.env.PORT) || 3000;
const openBrowser = !process.argv.includes('--no-browser') && !process.env.NO_BROWSER && !process.env.CI;

const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
    console.error(`❌ Node.js ${process.versions.node} ist zu alt. Bitte Node.js 18 oder neuer installieren: https://nodejs.org`);
    process.exit(1);
}

function run(args, cwd) {
    console.log(`\n▶ npm ${args.join(' ')}  (${path.relative(root, cwd) || '.'})`);
    const result = spawnSync('npm', args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
    if (result.status !== 0) {
        console.error(`❌ "npm ${args.join(' ')}" fehlgeschlagen.`);
        process.exit(result.status || 1);
    }
}

function newestMtime(p) {
    if (!fs.existsSync(p)) return 0;
    const stat = fs.statSync(p);
    if (!stat.isDirectory()) return stat.mtimeMs;
    return fs.readdirSync(p).reduce((max, entry) => Math.max(max, newestMtime(path.join(p, entry))), stat.mtimeMs);
}

function clientNeedsBuild() {
    const builtIndex = path.join(clientDir, 'dist', 'index.html');
    if (!fs.existsSync(builtIndex)) return true;
    const builtAt = fs.statSync(builtIndex).mtimeMs;
    const sources = ['src', 'public', 'index.html', 'vite.config.js', 'package.json'];
    return sources.some((s) => newestMtime(path.join(clientDir, s)) > builtAt);
}

if (!fs.existsSync(path.join(serverDir, 'node_modules'))) {
    console.log('📦 Erster Start: installiere Server-Abhängigkeiten...');
    run(['install', '--omit=dev'], serverDir);
}

// Portable releases ship a prebuilt client in server/public and no client folder
if (fs.existsSync(path.join(clientDir, 'package.json')) && clientNeedsBuild()) {
    if (!fs.existsSync(path.join(clientDir, 'node_modules'))) {
        console.log('📦 Installiere Client-Abhängigkeiten...');
        run(['install'], clientDir);
    }
    console.log('🔨 Baue die Web-Oberfläche...');
    run(['run', 'build'], clientDir);
}

const server = spawn(process.execPath, [path.join(serverDir, 'src', 'server.js')], {
    cwd: serverDir,
    stdio: 'inherit',
    env: process.env,
});

server.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.kill(signal));
}

async function waitForServer(url, timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const res = await fetch(url);
            if (res.ok) return true;
        } catch { /* not up yet */ }
        await new Promise((r) => setTimeout(r, 300));
    }
    return false;
}

if (openBrowser) {
    const url = `http://localhost:${PORT}`;
    if (await waitForServer(`${url}/api/health`)) {
        const [cmd, args] = process.platform === 'win32'
            ? ['cmd', ['/c', 'start', '', url]]
            : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
        const opener = spawn(cmd, args, { stdio: 'ignore', detached: true });
        opener.on('error', () => console.log(`   Browser bitte manuell öffnen: ${url}`));
        opener.unref();
    }
}
