import { describe, it, expect } from 'vitest';
import { createPlayer, createMatch, createTournament, generatePin } from '../src/models.js';

describe('createPlayer', () => {
    it('should create a player with a name and unique ID', () => {
        const p = createPlayer('Alice');
        expect(p.name).toBe('Alice');
        expect(p.id).toBeDefined();
        expect(typeof p.id).toBe('string');
        expect(p.createdAt).toBeGreaterThan(0);
    });

    it('should trim whitespace from name', () => {
        const p = createPlayer('  Bob  ');
        expect(p.name).toBe('Bob');
    });

    it('should create unique IDs for different players', () => {
        const p1 = createPlayer('Alice');
        const p2 = createPlayer('Bob');
        expect(p1.id).not.toBe(p2.id);
    });
});

describe('createMatch', () => {
    it('should create a match with two players', () => {
        const p1 = createPlayer('Alice');
        const p2 = createPlayer('Bob');
        const match = createMatch(p1, p2, 0, 0, 501);
        expect(match.player1.name).toBe('Alice');
        expect(match.player2.name).toBe('Bob');
        expect(match.scores.player1).toBe(501);
        expect(match.scores.player2).toBe(501);
        expect(match.status).toBe('waiting');
        expect(match.round).toBe(0);
        expect(match.matchIndex).toBe(0);
        expect(match.pin).toBeDefined();
        expect(match.pin).toHaveLength(4);
        expect(match.authorizedSockets).toEqual([]);
    });

    it('should create a bye match if player2 is null', () => {
        const p1 = createPlayer('Alice');
        const match = createMatch(p1, null, 0, 0, 501);
        expect(match.player1.name).toBe('Alice');
        expect(match.player2).toBeNull();
        expect(match.status).toBe('bye');
    });

    it('should set currentThrower to player1 by default', () => {
        const p1 = createPlayer('Alice');
        const p2 = createPlayer('Bob');
        const match = createMatch(p1, p2, 0, 0, 301);
        expect(match.currentThrower).toBe('player1');
    });
});

describe('createTournament', () => {
    it('should create a 501 tournament by default', () => {
        const t = createTournament();
        expect(t.type).toBe('501');
        expect(t.startingScore).toBe(501);
        expect(t.legsToWin).toBe(1);
        expect(t.status).toBe('setup');
        expect(t.players).toEqual([]);
        expect(t.rounds).toEqual([]);
    });

    it('should create a 301 tournament', () => {
        const t = createTournament('301', 3);
        expect(t.type).toBe('301');
        expect(t.startingScore).toBe(301);
        expect(t.legsToWin).toBe(3);
    });
});

describe('generatePin', () => {
    it('should generate a 4-digit string', () => {
        const pin = generatePin();
        expect(pin).toHaveLength(4);
        expect(/^\d{4}$/.test(pin)).toBe(true);
    });

    it('should generate pins >= 1000', () => {
        for (let i = 0; i < 50; i++) {
            const pin = parseInt(generatePin(), 10);
            expect(pin).toBeGreaterThanOrEqual(1000);
            expect(pin).toBeLessThanOrEqual(9999);
        }
    });
});
