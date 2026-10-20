import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import socket from './socket.js';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import SetupPage from './pages/SetupPage.jsx';
import TournamentPage from './pages/TournamentPage.jsx';
import MobileLobby from './pages/MobileLobby.jsx';
import MobileScoring from './pages/MobileScoring.jsx';
import LiveMatchPage from './pages/LiveMatchPage.jsx';
import { useI18n } from './i18n.jsx';

const THEME_STORAGE_KEY = 'dartvault-theme';

// Older versions stored 'obsidian' / 'neon' / 'classic'; anything that is not
// 'light' or 'dark' falls back to the system preference.
function initialTheme() {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
    } catch { /* storage blocked */ }
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export default function App() {
    const { t } = useI18n();
    const [tournament, setTournament] = useState(null);
    const [hostTournament, setHostTournament] = useState(null);
    const [isHost, setIsHost] = useState(null);
    const [theme, setTheme] = useState(initialTheme);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* storage blocked */ }
    }, [theme]);

    useEffect(() => {
        socket.on('session_info', (info) => {
            setIsHost(!!info?.isHost);
        });

        socket.on('tournament_update', (data) => {
            setTournament(data);
            if (!data) setHostTournament(null);
        });

        // Host-only update with PINs
        socket.on('tournament_update_host', (data) => {
            setHostTournament(data);
        });

        return () => {
            socket.off('session_info');
            socket.off('tournament_update');
            socket.off('tournament_update_host');
        };
    }, []);

    // Only the host PC (or a device with the admin link) manages the tournament;
    // everyone else gets the phone lobby.
    const getRootElement = () => {
        if (isHost === null) return <p className="center-state muted">{t('app.connecting')}</p>;
        if (!isHost) return <MobileLobby tournament={tournament} />;
        if (!tournament) return <HomePage />;
        if (tournament.status === 'setup') return <SetupPage tournament={tournament} />;
        return <TournamentPage tournament={tournament} hostTournament={hostTournament} />;
    };

    return (
        <div className="app">
            <Header tournament={tournament} theme={theme} setTheme={setTheme} />
            <main className="page">
                <Routes>
                    <Route path="/" element={getRootElement()} />
                    <Route path="/setup" element={isHost ? <SetupPage tournament={tournament} /> : getRootElement()} />
                    <Route path="/live/:matchId" element={<LiveMatchPage tournament={tournament} />} />
                    <Route path="/mobile" element={<MobileLobby tournament={tournament} />} />
                    <Route path="/mobile/match/:matchId" element={<MobileScoring tournament={tournament} isHost={!!isHost} />} />
                </Routes>
            </main>
            <footer className="footer">{t('app.footer', { year: new Date().getFullYear() })}</footer>
        </div>
    );
}
