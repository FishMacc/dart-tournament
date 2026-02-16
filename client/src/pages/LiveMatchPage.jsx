import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, CheckCircle, Target, Trophy, AlertTriangle } from 'lucide-react';
import socket from '../socket.js';

export default function LiveMatchPage({ tournament }) {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState(null);

    // Find match from tournament state
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

        // Join spectator room
        socket.emit('spectate_match', { matchId });

        return () => {
            socket.off('match_update', handleMatchUpdate);
        };
    }, [matchId]);

    if (!match) {
        return (
            <div className="text-center animate-fade-in" style={{ paddingTop: '4rem' }}>
                <p className="text-muted">Spiel wird geladen...</p>
            </div>
        );
    }

    const isActive = match.status === 'active';
    const isFinished = match.status === 'finished';

    // Get the last few throws for history
    const recentThrowsP1 = (match.throws?.player1 || []).slice(-6);
    const recentThrowsP2 = (match.throws?.player2 || []).slice(-6);

    return (
        <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '2rem', flexWrap: 'wrap', gap: '0.5rem',
            }}>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(-1)}
                    id="btn-back"
                >
                    ← Zurück
                </button>

                {isActive && (
                    <span className="badge badge-live" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Activity size={12} /> LIVE
                    </span>
                )}
                {isFinished && (
                    <span className="badge badge-success" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle size={12} /> Beendet
                    </span>
                )}
            </div>

            {/* Score Display */}
            <div className="live-match-container">
                {/* Player 1 */}
                <div className={`live-player-panel ${match.currentThrower === 'player1' && isActive ? 'active-panel' : ''}`}>
                    <div className="live-player-name">{match.player1?.name}</div>
                    <div className="live-player-score">
                        {isFinished ? match.legs?.player1 : match.scores?.player1}
                    </div>
                    <div className="live-player-legs">
                        {isFinished ? 'Legs' : `Legs: ${match.legs?.player1 || 0}`}
                    </div>
                    {match.currentThrower === 'player1' && isActive && (
                        <div className="live-thrower-indicator" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                            <Target size={14} /> Am Wurf
                        </div>
                    )}
                    {isFinished && match.winner?.id === match.player1?.id && (
                        <div style={{ marginTop: '0.5rem', color: 'var(--accent-success)', fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Trophy size={20} /> Gewinner
                        </div>
                    )}
                </div>

                {/* VS */}
                <div className="live-vs">VS</div>

                {/* Player 2 */}
                <div className={`live-player-panel ${match.currentThrower === 'player2' && isActive ? 'active-panel' : ''}`}>
                    <div className="live-player-name">{match.player2?.name}</div>
                    <div className="live-player-score">
                        {isFinished ? match.legs?.player2 : match.scores?.player2}
                    </div>
                    <div className="live-player-legs">
                        {isFinished ? 'Legs' : `Legs: ${match.legs?.player2 || 0}`}
                    </div>
                    {match.currentThrower === 'player2' && isActive && (
                        <div className="live-thrower-indicator" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                            <Target size={14} /> Am Wurf
                        </div>
                    )}
                    {isFinished && match.winner?.id === match.player2?.id && (
                        <div style={{ marginTop: '0.5rem', color: 'var(--accent-success)', fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Trophy size={20} /> Gewinner
                        </div>
                    )}
                </div>
            </div>

            {/* Throw History */}
            {(recentThrowsP1.length > 0 || recentThrowsP2.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
                    <div className="live-history">
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {match.player1?.name}
                        </div>
                        <div className="throw-history-list">
                            {recentThrowsP1.map((t, i) => (
                                <span key={i} className={`throw-chip ${t.isBust ? 'bust' : ''}`}>
                                    {t.isBust ? <AlertTriangle size={12} /> : getThrowLabel(t.value, t.multiplier)}
                                </span>
                            ))}
                            {recentThrowsP1.length === 0 && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Keine Würfe</span>
                            )}
                        </div>
                    </div>

                    <div className="live-history">
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {match.player2?.name}
                        </div>
                        <div className="throw-history-list">
                            {recentThrowsP2.map((t, i) => (
                                <span key={i} className={`throw-chip ${t.isBust ? 'bust' : ''}`}>
                                    {t.isBust ? <AlertTriangle size={12} /> : getThrowLabel(t.value, t.multiplier)}
                                </span>
                            ))}
                            {recentThrowsP2.length === 0 && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Keine Würfe</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function getThrowLabel(value, multiplier) {
    if (value === 0) return 'Miss';
    const prefix = multiplier === 1 ? 'S' : multiplier === 2 ? 'D' : 'T';
    if (value === 25) return multiplier === 2 ? 'Bullseye' : 'Bull';
    return `${prefix}${value}`;
}
