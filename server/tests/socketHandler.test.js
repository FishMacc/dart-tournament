import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { setupSocket } from '../src/socketHandler.js';
import { resetTournament } from '../src/tournamentManager.js';

let httpServer;
let io;
let url;
const clients = [];

function connect({ guest = false, adminKey } = {}) {
    return new Promise((resolve) => {
        const client = Client(url, {
            forceNew: true,
            // Simulate a phone on the LAN (the test itself always connects via loopback)
            extraHeaders: guest ? { 'x-forwarded-for': '192.168.1.50' } : {},
            auth: adminKey ? { adminKey } : {},
        });
        clients.push(client);
        client.on('session_info', (info) => resolve({ client, isHost: info.isHost }));
    });
}

const ask = (client, event, payload = {}) => new Promise((resolve) => client.emit(event, payload, resolve));

beforeAll(async () => {
    httpServer = createServer();
    io = new Server(httpServer);
    setupSocket(io);
    await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${httpServer.address().port}`;
});

afterAll(() => {
    clients.forEach((c) => c.close());
    io.close();
    httpServer.close();
});

beforeEach(() => resetTournament());

async function setupMatch(host) {
    await ask(host, 'create_tournament', { type: '501', legsToWin: 1, settings: { requirePin: true } });
    await ask(host, 'add_player', { name: 'Alice' });
    await ask(host, 'add_player', { name: 'Bob' });
    const res = await ask(host, 'start_tournament');
    return res.tournament.rounds[0][0];
}

describe('socket authorization', () => {
    it('recognizes the host PC and LAN guests', async () => {
        const { isHost } = await connect();
        const guest = await connect({ guest: true });
        expect(isHost).toBe(true);
        expect(guest.isHost).toBe(false);
    });

    it('blocks admin actions from guests', async () => {
        const { client: guest } = await connect({ guest: true });
        for (const event of ['create_tournament', 'add_player', 'start_tournament', 'request_host_view', 'reset_tournament']) {
            const res = await ask(guest, event, { type: '501', name: 'Mallory' });
            expect(res.success, event).toBe(false);
        }
    });

    it('accepts the admin key from a LAN device', async () => {
        const { getAdminKey } = await import('../src/hostAuth.js');
        const { isHost } = await connect({ guest: true, adminKey: getAdminKey() });
        expect(isHost).toBe(true);
    });

    it('requires the match PIN to start and score a match', async () => {
        const { client: host } = await connect();
        const { client: phone } = await connect({ guest: true });
        const { client: other } = await connect({ guest: true });
        const match = await setupMatch(host);
        expect(match.pin).toMatch(/^\d{4}$/);

        expect((await ask(phone, 'start_match', { matchId: match.id })).code).toBe('UNAUTHORIZED');
        expect((await ask(phone, 'verify_pin', { matchId: match.id, pin: '0000' === match.pin ? '1111' : '0000' })).authorized).toBe(false);
        expect((await ask(phone, 'verify_pin', { matchId: match.id, pin: match.pin })).authorized).toBe(true);

        const started = await ask(phone, 'start_match', { matchId: match.id });
        expect(started.success).toBe(true);
        expect(started.match.pin).toBeUndefined();

        const thrown = await ask(phone, 'throw_dart', { matchId: match.id, value: 20, multiplier: 3 });
        expect(thrown.success).toBe(true);
        expect(thrown.match.scores.player1).toBe(441);

        expect((await ask(other, 'throw_dart', { matchId: match.id, value: 20, multiplier: 3 })).code).toBe('UNAUTHORIZED');
        expect((await ask(phone, 'undo_throw', { matchId: match.id })).match.scores.player1).toBe(501);
    });

    it('does not crash on events without payload', async () => {
        const { client: host } = await connect();
        const res = await new Promise((resolve) => host.emit('add_player', resolve));
        expect(res.success).toBe(false);
        const health = await ask(host, 'get_playable_matches');
        expect(health.success).toBe(true);
    });
});
