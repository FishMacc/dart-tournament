// ============================================================
// Tournament Manager — manages a single tournament instance
// ============================================================
import { createTournament, createPlayer, createMatch } from './models.js';
import { generateBracket, advanceWinner } from './bracket.js';
import { processThrow, getCheckoutSuggestion } from './gameLogic.js';

let currentTournament = null;

/**
 * Get the current tournament state.
 * @returns {object|null}
 */
export function getTournament() {
    return currentTournament;
}

/**
 * Create a new tournament.
 * @param {string} type - Game type e.g. "501"
 * @param {number} legsToWin
 * @returns {object}
 */
export function initTournament(type = '501', legsToWin = 1) {
    currentTournament = createTournament(type, legsToWin);
    return currentTournament;
}

/**
 * Add a player to the current tournament.
 * @param {string} name
 * @returns {object} the new player
 */
export function addPlayer(name) {
    if (!currentTournament) throw new Error('No tournament created');
    if (currentTournament.status !== 'setup') throw new Error('Tournament already started');
    if (!name || !name.trim()) throw new Error('Player name is required');

    // Prevent duplicate names
    const existing = currentTournament.players.find(
        (p) => p.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existing) throw new Error(`Player "${name.trim()}" already exists`);

    const player = createPlayer(name);
    currentTournament.players.push(player);
    return player;
}

/**
 * Remove a player by ID.
 * @param {string} playerId
 */
export function removePlayer(playerId) {
    if (!currentTournament) throw new Error('No tournament created');
    if (currentTournament.status !== 'setup') throw new Error('Tournament already started');
    currentTournament.players = currentTournament.players.filter((p) => p.id !== playerId);
}

/**
 * Start the tournament: generate bracket and mark as active.
 * @returns {object} the tournament
 */
export function startTournament() {
    if (!currentTournament) throw new Error('No tournament created');
    if (currentTournament.players.length < 2) throw new Error('Need at least 2 players');
    if (currentTournament.status !== 'setup') throw new Error('Tournament already started');

    currentTournament.rounds = generateBracket(
        currentTournament.players,
        currentTournament.startingScore
    );
    currentTournament.status = 'active';
    return currentTournament;
}

/**
 * Start a specific match (change status from waiting to active).
 * @param {string} matchId
 * @returns {object} the match
 */
export function startMatch(matchId) {
    const match = findMatch(matchId);
    if (!match) throw new Error('Match not found');
    if (match.status !== 'waiting') throw new Error('Match is not in waiting state');
    match.status = 'active';
    return match;
}

/**
 * Record a dart throw in a match.
 * @param {string} matchId
 * @param {number} value - Dart value (0-20, 25)
 * @param {number} multiplier - 1, 2, or 3
 * @returns {object} Updated match + throw result
 */
export function recordThrow(matchId, value, multiplier) {
    const match = findMatch(matchId);
    if (!match) throw new Error('Match not found');
    if (match.status !== 'active') throw new Error('Match is not active');

    const thrower = match.currentThrower; // 'player1' or 'player2'
    const remainingScore = match.scores[thrower];

    const result = processThrow(remainingScore, value, multiplier);

    // Record the throw
    match.throws[thrower].push({
        value,
        multiplier,
        score: value * multiplier,
        isBust: result.isBust,
        timestamp: Date.now(),
    });

    // Update score
    match.scores[thrower] = result.newScore;

    if (result.isFinish) {
        // Player won this leg
        match.legs[thrower]++;

        if (match.legs[thrower] >= currentTournament.legsToWin) {
            // Player won the match
            match.status = 'finished';
            match.winner = match[thrower];

            // Advance winner in bracket
            const roundIndex = match.round;
            const matchIndex = match.matchIndex;
            advanceWinner(currentTournament.rounds, roundIndex, matchIndex, match.winner);

            // Check if tournament is finished
            checkTournamentEnd();
        } else {
            // Reset scores for next leg
            match.scores.player1 = currentTournament.startingScore;
            match.scores.player2 = currentTournament.startingScore;
            match.throws.player1 = [];
            match.throws.player2 = [];
            // Loser starts next leg
            match.currentThrower = thrower === 'player1' ? 'player2' : 'player1';
        }
    } else if (result.isBust) {
        // Switch thrower on bust
        match.currentThrower = thrower === 'player1' ? 'player2' : 'player1';
    }

    return {
        match,
        throwResult: result,
        checkout: getCheckoutSuggestion(match.scores[match.currentThrower]),
    };
}

/**
 * Find a match by ID across all rounds.
 * @param {string} matchId
 * @returns {object|null}
 */
export function findMatch(matchId) {
    if (!currentTournament) return null;
    for (const round of currentTournament.rounds) {
        for (const match of round) {
            if (match.id === matchId) return match;
        }
    }
    return null;
}

/**
 * Check if the tournament is finished (final match has a winner).
 */
function checkTournamentEnd() {
    if (!currentTournament) return;
    const lastRound = currentTournament.rounds[currentTournament.rounds.length - 1];
    const finalMatch = lastRound[0];
    if (finalMatch.status === 'finished' && finalMatch.winner) {
        currentTournament.status = 'finished';
        currentTournament.winner = finalMatch.winner;
    }
}

/**
 * Reset the tournament state.
 */
export function resetTournament() {
    currentTournament = null;
}

/**
 * Get all matches that are currently playable (waiting or active).
 * @returns {object[]}
 */
export function getPlayableMatches() {
    if (!currentTournament) return [];
    const matches = [];
    for (const round of currentTournament.rounds) {
        for (const match of round) {
            if (match.status === 'waiting' || match.status === 'active') {
                matches.push(match);
            }
        }
    }
    return matches;
}
