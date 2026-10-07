import os from 'os';

const VIRTUAL_ADAPTER = /(docker|veth|br-|vmnet|vbox|virtualbox|vEthernet|wsl|hyper-v|utun|tun|tap|tailscale|zerotier|hamachi|loopback)/i;

function privateRank(address) {
    if (address.startsWith('192.168.')) return 0;
    if (address.startsWith('10.')) return 1;
    const m = address.match(/^172\.(\d+)\./);
    if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return 2;
    if (address.startsWith('169.254.')) return 9; // link-local, last resort
    return 5;
}

/**
 * Best-guess LAN IPv4 address that phones on the same WiFi can reach.
 * Override with the HOST_IP environment variable.
 * @param {object} [interfaces] - injectable for tests
 * @returns {string}
 */
export function getLanIP(interfaces = os.networkInterfaces()) {
    if (process.env.HOST_IP) return process.env.HOST_IP;

    const candidates = [];
    for (const [name, list] of Object.entries(interfaces)) {
        for (const iface of list || []) {
            if (iface.family !== 'IPv4' && iface.family !== 4) continue;
            if (iface.internal) continue;
            const virtual = VIRTUAL_ADAPTER.test(name) ? 10 : 0;
            candidates.push({ address: iface.address, rank: virtual + privateRank(iface.address) });
        }
    }
    candidates.sort((a, b) => a.rank - b.rank);
    return candidates[0]?.address || 'localhost';
}
