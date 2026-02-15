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
} from './tournamentManager.js';

/**
 * Setup Socket.io event handlers.
 * @param {import('socket.io').Server} io
 */
export function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Send current tournament state on connect
        const tournament = getTournament();
        if (tournament) {
            socket.emit('tournament_update', tournament);
        }

        // ---------- Tournament Setup ----------

        socket.on('create_tournament', ({ type, legsToWin }, callback) => {
            try {
                const t = initTournament(type, legsToWin);
                io.emit('tournament_update', t);
                if (callback) callback({ success: true, tournament: t });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        socket.on('add_player', ({ name }, callback) => {
            try {
                const player = addPlayer(name);
                const t = getTournament();
                io.emit('tournament_update', t);
                if (callback) callback({ success: true, player });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        socket.on('remove_player', ({ playerId }, callback) => {
            try {
                removePlayer(playerId);
                const t = getTournament();
                io.emit('tournament_update', t);
                if (callback) callback({ success: true });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        socket.on('start_tournament', (_, callback) => {
            try {
                const t = startTournament();
                io.emit('tournament_update', t);
                if (callback) callback({ success: true, tournament: t });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        // ---------- Match Play ----------

        socket.on('start_match', ({ matchId }, callback) => {
            try {
                const match = startMatch(matchId);
                const t = getTournament();
                io.emit('tournament_update', t);
                io.emit('match_update', match);
                if (callback) callback({ success: true, match });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        socket.on('throw_dart', ({ matchId, value, multiplier }, callback) => {
            try {
                const result = recordThrow(matchId, value, multiplier);
                const t = getTournament();
                io.emit('tournament_update', t);
                io.emit('match_update', result.match);
                if (callback) callback({ success: true, ...result });
            } catch (err) {
                if (callback) callback({ success: false, error: err.message });
            }
        });

        socket.on('get_playable_matches', (_, callback) => {
            try {
                const matches = getPlayableMatches();
                if (callback) callback({ success: true, matches });
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
