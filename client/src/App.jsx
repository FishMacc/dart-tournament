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

export default function App() {
    const [tournament, setTournament] = useState(null);
    const [hostTournament, setHostTournament] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('dartvault-theme') || 'obsidian');

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dartvault-theme', theme);
    }, [theme]);

    useEffect(() => {
        socket.on('tournament_update', (data) => {
            setTournament(data);
        });

        // Host-only update with PINs
        socket.on('tournament_update_host', (data) => {
            setHostTournament(data);
        });

        return () => {
            socket.off('tournament_update');
            socket.off('tournament_update_host');
        };
    }, []);

    // Determine which page to show at root
    const getRootElement = () => {
        if (!tournament) return <HomePage onGetStarted={() => { }} />;
        if (tournament.status === 'setup') return <SetupPage tournament={tournament} />;
        return <TournamentPage tournament={tournament} hostTournament={hostTournament} />;
    };

    return (
        <>
            <Header tournament={tournament} theme={theme} setTheme={setTheme} />
            <main className="page">
                <div className="container">
                    <Routes>
                        <Route path="/" element={getRootElement()} />
                        <Route path="/setup" element={<SetupPage tournament={tournament} />} />
                        <Route path="/live/:matchId" element={<LiveMatchPage tournament={tournament} />} />
                        <Route path="/mobile" element={<MobileLobby tournament={tournament} />} />
                        <Route path="/mobile/match/:matchId" element={<MobileScoring tournament={tournament} />} />
                    </Routes>
                </div>
            </main>
            <footer className="footer">
                <div className="container">
                    DartVault &copy; {new Date().getFullYear()} — Professionelle Dart-Turnier-Software
                </div>
            </footer>
        </>
    );
}
