// ============================================================
// Data Models for DartVault
// ============================================================

/**
 * Generate a random 4-digit PIN for match protection.
 * @returns {string}
 */
export function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

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
 * @param {object} settings - Tournament settings
 * @returns {object}
 */
export function createMatch(player1, player2, round, matchIndex, startingScore, settings = {}) {
  return {
    id: crypto.randomUUID(),
    pin: settings.requirePin !== false ? generatePin() : null,
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
    legHistory: [],
    currentThrower: 'player1',
    currentTurnThrows: 0,
    // Only Round 0 matches with missing players are true byes. 
    // Future matches are just waiting for players to advance.
    status: (round === 0 && (!player1 || !player2)) ? 'bye' : (player1 && player2 ? 'waiting' : 'scheduled'),
    winner: null,
    legs: { player1: 0, player2: 0 },
    authorizedSockets: [],
    createdAt: Date.now(),
  };
}

/**
 * Create a new Tournament object.
 * @param {string} type - Game type, e.g. "501", "301"
 * @param {number} legsToWin - Number of legs needed to win a match
 * @param {object} settings - Additional tournament settings
 * @returns {object}
 */
export function createTournament(type = '501', legsToWin = 1, settings = {}) {
  const startingScore = parseInt(type, 10) || 501;
  return {
    id: crypto.randomUUID(),
    type,
    name: settings.name || '',
    startingScore,
    legsToWin,
    settings: {
      requirePin: settings.requirePin !== false,
      doubleOut: settings.doubleOut !== false,
      autoStartMatches: settings.autoStartMatches || false,
      shufflePlayers: settings.shufflePlayers || false,
    },
    players: [],
    rounds: [],
    status: 'setup',
    winner: null,
    createdAt: Date.now(),
  };
}
