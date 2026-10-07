import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.DART_DATA_DIR
    ? path.resolve(process.env.DART_DATA_DIR)
    : path.join(__dirname, '../data');
const BACKUP_FILE = path.join(DATA_DIR, 'tournament_backup.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

/**
 * Save the current tournament state to a JSON file (null deletes the backup).
 * @param {object|null} state
 */
export function saveState(state) {
    try {
        if (!state) {
            if (fs.existsSync(BACKUP_FILE)) fs.unlinkSync(BACKUP_FILE);
            return;
        }
        // Write to a temp file first so a crash never leaves a half-written backup
        const tmpFile = `${BACKUP_FILE}.${crypto.randomUUID()}.tmp`;
        fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf8');
        fs.renameSync(tmpFile, BACKUP_FILE);
    } catch (err) {
        console.error('❌ Failed to save tournament state:', err);
    }
}

/**
 * Load the tournament state from JSON file.
 * @returns {object|null}
 */
export function loadState() {
    if (!fs.existsSync(BACKUP_FILE)) return null;
    try {
        const state = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
        console.log('📂 Tournament state loaded from backup.');
        return state;
    } catch (err) {
        const corruptFile = `${BACKUP_FILE}.corrupt-${Date.now()}`;
        console.error(`❌ Backup unreadable, moved to ${corruptFile}:`, err.message);
        try { fs.renameSync(BACKUP_FILE, corruptFile); } catch { /* ignore */ }
        return null;
    }
}
