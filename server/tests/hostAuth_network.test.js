import { describe, it, expect, afterEach } from 'vitest';
import { isLoopback, isHostHandshake, getAdminKey } from '../src/hostAuth.js';
import { getLanIP } from '../src/network.js';

describe('host authorization', () => {
    it('detects loopback addresses', () => {
        expect(isLoopback('127.0.0.1')).toBe(true);
        expect(isLoopback('::1')).toBe(true);
        expect(isLoopback('::ffff:127.0.0.1')).toBe(true);
        expect(isLoopback('192.168.1.20')).toBe(false);
        expect(isLoopback(undefined)).toBe(false);
    });

    it('treats local connections as host and LAN devices as guests', () => {
        expect(isHostHandshake({ address: '127.0.0.1', headers: {} })).toBe(true);
        expect(isHostHandshake({ address: '::ffff:192.168.1.20', headers: {} })).toBe(false);
    });

    it('uses the forwarded address behind the dev proxy', () => {
        expect(isHostHandshake({ address: '127.0.0.1', headers: { 'x-forwarded-for': '192.168.1.20' } })).toBe(false);
        expect(isHostHandshake({ address: '127.0.0.1', headers: { 'x-forwarded-for': '127.0.0.1' } })).toBe(true);
    });

    it('ignores forwarded headers from remote peers', () => {
        expect(isHostHandshake({ address: '192.168.1.20', headers: { 'x-forwarded-for': '127.0.0.1' } })).toBe(false);
    });

    it('accepts the admin key from any device', () => {
        const key = getAdminKey();
        expect(key).toMatch(/^[0-9a-f]{8}$/);
        expect(getAdminKey()).toBe(key);
        expect(isHostHandshake({ address: '192.168.1.20', auth: { adminKey: key } })).toBe(true);
        expect(isHostHandshake({ address: '192.168.1.20', auth: { adminKey: 'wrong' } })).toBe(false);
    });
});

describe('getLanIP', () => {
    afterEach(() => { delete process.env.HOST_IP; });

    it('prefers the real WiFi/LAN adapter over Docker/VPN adapters', () => {
        const ip = getLanIP({
            lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }],
            docker0: [{ family: 'IPv4', internal: false, address: '172.17.0.1' }],
            tailscale0: [{ family: 'IPv4', internal: false, address: '100.64.0.5' }],
            wlan0: [{ family: 'IPv4', internal: false, address: '192.168.178.23' }],
        });
        expect(ip).toBe('192.168.178.23');
    });

    it('can be overridden with HOST_IP', () => {
        process.env.HOST_IP = '10.0.0.99';
        expect(getLanIP({})).toBe('10.0.0.99');
    });

    it('falls back to localhost', () => {
        expect(getLanIP({ lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }] })).toBe('localhost');
    });
});
