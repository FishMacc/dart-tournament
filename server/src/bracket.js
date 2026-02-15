// ============================================================
// Bracket Generation — Random seeding for single-elimination
// ============================================================
import { createMatch } from './models.js';

/**
 * Shuffle an array using Fisher-Yates algorithm.
 * Returns a new shuffled array.
 * @param {Array} array
 * @returns {Array}
 */
export function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Calculate the next power of 2 >= n.
 * This determines the bracket size.
 * @param {number} n
 * @returns {number}
 */
export function nextPowerOf2(n) {
    if (n <= 1) return 1;
    let p = 1;
    while (p < n) p *= 2;
    return p;
}

/**
 * Calculate the total number of rounds needed.
 * @param {number} bracketSize - Must be a power of 2
 * @returns {number}
 */
export function totalRounds(bracketSize) {
    return Math.log2(bracketSize);
}

/**
 * Generate a single-elimination bracket from a list of players.
 * Players are shuffled randomly, then placed into the bracket.
 * If the number of players is not a power of 2, byes are given.
 *
 * @param {object[]} players - Array of player objects
 * @param {number} startingScore - e.g. 501
 * @returns {object[][]} rounds - Array of rounds, each containing matches
 */
export function generateBracket(players, startingScore = 501) {
    if (!players || players.length < 2) {
        throw new Error('At least 2 players are required');
    }

    const shuffled = shuffleArray(players);
    const bracketSize = nextPowerOf2(shuffled.length);
    const numRounds = totalRounds(bracketSize);
    const numFirstRoundMatches = bracketSize / 2;

    // Pad with nulls for byes
    const paddedPlayers = [...shuffled];
    while (paddedPlayers.length < bracketSize) {
        paddedPlayers.push(null);
    }

    // Build first round
    const firstRound = [];
    for (let i = 0; i < numFirstRoundMatches; i++) {
        const p1 = paddedPlayers[i * 2];
        const p2 = paddedPlayers[i * 2 + 1];
        const match = createMatch(p1, p2, 0, i, startingScore);

        // If one player is null, it's a bye — auto-advance
        if (!p1 && p2) {
            match.winner = p2;
            match.status = 'bye';
        } else if (p1 && !p2) {
            match.winner = p1;
            match.status = 'bye';
        }

        firstRound.push(match);
    }

    // Build subsequent empty rounds
    const rounds = [firstRound];
    let matchesInRound = numFirstRoundMatches / 2;
    for (let r = 1; r < numRounds; r++) {
        const round = [];
        for (let i = 0; i < matchesInRound; i++) {
            round.push(createMatch(null, null, r, i, startingScore));
        }
        rounds.push(round);
        matchesInRound /= 2;
    }

    // Auto-advance byes to next round
    advanceByes(rounds);

    return rounds;
}

/**
 * Advance winners from bye matches into the next round.
 * @param {object[][]} rounds
 */
export function advanceByes(rounds) {
    for (let r = 0; r < rounds.length - 1; r++) {
        for (let m = 0; m < rounds[r].length; m++) {
            const match = rounds[r][m];
            if (match.status === 'bye' && match.winner) {
                advanceWinner(rounds, r, m, match.winner);
            }
        }
    }
}

/**
 * Advance a winner to their next match in the bracket.
 * @param {object[][]} rounds
 * @param {number} currentRound
 * @param {number} matchIndex
 * @param {object} winner
 */
export function advanceWinner(rounds, currentRound, matchIndex, winner) {
    const nextRound = currentRound + 1;
    if (nextRound >= rounds.length) return; // Tournament over

    const nextMatchIndex = Math.floor(matchIndex / 2);
    const nextMatch = rounds[nextRound][nextMatchIndex];

    // Place into the correct slot (even match index -> player1, odd -> player2)
    if (matchIndex % 2 === 0) {
        nextMatch.player1 = { ...winner };
    } else {
        nextMatch.player2 = { ...winner };
    }

    // If both players are now set, mark as waiting
    if (nextMatch.player1 && nextMatch.player2) {
        nextMatch.status = 'waiting';
    }

    // Reset scores for the next match
    if (nextMatch.player1) {
        nextMatch.scores.player1 = nextMatch.scores.player1; // Keep starting score
    }
    if (nextMatch.player2) {
        nextMatch.scores.player2 = nextMatch.scores.player2;
    }
}
