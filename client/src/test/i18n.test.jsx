import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Bracket from '../components/Bracket.jsx';
import {
    I18nProvider,
    dictionaries,
    translate,
    formatMoney,
    translateError,
    LANG_STORAGE_KEY,
} from '../i18n.jsx';

describe('i18n dictionaries', () => {
    it('English and German define exactly the same keys', () => {
        const en = Object.keys(dictionaries.en).sort();
        const de = Object.keys(dictionaries.de).sort();
        expect(de).toEqual(en);
    });

    it('German and English use the same placeholders for every key', () => {
        const vars = (text) => (text.match(/\{\w+\}/g) || []).sort();
        for (const key of Object.keys(dictionaries.en)) {
            expect(vars(dictionaries.de[key]), key).toEqual(vars(dictionaries.en[key]));
        }
    });
});

describe('translate', () => {
    it('replaces placeholders', () => {
        expect(translate('en', 'setup.start', { count: 4 })).toBe('Start tournament (4 players)');
        expect(translate('de', 'setup.start', { count: 4 })).toBe('Turnier starten (4 Spieler)');
    });

    it('falls back to English for an unknown language and to the key for an unknown key', () => {
        expect(translate('fr', 'bracket.final')).toBe('Final');
        expect(translate('en', 'does.not.exist')).toBe('does.not.exist');
    });
});

describe('formatMoney', () => {
    it('formats euros per language', () => {
        expect(formatMoney('en', 15)).toBe('€15.00');
        expect(formatMoney('de', 15).replace(/\s/g, ' ')).toBe('15,00 €');
    });
});

describe('translateError', () => {
    it('uses the error code when there is one', () => {
        expect(translateError('en', { code: 'NOT_HOST', error: 'x' })).toBe('Only the tournament host can do that.');
        expect(translateError('de', { code: 'UNAUTHORIZED', error: 'x' })).toBe('Nicht autorisiert! Bitte PIN eingeben.');
    });

    it('translates known server messages to German and passes others through', () => {
        expect(translateError('de', { error: 'Player "Bob" already exists' })).toBe('Spieler „Bob“ existiert bereits');
        expect(translateError('en', { error: 'Player "Bob" already exists' })).toBe('Player "Bob" already exists');
        expect(translateError('de', { error: 'Something new' })).toBe('Something new');
    });
});

describe('language switch', () => {
    beforeEach(() => localStorage.clear());

    const renderApp = () => render(
        <I18nProvider>
            <MemoryRouter>
                <Header tournament={{ status: 'finished' }} theme="obsidian" setTheme={() => { }} />
                <Bracket rounds={[[{ id: 'm1', status: 'waiting', player1: null, player2: null }]]} />
            </MemoryRouter>
        </I18nProvider>
    );

    it('defaults to English', () => {
        renderApp();
        expect(screen.getByText('Finished')).toBeInTheDocument();
        expect(screen.getByText('Final')).toBeInTheDocument();
        expect(document.documentElement.lang).toBe('en');
    });

    it('switches to German and remembers the choice', () => {
        renderApp();
        fireEvent.click(screen.getByRole('button', { name: 'Sprache: Deutsch' }));
        expect(screen.getByText('Beendet')).toBeInTheDocument();
        expect(screen.getByText('Finale')).toBeInTheDocument();
        expect(document.documentElement.lang).toBe('de');
        expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('de');
    });

    it('starts in the stored language', () => {
        localStorage.setItem(LANG_STORAGE_KEY, 'de');
        renderApp();
        expect(screen.getByText('Beendet')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Language: English' })).toHaveTextContent('DE');
    });
});
