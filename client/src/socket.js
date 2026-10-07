import { io } from 'socket.io-client';

const ADMIN_KEY_STORAGE = 'dart-admin-key';

// "?admin=KEY" (printed in the server console) turns this device into a host device
function readAdminKey() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('admin');
    if (fromUrl) {
        localStorage.setItem(ADMIN_KEY_STORAGE, fromUrl);
        params.delete('admin');
        const query = params.toString();
        window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash);
    }
    return localStorage.getItem(ADMIN_KEY_STORAGE) || undefined;
}

// Production: the server serves the app itself. Dev (Vite on :5173): talk to the
// server on the same host so phones on the LAN reach the PC, not themselves.
const URL = import.meta.env.PROD
    ? window.location.origin
    : `${window.location.protocol}//${window.location.hostname}:3000`;

const socket = io(URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
    auth: { adminKey: readAdminKey() },
});

export default socket;
