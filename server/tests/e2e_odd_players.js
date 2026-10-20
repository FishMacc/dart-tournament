/**
 * Full E2E Test: 5-Player Tournament (Odd Player Count)
 * 
 * Verifies that bracket generation and progression work correctly for an odd number of players without null-null errors.
 * 
 * Run with: node tests/e2e_odd_players.js
 */

import { io } from 'socket.io-client';
import http from 'http';
import fs from 'fs';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const PLAYER_COUNT = 5;

function createClient(name) {
    return new Promise((resolve, reject) => {
        const socket = io(SERVER_URL, {
            forceNew: true,
            reconnection: false,
        });
        socket.on('connect', () => {
            // console.log(`[${name}] Connected ${socket.id}`);
            resolve(socket);
        });
        socket.on('connect_error', (err) => reject(err));
    });
}
function emit(socket, event, data) {
    return new Promise((resolve) => {
        // Some events use ack, some use broadcast. 
        // We'll use a timeout race for safety.
        let resolved = false;
        socket.emit(event, data, (res) => {
            if (!resolved) { resolved = true; resolve(res); }
        });
        setTimeout(() => {
            if (!resolved) { resolved = true; resolve(null); }
        }, 2000);
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
    if (score >= 2 && score <= 40 && score % 2 === 0) return { multiplier: 2, value: score / 2 };
    if (score === 50) return { multiplier: 2, value: 25 };

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
    let matchFinished = false;
    let turnCount = 0;
    const MAX_THROWS = 100;

    while (!matchFinished && turnCount < MAX_THROWS) {
        // 1. Get status
        const view = await emit(host, 'request_host_view');
        const match = view?.tournament?.rounds?.[roundIdx]?.find(m => m.id === matchId);

        if (!match) { console.log('Match not found!'); return false; }
        if (match.status === 'finished') { return true; }

        if (match.status === 'waiting' || !match.player1 || !match.player2) {
            console.log(`  [DEBUG] Match ${matchId} waiting...`);
            await sleep(100);
            continue;
        }

        // 2. Auth for throw
        // ALWAYS refresh pin explicitly to ensure auth
        // Event name is 'verify_pin' in socketHandler.js, NOT 'verify_match_pin'
        const vPinRes = await emit(host, 'verify_pin', { matchId, pin: match.pin });
        if (!vPinRes?.success) {
            console.log(`  [DEBUG] Auth failed: ${vPinRes?.error} (PIN=${match.pin})`);
            await sleep(100);
            continue;
        }

        // 3. Throw
        const thrower = match.currentThrower; // 'player1' or 'player2'
        const score = match.scores[thrower];

        const dart = getSmartThrow(score);

        const res = await emit(host, 'throw_dart', {
            matchId,
            ...dart
        });

        if (res?.success) {
            // Check if finished
            if (res.match?.status === 'finished') return true;
        } else {
            console.log(`  [DEBUG] Throw failed: ${res?.error}`);
        }

        turnCount++;
        await sleep(50);
    }
    return false;
}

(async () => {
    console.log('\n═══════════════════════════════════════════════');
    console.log('  🎯 DARTVAULT — 5-Player Tournament E2E (Odd)');
    console.log('═══════════════════════════════════════════════');

    // Setup: Reset & Create
    const host = await createClient('Host');

    // Reset
    await emit(host, 'reset_tournament');
    await sleep(200);

    // Create
    await emit(host, 'create_tournament', { name: 'Odd E2E', legsToWin: 1, startingScore: 301, settings: { doubleOut: true, autoStartMatches: true } });
    await sleep(200);

    // Add 5 players
    for (let i = 1; i <= PLAYER_COUNT; i++) {
        await emit(host, 'add_player', { name: `Spieler${i}` });
    }

    // Start
    const startRes = await emit(host, 'start_tournament');
    assert(startRes.success, 'Tournament started');

    // Play loop
    let matchesPlayed = 0;
    const MAX_MATCHES = 4; // 5 players = 4 matches

    console.log(`  Playing up to ${MAX_MATCHES} matches...`);

    while (matchesPlayed < MAX_MATCHES) {
        await sleep(200); // Wait for potential auto-advancement
        const hostView = await emit(host, 'request_host_view');
        const hostT = hostView?.tournament;

        if (hostT?.status === 'finished') break;

        // Find playable match
        let foundMatch = null;
        let foundRoundIdx = -1;

        for (let r = 0; r < (hostT?.rounds?.length || 0); r++) {
            const round = hostT.rounds[r];
            const candidate = round.find(m =>
                (m.status === 'active' || (m.status === 'waiting' && m.player1 && m.player2))
                && m.status !== 'finished'
                && m.status !== 'bye'
            );
            if (candidate) {
                foundMatch = candidate;
                foundRoundIdx = r;
                break;
            }
        }

        if (!foundMatch) {
            console.log('  [WARN] No playable match found (waiting for others to finish?)');

            // Log detailed debug info about rounds
            if (hostT && hostT.rounds) {
                console.log(`  [DEBUG] Rounds count: ${hostT.rounds.length}`);
                hostT.rounds.forEach((round, rIdx) => {
                    // Log ONLY if interesting (avoids huge span)
                    const interesting = round.filter(m => m.status !== 'bye' && m.status !== 'finished' && m.status !== 'scheduled');
                    if (interesting.length > 0) {
                        console.log(`  [DEBUG] Round ${rIdx} interesting matches:`);
                        interesting.forEach(m => {
                            console.log(`    R${rIdx}M${m.id.substring(0, 4)}: ${m.player1?.name || 'null'} vs ${m.player2?.name || 'null'} [${m.status}]`);
                        });
                    } else {
                        // console.log(`  [DEBUG] Round ${rIdx}: All bye or finished or scheduled`);
                    }
                });
            }

            await sleep(2000);
            continue;
        }

        if (foundMatch.status === 'waiting') {
            await emit(host, 'start_match', { matchId: foundMatch.id });
            await sleep(100);
        }

        console.log(`  Playing Match ${matchesPlayed + 1} (R${foundRoundIdx + 1}): ${foundMatch.player1.name} vs ${foundMatch.player2.name}`);
        await playMatch(host, foundMatch.id, foundRoundIdx);
        matchesPlayed++;

        const vRes = await emit(host, 'request_host_view');
        const m = vRes?.tournament?.rounds?.[foundRoundIdx]?.find(x => x.id === foundMatch.id);
        assert(m?.status === 'finished', `Match finished: ${m?.winner?.name}`);
    }

    // Give server a moment to process tournament end
    await sleep(2000); // 2 secons safer

    const finalView = await emit(host, 'request_host_view');
    if (finalView?.tournament?.status !== 'finished') {
        console.log(`  [FAIL] Tournament status is '${finalView?.tournament?.status}' (expected 'finished')`);
        // Debug last match status
        const lastRound = finalView?.tournament?.rounds?.[finalView.tournament.rounds.length - 1];
        const lastMatch = lastRound?.[0];
        console.log(`  [DEBUG] Final Match: ${lastMatch?.player1?.name} vs ${lastMatch?.player2?.name} [${lastMatch?.status}] Winner=${lastMatch?.winner?.name}`);
    }

    assert(finalView?.tournament?.status === 'finished', 'Tournament Finished');
    assert(!!finalView?.tournament?.winner, `Winner: ${finalView?.tournament?.winner?.name}`);
    console.log(`  Total matches played: ${matchesPlayed}`);

    console.log(`\n  RESULTS: ${passed} passed, ${failed} failed`);

    host.disconnect();
    process.exit(failed > 0 ? 1 : 0);
})();
