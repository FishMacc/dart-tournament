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
    const [isHost, setIsHost] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('dartvault-theme') || 'obsidian');


    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dartvault-theme', theme);
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

    // Determine which page to show at root
    // Only the host PC (or a device with the admin link) manages the tournament;
    // everyone else gets the phone lobby.
    const getRootElement = () => {
        if (isHost === null) return <p className="text-muted text-center" style={{ paddingTop: '4rem' }}>Verbinde mit Server...</p>;
        if (!isHost) return <MobileLobby tournament={tournament} />;
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
                        <Route path="/setup" element={isHost ? <SetupPage tournament={tournament} /> : getRootElement()} />
                        <Route path="/live/:matchId" element={<LiveMatchPage tournament={tournament} />} />
                        <Route path="/mobile" element={<MobileLobby tournament={tournament} />} />
                        <Route path="/mobile/match/:matchId" element={<MobileScoring tournament={tournament} isHost={!!isHost} />} />
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
