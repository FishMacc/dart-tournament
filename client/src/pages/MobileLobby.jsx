import { useNavigate } from 'react-router-dom';

export default function MobileLobby({ tournament }) {
    const navigate = useNavigate();

    if (!tournament) {
        return (
            <div className="scoring-container animate-fade-in text-center" style={{ paddingTop: '4rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.6 }}>🎯</div>
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
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
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
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏆</div>
                <h2>Turnier beendet!</h2>
                <p className="mt-1" style={{ fontSize: '1.3rem', color: 'var(--accent-primary)' }}>
                    Gewinner: <strong>{tournament.winner?.name}</strong>
                </p>
            </div>
        );
    }

    // Active tournament: categorize matches
    const activeMatches = [];
    const waitingMatches = [];
    const finishedMatches = [];

    for (const round of tournament.rounds) {
        for (const match of round) {
            if (match.status === 'active') activeMatches.push(match);
            else if (match.status === 'waiting') waitingMatches.push(match);
            else if (match.status === 'finished') finishedMatches.push(match);
        }
    }

    const handleGoToMatch = (matchId) => {
        navigate(`/mobile/match/${matchId}`);
    };

    const handleWatchLive = (matchId) => {
        navigate(`/live/${matchId}`);
    };

    return (
        <div className="scoring-container animate-fade-in">
            <div className="scoring-header">
                <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{
                        background: 'var(--gradient-accent)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        DartVault
                    </span>
                </h2>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                    {tournament.type} • {tournament.players?.length} Spieler
                    {tournament.name && ` • ${tournament.name}`}
                </p>
            </div>

            {/* Active Matches */}
            {activeMatches.length > 0 && (
                <div className="mb-2">
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-live" style={{ fontSize: '0.7rem' }}>LIVE</span>
                        Aktive Spiele
                    </h3>
                    <div className="match-list">
                        {activeMatches.map((match) => (
                            <div key={match.id} className="match-card" style={{ flexDirection: 'column', gap: '0.75rem', cursor: 'default' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <div className="match-card-players">
                                        <span style={{ fontWeight: 600 }}>{match.player1?.name}</span>
                                        <span className="match-card-vs">VS</span>
                                        <span style={{ fontWeight: 600 }}>{match.player2?.name}</span>
                                    </div>
                                    <span className="badge badge-active">Live</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        style={{ flex: 1 }}
                                        onClick={() => handleGoToMatch(match.id)}
                                    >
                                        🎯 Punkte eintragen
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        style={{ flex: 1 }}
                                        onClick={() => handleWatchLive(match.id)}
                                    >
                                        👁 Zuschauen
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Waiting Matches */}
            {waitingMatches.length > 0 && (
                <div className="mb-2">
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>⏳ Wartende Spiele</h3>
                    <div className="match-list">
                        {waitingMatches.map((match) => (
                            <div
                                key={match.id}
                                className="match-card"
                                onClick={() => handleGoToMatch(match.id)}
                                id={`mobile-match-${match.id}`}
                            >
                                <div className="match-card-players">
                                    <span style={{ fontWeight: 600 }}>{match.player1?.name || 'TBD'}</span>
                                    <span className="match-card-vs">VS</span>
                                    <span style={{ fontWeight: 600 }}>{match.player2?.name || 'TBD'}</span>
                                </div>
                                <span className="badge badge-warning">Bereit</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Finished Matches */}
            {finishedMatches.length > 0 && (
                <div className="mb-2">
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>✅ Beendete Spiele</h3>
                    <div className="match-list">
                        {finishedMatches.slice(-4).map((match) => (
                            <div
                                key={match.id}
                                className="match-card"
                                onClick={() => handleWatchLive(match.id)}
                                style={{ opacity: 0.7 }}
                            >
                                <div className="match-card-players">
                                    <span style={{ fontWeight: 600 }}>{match.player1?.name}</span>
                                    <span className="match-card-vs">VS</span>
                                    <span style={{ fontWeight: 600 }}>{match.player2?.name}</span>
                                </div>
                                <span className="badge badge-finished">🏆 {match.winner?.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeMatches.length === 0 && waitingMatches.length === 0 && (
                <div className="text-center mt-4">
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.4 }}>🎯</div>
                    <p className="text-muted">Keine Spiele verfügbar gerade.</p>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                        Warte auf die nächste Runde...
                    </p>
                </div>
            )}
        </div>
    );
}
