import { describe, it, expect } from 'vitest';
import { calculateThrowScore, processThrow, isDoubleOut, getCheckoutSuggestion } from '../src/gameLogic.js';

describe('calculateThrowScore', () => {
    it('should calculate single scores', () => {
        expect(calculateThrowScore(20, 1)).toBe(20);
        expect(calculateThrowScore(1, 1)).toBe(1);
        expect(calculateThrowScore(25, 1)).toBe(25);
    });

    it('should calculate double scores', () => {
        expect(calculateThrowScore(20, 2)).toBe(40);
        expect(calculateThrowScore(25, 2)).toBe(50); // Bullseye
    });

    it('should calculate triple scores', () => {
        expect(calculateThrowScore(20, 3)).toBe(60);
        expect(calculateThrowScore(19, 3)).toBe(57);
    });

    it('should return 0 for a miss', () => {
        expect(calculateThrowScore(0, 1)).toBe(0);
    });

    it('should throw error for invalid value', () => {
        expect(() => calculateThrowScore(21, 1)).toThrow('Invalid dart value');
        expect(() => calculateThrowScore(-1, 1)).toThrow('Invalid dart value');
    });

    it('should throw error for invalid multiplier', () => {
        expect(() => calculateThrowScore(20, 4)).toThrow('Invalid multiplier');
        expect(() => calculateThrowScore(20, 0)).toThrow('Invalid multiplier');
    });

    it('should not allow triple bull', () => {
        expect(() => calculateThrowScore(25, 3)).toThrow('Triple Bull is not allowed');
    });
});

describe('isDoubleOut', () => {
    it('should return true for double', () => {
        expect(isDoubleOut(20, 2)).toBe(true);
    });

    it('should return false for single and triple', () => {
        expect(isDoubleOut(20, 1)).toBe(false);
        expect(isDoubleOut(20, 3)).toBe(false);
    });
});

describe('processThrow', () => {
    it('should reduce score on a normal throw', () => {
        const result = processThrow(501, 20, 3); // T20 = 60
        expect(result.newScore).toBe(441);
        expect(result.isBust).toBe(false);
        expect(result.isFinish).toBe(false);
    });

    it('should bust if score goes below 0', () => {
        const result = processThrow(30, 20, 3); // T20 = 60
        expect(result.newScore).toBe(30); // Score resets
        expect(result.isBust).toBe(true);
        expect(result.isFinish).toBe(false);
    });

    it('should bust if score reaches exactly 1', () => {
        const result = processThrow(21, 20, 1); // S20 = 20, remaining = 1
        expect(result.newScore).toBe(21);
        expect(result.isBust).toBe(true);
    });

    it('should bust if reaching 0 without double', () => {
        const result = processThrow(20, 20, 1); // S20, reaches 0 but not double
        expect(result.newScore).toBe(20);
        expect(result.isBust).toBe(true);
        expect(result.isFinish).toBe(false);
    });

    it('should finish on double out', () => {
        const result = processThrow(40, 20, 2); // D20 = 40
        expect(result.newScore).toBe(0);
        expect(result.isBust).toBe(false);
        expect(result.isFinish).toBe(true);
    });

    it('should finish on bullseye (D25)', () => {
        const result = processThrow(50, 25, 2); // Bull = 50
        expect(result.newScore).toBe(0);
        expect(result.isBust).toBe(false);
        expect(result.isFinish).toBe(true);
    });

    it('should handle a miss (0 points)', () => {
        const result = processThrow(501, 0, 1);
        expect(result.newScore).toBe(501);
        expect(result.isBust).toBe(false);
        expect(result.isFinish).toBe(false);
    });
});

describe('getCheckoutSuggestion', () => {
    it('should return checkout for 170', () => {
        expect(getCheckoutSuggestion(170)).toBe('T20 T20 Bull');
    });

    it('should return checkout for 40 (D20)', () => {
        expect(getCheckoutSuggestion(40)).toBe('D20');
    });

    it('should return checkout for 2 (D1)', () => {
        expect(getCheckoutSuggestion(2)).toBe('D1');
    });

    it('should return null for impossible checkouts', () => {
        expect(getCheckoutSuggestion(171)).toBeNull();
        expect(getCheckoutSuggestion(1)).toBeNull();
    });
});
