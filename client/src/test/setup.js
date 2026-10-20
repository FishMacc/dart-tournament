import '@testing-library/jest-dom';

// Node 22+ ships its own (file-backed, here unusable) global localStorage that
// shadows jsdom's. Give the tests a plain in-memory Storage instead.
if (typeof globalThis.localStorage?.clear !== 'function') {
    const store = new Map();
    const memoryStorage = {
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => { store.set(key, String(value)); },
        removeItem: (key) => { store.delete(key); },
        clear: () => { store.clear(); },
        key: (i) => [...store.keys()][i] ?? null,
        get length() { return store.size; },
    };
    Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true });
}
