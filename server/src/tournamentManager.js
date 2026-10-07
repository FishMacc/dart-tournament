import { createTournament, createPlayer, createMatch } from './models.js';
import { generateBracket, advanceWinner } from './bracket.js';
import { processThrow, getCheckoutSuggestion } from './gameLogic.js';
import { saveState, loadState } from './persistence.js';

let currentTournament = loadState();

/**
 * Manually trigger a save (e.g. after undo).
 */
export function triggerSave() {
    saveState(currentTournament);
}

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
 * @param {object} settings - Additional settings
 * @returns {object}
 */
export function initTournament(type = '501', legsToWin = 1, settings = {}) {
    currentTournament = createTournament(type, legsToWin, settings);
    saveState(currentTournament);
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
    saveState(currentTournament);
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
    saveState(currentTournament);
}

/**
 * Start the tournament: generate bracket and mark as active.
 * @returns {object} the tournament
 */
export function startTournament() {
    if (!currentTournament) throw new Error('No tournament created');
    if (currentTournament.players.length < 2) throw new Error('Need at least 2 players');
    if (currentTournament.status !== 'setup') throw new Error('Tournament already started');

    // Shuffle players if setting is enabled
    let players = [...currentTournament.players];
    if (currentTournament.settings.shufflePlayers) {
        for (let i = players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [players[i], players[j]] = [players[j], players[i]];
        }
        currentTournament.players = players;
    }

    currentTournament.rounds = generateBracket(
        currentTournament.players,
        currentTournament.startingScore,
        currentTournament.settings
    );
    currentTournament.status = 'active';

    // Auto start first round matches if setting is enabled
    // Includes round-2 matches that are already complete because of byes
    if (currentTournament.settings.autoStartMatches) {
        autoStartNextMatches();
    }

    saveState(currentTournament);
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
    saveState(currentTournament);
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
    const doubleOut = currentTournament.settings?.doubleOut !== false;

    const result = processThrow(remainingScore, value, multiplier, doubleOut);

    const previousTurnDarts = match.currentTurnThrows || 0;
    const turnThrowNumber = previousTurnDarts + 1;
    const turnStartScore = remainingScore + match.throws[thrower]
        .slice(match.throws[thrower].length - previousTurnDarts)
        .reduce((sum, t) => sum + (t.isBust ? 0 : t.score), 0);

    match.throwSeq = (match.throwSeq || 0) + 1;
    match.throws[thrower].push({
        value,
        multiplier,
        score: value * multiplier,
        isBust: result.isBust,
        turnThrowNumber: turnThrowNumber,
        scoreBefore: remainingScore,
        seq: match.throwSeq,
        timestamp: Date.now(),
    });

    // A bust voids the whole turn: score goes back to what it was before the turn
    match.scores[thrower] = result.isBust ? turnStartScore : result.newScore;

    if (result.isFinish) {
        // Player won this leg
        match.legs[thrower]++;

        // Save leg history before reset
        match.legHistory.push({
            scores: { ...match.scores },
            throws: {
                player1: [...match.throws.player1],
                player2: [...match.throws.player2]
            },
            winner: thrower,
            starter: match.legStarter || 'player1',
        });

        if (match.legs[thrower] >= currentTournament.legsToWin) {
            // Player won the match
            match.status = 'finished';
            match.winner = match[thrower];

            // Advance winner in bracket
            const roundIndex = match.round;
            const matchIndex = match.matchIndex;
            advanceWinner(currentTournament.rounds, roundIndex, matchIndex, match.winner);

            // Auto start next round matches if setting enabled
            if (currentTournament.settings.autoStartMatches) {
                autoStartNextMatches();
            }

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
            match.legStarter = match.currentThrower;
            match.currentTurnThrows = 0;
        }
    } else if (result.isBust) {
        // Switch thrower on bust
        match.currentThrower = thrower === 'player1' ? 'player2' : 'player1';
        match.currentTurnThrows = 0;
    } else {
        // Normal throw - update turn count
        match.currentTurnThrows = turnThrowNumber;
        if (match.currentTurnThrows >= 3) {
            match.currentThrower = thrower === 'player1' ? 'player2' : 'player1';
            match.currentTurnThrows = 0;
        }
    }

    // Compute turnTotal BEFORE state is mutated (use captured thrower + turnThrowNumber)
    let turnTotal = 0;
    const isTurnEnd = match.currentTurnThrows === 0 && !result.isFinish;
    if (!result.isBust && !result.isFinish) {
        // Sum the current turn's throws for the thrower who just threw
        const dartCount = isTurnEnd ? 3 : match.currentTurnThrows;
        const throwerThrows = match.throws[thrower];
        turnTotal = throwerThrows.slice(-dartCount).reduce((s, t) => s + (t.isBust ? 0 : t.score), 0);
    }

    saveState(currentTournament);

    return {
        match,
        throwResult: result,
        checkout: getCheckoutSuggestion(match.scores[match.currentThrower], currentTournament.settings?.doubleOut !== false),
        turnTotal,
        isTurnEnd,
    };
}

/**
 * Auto-start any waiting matches in next rounds where both players are present.
 */
function autoStartNextMatches() {
    if (!currentTournament) return;
    for (const round of currentTournament.rounds) {
        for (const match of round) {
            if (match.status === 'waiting' && match.player1 && match.player2) {
                match.status = 'active';
            }
        }
    }
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
    saveState(null);
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

/**
 * Verify a PIN for a match and authorize a socket.
 * @param {string} matchId
 * @param {string} pin - 4-digit PIN
 * @param {string} socketId - Socket ID to authorize
 * @returns {boolean} true if PIN is correct
 */
export function verifyMatchPin(matchId, pin, socketId) {
    const match = findMatch(matchId);
    if (!match) throw new Error('Match not found');

    // If global settings say no PIN, or match has no PIN, auto-authorize.
    // Use optional chaining for settings in case they are undefined.
    const pinNotRequired = currentTournament?.settings?.requirePin === false;

    if (pinNotRequired || !match.pin) {
        if (!match.authorizedSockets.includes(socketId)) {
            match.authorizedSockets.push(socketId);
        }
        return true;
    }

    if (match.pin !== pin) return false;
    if (!match.authorizedSockets.includes(socketId)) {
        match.authorizedSockets.push(socketId);
    }
    return true;
}

/**
 * Check if a socket is authorized for a match.
 * @param {string} matchId
 * @param {string} socketId
 * @returns {boolean}
 */
export function isSocketAuthorized(matchId, socketId) {
    const match = findMatch(matchId);
    if (!match) return false;

    const pinNotRequired = currentTournament?.settings?.requirePin === false;

    // If PIN is not required, everyone is authorized
    if (pinNotRequired || !match.pin) return true;

    return match.authorizedSockets.includes(socketId);
}

/**
 * Get a sanitized version of the tournament state (without PINs).
 * @param {boolean} includePin - Whether to include PIN (for host only)
 * @returns {object|null}
 */
export function getSafeTournament(includePin = false) {
    if (!currentTournament) return null;
    return {
        ...currentTournament,
        rounds: currentTournament.rounds.map((round) =>
            round.map((match) => {
                const safeMatch = { ...match };
                if (!includePin) {
                    delete safeMatch.pin;
                }
                delete safeMatch.authorizedSockets;
                return safeMatch;
            })
        ),
    };
}
