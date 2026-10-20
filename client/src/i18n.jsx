// ============================================================
// Tiny i18n layer: English (default) and German, switchable in the header.
// t('key', { var }) looks the key up in the active language, falls back to
// English, and replaces {var} placeholders.
// ============================================================
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const LANGUAGES = ['en', 'de'];
export const LANG_STORAGE_KEY = 'dartvault-lang';

const en = {
    'app.connecting': 'Connecting to server...',
    'app.footer': 'DartVault © {year} — Dart tournament software for your local network',

    'header.status.setup': 'Setup',
    'header.status.active': 'Live',
    'header.status.finished': 'Finished',
    'header.theme.obsidian': 'Obsidian (dark)',
    'header.theme.neon': 'Neon',
    'header.theme.classic': 'Classic',
    'header.language': 'Sprache: Deutsch',

    'home.badge': 'Open-source dart tournament software',
    'home.title': 'Your dart tournament.',
    'home.titleAccent': 'Done right.',
    'home.subtitle': 'Create and run dart tournaments in real time. Automatic brackets, live scoring on phones and a big-screen view — all on your local network.',
    'home.cta': 'Create tournament',
    'home.guide': 'How it works',
    'home.features.title': 'Everything you need',
    'home.features.subtitle': 'Features for your next dart night',
    'home.f.bracket.title': 'Automatic bracket',
    'home.f.bracket.text': 'Single-elimination brackets for any number of players, including byes.',
    'home.f.mobile.title': 'Phone scoring',
    'home.f.mobile.text': 'Players scan a QR code and enter their darts on their phone. No app, no extra hardware.',
    'home.f.pin.title': 'PIN protection',
    'home.f.pin.text': 'An optional match PIN keeps everyone else from entering scores.',
    'home.f.live.title': 'Live view',
    'home.f.live.text': 'Spectators follow every match live — scores, darts and legs in real time.',
    'home.f.themes.title': 'Themes',
    'home.f.themes.text': 'Pick Obsidian, Neon or Classic. Your tournament, your style.',
    'home.f.prize.title': 'Prize pool',
    'home.f.prize.text': 'Entry fee with automatic payouts: winner takes all, 70/30, top-4 split or custom.',
    'home.f.stats.title': 'Statistics',
    'home.f.stats.text': '3-dart average, best leg, highest finish and prize money at a glance.',
    'home.f.instant.title': 'Instant start',
    'home.f.instant.text': 'No account, no cloud. Everything runs locally on your network.',
    'home.steps.title': 'How it works',
    'home.steps.subtitle': 'Five steps to a great tournament',
    'home.s1.title': 'Create a tournament',
    'home.s1.text': 'Click “Create tournament” and pick the game (301, 501 or 701), the number of legs and options such as PIN protection, double-out or a prize pool.',
    'home.s2.title': 'Add players',
    'home.s2.text': 'Enter all participants — at least two. The bracket is generated automatically, byes included for odd player counts.',
    'home.s3.title': 'Share the QR code',
    'home.s3.text': 'Once the tournament starts, a QR code appears. Players scan it with their phone to open the scoring view.',
    'home.s4.title': 'Play the matches',
    'home.s4.text': 'Start matches from the host screen or let them start automatically. Players enter the match PIN and their darts; busts and checkouts are detected automatically.',
    'home.s5.title': 'Crown the winner',
    'home.s5.text': 'The bracket updates itself. Winners advance round by round until the champion is decided. 🏆',

    'setup.newTournament': 'New tournament',
    'setup.subtitle.create': 'Configure your tournament and get going',
    'setup.subtitle.players': 'Add players and start the tournament',
    'setup.settings': 'Settings',
    'setup.name': 'Tournament name (optional)',
    'setup.namePlaceholder': 'e.g. Friday Night Darts 🎯',
    'setup.gameMode': 'Game',
    'setup.legs': 'Legs to win',
    'setup.legs.single': '1 leg (single)',
    'setup.legs.bestOf': 'Best of {n}',
    'setup.advanced': 'Advanced settings',
    'setup.pin': 'PIN protection',
    'setup.pin.desc': 'A match PIN is required to enter scores',
    'setup.doubleOut': 'Double-out',
    'setup.doubleOut.desc': 'The last dart must hit a double',
    'setup.autoStart': 'Auto-start',
    'setup.autoStart.desc': 'Matches start automatically',
    'setup.shuffle': 'Shuffle players',
    'setup.shuffle.desc': 'Random order in the bracket',
    'setup.prize': 'Prize pool / entry fee',
    'setup.prize.desc': 'Play for money (entry fee and payouts)',
    'setup.entryFee': 'Entry fee per player (€)',
    'setup.distribution': 'Payout',
    'setup.dist.winner': 'Winner takes all (100%)',
    'setup.dist.final': 'Final split (70% / 30%)',
    'setup.dist.top4': 'Top-4 split (50% / 30% / 20%)',
    'setup.dist.custom': 'Custom',
    'setup.dist.customLabel': 'Split in % (must add up to 100)',
    'setup.place1': '1st place',
    'setup.place2': '2nd place',
    'setup.place34': '3rd/4th place',
    'setup.sum': 'Total: {sum}%',
    'setup.create': 'Create tournament',
    'setup.creating': 'Creating...',
    'setup.created': 'Tournament created — {type}',
    'setup.noPin': ' • no PIN',
    'setup.reconfigure': 'Start over',
    'setup.players': 'Players ({count})',
    'setup.playerPlaceholder': 'Enter player name...',
    'setup.addPlayer': 'Add player',
    'setup.removePlayer': 'Remove player',
    'setup.noPlayers': 'No players added yet',
    'setup.noSemiWarning': 'Note: with fewer than 4 players there is no semi-final, so the 3rd-place share cannot be paid out.',
    'setup.start': 'Start tournament ({count} players)',
    'setup.starting': 'Starting...',
    'setup.minPlayers': 'At least 2 players are needed',
    'setup.createFirst': 'Create the tournament first, then add players',
    'setup.err.fee': 'Please enter an entry fee per player (at least €0.50)',
    'setup.err.sum': 'The split must add up to 100% (currently {sum}%)',

    'tournament.bracket': 'Bracket',
    'tournament.players': '{count} players',
    'tournament.doubleOut': ' • Double-out',
    'tournament.noPin': ' • no PIN',
    'tournament.prizePool': '💰 Prize pool:',
    'tournament.showPins': 'Show PINs',
    'tournament.hidePins': 'Hide PINs',
    'tournament.reset': 'Reset',
    'tournament.activeMatches': 'Active matches',
    'tournament.legs': 'Legs: {n}',
    'tournament.score': 'Score: {a} - {b}',
    'tournament.noPinBadge': 'No PIN',
    'tournament.waitingMatches': 'Waiting matches',
    'tournament.startMatch': 'Start match',
    'tournament.open': 'Open',
    'tournament.resetTitle': 'Reset tournament?',
    'tournament.resetText': 'All results and the bracket will be lost for good.',
    'tournament.cancel': 'Cancel',

    'bracket.final': 'Final',
    'bracket.semi': 'Semi-final',
    'bracket.quarter': 'Quarter-final',
    'bracket.round': 'Round {n}',
    'bracket.bye': 'Bye',

    'qr.loading': 'Loading QR code...',
    'qr.error': 'Could not load the QR code',
    'qr.title': '📱 Phone scoring',
    'qr.text': 'Scan the QR code to enter scores on your phone',
    'qr.alt': 'QR code for the phone view',

    'lobby.waitTournament': 'Waiting for a tournament...',
    'lobby.waitTournament.text': 'The host has to create and start a tournament first.',
    'lobby.setup': 'Tournament is being set up',
    'lobby.setup.text': 'Wait until the host starts the tournament...',
    'lobby.setup.players': '{count} players registered so far',
    'lobby.finished': 'Tournament finished!',
    'lobby.winner': 'Winner:',
    'lobby.won': '💰 {amount} won!',
    'lobby.players': '{count} players',
    'lobby.activeMatches': 'Active matches',
    'lobby.score': '🎯 Enter scores',
    'lobby.watch': '👁 Watch',
    'lobby.waitingMatches': '⏳ Waiting matches',
    'lobby.ready': 'Ready',
    'lobby.finishedMatches': '✅ Finished matches',
    'lobby.none': 'No matches available right now.',
    'lobby.none.text': 'Waiting for the next round...',

    'scoring.error': '⚠️ Something went wrong',
    'scoring.error.text': 'Please reload the page.',
    'scoring.reload': 'Reload',
    'scoring.loading': 'Loading match...',
    'scoring.finished': 'Match finished!',
    'scoring.winner': 'Winner:',
    'scoring.backToLobby': '← Back to overview',
    'scoring.connecting': 'Connecting...',
    'scoring.enterPin': 'Enter match PIN',
    'scoring.pinHint': 'The PIN is shown on the host screen',
    'scoring.confirm': 'Confirm',
    'scoring.back': '← Back',
    'scoring.wrongPin': 'Wrong PIN, please try again.',
    'scoring.settings': '⚙️ Settings',
    'scoring.checkoutHints': 'Checkout hints',
    'scoring.checkoutHints.desc': 'Show finishing suggestions',
    'scoring.done': 'Done',
    'scoring.throwing': 'Throwing',
    'scoring.legs': 'Legs: {n}',
    'scoring.turn': '{name} — turn',
    'scoring.dart': 'Dart {n}',
    'scoring.pts': '{n} pts',
    'scoring.ready': 'The match is ready.',
    'scoring.start': '▶ Start match',

    'pad.single': 'Single',
    'pad.double': 'Double',
    'pad.triple': 'Triple',
    'pad.bull': 'Bull',
    'pad.miss': 'Miss',
    'pad.undo': 'Undo',

    'live.back': '← Back',
    'live.finished': 'Finished',
    'live.loading': 'Loading match...',
    'live.legs': 'Legs',
    'live.legsN': 'Legs: {n}',
    'live.throwing': 'Throwing',
    'live.winner': 'Winner',
    'live.noThrows': 'No darts yet',

    'stats.title': 'Tournament statistics',
    'stats.search': 'Search players...',
    'stats.name': 'Name',
    'stats.matches': 'Matches',
    'stats.wins': 'Wins',
    'stats.legs': 'Legs',
    'stats.avg': 'Avg (3)',
    'stats.bestLeg': 'Best leg',
    'stats.hiFin': 'High finish',
    'stats.prize': 'Prize money',
    'stats.champion': 'CHAMPION',
    'stats.darts': 'darts',
    'stats.winnerIs': 'And the winner is',
    'stats.tournament': 'Tournament: {name}',

    'errors.NOT_HOST': 'Only the tournament host can do that.',
    'errors.UNAUTHORIZED': 'Not authorized — please enter the match PIN.',
};

const de = {
    'app.connecting': 'Verbinde mit Server...',
    'app.footer': 'DartVault © {year} — Dart-Turnier-Software für dein lokales Netzwerk',

    'header.status.setup': 'Setup',
    'header.status.active': 'Live',
    'header.status.finished': 'Beendet',
    'header.theme.obsidian': 'Obsidian (dunkel)',
    'header.theme.neon': 'Neon',
    'header.theme.classic': 'Classic',
    'header.language': 'Language: English',

    'home.badge': 'Open-Source-Dart-Turnier-Software',
    'home.title': 'Dein Dart-Turnier.',
    'home.titleAccent': 'Professionell.',
    'home.subtitle': 'Erstelle und verwalte Dart-Turniere in Echtzeit. Automatische Turnierbäume, Live-Scoring über das Handy und eine Ansicht für den großen Bildschirm — alles lokal in deinem Netzwerk.',
    'home.cta': 'Turnier erstellen',
    'home.guide': 'Anleitung',
    'home.features.title': 'Alles, was du brauchst',
    'home.features.subtitle': 'Features für deinen nächsten Dartabend',
    'home.f.bracket.title': 'Auto-Turnierbaum',
    'home.f.bracket.text': 'K.-o.-Turnierbaum für beliebig viele Spieler, inklusive Freilosen.',
    'home.f.mobile.title': 'Scoring per Handy',
    'home.f.mobile.text': 'Spieler scannen einen QR-Code und tragen ihre Würfe am Handy ein. Keine App, kein Extra-Gerät.',
    'home.f.pin.title': 'PIN-Schutz',
    'home.f.pin.text': 'Ein optionaler Match-PIN verhindert, dass andere Ergebnisse eintragen.',
    'home.f.live.title': 'Live-Ansicht',
    'home.f.live.text': 'Zuschauer verfolgen jedes Spiel live — Scores, Würfe und Legs in Echtzeit.',
    'home.f.themes.title': 'Themes',
    'home.f.themes.text': 'Wähle Obsidian, Neon oder Classic. Dein Turnier, dein Style.',
    'home.f.prize.title': 'Preispool',
    'home.f.prize.text': 'Einsatz mit automatischer Auszahlung: Alles für den Sieger, 70/30, Top-4-Split oder eigene Verteilung.',
    'home.f.stats.title': 'Statistiken',
    'home.f.stats.text': '3-Dart-Average, Best Leg, Highest Finish und Preisgeld auf einen Blick.',
    'home.f.instant.title': 'Sofort startklar',
    'home.f.instant.text': 'Kein Account, keine Cloud. Alles läuft lokal in deinem Netzwerk.',
    'home.steps.title': "So funktioniert's",
    'home.steps.subtitle': 'In fünf Schritten zum perfekten Turnier',
    'home.s1.title': 'Turnier erstellen',
    'home.s1.text': 'Klicke auf „Turnier erstellen“ und wähle den Spielmodus (301, 501 oder 701), die Anzahl der Legs und Optionen wie PIN-Schutz, Double-Out oder einen Preispool.',
    'home.s2.title': 'Spieler hinzufügen',
    'home.s2.text': 'Gib alle Teilnehmer ein — mindestens zwei. Der Turnierbaum entsteht automatisch, bei ungerader Spielerzahl mit Freilosen.',
    'home.s3.title': 'QR-Code teilen',
    'home.s3.text': 'Nach dem Start erscheint ein QR-Code. Die Spieler scannen ihn mit dem Handy und landen in der Scoring-Ansicht.',
    'home.s4.title': 'Spiele durchführen',
    'home.s4.text': 'Starte Matches am Host-Bildschirm oder lass sie automatisch starten. Spieler geben den Match-PIN und ihre Würfe ein; Busts und Finishes werden automatisch erkannt.',
    'home.s5.title': 'Gewinner feiern',
    'home.s5.text': 'Der Turnierbaum aktualisiert sich selbst. Die Sieger rücken Runde für Runde vor, bis der Champion feststeht. 🏆',

    'setup.newTournament': 'Neues Turnier',
    'setup.subtitle.create': 'Konfiguriere dein Turnier und starte durch',
    'setup.subtitle.players': 'Füge Spieler hinzu und starte das Turnier',
    'setup.settings': 'Einstellungen',
    'setup.name': 'Turniername (optional)',
    'setup.namePlaceholder': 'z.B. Freitags-Turnier 🎯',
    'setup.gameMode': 'Spielmodus',
    'setup.legs': 'Legs zum Sieg',
    'setup.legs.single': '1 Leg (Single)',
    'setup.legs.bestOf': 'Best of {n}',
    'setup.advanced': 'Erweiterte Einstellungen',
    'setup.pin': 'PIN-Schutz',
    'setup.pin.desc': 'Match-PIN zum Eintragen erforderlich',
    'setup.doubleOut': 'Double-Out',
    'setup.doubleOut.desc': 'Letzter Wurf muss ein Double sein',
    'setup.autoStart': 'Auto-Start',
    'setup.autoStart.desc': 'Matches starten automatisch',
    'setup.shuffle': 'Spieler mischen',
    'setup.shuffle.desc': 'Zufällige Reihenfolge im Turnierbaum',
    'setup.prize': 'Preispool / Einsatz',
    'setup.prize.desc': 'Spiele um Geld (Einsatz & Gewinne)',
    'setup.entryFee': 'Einsatz pro Spieler (€)',
    'setup.distribution': 'Gewinnverteilung',
    'setup.dist.winner': 'Alles für den Sieger (100%)',
    'setup.dist.final': 'Finale Split (70% / 30%)',
    'setup.dist.top4': 'Top 4 Split (50% / 30% / 20%)',
    'setup.dist.custom': 'Benutzerdefiniert',
    'setup.dist.customLabel': 'Verteilung in % (Summe muss 100 ergeben)',
    'setup.place1': '1. Platz',
    'setup.place2': '2. Platz',
    'setup.place34': '3./4. Platz',
    'setup.sum': 'Summe: {sum}%',
    'setup.create': 'Turnier erstellen',
    'setup.creating': 'Wird erstellt...',
    'setup.created': 'Turnier erstellt — {type}',
    'setup.noPin': ' • Ohne PIN',
    'setup.reconfigure': 'Neu konfigurieren',
    'setup.players': 'Spieler ({count})',
    'setup.playerPlaceholder': 'Spielername eingeben...',
    'setup.addPlayer': 'Spieler hinzufügen',
    'setup.removePlayer': 'Spieler entfernen',
    'setup.noPlayers': 'Noch keine Spieler hinzugefügt',
    'setup.noSemiWarning': 'Hinweis: Bei weniger als 4 Spielern gibt es kein Halbfinale — der Anteil für Platz 3 kann nicht vergeben werden.',
    'setup.start': 'Turnier starten ({count} Spieler)',
    'setup.starting': 'Wird gestartet...',
    'setup.minPlayers': 'Mindestens 2 Spieler benötigt',
    'setup.createFirst': 'Erstelle zuerst ein Turnier, um Spieler hinzuzufügen',
    'setup.err.fee': 'Bitte einen Einsatz pro Spieler angeben (min. 0,50 €)',
    'setup.err.sum': 'Die Verteilung muss 100% ergeben (aktuell: {sum}%)',

    'tournament.bracket': 'Turnierbaum',
    'tournament.players': '{count} Spieler',
    'tournament.doubleOut': ' • Double-Out',
    'tournament.noPin': ' • Ohne PIN',
    'tournament.prizePool': '💰 Preispool:',
    'tournament.showPins': 'PINs zeigen',
    'tournament.hidePins': 'PINs verstecken',
    'tournament.reset': 'Zurücksetzen',
    'tournament.activeMatches': 'Aktive Spiele',
    'tournament.legs': 'Legs: {n}',
    'tournament.score': 'Score: {a} - {b}',
    'tournament.noPinBadge': 'Kein PIN',
    'tournament.waitingMatches': 'Wartende Spiele',
    'tournament.startMatch': 'Spiel starten',
    'tournament.open': 'Offen',
    'tournament.resetTitle': 'Turnier zurücksetzen?',
    'tournament.resetText': 'Alle Spielergebnisse und der Turnierbaum gehen unwiderruflich verloren.',
    'tournament.cancel': 'Abbrechen',

    'bracket.final': 'Finale',
    'bracket.semi': 'Halbfinale',
    'bracket.quarter': 'Viertelfinale',
    'bracket.round': 'Runde {n}',
    'bracket.bye': 'Freilos',

    'qr.loading': 'QR-Code wird geladen...',
    'qr.error': 'QR-Code konnte nicht geladen werden',
    'qr.title': '📱 Mobile Ansicht',
    'qr.text': 'Scanne den QR-Code, um auf deinem Handy Punkte einzutragen',
    'qr.alt': 'QR-Code für die Handy-Ansicht',

    'lobby.waitTournament': 'Warte auf Turnier...',
    'lobby.waitTournament.text': 'Der Host muss zuerst ein Turnier erstellen und starten.',
    'lobby.setup': 'Turnier wird eingerichtet',
    'lobby.setup.text': 'Warte, bis der Host das Turnier startet...',
    'lobby.setup.players': '{count} Spieler bisher registriert',
    'lobby.finished': 'Turnier beendet!',
    'lobby.winner': 'Gewinner:',
    'lobby.won': '💰 {amount} gewonnen!',
    'lobby.players': '{count} Spieler',
    'lobby.activeMatches': 'Aktive Spiele',
    'lobby.score': '🎯 Punkte eintragen',
    'lobby.watch': '👁 Zuschauen',
    'lobby.waitingMatches': '⏳ Wartende Spiele',
    'lobby.ready': 'Bereit',
    'lobby.finishedMatches': '✅ Beendete Spiele',
    'lobby.none': 'Gerade sind keine Spiele verfügbar.',
    'lobby.none.text': 'Warte auf die nächste Runde...',

    'scoring.error': '⚠️ Ein Fehler ist aufgetreten',
    'scoring.error.text': 'Bitte lade die Seite neu.',
    'scoring.reload': 'Neu laden',
    'scoring.loading': 'Spiel wird geladen...',
    'scoring.finished': 'Spiel beendet!',
    'scoring.winner': 'Gewinner:',
    'scoring.backToLobby': '← Zurück zur Übersicht',
    'scoring.connecting': 'Verbindung wird hergestellt...',
    'scoring.enterPin': 'Match-PIN eingeben',
    'scoring.pinHint': 'Der PIN wird auf dem Host-Bildschirm angezeigt',
    'scoring.confirm': 'Bestätigen',
    'scoring.back': '← Zurück',
    'scoring.wrongPin': 'Falscher PIN! Bitte erneut versuchen.',
    'scoring.settings': '⚙️ Einstellungen',
    'scoring.checkoutHints': 'Checkout-Hinweise',
    'scoring.checkoutHints.desc': 'Vorschläge für das Finish anzeigen',
    'scoring.done': 'Fertig',
    'scoring.throwing': 'Am Wurf',
    'scoring.legs': 'Legs: {n}',
    'scoring.turn': '{name} — Aufnahme',
    'scoring.dart': 'Dart {n}',
    'scoring.pts': '{n} Pkt.',
    'scoring.ready': 'Das Spiel ist bereit.',
    'scoring.start': '▶ Spiel starten',

    'pad.single': 'Single',
    'pad.double': 'Double',
    'pad.triple': 'Triple',
    'pad.bull': 'Bull',
    'pad.miss': 'Miss',
    'pad.undo': 'Undo',

    'live.back': '← Zurück',
    'live.finished': 'Beendet',
    'live.loading': 'Spiel wird geladen...',
    'live.legs': 'Legs',
    'live.legsN': 'Legs: {n}',
    'live.throwing': 'Am Wurf',
    'live.winner': 'Gewinner',
    'live.noThrows': 'Keine Würfe',

    'stats.title': 'Turnierstatistik',
    'stats.search': 'Spieler suchen...',
    'stats.name': 'Name',
    'stats.matches': 'Spiele',
    'stats.wins': 'Siege',
    'stats.legs': 'Legs',
    'stats.avg': 'Avg (3)',
    'stats.bestLeg': 'Best Leg',
    'stats.hiFin': 'Hi-Finish',
    'stats.prize': 'Preisgeld',
    'stats.champion': 'CHAMPION',
    'stats.darts': 'Darts',
    'stats.winnerIs': 'Der Sieger ist',
    'stats.tournament': 'Turnier: {name}',

    'errors.NOT_HOST': 'Nur der Turnier-Host darf das tun.',
    'errors.UNAUTHORIZED': 'Nicht autorisiert! Bitte PIN eingeben.',
};

// Server errors arrive in English; these patterns give the German UI a translation.
const SERVER_ERRORS_DE = [
    [/^Player name is required$/, 'Spielername fehlt'],
    [/^Player "(.*)" already exists$/, 'Spieler „$1“ existiert bereits'],
    [/^Need at least 2 players$/, 'Mindestens 2 Spieler benötigt'],
    [/^Tournament already started$/, 'Das Turnier läuft bereits'],
    [/^No tournament created$/, 'Es wurde noch kein Turnier erstellt'],
    [/^Match not found$/, 'Spiel nicht gefunden'],
    [/^Match is not in waiting state$/, 'Das Spiel wartet nicht mehr auf den Start'],
    [/^Match is not active$/, 'Das Spiel läuft nicht'],
    [/^No throws to undo$/, 'Kein Wurf zum Rückgängigmachen'],
    [/^Next match has already started.*$/, 'Das nächste Spiel läuft schon — Rückgängig nicht mehr möglich'],
];

export const dictionaries = { en, de };

function interpolate(text, vars) {
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (m, name) => (vars[name] !== undefined ? String(vars[name]) : m));
}

export function translate(lang, key, vars) {
    const text = dictionaries[lang]?.[key] ?? en[key] ?? key;
    return interpolate(text, vars);
}

/** Money with the language's number format, e.g. "€15.00" / "15,00 €". */
export function formatMoney(lang, amount) {
    return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
}

/** Human-readable text for a failed socket response ({ code, error }). */
export function translateError(lang, res) {
    if (!res) return '';
    if (res.code && (dictionaries[lang]?.[`errors.${res.code}`] || en[`errors.${res.code}`])) {
        return translate(lang, `errors.${res.code}`);
    }
    const message = res.error || '';
    if (lang === 'de') {
        for (const [pattern, replacement] of SERVER_ERRORS_DE) {
            if (pattern.test(message)) return message.replace(pattern, replacement);
        }
    }
    return message;
}

function readStoredLang() {
    try {
        const stored = localStorage.getItem(LANG_STORAGE_KEY);
        if (LANGUAGES.includes(stored)) return stored;
    } catch { /* storage blocked */ }
    return 'en';
}

function makeApi(lang, setLang) {
    return {
        lang,
        setLang,
        t: (key, vars) => translate(lang, key, vars),
        money: (amount) => formatMoney(lang, amount),
        errorText: (res) => translateError(lang, res),
    };
}

const I18nContext = createContext(makeApi('en', () => { }));

export function I18nProvider({ children, initialLang }) {
    const [lang, setLang] = useState(() => initialLang || readStoredLang());

    useEffect(() => {
        document.documentElement.lang = lang;
        try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch { /* storage blocked */ }
    }, [lang]);

    const api = useMemo(() => makeApi(lang, setLang), [lang]);
    return <I18nContext.Provider value={api}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    return useContext(I18nContext);
}
