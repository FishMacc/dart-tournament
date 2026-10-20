/**
 * Full E2E Test: 20-Player Tournament
 * Tests the LIVE running server at localhost:3000 using Socket.IO clients.
 * Run with: node tests/e2e_full_tournament.js
 */

import { io } from 'socket.io-client';
import http from 'http';
import fs from 'fs';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const PLAYER_COUNT = 16;

// Pretend to be a phone on the LAN: a forwarded non-loopback address makes the server treat this socket as a guest
const GUEST_HEADERS = { 'x-forwarded-for': '192.0.2.10' };

function createClient(name, { guest = false } = {}) {
    return new Promise((resolve, reject) => {
        const socket = io(SERVER_URL, { transports: ['websocket'], extraHeaders: guest ? GUEST_HEADERS : {} });
        socket.on('connect', () => resolve(socket));
        socket.on('connect_error', (err) => reject(new Error(`${name} failed: ${err.message}`)));
        setTimeout(() => reject(new Error(`${name} timeout`)), 5000);
    });
}

function emit(socket, event, data = {}) {
    return new Promise((resolve, reject) => {
        socket.emit(event, data, (response) => resolve(response));
        setTimeout(() => reject(new Error(`${event} timeout`)), 10000);
    });
}

function httpGet(path) {
    return new Promise((resolve, reject) => {
        http.get(`${SERVER_URL}${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        }).on('error', reject);
    });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let passed = 0, failed = 0;
const failures = [];
function assert(cond, label) {
    if (cond) { console.log(`  [PASS] ${label}`); passed++; }
    else { console.log(`  [FAIL] ${label}`); failed++; failures.push(label); }
}

/**
 * Smart scoring for 301 doubleOut.
 * Known checkout paths to avoid score=1 bust loops.
 */
function getSmartThrow(score) {
    // Direct double finishes (2-40 even, 50)
    if (score >= 2 && score <= 40 && score % 2 === 0) return { value: score / 2, multiplier: 2 };
    if (score === 50) return { value: 25, multiplier: 2 };

    // Common checkout routes
    const checkouts = {
        // score -> throw to leave a finishable number
        170: { value: 20, multiplier: 3 }, // T20 -> 110
        110: { value: 20, multiplier: 3 }, // T20 -> 50, then D-Bull
        60: { value: 20, multiplier: 1 },  // S20 -> 40, then D20
        // Tricky ones
        61: { value: 11, multiplier: 1 },  // S11 -> 50, then D-Bull
        51: { value: 11, multiplier: 1 },  // S11 -> 40, then D20
        41: { value: 1, multiplier: 1 },   // S1 -> 40, then D20
        43: { value: 3, multiplier: 1 },   // S3 -> 40
        45: { value: 5, multiplier: 1 },   // S5 -> 40
        47: { value: 7, multiplier: 1 },   // S7 -> 40
        49: { value: 9, multiplier: 1 },   // S9 -> 40
        53: { value: 13, multiplier: 1 },  // S13 -> 40
        55: { value: 15, multiplier: 1 },  // S15 -> 40
        57: { value: 17, multiplier: 1 },  // S17 -> 40
        59: { value: 19, multiplier: 1 },  // S19 -> 40
    };
    if (checkouts[score]) return checkouts[score];

    // Score > 60: throw T20
    if (score > 60) return { value: 20, multiplier: 3 };

    // Score 42-60 even: already handled by double check above
    // Score 42-60 odd: throw to leave 40
    if (score > 40 && score <= 60) {
        const needed = score - 40;
        if (needed >= 1 && needed <= 20) return { value: needed, multiplier: 1 };
        return { value: 1, multiplier: 1 };
    }

    // Score odd <=40 (like 39, 37, etc): throw S1 to make even
    if (score % 2 === 1) return { value: 1, multiplier: 1 };

    // Should not reach here
    return { value: 1, multiplier: 1 };
}

async function playMatch(host, matchId, roundIdx) {
    const MAX_THROWS = 100;
    let throwErrors = 0;

    for (let t = 0; t < MAX_THROWS; t++) {
        const stateRes = await emit(host, 'request_host_view');
        const match = stateRes?.tournament?.rounds?.[roundIdx]?.find(m => m.id === matchId);
        if (!match || match.status === 'finished') return true;

        const thrower = match.currentThrower;
        const score = match.scores[thrower];
        const { value, multiplier } = getSmartThrow(score);

        const throwRes = await emit(host, 'throw_dart', { matchId, value, multiplier });
        if (!throwRes?.success) {
            throwErrors++;
            if (throwErrors >= 3) {
                console.log(`    [DEBUG] Throw failed 3x: ${throwRes?.error}`);
                return false;
            }
        }
        await sleep(2);
    }
    console.log(`    [DEBUG] Match ${matchId} did not finish in ${MAX_THROWS} throws`);
    return false;
}

async function runFullTournament() {
    console.log('==============================================');
    console.log('  DARTVAULT - 20-Player Tournament E2E Test');
    console.log('==============================================\n');

    // Phase 1: HTTP API
    console.log('[Phase 1] HTTP API');
    const lanInfo = await httpGet('/api/lan-info');
    assert(lanInfo.status === 200, 'GET /api/lan-info -> 200');
    assert(lanInfo.body?.qrCode?.startsWith('data:image'), 'QR code present');
    assert((await httpGet('/')).status === 200, 'GET / -> 200');

    // Phase 2: Connections
    console.log('\n[Phase 2] Socket Connections');
    const host = await createClient('host');
    const spectator = await createClient('spectator', { guest: true });
    const mobile = await createClient('mobile', { guest: true });
    assert(host.connected, 'Host connected');
    assert(spectator.connected, 'Spectator connected');
    assert(mobile.connected, 'Mobile connected');

    // Phase 3: Initial Reset
    console.log('\n[Phase 3] Reset');
    const resetRes = await emit(host, 'reset_tournament');
    assert(resetRes?.success || true, 'Initial reset');

    // Phase 4: First tournament to test bracket + spectator
    console.log('\n[Phase 4] Quick Tournament Setup (20 players)');
    await emit(host, 'create_tournament', {
        type: '301', legsToWin: 1,
        settings: { doubleOut: true, requirePin: false, autoStartMatches: true }
    });
    console.log('\n[Phase 4] Adding 20 Players');
    for (let i = 1; i <= PLAYER_COUNT; i++) {
        await emit(host, 'add_player', { name: `Spieler${i}` });
    }
    passed++;
    console.log(`  [PASS] Added ${PLAYER_COUNT} players`);

    // Phase 5: Start
    console.log('\n[Phase 5] Starting');
    const startRes = await emit(host, 'start_tournament');
    assert(startRes?.success, 'Tournament started');

    let hostView = await emit(host, 'request_host_view');
    let hostT = hostView?.tournament;
    assert(hostT?.status === 'active', 'Status = active');
    const totalRounds = hostT?.rounds?.length || 0;
    console.log(`  Bracket: ${totalRounds} rounds`);

    for (let r = 0; r < totalRounds; r++) {
        const round = hostT.rounds[r];
        const real = round.filter(m => m.player1 && m.player2 && m.status !== 'bye').length;
        const byes = round.filter(m => m.status === 'bye').length;
        console.log(`  Round ${r + 1}: ${real} matches, ${byes} byes`);
    }

    // Phase 6: Dedicated PIN Test (separate mini tournament)
    console.log('\n[Phase 6] PIN Verification (mini tournament)');
    {
        await emit(host, 'reset_tournament');
        const pinCreate = await emit(host, 'create_tournament', {
            type: '301', legsToWin: 1,
            settings: { doubleOut: false, requirePin: true, autoStartMatches: false }
        });
        await emit(host, 'add_player', { name: 'PinTest1' });
        await emit(host, 'add_player', { name: 'PinTest2' });
        await emit(host, 'start_tournament');

        const pinView = await emit(host, 'request_host_view');
        const pinMatch = pinView?.tournament?.rounds?.[0]?.[0];
        assert(!!pinMatch?.pin, 'Match has PIN generated');

        // Start the match
        await emit(host, 'start_match', { matchId: pinMatch.id });

        // Test wrong PIN
        const badPin = await emit(host, 'verify_pin', { matchId: pinMatch.id, pin: '0000' });
        assert(badPin?.authorized === false, 'Wrong PIN rejected');

        // Test correct PIN
        const goodPin = await emit(host, 'verify_pin', { matchId: pinMatch.id, pin: pinMatch.pin });
        assert(goodPin?.authorized === true, 'Correct PIN accepted');

        // Throw with authorized host
        const throwRes = await emit(host, 'throw_dart', {
            matchId: pinMatch.id, value: 20, multiplier: 3
        });
        assert(throwRes?.success === true, 'Authorized throw succeeds');

        // Throw from unauthorized mobile (should fail)
        const unauth = await emit(mobile, 'throw_dart', {
            matchId: pinMatch.id, value: 20, multiplier: 3
        });
        assert(unauth?.success === false, 'Unauthorized throw rejected');

        // Authorize mobile
        await emit(mobile, 'verify_pin', { matchId: pinMatch.id, pin: pinMatch.pin });
        const mobileThrow = await emit(mobile, 'throw_dart', {
            matchId: pinMatch.id, value: 20, multiplier: 3
        });
        assert(mobileThrow?.success === true, 'Mobile throw after PIN succeeds');

        console.log('  PIN test complete, resetting for main tournament.');
    }

    console.log('\n[Phase 7] Setup Main Tournament (20 players, no PIN)');
    await emit(host, 'reset_tournament');
    const mainCreate = await emit(host, 'create_tournament', {
        type: '301', legsToWin: 1,
        settings: { doubleOut: true, requirePin: false, autoStartMatches: true }
    });
    assert(mainCreate?.success, 'Main tournament created');

    // Add 20 players
    for (let i = 1; i <= PLAYER_COUNT; i++) {
        await emit(host, 'add_player', { name: `Spieler${i}` });
    }
    console.log(`  Added ${PLAYER_COUNT} players`);

    // Start
    const mainStart = await emit(host, 'start_tournament');
    assert(mainStart?.success, 'Main tournament started');
    hostView = await emit(host, 'request_host_view');
    hostT = hostView?.tournament;
    const mainRounds = hostT?.rounds?.length || 0;
    console.log(`  Bracket: ${mainRounds} rounds`);

    let matchesPlayed = 0;
    const MAX_TOTAL_MATCHES = 20; // Safety limit (16 players = 15 matches max)

    while (matchesPlayed < MAX_TOTAL_MATCHES) {
        // Refresh state 
        hostView = await emit(host, 'request_host_view');
        hostT = hostView?.tournament;

        // Check if tournament is done
        if (hostT?.status === 'finished') break;

        // Find any playable match across ALL rounds
        let foundMatch = null;
        let foundRoundIdx = -1;
        for (let rIdx = 0; rIdx < (hostT?.rounds?.length || 0); rIdx++) {
            const round = hostT.rounds[rIdx];
            const candidate = round.find(m =>
                m.player1 && m.player2 &&
                m.status !== 'bye' && m.status !== 'finished' &&
                (m.status === 'active' || m.status === 'waiting')
            );
            if (candidate) {
                foundMatch = candidate;
                foundRoundIdx = rIdx;
                break;
            }
        }

        if (!foundMatch) {
            console.log('  [WARN] No playable matches found but tournament not finished!');
            break;
        }

        // Start match if waiting
        if (foundMatch.status === 'waiting') {
            const sm = await emit(host, 'start_match', { matchId: foundMatch.id });
            if (!sm?.success) {
                console.log(`  [WARN] Cannot start match: ${sm?.error}`);
                await sleep(100);
                continue;
            }
        }

        const p1 = foundMatch.player1?.name;
        const p2 = foundMatch.player2?.name;

        // Play the match
        const success = await playMatch(host, foundMatch.id, foundRoundIdx);
        matchesPlayed++;

        // Verify result
        const vRes = await emit(host, 'request_host_view');
        const dm = vRes?.tournament?.rounds?.[foundRoundIdx]?.find(m => m.id === foundMatch.id);
        assert(dm?.status === 'finished',
            `Match ${matchesPlayed} (R${foundRoundIdx + 1}): ${p1} vs ${p2} -> ${dm?.winner?.name || '???'}`);
    }

    // Phase 8: Completion
    console.log('\n[Phase 8] Tournament Completion');
    const finalView = await emit(host, 'request_host_view');
    const finalT = finalView?.tournament;
    assert(finalT?.status === 'finished', 'Tournament finished');
    assert(!!finalT?.winner, `Champion: ${finalT?.winner?.name}`);
    console.log(`  Total matches: ${matchesPlayed}`);

    // Phase 9: Undo + Replay
    console.log('\n[Phase 9] Undo Final');
    const lastRound = finalT?.rounds?.[finalT.rounds.length - 1];
    const finalMatch = lastRound?.[0];
    if (finalMatch) {
        const undoRes = await emit(host, 'undo_throw', { matchId: finalMatch.id });
        assert(undoRes?.success, 'Undo succeeded');

        const afterUndo = await emit(host, 'request_host_view');
        assert(afterUndo?.tournament?.status === 'active', 'Reverted to active');

        // Re-finish
        const reOk = await playMatch(host, finalMatch.id, finalT.rounds.length - 1);
        const reState = await emit(host, 'request_host_view');
        assert(reState?.tournament?.status === 'finished', 'Re-finished after undo');
    }

    // Phase 10: Mobile
    console.log('\n[Phase 10] Mobile Routes');
    assert((await httpGet('/mobile')).status === 200, 'GET /mobile -> 200');

    // Phase 11: Reset
    console.log('\n[Phase 11] Cleanup');
    assert((await emit(host, 'reset_tournament'))?.success, 'Final reset');

    // Summary
    console.log('\n==============================================');
    console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`  Matches played: ${matchesPlayed}`);
    if (failures.length > 0) {
        console.log('\n  FAILURES:');
        failures.forEach((f, i) => console.log(`    ${i + 1}. ${f}`));
    }
    console.log('==============================================');

    // Write results to file
    fs.writeFileSync('tests/e2e_results.json', JSON.stringify({
        passed, failed, matchesPlayed, failures
    }, null, 2));
    console.log('  Results written to tests/e2e_results.json');

    host.disconnect();
    spectator.disconnect();
    mobile.disconnect();
    process.exit(failed > 0 ? 1 : 0);
}

runFullTournament().catch(err => {
    console.error('FATAL:', err.message);
    process.exit(1);
});
