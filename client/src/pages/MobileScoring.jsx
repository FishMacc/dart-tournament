import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket.js';
import ScorePad from '../components/ScorePad.jsx';

export default function MobileScoring({ tournament }) {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState(null);
    const [lastThrow, setLastThrow] = useState(null);
    const [checkout, setCheckout] = useState(null);

    // Find our match from tournament state
    useEffect(() => {
        if (!tournament?.rounds) return;
        for (const round of tournament.rounds) {
            for (const m of round) {
                if (m.id === matchId) {
                    setMatch(m);
                    return;
                }
            }
        }
    }, [tournament, matchId]);

    // Listen for match-specific updates
    useEffect(() => {
        const handleMatchUpdate = (updatedMatch) => {
            if (updatedMatch.id === matchId) {
                setMatch(updatedMatch);
            }
        };
        socket.on('match_update', handleMatchUpdate);
        return () => socket.off('match_update', handleMatchUpdate);
    }, [matchId]);

    const handleThrow = (value, multiplier) => {
        socket.emit('throw_dart', { matchId, value, multiplier }, (res) => {
            if (res.success) {
                const label = getThrowLabel(value, multiplier);
                setLastThrow({
                    label,
                    score: value * multiplier,
                    isBust: res.throwResult.isBust,
                    isFinish: res.throwResult.isFinish,
                });
                setCheckout(res.checkout);
            }
        });
    };

    if (!match) {
        return (
            <div className="scoring-container animate-fade-in text-center" style={{ paddingTop: '4rem' }}>
                <p className="text-muted">Spiel wird geladen...</p>
            </div>
        );
    }

    if (match.status === 'finished') {
        return (
            <div className="scoring-container animate-fade-in text-center" style={{ paddingTop: '4rem' }}>
                <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</h2>
                <h2>Spiel beendet!</h2>
                <p className="mt-1" style={{ fontSize: '1.3rem', color: 'var(--accent-primary)' }}>
                    Gewinner: <strong>{match.winner?.name}</strong>
                </p>
                <button
                    className="btn btn-secondary mt-3"
                    onClick={() => navigate('/mobile')}
                    id="btn-back-to-lobby"
                >
                    ← Zurück zur Übersicht
                </button>
            </div>
        );
    }

    const currentThrowerName =
        match.currentThrower === 'player1' ? match.player1?.name : match.player2?.name;

    return (
        <div className="scoring-container animate-fade-in">
            {/* Score Display */}
            <div className="scoring-players">
                <div className={`scoring-player-card ${match.currentThrower === 'player1' ? 'active-thrower' : ''}`}>
                    <div className="scoring-player-name">{match.player1?.name}</div>
                    <div className="scoring-player-score">{match.scores?.player1}</div>
                    {match.legs?.player1 > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Legs: {match.legs.player1}
                        </div>
                    )}
                    <div className="scoring-checkout">
                        {match.currentThrower === 'player1' && checkout ? `🎯 ${checkout}` : '\u00A0'}
                    </div>
                </div>
                <div className={`scoring-player-card ${match.currentThrower === 'player2' ? 'active-thrower' : ''}`}>
                    <div className="scoring-player-name">{match.player2?.name}</div>
                    <div className="scoring-player-score">{match.scores?.player2}</div>
                    {match.legs?.player2 > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Legs: {match.legs.player2}
                        </div>
                    )}
                    <div className="scoring-checkout">
                        {match.currentThrower === 'player2' && checkout ? `🎯 ${checkout}` : '\u00A0'}
                    </div>
                </div>
            </div>

            {/* Current Throw Display */}
            <div className="current-throw">
                {lastThrow ? (
                    <>
                        <span className="current-throw-label">
                            {lastThrow.isBust ? '💥 BUST!' : lastThrow.isFinish ? '🎉 FINISH!' : 'Letzter Wurf:'}
                        </span>
                        <span className="current-throw-value" style={{
                            color: lastThrow.isBust ? 'var(--accent-danger)' : lastThrow.isFinish ? 'var(--accent-success)' : 'var(--accent-primary)'
                        }}>
                            {lastThrow.label} ({lastThrow.score})
                        </span>
                    </>
                ) : (
                    <span className="current-throw-label">
                        🎯 {currentThrowerName} ist dran
                    </span>
                )}
            </div>

            {/* Score Pad */}
            <ScorePad
                onThrow={handleThrow}
                disabled={match.status !== 'active'}
            />

            {/* Back button */}
            <div className="mt-2">
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate('/mobile')}
                    style={{ width: '100%' }}
                >
                    ← Zurück zur Übersicht
                </button>
            </div>
        </div>
    );
}

function getThrowLabel(value, multiplier) {
    if (value === 0) return 'Miss';
    const prefix = multiplier === 1 ? 'S' : multiplier === 2 ? 'D' : 'T';
    if (value === 25) return multiplier === 2 ? 'Bullseye' : 'Bull';
    return `${prefix}${value}`;
}
