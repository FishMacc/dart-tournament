import { findMatch, getTournament } from './tournamentManager.js';

function throwOrder(t) {
    return t.seq ?? t.timestamp ?? 0;
}

/**
 * Remove the winner of a finished match from the next bracket slot.
 * Refuses if the next match has already been played.
 */
function unadvanceWinner(tournament, match) {
    const nextRound = match.round + 1;
    if (nextRound >= tournament.rounds.length) return;

    const nextMatch = tournament.rounds[nextRound][Math.floor(match.matchIndex / 2)];
    if (!nextMatch) return;

    const nextHasThrows = nextMatch.throws.player1.length > 0
        || nextMatch.throws.player2.length > 0
        || nextMatch.legHistory.length > 0;
    if (nextMatch.status === 'finished' || nextHasThrows) {
        throw new Error('Next match has already started – undo not possible');
    }

    if (match.matchIndex % 2 === 0) {
        nextMatch.player1 = null;
    } else {
        nextMatch.player2 = null;
    }
    nextMatch.status = 'scheduled';
}

/**
 * Undo the last throw in a match.
 * @param {string} matchId
 * @returns {object} Updated match
 */
export function undoLastThrow(matchId) {
    const match = findMatch(matchId);
    const currentTournament = getTournament();
    if (!match) throw new Error('Match not found');
    if (match.status !== 'active' && match.status !== 'finished') {
        throw new Error('No throws to undo');
    }

    if (match.status === 'finished') {
        unadvanceWinner(currentTournament, match);

        match.status = 'active';
        match.winner = null;
        if (currentTournament.status === 'finished') {
            currentTournament.status = 'active';
            currentTournament.winner = null;
        }

        // The final leg is still on the board (throws are not cleared when the
        // match ends), so only drop its history entry and the leg point.
        const lastLeg = match.legHistory.pop();
        if (lastLeg) match.legs[lastLeg.winner]--;
    } else if (match.throws.player1.length === 0 && match.throws.player2.length === 0 && match.legHistory.length > 0) {
        // Start of a new leg: restore the previous leg (state right after the winning dart)
        const lastLeg = match.legHistory.pop();
        match.scores = lastLeg.scores;
        match.throws = lastLeg.throws;
        match.legs[lastLeg.winner]--;
        match.legStarter = lastLeg.starter;
    }

    const lastP1 = match.throws.player1[match.throws.player1.length - 1];
    const lastP2 = match.throws.player2[match.throws.player2.length - 1];

    if (!lastP1 && !lastP2) {
        throw new Error('No throws to undo');
    }

    let throwerToUndo = 'player1';
    let throwToUndo = lastP1;
    if (!lastP1 || (lastP2 && throwOrder(lastP2) > throwOrder(lastP1))) {
        throwerToUndo = 'player2';
        throwToUndo = lastP2;
    }

    match.throws[throwerToUndo].pop();

    if (typeof throwToUndo.scoreBefore === 'number') {
        match.scores[throwerToUndo] = throwToUndo.scoreBefore;
    } else if (!throwToUndo.isBust) {
        // Legacy throws without scoreBefore
        match.scores[throwerToUndo] += throwToUndo.score;
    }

    // currentTurnThrows counts the darts already thrown in the current turn
    match.currentThrower = throwerToUndo;
    match.currentTurnThrows = throwToUndo.turnThrowNumber - 1;

    return match;
}
