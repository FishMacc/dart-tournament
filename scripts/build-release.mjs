#!/usr/bin/env node
// Builds a portable folder (dist/DartTournament) that only needs Node.js:
// prebuilt web app + server with production dependencies + double-click starters.
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientDir = path.join(root, 'client');
const serverDir = path.join(root, 'server');
const releaseDir = path.join(root, 'dist', 'DartTournament');
const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });

console.log('🚀 Building portable release...');

console.log('\n📦 [1/3] Building client');
if (!fs.existsSync(path.join(clientDir, 'node_modules'))) sh('npm ci', clientDir);
sh('npm run build', clientDir);

console.log('\n📦 [2/3] Assembling release folder');
fs.rmSync(releaseDir, { recursive: true, force: true });
const releaseServer = path.join(releaseDir, 'server');
fs.mkdirSync(releaseServer, { recursive: true });
fs.cpSync(path.join(serverDir, 'src'), path.join(releaseServer, 'src'), { recursive: true });
fs.cpSync(path.join(clientDir, 'dist'), path.join(releaseServer, 'public'), { recursive: true });
for (const f of ['package.json', 'package-lock.json']) {
    fs.copyFileSync(path.join(serverDir, f), path.join(releaseServer, f));
}
fs.mkdirSync(path.join(releaseDir, 'scripts'));
fs.copyFileSync(path.join(root, 'scripts', 'start.mjs'), path.join(releaseDir, 'scripts', 'start.mjs'));
for (const f of ['Start-Windows.bat', 'Start-Mac-Linux.command', 'TURNIER_GUIDE.md']) {
    fs.copyFileSync(path.join(root, f), path.join(releaseDir, f));
}
fs.chmodSync(path.join(releaseDir, 'Start-Mac-Linux.command'), 0o755);
fs.copyFileSync(path.join(root, 'INSTALL.txt'), path.join(releaseDir, 'LIESMICH.txt'));

console.log('\n📦 [3/3] Installing server production dependencies');
sh('npm ci --omit=dev', releaseServer);

console.log(`\n✅ Release ready: ${path.relative(root, releaseDir)}`);
console.log('   Zip this folder and copy it to the tournament PC (Node.js 18+ required).');
