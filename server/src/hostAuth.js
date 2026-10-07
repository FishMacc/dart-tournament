// ============================================================
// Host authorization: only the host PC (or a device that opened
// the admin link) may manage the tournament and see match PINs.
// ============================================================
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DATA_DIR } from './persistence.js';

const ADMIN_KEY_FILE = path.join(DATA_DIR, 'admin_key.txt');
let cachedKey = null;

export function getAdminKey() {
    if (cachedKey) return cachedKey;
    if (process.env.ADMIN_KEY) {
        cachedKey = process.env.ADMIN_KEY.trim();
        return cachedKey;
    }
    try {
        cachedKey = fs.readFileSync(ADMIN_KEY_FILE, 'utf8').trim();
    } catch { /* not created yet */ }
    if (!cachedKey) {
        cachedKey = crypto.randomBytes(4).toString('hex');
        fs.writeFileSync(ADMIN_KEY_FILE, cachedKey, 'utf8');
    }
    return cachedKey;
}

export function isLoopback(address) {
    if (!address) return false;
    const addr = address.replace(/^::ffff:/, '');
    return addr === '::1' || addr === 'localhost' || addr.startsWith('127.');
}

/**
 * @param {{ address?: string, headers?: object, auth?: object }} handshake
 * @returns {boolean}
 */
export function isHostHandshake(handshake = {}) {
    const providedKey = handshake.auth?.adminKey;
    if (typeof providedKey === 'string' && providedKey.length > 0) {
        const expected = Buffer.from(getAdminKey());
        const given = Buffer.from(providedKey);
        if (given.length === expected.length && crypto.timingSafeEqual(given, expected)) {
            return true;
        }
    }

    if (!isLoopback(handshake.address)) return false;

    // Behind the Vite dev proxy every connection is loopback; trust the
    // forwarded client address in that case (only loopback peers can set it).
    const forwarded = handshake.headers?.['x-forwarded-for'];
    if (forwarded) {
        const client = String(forwarded).split(',')[0].trim();
        return isLoopback(client);
    }
    return true;
}
