import { useNavigate } from 'react-router-dom';
import socket from '../socket.js';

export default function MobileLobby({ tournament }) {
    const navigate = useNavigate();

    if (!tournament) {
        return (
            <div className="scoring-container animate-fade-in text-center" style={{ paddingTop: '4rem' }}>
                <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</h2>
                <h2>Warte auf Turnier...</h2>
                <p className="text-muted mt-1">
                    Der Host muss zuerst ein Turnier erstellen und starten.
                </p>
            </div>
        );
    }

    if (tournament.status === 'setup') {
        return (
            <div className="scoring-container animate-fade-in text-center" style={{ paddingTop: '4rem' }}>
                <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</h2>
                <h2>Turnier wird eingerichtet</h2>
                <p className="text-muted mt-1">
                    Warte bis der Host das Turnier startet...
                </p>
                <p className="mt-2 text-muted" style={{ fontSize: '0.85rem' }}>
                    {tournament.players?.length || 0} Spieler bisher registriert
                </p>
            </div>
        );
    }

    if (tournament.status === 'finished') {
        return (
            <div className="scoring-container animate-fade-in text-center" style={{ paddingTop: '4rem' }}>
                <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</h2>
                <h2>Turnier beendet!</h2>
                <p className="mt-1" style={{ fontSize: '1.3rem', color: 'var(--accent-primary)' }}>
                    Gewinner: <strong>{tournament.winner?.name}</strong>
                </p>
            </div>
        );
    }

    // Active tournament: show playable matches
    const playableMatches = [];
    for (const round of tournament.rounds) {
        for (const match of round) {
            if (match.status === 'waiting' || match.status === 'active') {
                playableMatches.push(match);
            }
        }
    }

    const handleStartAndGo = (match) => {
        if (match.status === 'waiting') {
            socket.emit('start_match', { matchId: match.id }, (res) => {
                if (res.success) {
                    navigate(`/mobile/match/${match.id}`);
                }
            });
        } else {
            navigate(`/mobile/match/${match.id}`);
        }
    };

    return (
        <div className="scoring-container animate-fade-in">
            <div className="scoring-header">
                <h2>🎯 Spiele</h2>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                    Wähle dein Spiel aus
                </p>
            </div>

            {playableMatches.length === 0 ? (
                <div className="text-center mt-4">
                    <p className="text-muted">Keine Spiele verfügbar gerade.</p>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                        Warte auf die nächste Runde...
                    </p>
                </div>
            ) : (
                <div className="match-list">
                    {playableMatches.map((match) => (
                        <div
                            key={match.id}
                            className="match-card"
                            onClick={() => handleStartAndGo(match)}
                            id={`mobile-match-${match.id}`}
                        >
                            <div className="match-card-players">
                                <span style={{ fontWeight: 600 }}>{match.player1?.name || 'TBD'}</span>
                                <span className="match-card-vs">VS</span>
                                <span style={{ fontWeight: 600 }}>{match.player2?.name || 'TBD'}</span>
                            </div>
                            <span className={`badge ${match.status === 'active' ? 'badge-active' : 'badge-warning'}`}>
                                {match.status === 'active' ? 'Live' : 'Bereit'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
