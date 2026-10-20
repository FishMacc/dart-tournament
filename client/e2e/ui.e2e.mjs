#!/usr/bin/env node
// Browser end-to-end test: plays a full 3-player tournament through the real UI.
// A host browser (desktop) runs the tournament, a phone browser (mobile viewport,
// treated as a guest on the LAN) scores a match with its PIN.
//
//   npm run test:ui                      (from the repo root; builds the client first)
//   SCREENSHOT_DIR=shots npm run test:ui (also saves a screenshot of every step)
//   CHROMIUM_PATH=/usr/bin/chromium …    (use an installed Chromium instead of Playwright's)
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = Number(process.env.E2E_PORT) || 3998;
const BASE = `http://localhost:${PORT}`;
const SHOTS = process.env.SCREENSHOT_DIR ? path.resolve(process.env.SCREENSHOT_DIR) : null;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dart-ui-'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = () => JSON.parse(fs.readFileSync(path.join(dataDir, 'tournament_backup.json'), 'utf8'));
const allMatches = () => state().rounds.flat();
const pageErrors = [];
let step = 0;

function check(condition, message) {
    if (!condition) throw new Error(`Check failed: ${message}`);
    console.log(`  ✓ ${message}`);
}

async function until(fn, message, timeoutMs = 5000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try { if (fn()) { console.log(`  ✓ ${message}`); return; } } catch { /* backup not written yet */ }
        await sleep(100);
    }
    throw new Error(`Timed out: ${message}`);
}

async function shot(page, name) {
    if (!SHOTS) return;
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.evaluate(() => window.scrollTo(0, 0)); // sticky header would cover content otherwise
    await sleep(400); // let fade-in animations finish
    await page.screenshot({ path: path.join(SHOTS, `${String(++step).padStart(2, '0')}-${name}.png`), fullPage: true });
}

async function newPage(browser, who, options) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(`[${who}] ${m.text()}`); });
    page.on('pageerror', (e) => pageErrors.push(`[${who}] ${e.message}`));
    return page;
}

/** Enter one dart on the score pad: multiplier 1/2/3, value 1-20, 25 (bull) or 0 (miss). */
async function dart(page, multiplier, value) {
    if (multiplier === 2) await page.getByRole('button', { name: 'Double', exact: true }).click();
    if (multiplier === 3) await page.getByRole('button', { name: 'Triple', exact: true }).click();
    if (value === 0) await page.getByRole('button', { name: /Miss/ }).click();
    else if (value === 25) await page.getByRole('button', { name: /Bull/ }).click();
    else await page.locator('.number-pad .number-btn', { hasText: new RegExp(`^${value}$`) }).click();
    await sleep(120);
}

async function waitForServer() {
    for (let i = 0; i < 50; i++) {
        try { if ((await fetch(`${BASE}/api/health`)).ok) return; } catch { /* not up yet */ }
        await sleep(200);
    }
    throw new Error('Server did not start');
}

const server = spawn(process.execPath, ['src/server.js'], {
    cwd: path.join(root, 'server'),
    env: { ...process.env, PORT: String(PORT), DART_DATA_DIR: dataDir },
    stdio: 'ignore',
});
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

try {
    await waitForServer();

    // ---------- Host: create a 301 tournament with a prize pool ----------
    console.log('\nHost: setup');
    const host = await newPage(browser, 'host', { viewport: { width: 1366, height: 900 } });
    await host.goto(BASE);
    await host.locator('#btn-get-started').waitFor();
    check(await host.locator('html').getAttribute('lang') === 'en', 'English is the default language');
    await shot(host, 'host-home');
    await host.click('#btn-get-started');
    await host.fill('#input-tournament-name', 'Friday Night Darts');
    await host.selectOption('#select-game-type', '301');
    await host.locator('.setting-row', { hasText: 'Prize pool' }).locator('.toggle-slider').click();
    await host.fill('#input-entry-fee', '5');
    await shot(host, 'host-setup');
    await host.click('#btn-create-tournament');
    await host.locator('#input-player-name').waitFor();
    for (const name of ['Alice', 'Bob', 'Carol']) {
        await host.fill('#input-player-name', name);
        await host.click('#btn-add-player');
        await host.getByText(name, { exact: true }).waitFor();
    }
    await host.fill('#input-player-name', 'Bob');
    await host.click('#btn-add-player');
    await host.getByText('Player "Bob" already exists').waitFor();
    check(true, 'duplicate player name is rejected with a message');
    await host.locator('.player-item', { hasText: 'Carol' }).locator('.player-remove-btn').click();
    await host.getByText('Carol', { exact: true }).waitFor({ state: 'detached' });
    await host.fill('#input-player-name', 'Carol');
    await host.click('#btn-add-player');
    await host.getByText('Carol', { exact: true }).waitFor();
    check(true, 'players can be added and removed');
    await shot(host, 'host-players');
    await host.click('#btn-start-tournament');
    await until(() => state().status === 'active', 'tournament is running');
    await host.locator('.bracket').waitFor();
    check((await host.locator('body').innerText()).includes('€15.00'), 'prize pool shows €15.00');
    await shot(host, 'host-bracket');

    const semi = allMatches().find((m) => m.status === 'waiting' && m.player1 && m.player2);
    const pin = (await host.locator(`#btn-start-match-${semi.id}`).locator('..').locator('.pin-value').innerText()).trim();
    check(/^\d{4}$/.test(pin), `host sees the match PIN (${pin})`);

    // ---------- Phone: lobby, PIN, scoring ----------
    console.log('\nPhone: scoring with PIN');
    const phone = await newPage(browser, 'phone', {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
    });
    // Look like a phone on the LAN to the server, not like the host PC
    await phone.context().route(`${BASE}/**`, (route) => route.continue({
        headers: { ...route.request().headers(), 'x-forwarded-for': '192.0.2.10' },
    }));
    await phone.goto(BASE);
    await phone.locator(`#mobile-match-${semi.id}`).waitFor();
    check(await phone.locator('#btn-get-started, #btn-reset-tournament').count() === 0, 'phone gets the lobby, no host controls');
    await shot(phone, 'phone-lobby');
    await phone.click(`#mobile-match-${semi.id}`);
    await phone.fill('#input-match-pin', pin === '0000' ? '1111' : '0000');
    await phone.click('#btn-verify-pin');
    await phone.getByText('Wrong PIN, please try again.').waitFor();
    check(true, 'wrong PIN is rejected');
    await phone.fill('#input-match-pin', pin);
    await phone.click('#btn-verify-pin');
    await phone.locator('#btn-mobile-start-match').click();
    await until(() => allMatches().find((m) => m.id === semi.id).status === 'active', 'phone started the match');

    const m = () => allMatches().find((x) => x.id === semi.id);
    const first = m().currentThrower;
    const second = first === 'player1' ? 'player2' : 'player1';
    for (let i = 0; i < 3; i++) await dart(phone, 3, 20);
    await until(() => m().scores[first] === 121 && m().currentThrower === second, '180 scored, 121 left, turn passes');
    await dart(phone, 1, 1);
    await until(() => m().scores[second] === 300, 'S1 scored');
    await phone.getByRole('button', { name: /Undo/ }).click();
    await until(() => m().scores[second] === 301, 'undo restores the score');
    for (let i = 0; i < 3; i++) await dart(phone, 1, 0);
    await dart(phone, 3, 20);
    await dart(phone, 3, 20);
    await until(() => m().scores[first] === 121 && m().currentThrower === second, 'bust voids the whole turn');
    await phone.getByText('BUST!').waitFor();
    await shot(phone, 'phone-scoring');
    for (let i = 0; i < 3; i++) await dart(phone, 1, 0);
    await phone.reload();
    await phone.locator('.number-pad').waitFor();
    check(await phone.locator('#input-match-pin').count() === 0, 'phone stays authorized after a reload');
    await dart(phone, 3, 20);
    await dart(phone, 3, 7);
    await dart(phone, 2, 20);
    await until(() => m().status === 'finished', 'checkout T20 T7 D20 wins the match');
    await phone.locator('#btn-back-to-lobby').waitFor();

    // ---------- Final: host starts and scores, phone spectates ----------
    console.log('\nHost: final');
    const final = allMatches().find((x) => x.status === 'waiting' && x.player1 && x.player2);
    check(!!final, 'final is ready');
    await host.click(`#btn-start-match-${final.id}`);
    await until(() => allMatches().find((x) => x.id === final.id).status === 'active', 'host started the final');
    await phone.goto(`${BASE}/live/${final.id}`);
    await phone.locator('.live-match-container').waitFor();
    await host.goto(`${BASE}/mobile/match/${final.id}`);
    await host.locator('.number-pad').waitFor();
    check(await host.locator('#input-match-pin').count() === 0, 'host scores without a PIN');
    const f = () => allMatches().find((x) => x.id === final.id);
    const ff = f().currentThrower;
    for (let i = 0; i < 3; i++) await dart(host, 3, 20);
    await until(() => f().scores[ff] === 121, 'final: 121 left');
    await phone.locator('.live-player-score', { hasText: '121' }).waitFor();
    check(true, 'spectator view updates live');
    await shot(phone, 'phone-live');
    for (let i = 0; i < 3; i++) await dart(host, 1, 0);
    await dart(host, 3, 20);
    await dart(host, 3, 7);
    await dart(host, 2, 20);
    await until(() => state().status === 'finished', 'tournament finished');

    await host.goto(BASE);
    await host.locator('.stats-board').waitFor();
    const winner = state().winner.name;
    const stats = await host.locator('.stats-board').innerText();
    check(stats.includes(winner) && stats.includes('€15.00'), `statistics show champion ${winner} with €15.00`);
    await shot(host, 'host-stats');

    // ---------- German ----------
    console.log('\nLanguage switch');
    await host.click('#btn-language');
    await host.getByText('Turnierstatistik').waitFor();
    check(await host.locator('html').getAttribute('lang') === 'de', 'host switched to German');
    check((await host.locator('.stats-board').innerText()).includes('15,00'), 'German money format');
    await host.reload();
    await host.getByText('Turnierstatistik').waitFor();
    check(true, 'language choice survives a reload');
    await host.click('#btn-language');
    await host.getByText('Tournament statistics').waitFor();
    await phone.goto(BASE);
    await phone.click('#btn-language');
    await phone.getByText('Turnier beendet!').waitFor();
    check(true, 'phone lobby in German');
    await shot(phone, 'phone-finished-de');

    // ---------- Reset ----------
    await host.click('#btn-reset-tournament');
    await host.locator('.modal-content .btn-danger').click();
    await host.locator('#btn-get-started').waitFor();
    check(!fs.existsSync(path.join(dataDir, 'tournament_backup.json')), 'reset clears the saved tournament');

    check(pageErrors.length === 0, `no browser errors${pageErrors.length ? `:\n${pageErrors.join('\n')}` : ''}`);
    console.log('\n✅ UI test passed');
} catch (err) {
    console.error(`\n❌ UI test failed: ${err.message}`);
    if (pageErrors.length) console.error(pageErrors.join('\n'));
    process.exitCode = 1;
} finally {
    await browser.close();
    const exited = new Promise((resolve) => server.once('exit', resolve));
    server.kill();
    await exited;
    fs.rmSync(dataDir, { recursive: true, force: true });
}
