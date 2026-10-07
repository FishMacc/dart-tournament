import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    initTournament, addPlayer, startTournament, startMatch, recordThrow,
    resetTournament, getTournament, triggerSave,
} from '../src/tournamentManager.js';
import { undoLastThrow } from '../src/tournamentManager_undo.js';
import * as persistence from '../src/persistence.js';

vi.mock('../src/persistence.js', () => ({
    saveState: vi.fn(),
    loadState: vi.fn(() => null),
}));

describe('⏪ Undo Functionality', () => {
    beforeEach(() => {
        resetTournament();
        vi.clearAllMocks();
    });

    function setupMatch(type = '501', legsToWin = 1, settings = {}) {
        initTournament(type, legsToWin, settings);
        addPlayer('Alice');
        addPlayer('Bob');
        startTournament();
        const t = getTournament();
        const match = t.rounds[0][0];
        startMatch(match.id);
        return match;
    }

    // ==========================================
    // 1. Basic Undo
    // ==========================================
    describe('Basic undo operations', () => {
        it('should undo a single throw and restore score', () => {
            const match = setupMatch();
            recordThrow(match.id, 20, 3); // T20 = 60, score: 441
            expect(match.scores.player1).toBe(441);

            undoLastThrow(match.id);

            expect(match.scores.player1).toBe(501);
            expect(match.throws.player1).toHaveLength(0);
            expect(match.currentThrower).toBe('player1');
            expect(match.currentTurnThrows).toBe(0);
        });

        it('should undo the second throw in a turn', () => {
            const match = setupMatch();
            recordThrow(match.id, 20, 1); // S20, score: 481
            recordThrow(match.id, 19, 3); // T19 = 57, score: 424

            undoLastThrow(match.id);

            expect(match.scores.player1).toBe(481);
            expect(match.throws.player1).toHaveLength(1);
            expect(match.currentThrower).toBe('player1');
            expect(match.currentTurnThrows).toBe(1);
        });

        it('should undo the third throw and keep thrower as player1', () => {
            const match = setupMatch();
            recordThrow(match.id, 20, 1); // S20 -> 481
            recordThrow(match.id, 20, 1); // S20 -> 461
            recordThrow(match.id, 20, 1); // S20 -> 441, switches to player2

            expect(match.currentThrower).toBe('player2');

            undoLastThrow(match.id);

            expect(match.scores.player1).toBe(461);
            expect(match.currentThrower).toBe('player1');
            expect(match.currentTurnThrows).toBe(2);
        });
    });

    // ==========================================
    // 2. Undo across turn boundaries
    // ==========================================
    describe('Undo across turn boundaries', () => {
        it('should undo player2 first throw and restore score', async () => {
            const match = setupMatch();
            // Player 1 turn: 3 throws
            recordThrow(match.id, 20, 1);
            recordThrow(match.id, 20, 1);
            recordThrow(match.id, 20, 1);
            // Wait 1ms to ensure P2's throw has a later timestamp
            await new Promise(resolve => setTimeout(resolve, 2));
            // Player 2 turn: 1 throw
            recordThrow(match.id, 19, 1); // S19 -> 482

            // Undo P2's throw (latest timestamp)
            undoLastThrow(match.id);

            // P2's score should be restored
            expect(match.scores.player2).toBe(501);
            // P2 should have 0 throws now
            expect(match.throws.player2).toHaveLength(0);
        });

        it('should handle multiple consecutive undos', () => {
            const match = setupMatch();
            recordThrow(match.id, 20, 3); // T20 -> 441
            recordThrow(match.id, 19, 3); // T19 -> 384
            recordThrow(match.id, 18, 3); // T18 -> 330, switch to P2

            undoLastThrow(match.id);
            expect(match.scores.player1).toBe(384);

            undoLastThrow(match.id);
            expect(match.scores.player1).toBe(441);

            undoLastThrow(match.id);
            expect(match.scores.player1).toBe(501);
            expect(match.throws.player1).toHaveLength(0);
        });
    });

    // ==========================================
    // 3. Undo bust throws
    // ==========================================
    describe('Undo bust throws', () => {
        it('should undo a bust throw correctly (score was not changed)', () => {
            const match = setupMatch('301', 1, { doubleOut: true });
            // Alice: T20 T20 T20 = 180 -> 121
            recordThrow(match.id, 20, 3);
            recordThrow(match.id, 20, 3);
            recordThrow(match.id, 20, 3);

            // Bob misses
            recordThrow(match.id, 0, 1);
            recordThrow(match.id, 0, 1);
            recordThrow(match.id, 0, 1);

            // Alice: T20 (60) -> 61, T20 (60) -> score=1 -> BUST with doubleOut! Turn voided -> 121
            recordThrow(match.id, 20, 3); // -> 61
            const bustResult = recordThrow(match.id, 20, 3); // BUST -> back to 121
            expect(bustResult.throwResult.isBust).toBe(true);
            expect(match.scores.player1).toBe(121);
            expect(match.currentThrower).toBe('player2');

            // Undo the bust throw -> back to 61, Alice on her 2nd dart again
            undoLastThrow(match.id);

            expect(match.scores.player1).toBe(61);
            expect(match.currentThrower).toBe('player1');
            expect(match.currentTurnThrows).toBe(1);
        });
    });

    // ==========================================
    // 4. Undo leg-winning throws
    // ==========================================
    describe('Undo leg-winning throws', () => {
        it('should undo a leg win and restore previous leg state', () => {
            const match = setupMatch('40', 2, { doubleOut: true }); // 40 starting, 2 legs to win
            // Leg 1: Alice finishes with D20
            const res = recordThrow(match.id, 20, 2); // D20 = 40 -> finish!
            expect(res.throwResult.isFinish).toBe(true);
            expect(match.legs.player1).toBe(1);
            // New leg started — scores reset
            expect(match.scores.player1).toBe(40);
            expect(match.scores.player2).toBe(40);

            // Undo the leg win — Case 2 fires (throws cleared, legHistory exists)
            undoLastThrow(match.id);

            // Legs should be reverted (Case 2 decrements legs)
            expect(match.legs.player1).toBe(0);
            // Score should be back to 40 (restored from legHistory, then winning throw undone)
            expect(match.scores.player1).toBe(40);
        });

        it('should undo a match-winning throw (revert finished → active)', () => {
            const match = setupMatch('40', 1, { doubleOut: true }); // 40 starting, 1 leg to win
            const res = recordThrow(match.id, 20, 2); // D20 = 40 -> finish + match win!
            expect(res.match.status).toBe('finished');
            expect(res.match.winner).not.toBeNull();

            undoLastThrow(match.id);

            expect(match.status).toBe('active');
            expect(match.winner).toBeNull();
            expect(match.legs.player1).toBe(0);
            expect(match.legHistory).toHaveLength(0);
            expect(match.scores.player1).toBe(40);

            // Re-finishing counts the leg exactly once
            recordThrow(match.id, 20, 2);
            expect(match.legs.player1).toBe(1);
            expect(match.legHistory).toHaveLength(1);
        });

        it('should undo tournament-winning throw (revert tournament finished → active)', () => {
            const match = setupMatch('40', 1, { doubleOut: true });
            recordThrow(match.id, 20, 2); // D20 -> finish + match win + tournament win

            const t = getTournament();
            expect(t.status).toBe('finished');
            expect(t.winner).not.toBeNull();

            undoLastThrow(match.id);

            expect(t.status).toBe('active');
            expect(t.winner).toBeNull();
            expect(match.status).toBe('active');
            expect(match.winner).toBeNull();
        });
    });

    // ==========================================
    // 4b. Ordering, bracket safety
    // ==========================================
    describe('Undo ordering and bracket safety', () => {
        it('should undo throws in order even with identical timestamps', () => {
            const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000);
            const match = setupMatch();
            recordThrow(match.id, 20, 1);
            recordThrow(match.id, 20, 1);
            recordThrow(match.id, 20, 1); // -> player2
            recordThrow(match.id, 5, 1);  // player2 first dart
            nowSpy.mockRestore();

            undoLastThrow(match.id);
            expect(match.throws.player2).toHaveLength(0);
            expect(match.scores.player2).toBe(501);
            undoLastThrow(match.id);
            expect(match.throws.player1).toHaveLength(2);
            expect(match.scores.player1).toBe(461);
        });

        it('should refuse to undo a match whose next match already started', () => {
            initTournament('40', 1, { requirePin: false });
            ['A', 'B', 'C', 'D'].forEach(addPlayer);
            startTournament();
            const t = getTournament();
            const [m1, m2] = t.rounds[0];
            startMatch(m1.id); recordThrow(m1.id, 20, 2);
            startMatch(m2.id); recordThrow(m2.id, 20, 2);
            const final = t.rounds[1][0];
            startMatch(final.id);
            recordThrow(final.id, 5, 1);

            expect(() => undoLastThrow(m1.id)).toThrow(/already started/);
            expect(m1.status).toBe('finished');
            expect(final.player1).not.toBeNull();
        });

        it('should remove the winner from the next match when undoing', () => {
            initTournament('40', 1, { requirePin: false });
            ['A', 'B', 'C', 'D'].forEach(addPlayer);
            startTournament();
            const t = getTournament();
            const m1 = t.rounds[0][0];
            startMatch(m1.id); recordThrow(m1.id, 20, 2);
            expect(t.rounds[1][0].player1).not.toBeNull();

            undoLastThrow(m1.id);
            expect(t.rounds[1][0].player1).toBeNull();
            expect(t.rounds[1][0].status).toBe('scheduled');
        });
    });

    // ==========================================
    // 5. Error cases
    // ==========================================
    describe('Error cases', () => {
        it('should throw error when undoing with no throws', () => {
            const match = setupMatch();
            expect(() => undoLastThrow(match.id)).toThrow('No throws to undo');
        });

        it('should throw error for non-existent match', () => {
            setupMatch();
            expect(() => undoLastThrow('non-existent-id')).toThrow('Match not found');
        });
    });

    // ==========================================
    // 6. Undo with miss throws
    // ==========================================
    describe('Undo miss throws', () => {
        it('should undo a miss (score 0) correctly', () => {
            const match = setupMatch();
            recordThrow(match.id, 0, 1); // Miss

            expect(match.scores.player1).toBe(501); // unchanged

            undoLastThrow(match.id);

            expect(match.scores.player1).toBe(501);
            expect(match.throws.player1).toHaveLength(0);
            expect(match.currentTurnThrows).toBe(0);
        });
    });
});
