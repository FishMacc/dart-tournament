const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'client');
const serverDir = path.join(rootDir, 'server');
const distDir = path.join(rootDir, 'dist');

// Ensure dist dir exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

console.log('🚀 Starting Release Build...');

try {
    // 1. Client Build
    console.log('\n📦 [1/5] Building Client...');
    execSync('npm install', { cwd: clientDir, stdio: 'inherit' });
    execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });

    // 2. Prepare Server Public Folder
    console.log('\n📦 [2/5] Preparing Server Assets...');
    const serverPublicDir = path.join(serverDir, 'public');
    if (fs.existsSync(serverPublicDir)) {
        fs.rmSync(serverPublicDir, { recursive: true, force: true });
    }
    fs.mkdirSync(serverPublicDir);

    // Copy client build to server public
    console.log('   Copying client/dist to server/public...');
    fs.cpSync(path.join(clientDir, 'dist'), serverPublicDir, { recursive: true });

    // 3. Install Server Deps
    console.log('\n📦 [3/5] Installing Server Dependencies...');
    execSync('npm install', { cwd: serverDir, stdio: 'inherit' });

    // 4. Create Portable Release Folder (Reliable)
    console.log('\n📦 [4/5] Creating Portable Release Folder...');
    const releaseName = 'DartTournament_v1.0';
    const releaseDir = path.join(distDir, releaseName);
    if (fs.existsSync(releaseDir)) fs.rmSync(releaseDir, { recursive: true, force: true });
    fs.mkdirSync(releaseDir);

    // Copy server (which now includes public/ client build)
    console.log('   Copying server content...');
    fs.cpSync(serverDir, path.join(releaseDir, 'server'), { recursive: true });

    // Copy INSTALL.txt as README.txt
    console.log('   Copying instructions...');
    if (fs.existsSync(path.join(rootDir, 'INSTALL.txt'))) {
        fs.copyFileSync(path.join(rootDir, 'INSTALL.txt'), path.join(releaseDir, 'README.txt'));
    }

    // Remove node_modules from release if you want smaller size? 
    // No, we need them for portable run unless we bundle. 
    // But copying deep node_modules takes time. It's fine for now.

    // Create simple start script
    console.log('   Creating start.bat...');
    const batContent = `@echo off
echo Starting Dart Tournament v1.0...
cd server
npm start
pause`;
    fs.writeFileSync(path.join(releaseDir, 'start.bat'), batContent);

    console.log(`✅ Portable release created at dist/${releaseName}`);

    // 5. Try Package Server (Optional, Experimental)
    console.log('\n📦 [5/5] Attempting Single EXE (Experimental)...');
    try {
        execSync('npx --yes pkg . --targets node18-win-x64 --output ../dist/dart-tournament.exe', { cwd: serverDir, stdio: 'inherit' });
        console.log('\n✅ EXE Build Successful! artifact located at dist/dart-tournament.exe');
    } catch (e) {
        console.log('\n⚠️ EXE build skipped (pkg failed). Use the portable folder in dist/');
    }

} catch (error) {
    console.error('\n❌ Build Failed:', error.message);
    process.exit(1);
}
