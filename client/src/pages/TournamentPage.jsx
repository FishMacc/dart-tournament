import socket from '../socket.js';
import Bracket from '../components/Bracket.jsx';
import QRCodeDisplay from '../components/QRCodeDisplay.jsx';

export default function TournamentPage({ tournament }) {
    if (!tournament) return null;

    const handleReset = () => {
        if (confirm('Turnier wirklich zurücksetzen? Alle Daten gehen verloren!')) {
            socket.emit('reset_tournament');
        }
    };

    const handleStartMatch = (matchId) => {
        socket.emit('start_match', { matchId }, (res) => {
            if (!res.success) alert(res.error);
        });
    };

    // Get waiting matches that can be started
    const waitingMatches = [];
    if (tournament.rounds) {
        for (const round of tournament.rounds) {
            for (const match of round) {
                if (match.status === 'waiting') {
                    waitingMatches.push(match);
                }
            }
        }
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2>Turnierbaum</h2>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                        {tournament.type} • {tournament.players?.length} Spieler
                        {tournament.status === 'finished' && tournament.winner && (
                            <> • 🏆 Gewinner: <strong style={{ color: 'var(--accent-primary)' }}>{tournament.winner.name}</strong></>
                        )}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-danger btn-sm" onClick={handleReset} id="btn-reset-tournament">
                        Zurücksetzen
                    </button>
                </div>
            </div>

            {/* Bracket */}
            <Bracket rounds={tournament.rounds} />

            {/* Waiting Matches */}
            {waitingMatches.length > 0 && (
                <div className="mt-4">
                    <h3 className="mb-2">⏳ Wartende Spiele</h3>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {waitingMatches.map((match) => (
                            <button
                                key={match.id}
                                className="btn btn-secondary"
                                onClick={() => handleStartMatch(match.id)}
                                id={`btn-start-match-${match.id}`}
                            >
                                ▶ {match.player1?.name || 'TBD'} vs {match.player2?.name || 'TBD'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* QR Code */}
            <div className="mt-4">
                <QRCodeDisplay />
            </div>
        </div>
    );
}
