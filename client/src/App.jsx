import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import socket from './socket.js';
import Header from './components/Header.jsx';
import SetupPage from './pages/SetupPage.jsx';
import TournamentPage from './pages/TournamentPage.jsx';
import MobileLobby from './pages/MobileLobby.jsx';
import MobileScoring from './pages/MobileScoring.jsx';

export default function App() {
    const [tournament, setTournament] = useState(null);

    useEffect(() => {
        socket.on('tournament_update', (data) => {
            setTournament(data);
        });

        return () => {
            socket.off('tournament_update');
        };
    }, []);

    return (
        <>
            <Header tournament={tournament} />
            <main className="page">
                <div className="container">
                    <Routes>
                        <Route
                            path="/"
                            element={
                                tournament && tournament.status !== 'setup' ? (
                                    <TournamentPage tournament={tournament} />
                                ) : (
                                    <SetupPage tournament={tournament} />
                                )
                            }
                        />
                        <Route path="/mobile" element={<MobileLobby tournament={tournament} />} />
                        <Route path="/mobile/match/:matchId" element={<MobileScoring tournament={tournament} />} />
                    </Routes>
                </div>
            </main>
        </>
    );
}
