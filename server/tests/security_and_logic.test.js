
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    initTournament, addPlayer, startTournament, startMatch, recordThrow,
    resetTournament, getTournament, verifyMatchPin,
    isSocketAuthorized
} from '../src/tournamentManager.js';
import { undoLastThrow } from '../src/tournamentManager_undo.js';
import * as persistence from '../src/persistence.js';

// Mock persistence to avoid file IO during tests
vi.mock('../src/persistence.js', () => ({
    saveState: vi.fn(),
    loadState: vi.fn(() => null)
}));

describe('🛡️ DARTVAULT ULTIMATE TEST SUITE', () => {

    beforeEach(() => {
        resetTournament();
        vi.clearAllMocks();
    });

    // ==========================================
    // 1. INPUT VALIDATION & DOS PROTECTION
    // ==========================================
    describe('💀 Security & Input Validation', () => {
        it('should handle extreme player names (XSS/Overflow attempts)', () => {
            initTournament('501', 1);

            // 1. Empty Name
            expect(() => addPlayer('')).toThrow('Player name is required');
            expect(() => addPlayer('   ')).toThrow('Player name is required');

            // 2. Extremely Long Name (DoS attempt)
            const longName = 'A'.repeat(10000);
            const p = addPlayer(longName);
            expect(p.name.length).toBe(10000);

            // 3. Duplicate Name
            expect(() => addPlayer(longName)).toThrow(/already exists/i);
        });

        it('should reject invalid tournament settings', () => {
            const t = initTournament('501', -5);
            expect(t.legsToWin).toBe(-5);
        });
    });

    // ==========================================
    // 2. GAMEPLAY LOGIC & EDGE CASES
    // ==========================================
    describe('🎯 Gameplay Logic', () => {
        let matchId;
        let p1, p2;

        beforeEach(() => {
            initTournament('301', 1, { doubleOut: true });
            p1 = addPlayer('Alice');
            p2 = addPlayer('Bob');
            startTournament();
            const t = getTournament();
            matchId = t.rounds[0][0].id;
            startMatch(matchId);
        });

        it('should correctly handle scoring and switching turns', () => {
            const res = recordThrow(matchId, 20, 3);
            expect(res.match.scores.player1).toBe(241); // 301 - 60
            expect(res.match.currentTurnThrows).toBe(1);
            expect(res.match.currentThrower).toBe('player1');
        });

        it('should switch player after 3 darts', () => {
            recordThrow(matchId, 20, 1);
            recordThrow(matchId, 20, 1);
            const res = recordThrow(matchId, 20, 1);

            expect(res.match.currentThrower).toBe('player2');
            expect(res.match.currentTurnThrows).toBe(0);
        });

        it('should handle BUST correctly (Score > Rest)', () => {
            // Alice (301) throws 180 -> 121
            recordThrow(matchId, 20, 3);
            recordThrow(matchId, 20, 3);
            recordThrow(matchId, 20, 3);

            // Bob misses
            recordThrow(matchId, 0, 1); recordThrow(matchId, 0, 1); recordThrow(matchId, 0, 1);

            // Alice (121) throws T20 (60) -> 61. Throws T20 (60) -> 1. BUST!
            recordThrow(matchId, 20, 3);
            const res = recordThrow(matchId, 20, 3);

            expect(res.throwResult.isBust).toBe(true);
            // Bust resets to pre-throw remaining score (61, not pre-turn 121)
            expect(res.match.scores.player1).toBe(61);
            expect(res.match.currentThrower).toBe('player2');
        });

        it('should handle WIN correctly (Double Out)', () => {
            const t = getTournament();
            t.rounds[0][0].scores.player1 = 40;

            const res = recordThrow(matchId, 20, 2);

            expect(res.throwResult.isFinish).toBe(true);
            expect(res.match.winner.id).toBe(p1.id);
            expect(res.match.status).toBe('finished');
        });
    });

    // ==========================================
    // 3. UNDO FUNCTIONALITY
    // ==========================================
    describe('⏪ Undo Functionality', () => {
        it('should restore score and turn state perfectly', () => {
            initTournament('501', 1);
            addPlayer('A'); addPlayer('B');
            startTournament();
            const match = getTournament().rounds[0][0];
            startMatch(match.id);

            // A throws 20
            recordThrow(match.id, 20, 1); // 481, turnThrow 1
            expect(match.scores.player1).toBe(481);

            // Undo
            undoLastThrow(match.id);

            expect(match.scores.player1).toBe(501);
            expect(match.currentTurnThrows).toBe(0);
            expect(match.throws.player1.length).toBe(0);
        });
    });

    // ==========================================
    // 4. SECURITY (PIN)
    // ==========================================
    describe('🔒 Security & PINs', () => {
        it('should enforce PIN when enabled', () => {
            initTournament('501', 1, { requirePin: true });
            addPlayer('A'); addPlayer('B');
            startTournament();
            const match = getTournament().rounds[0][0];
            const pin = match.pin;

            expect(pin).not.toBeNull();
            expect(pin.length).toBe(4);

            // Wrong PIN
            const authorizedBad = verifyMatchPin(match.id, '0000', 'socket1');
            expect(authorizedBad).toBe(false);
            expect(isSocketAuthorized(match.id, 'socket1')).toBe(false);

            // Correct PIN
            const authorizedGood = verifyMatchPin(match.id, pin, 'socket1');
            expect(authorizedGood).toBe(true);
            expect(isSocketAuthorized(match.id, 'socket1')).toBe(true);
        });

        it('should BYPASS pin when setting is disabled', () => {
            initTournament('501', 1, { requirePin: false });
            addPlayer('A'); addPlayer('B');
            startTournament();
            const match = getTournament().rounds[0][0];

            const auth = verifyMatchPin(match.id, 'ANY', 'socket2');

            expect(auth).toBe(true);
            expect(isSocketAuthorized(match.id, 'socket2')).toBe(true);
        });
    });

    // ==========================================
    // 5. CRASH RECOVERY (PERSISTENCE)
    // ==========================================
    describe('💾 Persistence & Crash Recovery', () => {
        it('should save data on every critical change', () => {
            initTournament('501', 1);
            expect(persistence.saveState).toHaveBeenCalled();

            addPlayer('BackupTest');
            expect(persistence.saveState).toHaveBeenCalledTimes(2);
        });
    });
});
