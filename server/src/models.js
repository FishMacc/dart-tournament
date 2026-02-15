// ============================================================
// Data Models for Dart Tournament
// ============================================================

/**
 * Create a new Player object.
 * @param {string} name
 * @returns {object}
 */
export function createPlayer(name) {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: Date.now(),
  };
}

/**
 * Create a new Match object.
 * @param {object} player1 - Player object (or null for bye)
 * @param {object} player2 - Player object (or null for bye)
 * @param {number} round - Round number (0-indexed)
 * @param {number} matchIndex - Match index within the round
 * @param {number} startingScore - e.g. 501, 301
 * @returns {object}
 */
export function createMatch(player1, player2, round, matchIndex, startingScore) {
  return {
    id: crypto.randomUUID(),
    round,
    matchIndex,
    player1: player1 ? { ...player1 } : null,
    player2: player2 ? { ...player2 } : null,
    scores: {
      player1: startingScore,
      player2: startingScore,
    },
    throws: {
      player1: [],
      player2: [],
    },
    currentThrower: 'player1',
    status: player1 && player2 ? 'waiting' : 'bye',
    winner: null,
    legs: { player1: 0, player2: 0 },
    createdAt: Date.now(),
  };
}

/**
 * Create a new Tournament object.
 * @param {string} type - Game type, e.g. "501", "301", "Cricket"
 * @param {number} legsToWin - Number of legs needed to win a match
 * @returns {object}
 */
export function createTournament(type = '501', legsToWin = 1) {
  const startingScore = parseInt(type, 10) || 501;
  return {
    id: crypto.randomUUID(),
    type,
    startingScore,
    legsToWin,
    players: [],
    rounds: [],     // rounds[roundIndex] = [match, match, ...]
    status: 'setup', // 'setup' | 'active' | 'finished'
    winner: null,
    createdAt: Date.now(),
  };
}
