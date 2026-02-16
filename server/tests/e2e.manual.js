// ============================================================
// DartVault — Automated End-to-End Test Suite
// Tests all features via Socket.IO (no browser needed)
// ============================================================
import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';
let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, testName) {
    if (condition) {
        console.log(`  [PASS] ${testName}`);
        passed++;
    } else {
        console.log(`  [FAIL] ${testName}`);
        failed++;
        errors.push(testName);
    }
}

function assertEq(actual, expected, testName) {
    if (actual === expected) {
        console.log(`  [PASS] ${testName}`);
        passed++;
    } else {
        console.log(`  [FAIL] ${testName} (expected: ${expected}, got: ${actual})`);
        failed++;
        errors.push(`${testName} (expected: ${expected}, got: ${actual})`);
    }
}

function createSocket() {
    return new Promise((resolve) => {
        const socket = io(SERVER_URL, { transports: ['websocket'] });
        socket.on('connect', () => resolve(socket));
    });
}

function emit(socket, event, data = {}) {
    return new Promise((resolve, reject) => {
        socket.emit(event, data, (response) => {
            resolve(response);
        });
        setTimeout(() => reject(new Error(`Timeout on ${event}`)), 5000);
    });
}

function waitForEvent(socket, event, timeout = 3000) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), timeout);
        socket.once(event, (data) => {
            clearTimeout(timer);
            resolve(data);
        });
    });
}

// ============================================================
// TEST SUITES
// ============================================================

async function testTournamentCreation(socket) {
    console.log('\n--- TEST: Tournament Creation ---');

    await emit(socket, 'reset_tournament');

    const res = await emit(socket, 'create_tournament', {
        type: '501',
        legsToWin: 2,
        settings: {
            name: 'Test-Turnier',
            requirePin: true,
            doubleOut: true,
            autoStartMatches: false,
            shufflePlayers: false,
        }
    });

    assert(res.success, 'Tournament created successfully');
    assertEq(res.tournament.type, '501', 'Game type is 501');
    assertEq(res.tournament.legsToWin, 2, 'Legs to win is 2');
    assertEq(res.tournament.status, 'setup', 'Status is setup');
    assertEq(res.tournament.settings.requirePin, true, 'PIN required');
    assertEq(res.tournament.settings.doubleOut, true, 'Double-out enabled');
}

async function testPlayerManagement(socket) {
    console.log('\n--- TEST: Player Management ---');

    const r1 = await emit(socket, 'add_player', { name: 'Alice' });
    assert(r1.success, 'Added Alice');

    const r2 = await emit(socket, 'add_player', { name: 'Bob' });
    assert(r2.success, 'Added Bob');

    const r3 = await emit(socket, 'add_player', { name: 'Charlie' });
    assert(r3.success, 'Added Charlie');

    const r4 = await emit(socket, 'add_player', { name: 'Diana' });
    assert(r4.success, 'Added Diana');

    const rDup = await emit(socket, 'add_player', { name: 'Alice' });
    assert(!rDup.success, 'Duplicate name rejected');

    const rEmpty = await emit(socket, 'add_player', { name: '' });
    assert(!rEmpty.success, 'Empty name rejected');

    const rRemove = await emit(socket, 'remove_player', { playerId: r3.player.id });
    assert(rRemove.success, 'Removed Charlie');

    const r3b = await emit(socket, 'add_player', { name: 'Charlie' });
    assert(r3b.success, 'Added Charlie back');
}

async function testTournamentStart(socket) {
    console.log('\n--- TEST: Tournament Start ---');

    const res = await emit(socket, 'start_tournament');
    assert(res.success, 'Tournament started successfully');
    assertEq(res.tournament.status, 'active', 'Status is active');
    assert(res.tournament.rounds.length > 0, 'Rounds generated');

    const r2 = await emit(socket, 'start_tournament');
    assert(!r2.success, 'Cannot start tournament twice');
}

async function testHostView(socket) {
    console.log('\n--- TEST: Host View (PINs) ---');

    const res = await emit(socket, 'request_host_view');
    assert(res.success, 'Host view requested');

    let hasPins = false;
    for (const round of res.tournament.rounds) {
        for (const match of round) {
            if (match.pin) hasPins = true;
        }
    }
    assert(hasPins, 'Host view contains PINs');
}

async function testMatchStartAndPIN(socket) {
    console.log('\n--- TEST: Match Start & PIN ---');

    const hostRes = await emit(socket, 'request_host_view');
    const firstMatch = hostRes.tournament.rounds[0].find(m => m.status === 'waiting');

    if (!firstMatch) {
        console.log('  [SKIP] No waiting match found');
        return null;
    }

    const startRes = await emit(socket, 'start_match', { matchId: firstMatch.id });
    assert(startRes.success, 'Match started');
    assertEq(startRes.match.status, 'active', 'Match status is active');

    const wrongPinRes = await emit(socket, 'verify_pin', { matchId: firstMatch.id, pin: '0000' });
    assert(wrongPinRes.success && !wrongPinRes.authorized, 'Wrong PIN rejected');

    const correctPinRes = await emit(socket, 'verify_pin', { matchId: firstMatch.id, pin: firstMatch.pin });
    assert(correctPinRes.success && correctPinRes.authorized, 'Correct PIN accepted');

    return firstMatch.id;
}

async function testThrowingDarts(socket, matchId) {
    console.log('\n--- TEST: Throwing Darts ---');

    if (!matchId) { console.log('  [SKIP]'); return; }

    const t1 = await emit(socket, 'throw_dart', { matchId, value: 20, multiplier: 1 });
    assert(t1.success, 'Throw S20 recorded');
    assert(!t1.throwResult.isBust, 'S20 is not bust');

    const t2 = await emit(socket, 'throw_dart', { matchId, value: 20, multiplier: 3 });
    assert(t2.success, 'Throw T20 recorded');

    const t3 = await emit(socket, 'throw_dart', { matchId, value: 19, multiplier: 3 });
    assert(t3.success, 'Throw T19 recorded');
    assertEq(t3.match.currentThrower, 'player2', 'Turn switched after 3 darts');

    const t4 = await emit(socket, 'throw_dart', { matchId, value: 20, multiplier: 3 });
    assert(t4.success, 'Player 2 T20 recorded');
}

async function testUndoThrow(socket, matchId) {
    console.log('\n--- TEST: Undo Throw ---');
    if (!matchId) { console.log('  [SKIP]'); return; }

    const undoRes = await emit(socket, 'undo_throw', { matchId });
    assert(undoRes.success, 'Undo successful');
}

async function testUnauthorizedThrow(matchId) {
    console.log('\n--- TEST: Unauthorized Throw ---');
    if (!matchId) { console.log('  [SKIP]'); return; }

    const newSocket = await createSocket();
    const res = await emit(newSocket, 'throw_dart', { matchId, value: 20, multiplier: 1 });
    assert(!res.success, 'Unauthorized throw rejected');
    newSocket.disconnect();
}

async function testSpectator(matchId) {
    console.log('\n--- TEST: Spectator Mode ---');
    if (!matchId) { console.log('  [SKIP]'); return; }

    const specSocket = await createSocket();
    const res = await emit(specSocket, 'spectate_match', { matchId });
    assert(res.success, 'Spectator joined match');
    specSocket.disconnect();
}

async function testNoPinTournament() {
    console.log('\n--- TEST: No-PIN Tournament ---');

    const socket = await createSocket();
    await emit(socket, 'reset_tournament');

    const createRes = await emit(socket, 'create_tournament', {
        type: '301', legsToWin: 1,
        settings: { requirePin: false, doubleOut: true, autoStartMatches: false, shufflePlayers: false }
    });
    assert(createRes.success, 'No-PIN tournament created');
    assertEq(createRes.tournament.settings.requirePin, false, 'PIN not required');

    await emit(socket, 'add_player', { name: 'Eve' });
    await emit(socket, 'add_player', { name: 'Frank' });
    const startRes = await emit(socket, 'start_tournament');
    assert(startRes.success, 'No-PIN tournament started');

    const hostRes = await emit(socket, 'request_host_view');
    const match = hostRes.tournament.rounds[0].find(m => m.status === 'waiting');

    if (match) {
        assert(match.pin === null, 'Match has no PIN');
        await emit(socket, 'start_match', { matchId: match.id });

        const pinRes = await emit(socket, 'verify_pin', { matchId: match.id, pin: '' });
        assert(pinRes.success && pinRes.authorized, 'Auto-authorized without PIN');

        const throwRes = await emit(socket, 'throw_dart', { matchId: match.id, value: 20, multiplier: 3 });
        assert(throwRes.success, 'Throw works without PIN');
    }

    socket.disconnect();
}

async function testNoDoubleOutTournament() {
    console.log('\n--- TEST: No-DoubleOut Tournament ---');

    const socket = await createSocket();
    await emit(socket, 'reset_tournament');

    const createRes = await emit(socket, 'create_tournament', {
        type: '301', legsToWin: 1,
        settings: { requirePin: false, doubleOut: false, autoStartMatches: false, shufflePlayers: false }
    });
    assert(createRes.success, 'No-DoubleOut tournament created');
    assertEq(createRes.tournament.settings.doubleOut, false, 'Double-out disabled');

    await emit(socket, 'add_player', { name: 'Grace' });
    await emit(socket, 'add_player', { name: 'Hank' });
    await emit(socket, 'start_tournament');

    const hostRes = await emit(socket, 'request_host_view');
    const match = hostRes.tournament.rounds[0].find(m => m.status === 'waiting');

    if (match) {
        await emit(socket, 'start_match', { matchId: match.id });
        await emit(socket, 'verify_pin', { matchId: match.id, pin: '' });

        // Player 1: T20 T20 T20 = 180, score = 121. Switch to P2.
        await emit(socket, 'throw_dart', { matchId: match.id, value: 20, multiplier: 3 });
        await emit(socket, 'throw_dart', { matchId: match.id, value: 20, multiplier: 3 });
        await emit(socket, 'throw_dart', { matchId: match.id, value: 20, multiplier: 3 });

        // Player 2: T20 T20 T20 = 180, score = 121. Switch to P1.
        await emit(socket, 'throw_dart', { matchId: match.id, value: 20, multiplier: 3 });
        await emit(socket, 'throw_dart', { matchId: match.id, value: 20, multiplier: 3 });
        await emit(socket, 'throw_dart', { matchId: match.id, value: 20, multiplier: 3 });

        // Player 1: T20(60) = 61. T20(60) = 1. This should NOT bust without double-out.
        await emit(socket, 'throw_dart', { matchId: match.id, value: 20, multiplier: 3 });
        const t2 = await emit(socket, 'throw_dart', { matchId: match.id, value: 20, multiplier: 3 });
        assertEq(t2.match.scores.player1, 1, 'Score=1 is valid (no double-out)');
        assert(!t2.throwResult.isBust, 'Score=1 is NOT a bust');

        // S1 = finish!
        const tFinish = await emit(socket, 'throw_dart', { matchId: match.id, value: 1, multiplier: 1 });
        assert(tFinish.throwResult.isFinish, 'S1 finishes without double-out');
        assert(!tFinish.throwResult.isBust, 'S1 is not a bust');
    }

    socket.disconnect();
}

async function testAutoStartMatches() {
    console.log('\n--- TEST: Auto-Start Matches ---');

    const socket = await createSocket();
    await emit(socket, 'reset_tournament');

    await emit(socket, 'create_tournament', {
        type: '501', legsToWin: 1,
        settings: { requirePin: false, doubleOut: true, autoStartMatches: true, shufflePlayers: false }
    });

    await emit(socket, 'add_player', { name: 'Ivy' });
    await emit(socket, 'add_player', { name: 'Jack' });

    const startRes = await emit(socket, 'start_tournament');
    assert(startRes.success, 'Auto-start tournament started');

    const firstRound = startRes.tournament.rounds[0];
    const activeMatches = firstRound.filter(m => m.status === 'active');
    assert(activeMatches.length > 0, 'Matches auto-started');

    socket.disconnect();
}

async function testResetAndEdgeCases(socket) {
    console.log('\n--- TEST: Reset & Edge Cases ---');

    await emit(socket, 'reset_tournament');
    await emit(socket, 'create_tournament', { type: '501', legsToWin: 1, settings: {} });
    await emit(socket, 'add_player', { name: 'Solo' });

    const res = await emit(socket, 'start_tournament');
    assert(!res.success, 'Cannot start with 1 player');

    const resetRes = await emit(socket, 'reset_tournament');
    assert(resetRes.success, 'Tournament reset');

    const createRes = await emit(socket, 'create_tournament', { type: '301', legsToWin: 1, settings: {} });
    assert(createRes.success, 'Can create new tournament after reset');
    assertEq(createRes.tournament.type, '301', 'New tournament is 301');

    await emit(socket, 'reset_tournament');
}

// ============================================================
// RUNNER
// ============================================================

async function runAllTests() {
    console.log('=======================================');
    console.log('DartVault -- Automated Test Suite');
    console.log('=======================================');

    try {
        const socket = await createSocket();
        console.log('\nConnected to ' + SERVER_URL);

        await testTournamentCreation(socket);
        await testPlayerManagement(socket);
        await testTournamentStart(socket);
        await testHostView(socket);
        const matchId = await testMatchStartAndPIN(socket);
        await testThrowingDarts(socket, matchId);
        await testUndoThrow(socket, matchId);
        await testUnauthorizedThrow(matchId);
        await testSpectator(matchId);

        await testNoPinTournament();
        await testNoDoubleOutTournament();
        await testAutoStartMatches();
        await testResetAndEdgeCases(socket);

        await emit(socket, 'reset_tournament');
        socket.disconnect();

    } catch (err) {
        console.error('\nCRITICAL ERROR: ' + err.message);
        failed++;
    }

    console.log('\n=======================================');
    console.log('RESULTS: ' + passed + ' passed, ' + failed + ' failed');
    if (errors.length > 0) {
        console.log('\nFAILED TESTS:');
        errors.forEach(e => console.log('   - ' + e));
    }
    console.log('=======================================');

    process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
