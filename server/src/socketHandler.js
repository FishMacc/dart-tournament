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
import { isHostHandshake } from './hostAuth.js';

const NOT_HOST = 'Nur der Turnier-Host darf das tun.';
const NOT_AUTHORIZED = 'Nicht autorisiert! Bitte PIN eingeben.';

/**
 * Setup Socket.io event handlers.
 * @param {import('socket.io').Server} io
 */
export function setupSocket(io) {
    io.on('connection', (socket) => {
        const isHost = isHostHandshake(socket.handshake);
        socket.data.isHost = isHost;
        console.log(`Client connected: ${socket.id}${isHost ? ' (host)' : ''}`);

        socket.emit('session_info', { isHost });
        const safeTournament = getSafeTournament(false);
        if (safeTournament) {
            socket.emit('tournament_update', safeTournament);
        }

        const canPlay = (matchId) => isHost || isSocketAuthorized(matchId, socket.id);

        /**
         * Register a handler with a safe payload, an optional ack callback,
         * error handling and an optional host-only guard.
         */
        const on = (event, handler, { hostOnly = false } = {}) => {
            socket.on(event, (...args) => {
                const callback = typeof args[args.length - 1] === 'function' ? args.pop() : () => { };
                const payload = args[0] && typeof args[0] === 'object' ? args[0] : {};
                if (hostOnly && !isHost) {
                    callback({ success: false, error: NOT_HOST });
                    return;
                }
                try {
                    handler(payload, callback);
                } catch (err) {
                    callback({ success: false, error: err.message });
                }
            });
        };

        const broadcastTournament = () => {
            io.emit('tournament_update', getSafeTournament(false));
            for (const s of io.sockets.sockets.values()) {
                if (s.data.isHost) s.emit('tournament_update_host', getSafeTournament(true));
            }
        };

        // ---------- Tournament Setup (host) ----------

        on('create_tournament', ({ type, legsToWin, settings }, callback) => {
            initTournament(type, legsToWin, settings || {});
            broadcastTournament();
            callback({ success: true, tournament: getSafeTournament(false) });
        }, { hostOnly: true });

        on('add_player', ({ name }, callback) => {
            const player = addPlayer(typeof name === 'string' ? name : '');
            broadcastTournament();
            callback({ success: true, player });
        }, { hostOnly: true });

        on('remove_player', ({ playerId }, callback) => {
            removePlayer(playerId);
            broadcastTournament();
            callback({ success: true });
        }, { hostOnly: true });

        on('start_tournament', (_, callback) => {
            startTournament();
            broadcastTournament();
            callback({ success: true, tournament: getSafeTournament(true) });
        }, { hostOnly: true });

        on('request_host_view', (_, callback) => {
            const hostTournament = getSafeTournament(true);
            socket.emit('tournament_update_host', hostTournament);
            callback({ success: true, tournament: hostTournament });
        }, { hostOnly: true });

        on('reset_tournament', (_, callback) => {
            resetTournament();
            io.emit('tournament_update', null);
            callback({ success: true });
        }, { hostOnly: true });

        // ---------- PIN Verification ----------

        on('verify_pin', ({ matchId, pin }, callback) => {
            const valid = verifyMatchPin(matchId, String(pin ?? ''), socket.id);
            callback({ success: true, authorized: valid });
        });

        // ---------- Match Play (host or PIN-authorized device) ----------

        on('start_match', ({ matchId }, callback) => {
            if (!canPlay(matchId)) {
                callback({ success: false, code: 'UNAUTHORIZED', error: NOT_AUTHORIZED });
                return;
            }
            const match = startMatch(matchId);
            broadcastTournament();
            io.emit('match_update', sanitizeMatch(match));
            callback({ success: true, match: sanitizeMatch(match) });
        });

        on('throw_dart', ({ matchId, value, multiplier }, callback) => {
            if (!canPlay(matchId)) {
                callback({ success: false, code: 'UNAUTHORIZED', error: NOT_AUTHORIZED });
                return;
            }

            const result = recordThrow(matchId, value, multiplier);

            io.to(`match-${matchId}`).emit('throw_event', {
                matchId,
                value,
                multiplier,
                score: value * multiplier,
                isBust: result.throwResult.isBust,
                isFinish: result.throwResult.isFinish,
                isTurnEnd: result.isTurnEnd,
                turnTotal: result.turnTotal,
            });

            broadcastTournament();
            io.emit('match_update', sanitizeMatch(result.match));
            callback({ success: true, match: sanitizeMatch(result.match), throwResult: result.throwResult, checkout: result.checkout });
        });

        on('undo_throw', ({ matchId }, callback) => {
            if (!canPlay(matchId)) {
                callback({ success: false, code: 'UNAUTHORIZED', error: NOT_AUTHORIZED });
                return;
            }

            const match = undoLastThrow(matchId);
            triggerSave();

            const doubleOut = getTournament()?.settings?.doubleOut !== false;
            const checkout = getCheckoutSuggestion(match.scores[match.currentThrower], doubleOut);

            broadcastTournament();
            io.emit('match_update', sanitizeMatch(match));
            callback({ success: true, match: sanitizeMatch(match), checkout });
        });

        on('get_playable_matches', (_, callback) => {
            callback({ success: true, matches: getPlayableMatches().map(sanitizeMatch) });
        });

        // ---------- Spectator ----------

        on('spectate_match', ({ matchId }, callback) => {
            if (!getTournament()) {
                callback({ success: false, error: 'No tournament' });
                return;
            }
            socket.join(`match-${matchId}`);
            callback({ success: true });
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
