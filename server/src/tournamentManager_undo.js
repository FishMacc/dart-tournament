
import { findMatch, getTournament } from './tournamentManager.js';

/**
 * Undo the last throw in a match.
 * @param {string} matchId
 * @returns {object} Updated match
 */
export function undoLastThrow(matchId) {
    const match = findMatch(matchId);
    const currentTournament = getTournament();
    if (!match) throw new Error('Match not found');

    // Case 1: Match is finished -> Revert to active
    if (match.status === 'finished') {
        // Un-advance winner from the next round bracket slot
        const nextRound = match.round + 1;
        if (nextRound < currentTournament.rounds.length) {
            const nextMatchIndex = Math.floor(match.matchIndex / 2);
            const nextMatch = currentTournament.rounds[nextRound][nextMatchIndex];
            if (nextMatch && nextMatch.status !== 'active' && nextMatch.status !== 'finished') {
                if (match.matchIndex % 2 === 0) {
                    nextMatch.player1 = null;
                } else {
                    nextMatch.player2 = null;
                }
                nextMatch.status = 'scheduled';
            }
        }

        match.status = 'active';
        match.winner = null;
        if (currentTournament.status === 'finished') {
            currentTournament.status = 'active';
            currentTournament.winner = null;
        }
        // Then proceed to revert the winning leg logic (below)
    }

    // Case 2: Start of a new leg (clean slate) -> Restore previous leg
    if (match.throws.player1.length === 0 && match.throws.player2.length === 0 && match.legHistory.length > 0) {
        const lastLeg = match.legHistory.pop();

        // Restore state
        match.scores = lastLeg.scores;
        match.throws = lastLeg.throws;
        match.legs[lastLeg.winner]--;

        // Who threw the winning dart? The winner.
        match.currentThrower = lastLeg.winner;

        // We need to fetch that last throw to know turn state?
        // Actually, if they won, it was a Finish.
        // So we are now "Before the next leg started", i.e. "Just finished".
        // But we want to be "Before the winning throw happened".
        // So we restore the leg state, AND THEN we need to Undo the winning throw itself.
        // Because "Restore previous leg" puts us at the state *after* the winning throw (score 0).
        // We want to go back to *before* that.

        // So: Restore leg -> Undo Throw.
        // Recursively call undo? No, just fall through.
        // Wait, currentThrower is set to winner.
        // currentTurnThrows?
        // We need to look at the last throw of the winner to set currentTurnThrows.
        const winnerThrows = match.throws[match.currentThrower];
        const winningThrow = winnerThrows[winnerThrows.length - 1];
        match.currentTurnThrows = winningThrow.turnThrowNumber; // Should be correct

        // Now fall through to "Normal Undo" to actually remove the throw and points.
    }

    // Find the absolute last throw
    const p1Throws = match.throws.player1;
    const p2Throws = match.throws.player2;
    const lastP1 = p1Throws[p1Throws.length - 1];
    const lastP2 = p2Throws[p2Throws.length - 1];

    if (!lastP1 && !lastP2) {
        throw new Error('No throws to undo');
    }

    let throwerToUndo = 'player1';
    let throwToUndo = lastP1;

    if (lastP1 && lastP2) {
        if (lastP2.timestamp > lastP1.timestamp) {
            throwerToUndo = 'player2';
            throwToUndo = lastP2;
        }
    } else if (lastP2) {
        throwerToUndo = 'player2';
        throwToUndo = lastP2;
    }

    // Remove the throw
    match.throws[throwerToUndo].pop();

    // Revert Score (only if not bust, OR if it was a bust that didn't change score... 
    // wait, logic: score IS reduced in recordThrow. If BUST, score is RESET.
    // If not bust, score = score + throw.
    // If bust, score was reset to old. So checking !isBust is WRONG if we didn't store old score.
    // BUT! processThrow returns newScore. 
    // If Bust: newScore = remainingScore (unchanged).
    // So current match.scores is the *pre-throw* score already.
    // So if IsBust, we do NOTHING to score.
    // If !IsBust, we ADD the throw value back.
    if (!throwToUndo.isBust) {
        match.scores[throwerToUndo] += throwToUndo.score;
    }

    // Revert Turn State
    match.currentThrower = throwerToUndo;
    // TurnThrowNumber is 1-based (1, 2, 3).
    // If we undo throw #1, we are at 0 (meaning previous player finished).
    // Wait, if we undo throw 1, currentTurnThrows becomes 0.
    // But logically, if we undo throw 1, we are back to "Turn Start".
    // Does 'currentTurnThrows' mean "completed throws" or "current dart"?
    // In recordThrow: match.currentTurnThrows++ checks limit.
    // So it tracks "completed throws in this turn".
    match.currentTurnThrows = throwToUndo.turnThrowNumber - 1;

    return match;
}
