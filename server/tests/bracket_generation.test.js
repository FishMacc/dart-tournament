
import { describe, it, expect } from 'vitest';
import { generateBracket } from '../src/bracket.js';

describe('Bracket Generation', () => {
    it('should generate a standard bracket for 4 players (power of 2)', () => {
        const players = [{ name: 'P1' }, { name: 'P2' }, { name: 'P3' }, { name: 'P4' }];
        const rounds = generateBracket(players);

        expect(rounds.length).toBe(2); // 2 rounds for 4 players
        const r1 = rounds[0];
        expect(r1.length).toBe(2); // 2 matches in R1

        // All matches should have real players
        r1.forEach(m => {
            expect(m.player1).toBeTruthy();
            expect(m.player2).toBeTruthy();
            expect(m.status).toBe('waiting');
        });
    });

    it('should handle 5 players (odd count) correctly', () => {
        // 5 players -> 8 slots. 3 byes.
        // Standard seeding: 3 byes.
        // Matches: 4 in R1.
        // 3 matches should be byes (P vs null -> winner P)
        // 1 match should be real (P vs P)

        const players = Array.from({ length: 5 }, (_, i) => ({ name: `P${i + 1}` }));
        const rounds = generateBracket(players);

        expect(rounds.length).toBe(3); // 8 slots = 3 rounds
        const r1 = rounds[0];
        expect(r1.length).toBe(4); // 4 potential matches

        // Count statuses
        const byes = r1.filter(m => m.status === 'bye');
        const waiting = r1.filter(m => m.status === 'waiting');

        // 5 players in 8 slots:
        // 3 byes (players 6, 7, 8 in seeding get nulls -> bottom 3 seeds)
        // Actually my code puts byes at bottom seeds.
        // 8 slots. Byes at indices 7, 6, 5.
        // Matches:
        // 0: Seed 0 vs Seed 1 (Real vs Real)
        // 1: Seed 2 vs Seed 3 (Real vs Real)
        // 2: Seed 4 vs Seed 5 (Real vs Waiting/Bye?) -> Seed 5 is Bye? 
        // Let's trace my code: 
        // numByes = 8-5 = 3. 
        // byePositions = {7, 6, 5}.
        // seededPlayers: 
        // 0: P1
        // 1: P2
        // 2: P3
        // 3: P4
        // 4: P5
        // 5: null (bye)
        // 6: null (bye)
        // 7: null (bye)
        //
        // Matches (i*2 vs i*2+1):
        // i=0: 0 vs 1 (P1 vs P2) -> Real match
        // i=1: 2 vs 3 (P3 vs P4) -> Real match
        // i=2: 4 vs 5 (P5 vs null) -> Bye (Winner P5)
        // i=3: 6 vs 7 (null vs null) -> Empty Bye? NO!
        // Wait, my code does:
        // i=3: p1=seeded[6]=null, p2=seeded[7]=null.
        // p1 && !p2 -> bye. !p1 && p2 -> bye. !p1 && !p2 -> status='bye' (empty)

        // BUT standard seeding pairs 1vs8, 2vs7 etc usually? 
        // My simple generation does i*2 vs i*2+1 (neighbors).
        // With neighbors:
        // 6 vs 7 is null vs null. That IS a double-null match.
        // This is STILL problematic if we have null-null matches that don't advance properly.

        // Wait, if I have 5 players:
        // Pwr2 = 8.
        // Byes = 3.
        // If I put byes at 5, 6, 7.
        // Matches: (0,1), (2,3), (4,5), (6,7).
        // (4,5) is P5 vs null -> P5 advances.
        // (6,7) is null vs null -> NOBODY advances.

        // The issue is proper seeding.
        // Standard seeding for 8 slots array is: 
        // 0 vs 7, 1 vs 6 etc? No, standard bracket layout is:
        // 1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6.

        // If simply filling array 0..7 and pairing neighbors:
        // I need to distribute byes such that they don't pair with each other!
        // To avoid null-null, simply ensure every even index (0, 2, 4, 6) has a player?
        // Or ensure that we don't have consecutive nulls aligned to match boundaries.

        // If 5 players, 3 byes.
        // nulls at 5, 6, 7 gives (4,5)=P,null (6,7)=null,null.
        // If I interleave them?
        // 0: P, 1: null -> Bye
        // 2: P, 3: null -> Bye
        // 4: P, 5: null -> Bye
        // 6: P, 7: P    -> Real

        // This guarantees no null-null matches as long as Byes <= Matches.
        // With 5 players, 3 byes. 4 matches. So we can give 3 matches a bye, 1 match real.
        // This works!

        // So my `generateBracket` seeding strategy needs to be INTERLEAVED, not bottom-filled.

        // Let's verify what the current code does (bottom filled)
        // verify no null-null matches for 5 players.

        // If my previous fix (bottom filling) failed for 5 players, I need to know.

        const nullNullMatches = r1.filter(m => !m.player1 && !m.player2);
        expect(nullNullMatches.length).toBe(0);
    });

    it('should handle 20 players (generating 32 slots)', () => {
        // 20 players -> 32 slots. 12 byes.
        // 16 matches.
        // 12 byes means 12 matches should have 1 player (bye).
        // 4 matches should have 2 players (real).
        // 0 matches should have 0 players (null-null).

        const players = Array.from({ length: 20 }, (_, i) => ({ name: `P${i + 1}` }));
        const rounds = generateBracket(players);

        const r1 = rounds[0];
        expect(r1.length).toBe(16);

        const nullNullMatches = r1.filter(m => !m.player1 && !m.player2);
        expect(nullNullMatches.length).toBe(0);

        const byeMatches = r1.filter(m => m.status === 'bye' && (m.player1 || m.player2));
        expect(byeMatches.length).toBe(12);

        const realMatches = r1.filter(m => m.player1 && m.player2);
        expect(realMatches.length).toBe(4);
    });
});
