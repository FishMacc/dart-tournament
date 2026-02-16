import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Go up one level from src to server root, then into data
const DATA_DIR = path.join(__dirname, '../data');
const BACKUP_FILE = path.join(DATA_DIR, 'tournament_backup.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

/**
 * Save the current tournament state to a JSON file.
 * @param {object} state 
 */
export function saveState(state) {
    try {
        if (!state) {
            // If state is null (reset), maybe delete file or save null
            if (fs.existsSync(BACKUP_FILE)) {
                fs.unlinkSync(BACKUP_FILE);
            }
            return;
        }
        const data = JSON.stringify(state, null, 2);
        fs.writeFileSync(BACKUP_FILE, data, 'utf8');
        console.log('💾 Tournament state saved.');
    } catch (err) {
        console.error('❌ Failed to save tournament state:', err);
    }
}

/**
 * Load the tournament state from JSON file.
 * @returns {object|null}
 */
export function loadState() {
    try {
        if (fs.existsSync(BACKUP_FILE)) {
            const data = fs.readFileSync(BACKUP_FILE, 'utf8');
            const state = JSON.parse(data);
            console.log('📂 Tournament state loaded from backup.');
            return state;
        }
    } catch (err) {
        console.error('❌ Failed to load tournament state:', err);
    }
    return null;
}
