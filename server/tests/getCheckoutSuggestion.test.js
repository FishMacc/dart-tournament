import { describe, it, expect } from 'vitest';
import { getCheckoutSuggestion } from '../src/gameLogic.js';

describe('getCheckoutSuggestion', () => {
    describe('Double Out (Default)', () => {
        it('should Suggest D20 for 40', () => {
            expect(getCheckoutSuggestion(40, true)).toBe('D20');
        });

        it('should Suggest D4 for 8', () => {
            expect(getCheckoutSuggestion(8, true)).toBe('D4');
        });

        it('should Suggest S9 D8 for 25 (NEW)', () => {
            expect(getCheckoutSuggestion(25, true)).toBe('S9 D8');
        });

        it('should return null for non-checkout score (e.g. 171)', () => {
            expect(getCheckoutSuggestion(171, true)).toBe(null);
        });
    });

    describe('Single Out (doubleOut = false)', () => {
        it('should Suggest S8 for 8 (Single preferred)', () => {
            expect(getCheckoutSuggestion(8, false)).toBe('S8');
        });

        it('should Suggest Bull for 25', () => {
            expect(getCheckoutSuggestion(25, false)).toBe('Bull');
        });

        it('should Suggest Bullseye for 50', () => {
            expect(getCheckoutSuggestion(50, false)).toBe('Bullseye');
        });

        it('should Suggest D20 for 40 (1-dart finish)', () => {
            // Even number <= 40 can be finished with 1 dart (Double)
            expect(getCheckoutSuggestion(40, false)).toBe('D20');
        });

        it('should Suggest T13 for 39 (1-dart finish)', () => {
            // Divisible by 3 <= 60 can be finished with 1 dart (Triple)
            expect(getCheckoutSuggestion(39, false)).toBe('T13');
        });

        it('should Suggest S20 for 20', () => {
            expect(getCheckoutSuggestion(20, false)).toBe('S20');
        });

        it('should fall back to standard checkout for high scores (e.g. 170)', () => {
            expect(getCheckoutSuggestion(170, false)).toBe('T20 T20 Bull');
        });
    });
});
