import { describe, it, expect } from 'vitest';
import { shuffleArray, nextPowerOf2, totalRounds, generateBracket } from '../src/bracket.js';
import { createPlayer } from '../src/models.js';

describe('shuffleArray', () => {
    it('should return an array of the same length', () => {
        const arr = [1, 2, 3, 4, 5];
        const shuffled = shuffleArray(arr);
        expect(shuffled).toHaveLength(5);
    });

    it('should contain all the same elements', () => {
        const arr = [1, 2, 3, 4, 5];
        const shuffled = shuffleArray(arr);
        expect(shuffled.sort()).toEqual(arr.sort());
    });

    it('should not mutate the original array', () => {
        const arr = [1, 2, 3, 4, 5];
        const copy = [...arr];
        shuffleArray(arr);
        expect(arr).toEqual(copy);
    });
});

describe('nextPowerOf2', () => {
    it('should return correct power of 2', () => {
        expect(nextPowerOf2(1)).toBe(1);
        expect(nextPowerOf2(2)).toBe(2);
        expect(nextPowerOf2(3)).toBe(4);
        expect(nextPowerOf2(4)).toBe(4);
        expect(nextPowerOf2(5)).toBe(8);
        expect(nextPowerOf2(7)).toBe(8);
        expect(nextPowerOf2(8)).toBe(8);
        expect(nextPowerOf2(9)).toBe(16);
    });
});

describe('totalRounds', () => {
    it('should return correct number of rounds', () => {
        expect(totalRounds(2)).toBe(1);
        expect(totalRounds(4)).toBe(2);
        expect(totalRounds(8)).toBe(3);
        expect(totalRounds(16)).toBe(4);
    });
});

describe('generateBracket', () => {
    it('should throw if less than 2 players', () => {
        expect(() => generateBracket([])).toThrow('At least 2 players');
        expect(() => generateBracket([createPlayer('A')])).toThrow('At least 2 players');
    });

    it('should generate 1 round for 2 players', () => {
        const players = [createPlayer('A'), createPlayer('B')];
        const rounds = generateBracket(players, 501);
        expect(rounds).toHaveLength(1); // Final only
        expect(rounds[0]).toHaveLength(1);
        expect(rounds[0][0].player1).not.toBeNull();
        expect(rounds[0][0].player2).not.toBeNull();
    });

    it('should generate 2 rounds for 3-4 players', () => {
        const players = [createPlayer('A'), createPlayer('B'), createPlayer('C'), createPlayer('D')];
        const rounds = generateBracket(players, 501);
        expect(rounds).toHaveLength(2); // Semi + Final
        expect(rounds[0]).toHaveLength(2); // 2 semis
        expect(rounds[1]).toHaveLength(1); // 1 final
    });

    it('should generate 3 rounds for 5-8 players', () => {
        const players = [];
        for (let i = 0; i < 5; i++) players.push(createPlayer(`P${i}`));
        const rounds = generateBracket(players, 501);
        expect(rounds).toHaveLength(3); // Quarter + Semi + Final
        expect(rounds[0]).toHaveLength(4); // 4 quarter-finals
    });

    it('should handle byes for non-power-of-2 player counts', () => {
        const players = [createPlayer('A'), createPlayer('B'), createPlayer('C')];
        const rounds = generateBracket(players, 501);
        // 3 players in a 4-bracket -> 1 bye
        const byes = rounds[0].filter((m) => m.status === 'bye');
        expect(byes).toHaveLength(1);
        expect(byes[0].winner).not.toBeNull();
    });

    it('should advance bye winners to next round', () => {
        const players = [createPlayer('A'), createPlayer('B'), createPlayer('C')];
        const rounds = generateBracket(players, 501);
        const final = rounds[1][0];
        // One slot in the final should already be filled by the bye winner
        const filled = [final.player1, final.player2].filter((p) => p !== null);
        expect(filled.length).toBeGreaterThanOrEqual(1);
    });
});
