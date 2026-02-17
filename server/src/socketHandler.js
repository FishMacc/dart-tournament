// ============================================================
// Socket.io Event Handlers
// ============================================================
import {
    getTournament,
    initTournament,
    addPlayer,
    removePlayer,
    startTournament,
    startMatch,
    recordThrow,
    getPlayableMatches,
    resetTournament,
    verifyMatchPin,
    isSocketAuthorized,
    getSafeTournament,
    triggerSave,
} from './tournamentManager.js';
import { undoLastThrow } from './tournamentManager_undo.js';
import { getCheckoutSuggestion } from './gameLogic.js';


/**
 * Setup Socket.io event handlers.
 * @param {import('socket.io').Server} io
 */
export function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Send current tournament state on connect (without PINs)
        const safeTournament = getSafeTournament(false);
        if (safeTournament) {
            socket.emit('tournament_update', safeTournament);
        }

        // ---------- Tournament Setup ----------

        socket.on('create_tournament', ({ type, legsToWin, settings }, callback) => {
            try {
                initTournament(type, legsToWin, settings || {});
                io.emit('tournament_update', getSafeTournament(false));
                if (callback) callback({ success: true, tournament: getSafeTournament(false) });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        socket.on('add_player', ({ name }, callback) => {
            try {
                const player = addPlayer(name);
                io.emit('tournament_update', getSafeTournament(false));
                if (callback) callback({ success: true, player });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        socket.on('remove_player', ({ playerId }, callback) => {
            try {
                removePlayer(playerId);
                io.emit('tournament_update', getSafeTournament(false));
                if (callback) callback({ success: true });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        socket.on('start_tournament', (_, callback) => {
            try {
                startTournament();
                // Send WITH PINs to the host that started it
                socket.emit('tournament_update_host', getSafeTournament(true));
                // Send WITHOUT PINs to everyone else
                io.emit('tournament_update', getSafeTournament(false));
                if (callback) callback({ success: true, tournament: getSafeTournament(true) });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        // ---------- Host: Request PINs ----------

        socket.on('request_host_view', (_, callback) => {
            try {
                const hostTournament = getSafeTournament(true);
                socket.emit('tournament_update_host', hostTournament);
                if (callback) callback({ success: true, tournament: hostTournament });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        // ---------- PIN Verification ----------

        socket.on('verify_pin', ({ matchId, pin }, callback) => {
            try {
                const valid = verifyMatchPin(matchId, pin, socket.id);
                if (callback) callback({ success: true, authorized: valid });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        // ---------- Match Play ----------

        socket.on('start_match', ({ matchId }, callback) => {
            try {
                const match = startMatch(matchId);
                io.emit('tournament_update', getSafeTournament(false));
                io.emit('match_update', sanitizeMatch(match));
                if (callback) callback({ success: true, match: sanitizeMatch(match) });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        socket.on('throw_dart', ({ matchId, value, multiplier }, callback) => {
            try {
                // Check PIN authorization
                if (!isSocketAuthorized(matchId, socket.id)) {
                    if (callback) callback({ success: false, error: 'Nicht autorisiert! Bitte PIN eingeben.' });
                    return;
                }

                const result = recordThrow(matchId, value, multiplier);

                // Broadcast explicit throw event for audio/animations
                io.to(`match-${matchId}`).emit('throw_event', {
                    matchId,
                    player: result.match.currentThrower, // actually the one who JUST threw is... wait.
                    // recordThrow switches the thrower if turn is over. 
                    // We can just send the raw values.
                    value,
                    multiplier,
                    score: value * multiplier,
                    isBust: result.throwResult.isBust,
                    isFinish: result.throwResult.isFinish,
                    isTurnEnd: result.isTurnEnd,
                    turnTotal: result.turnTotal
                });

                io.emit('tournament_update', getSafeTournament(false));
                io.emit('match_update', sanitizeMatch(result.match));
                if (callback) callback({ success: true, match: sanitizeMatch(result.match), throwResult: result.throwResult, checkout: result.checkout });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        socket.on('undo_throw', ({ matchId }, callback) => {
            try {
                // Check PIN authorization
                if (!isSocketAuthorized(matchId, socket.id)) {
                    if (callback) callback({ success: false, error: 'Nicht autorisiert!' });
                    return;
                }

                const match = undoLastThrow(matchId);
                triggerSave();

                // Calculate/Update checkout suggestion
                const tournament = getTournament();
                const doubleOut = tournament?.settings?.doubleOut !== false;
                const currentScore = match.scores[match.currentThrower];
                const checkout = getCheckoutSuggestion(currentScore, doubleOut);

                io.emit('tournament_update', getSafeTournament(false));
                io.emit('match_update', sanitizeMatch(match));
                if (callback) callback({ success: true, match: sanitizeMatch(match), checkout });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        socket.on('get_playable_matches', (_, callback) => {

            try {
                const matches = getPlayableMatches().map(sanitizeMatch);
                if (callback) callback({ success: true, matches });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        // ---------- Spectator ----------

        socket.on('spectate_match', ({ matchId }, callback) => {
            try {
                const tournament = getTournament();
                if (!tournament) {
                    if (callback) callback({ success: false, error: 'No tournament' });
                    return;
                }
                // Join a room for this match to receive updates
                socket.join(`match-${matchId}`);
                if (callback) callback({ success: true });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        // ---------- Admin ----------

        socket.on('reset_tournament', (_, callback) => {
            try {
                resetTournament();
                io.emit('tournament_update', null);
                if (callback) callback({ success: true });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
}

/**
 * Remove sensitive data (pin, authorizedSockets) from a match before sending to clients.
 */
function sanitizeMatch(match) {
    const safe = { ...match };
    delete safe.pin;
    delete safe.authorizedSockets;
    return safe;
}
