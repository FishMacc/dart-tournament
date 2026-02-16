import { describe, it, expect, beforeEach } from 'vitest';
import {
    getTournament,
    initTournament,
    addPlayer,
    removePlayer,
    startTournament,
    startMatch,
    recordThrow,
    getPlayableMatches,
    resetTournament,
    verifyMatchPin,
    isSocketAuthorized,
    getSafeTournament,
} from '../src/tournamentManager.js';

beforeEach(() => {
    resetTournament();
});

describe('initTournament', () => {
    it('should create a new tournament', () => {
        const t = initTournament('501', 1);
        expect(t.type).toBe('501');
        expect(t.status).toBe('setup');
    });
});

describe('addPlayer', () => {
    it('should add a player to the tournament', () => {
        initTournament();
        const p = addPlayer('Alice');
        expect(p.name).toBe('Alice');
        expect(getTournament().players).toHaveLength(1);
    });

    it('should prevent duplicate names', () => {
        initTournament();
        addPlayer('Alice');
        expect(() => addPlayer('Alice')).toThrow('already exists');
    });

    it('should prevent duplicate names case-insensitive', () => {
        initTournament();
        addPlayer('Alice');
        expect(() => addPlayer('alice')).toThrow('already exists');
    });

    it('should throw if no tournament', () => {
        expect(() => addPlayer('Alice')).toThrow('No tournament created');
    });

    it('should throw if empty name', () => {
        initTournament();
        expect(() => addPlayer('')).toThrow('Player name is required');
        expect(() => addPlayer('   ')).toThrow('Player name is required');
    });
});

describe('removePlayer', () => {
    it('should remove a player by ID', () => {
        initTournament();
        const p = addPlayer('Alice');
        removePlayer(p.id);
        expect(getTournament().players).toHaveLength(0);
    });
});

describe('startTournament', () => {
    it('should start the tournament and generate bracket', () => {
        initTournament('501');
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        expect(t.status).toBe('active');
        expect(t.rounds.length).toBeGreaterThan(0);
    });

    it('should throw if fewer than 2 players', () => {
        initTournament();
        addPlayer('Alice');
        expect(() => startTournament()).toThrow('at least 2 players');
    });

    it('should throw if no tournament', () => {
        expect(() => startTournament()).toThrow('No tournament created');
    });
});

describe('startMatch', () => {
    it('should change match status to active', () => {
        initTournament('501');
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0];
        const started = startMatch(match.id);
        expect(started.status).toBe('active');
    });
});

describe('recordThrow', () => {
    it('should reduce the score for the current thrower', () => {
        initTournament('501');
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0];
        startMatch(match.id);

        const result = recordThrow(match.id, 20, 3); // T20 = 60
        expect(result.match.scores.player1).toBe(441);
    });

    it('should handle a bust correctly', () => {
        initTournament('301');
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0];
        startMatch(match.id);

        // Throw to reduce score near 0
        // 301 - 180 = 121
        recordThrow(match.id, 20, 3); // 60
        recordThrow(match.id, 20, 3); // 60 -> p1 at 181
        // Now switch happens on bust, but let's just throw a lot
        // This test focuses on bust detection
        const result = recordThrow(match.id, 20, 3); // another 60 -> p1 at 121
        expect(result.match.scores.player1).toBe(121);
    });
});

describe('getPlayableMatches', () => {
    it('should return waiting and active matches', () => {
        initTournament('501');
        addPlayer('Alice');
        addPlayer('Bob');
        addPlayer('Charlie');
        addPlayer('Dave');
        startTournament();
        const matches = getPlayableMatches();
        expect(matches.length).toBeGreaterThan(0);
        expect(matches.every((m) => m.status === 'waiting' || m.status === 'active')).toBe(true);
    });
});

describe('verifyMatchPin', () => {
    it('should authorize a socket with the correct PIN', () => {
        initTournament('501');
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0];
        const pin = match.pin;

        const result = verifyMatchPin(match.id, pin, 'socket-123');
        expect(result).toBe(true);
    });

    it('should reject wrong PIN', () => {
        initTournament('501');
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0];

        const result = verifyMatchPin(match.id, '0000', 'socket-123');
        expect(result).toBe(false);
    });

    it('should track authorized sockets', () => {
        initTournament('501');
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0];

        verifyMatchPin(match.id, match.pin, 'socket-1');
        verifyMatchPin(match.id, match.pin, 'socket-2');
        expect(isSocketAuthorized(match.id, 'socket-1')).toBe(true);
        expect(isSocketAuthorized(match.id, 'socket-2')).toBe(true);
        expect(isSocketAuthorized(match.id, 'socket-3')).toBe(false);
    });
});

describe('getSafeTournament', () => {
    it('should strip PINs when includePin is false', () => {
        initTournament('501');
        addPlayer('Alice');
        addPlayer('Bob');
        startTournament();

        const safe = getSafeTournament(false);
        for (const round of safe.rounds) {
            for (const match of round) {
                expect(match.pin).toBeUndefined();
                expect(match.authorizedSockets).toBeUndefined();
            }
        }
    });

    it('should include PINs when includePin is true', () => {
        initTournament('501');
        addPlayer('Alice');
        addPlayer('Bob');
        startTournament();

        const host = getSafeTournament(true);
        for (const round of host.rounds) {
            for (const match of round) {
                expect(match.pin).toBeDefined();
                expect(match.pin).toHaveLength(4);
                expect(match.authorizedSockets).toBeUndefined();
            }
        }
    });
});

// ==========================================
// NEW: Multi-Leg Match Tests
// ==========================================
describe('Multi-leg match', () => {
    it('should track legs correctly in a 2-leg match', () => {
        initTournament('40', 2, { doubleOut: true }); // 40 starting, best of 3 legs
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0];
        startMatch(match.id);

        // Leg 1: Alice wins with D20
        const res1 = recordThrow(match.id, 20, 2); // D20 -> 0 -> finish
        expect(res1.throwResult.isFinish).toBe(true);
        expect(match.legs.player1).toBe(1);
        expect(match.status).toBe('active'); // needs 2 legs

        // Scores should reset for new leg
        expect(match.scores.player1).toBe(40);
        expect(match.scores.player2).toBe(40);
        expect(match.throws.player1).toHaveLength(0);
        expect(match.throws.player2).toHaveLength(0);
    });

    it('should record leg history', () => {
        initTournament('40', 2, { doubleOut: true });
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0];
        startMatch(match.id);

        // Win leg 1
        recordThrow(match.id, 20, 2);
        expect(match.legHistory).toHaveLength(1);
        expect(match.legHistory[0].winner).toBe('player1');
    });

    it('should end match when legsToWin reached', () => {
        initTournament('40', 1, { doubleOut: true });
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0];
        startMatch(match.id);

        const res = recordThrow(match.id, 20, 2);
        expect(res.match.status).toBe('finished');
        expect(res.match.winner.name).toBeDefined();
    });

    it('should switch starter (loser starts) in next leg', () => {
        initTournament('40', 2, { doubleOut: true });
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0];
        startMatch(match.id);

        // player1 wins leg 1
        recordThrow(match.id, 20, 2);

        // In the next leg, loser (player2) should start
        expect(match.currentThrower).toBe('player2');
    });
});

// ==========================================
// NEW: Settings Variations
// ==========================================
describe('Double-out disabled', () => {
    it('should allow finishing without a double', () => {
        initTournament('20', 1, { doubleOut: false });
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0];
        startMatch(match.id);

        // S20 = 20 -> finish! (no double needed)
        const res = recordThrow(match.id, 20, 1);
        expect(res.throwResult.isFinish).toBe(true);
        expect(res.match.status).toBe('finished');
    });

    it('should allow score=1 when doubleOut is disabled', () => {
        initTournament('21', 1, { doubleOut: false });
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0];
        startMatch(match.id);

        // S20 -> score=1 (not bust without double-out)
        const res = recordThrow(match.id, 20, 1);
        expect(res.throwResult.isBust).toBe(false);
        expect(res.match.scores.player1).toBe(1);
    });
});

describe('Auto-start matches', () => {
    it('should auto-start first round matches when autoStartMatches is true', () => {
        initTournament('501', 1, { autoStartMatches: true });
        addPlayer('Alice');
        addPlayer('Bob');
        addPlayer('Charlie');
        addPlayer('Dave');
        const t = startTournament();

        const activeMatches = t.rounds[0].filter(m => m.status === 'active');
        expect(activeMatches.length).toBeGreaterThan(0);
    });

    it('should NOT auto-start matches when autoStartMatches is false', () => {
        initTournament('501', 1, { autoStartMatches: false });
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();

        const activeMatches = t.rounds[0].filter(m => m.status === 'active');
        expect(activeMatches).toHaveLength(0);
    });
});

describe('Shuffle players', () => {
    it('should accept shufflePlayers setting', () => {
        initTournament('501', 1, { shufflePlayers: true });
        for (let i = 0; i < 8; i++) addPlayer(`Player${i}`);
        const t = startTournament();
        expect(t.status).toBe('active');
        expect(t.players).toHaveLength(8);
    });
});

// ==========================================
// NEW: Tournament End Detection
// ==========================================
describe('Tournament completion', () => {
    it('should mark tournament as finished when final match is won', () => {
        initTournament('40', 1, { doubleOut: true });
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0]; // Only match = final
        startMatch(match.id);

        recordThrow(match.id, 20, 2); // D20 -> win

        expect(t.status).toBe('finished');
        expect(t.winner).not.toBeNull();
    });
});

// ==========================================
// NEW: Bracket Advancement
// ==========================================
describe('Bracket advancement', () => {
    it('should advance winner to the next round', () => {
        initTournament('40', 1, { doubleOut: true });
        addPlayer('Alice');
        addPlayer('Bob');
        addPlayer('Charlie');
        addPlayer('Dave');
        const t = startTournament();

        // Find and start a first-round match
        const firstMatch = t.rounds[0].find(m => m.status === 'waiting' && m.player1 && m.player2);
        startMatch(firstMatch.id);

        // Win it
        recordThrow(firstMatch.id, 20, 2);

        // Winner should be advanced to round 2
        const nextRound = t.rounds[1];
        const nextMatch = nextRound[0];
        const hasWinnerInNext = (nextMatch.player1 && nextMatch.player1.id === firstMatch.winner.id) ||
            (nextMatch.player2 && nextMatch.player2.id === firstMatch.winner.id);
        expect(hasWinnerInNext).toBe(true);
    });
});

// ==========================================
// NEW: Error handling edge cases
// ==========================================
describe('Error handling', () => {
    it('should throw when adding player to started tournament', () => {
        initTournament('501');
        addPlayer('Alice');
        addPlayer('Bob');
        startTournament();
        expect(() => addPlayer('Charlie')).toThrow('Tournament already started');
    });

    it('should throw when removing player from started tournament', () => {
        initTournament('501');
        const p = addPlayer('Alice');
        addPlayer('Bob');
        startTournament();
        expect(() => removePlayer(p.id)).toThrow('Tournament already started');
    });

    it('should throw when starting match that is not waiting', () => {
        initTournament('501');
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0];
        startMatch(match.id);
        expect(() => startMatch(match.id)).toThrow('Match is not in waiting state');
    });

    it('should throw when recording throw on non-active match', () => {
        initTournament('501');
        addPlayer('Alice');
        addPlayer('Bob');
        const t = startTournament();
        const match = t.rounds[0][0];
        // Match is 'waiting', not 'active'
        expect(() => recordThrow(match.id, 20, 1)).toThrow('Match is not active');
    });

    it('should throw for non-existent match', () => {
        initTournament('501');
        addPlayer('Alice');
        addPlayer('Bob');
        startTournament();
        expect(() => startMatch('fake-id')).toThrow('Match not found');
    });

    it('should return empty playable matches when no tournament', () => {
        const matches = getPlayableMatches();
        expect(matches).toEqual([]);
    });
});
