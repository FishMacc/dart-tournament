import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Trophy, Eye, EyeOff, Trash2, Activity, Clock, Unlock, Play, Lock } from 'lucide-react';
import socket from '../socket.js';
import Bracket from '../components/Bracket.jsx';
import QRCodeDisplay from '../components/QRCodeDisplay.jsx';
import StatsBoard from '../components/StatsBoard.jsx';
import { useI18n } from '../i18n.jsx';

export default function TournamentPage({ tournament, hostTournament }) {
    const navigate = useNavigate();
    const { t, money, errorText } = useI18n();

    // Request host view with PINs on mount
    useEffect(() => {
        socket.emit('request_host_view', {}, () => { });
    }, []);

    const [hidePins, setHidePins] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [matchError, setMatchError] = useState('');

    // Confetti on finish
    useEffect(() => {
        if (tournament?.status === 'finished') {
            const duration = 5000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                const particleCount = 50 * (timeLeft / duration);

                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [tournament?.status]);

    if (!tournament) return null;

    const requiresPin = tournament.settings?.requirePin !== false;

    const handleReset = () => {
        setShowResetConfirm(true);
    };

    const confirmReset = () => {
        socket.emit('reset_tournament');
        setShowResetConfirm(false);
    };

    const handleStartMatch = (matchId) => {
        socket.emit('start_match', { matchId }, (res) => {
            if (!res.success) {
                setMatchError(errorText(res));
                setTimeout(() => setMatchError(''), 3000);
            }
        });
    };

    const handleWatchLive = (matchId) => {
        navigate(`/live/${matchId}`);
    };

    // Build match lists
    const waitingMatches = [];
    const activeMatches = [];
    const hostRounds = hostTournament?.rounds || [];

    if (tournament.rounds) {
        for (const round of tournament.rounds) {
            for (const match of round) {
                if (match.status === 'waiting') waitingMatches.push(match);
                if (match.status === 'active') activeMatches.push(match);
            }
        }
    }

    // Helper to find PIN from host tournament
    const getPin = (matchId) => {
        if (!hostRounds.length) return '...';
        for (const round of hostRounds) {
            for (const match of round) {
                if (match.id === matchId) return match.pin;
            }
        }
        return '----';
    };

    return (
        <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
            {/* Tournament Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {tournament.name || t('tournament.bracket')}
                        {tournament.status === 'finished' && tournament.winner && (
                            <span className="badge badge-success" style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Trophy size={14} /> {tournament.winner.name}
                            </span>
                        )}
                    </h2>
                    <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        {tournament.type} • {t('tournament.players', { count: tournament.players?.length || 0 })}
                        {tournament.settings?.doubleOut ? t('tournament.doubleOut') : ''}
                        {!requiresPin && t('tournament.noPin')}
                    </p>
                    {tournament.settings?.entryFee > 0 && (
                        <div style={{
                            marginTop: '0.5rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'rgba(234, 179, 8, 0.1)',
                            border: '1px solid rgba(234, 179, 8, 0.3)',
                            borderRadius: 'var(--radius-full)',
                            padding: '0.2rem 0.75rem',
                            color: '#eab308',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                        }}>
                            <span>{t('tournament.prizePool')}</span>
                            <span>
                                {money(tournament.settings.entryFee * (tournament.players?.length || 0))}
                            </span>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {requiresPin && (
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setHidePins(!hidePins)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {hidePins ? <><Eye size={14} /> {t('tournament.showPins')}</> : <><EyeOff size={14} /> {t('tournament.hidePins')}</>}
                        </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={handleReset} id="btn-reset-tournament" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trash2 size={14} /> {t('tournament.reset')}
                    </button>
                </div>
            </div>

            {/* Stats Board (Shown only when finished) */}
            {tournament.status === 'finished' && (
                <div className="mb-5 animate-scale-in">
                    <StatsBoard tournament={tournament} />
                </div>
            )}

            {/* Live Matches */}
            {activeMatches.length > 0 && (
                <div className="mb-4">
                    <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-live" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Activity size={12} /> LIVE</span>
                        {t('tournament.activeMatches')}
                    </h3>
                    <div className="active-matches-grid">
                        {activeMatches.map((match) => (
                            <div key={match.id} className="active-match-card">
                                <div className="active-match-players">
                                    <span className="active-match-name">{match.player1?.name}</span>
                                    {/* Display LEGS instead of SCORES */}
                                    <span className="active-match-score" style={{ color: 'var(--accent-primary)' }}>
                                        {t('tournament.legs', { n: match.legs?.player1 ?? 0 })}
                                    </span>
                                </div>
                                <div className="active-match-vs" style={{ fontSize: '0.8rem', opacity: 0.6 }}>VS</div>
                                <div className="active-match-players">
                                    <span className="active-match-name">{match.player2?.name}</span>
                                    {/* Display LEGS instead of SCORES */}
                                    <span className="active-match-score" style={{ color: 'var(--accent-primary)' }}>
                                        {t('tournament.legs', { n: match.legs?.player2 ?? 0 })}
                                    </span>
                                </div>

                                <div className="active-match-footer">
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {t('tournament.score', { a: match.scores?.player1, b: match.scores?.player2 })}
                                    </div>

                                    {requiresPin ? (
                                        <div className="active-match-pin">
                                            <span className="pin-label">PIN:</span>
                                            <span className="pin-value">
                                                {hidePins ? '••••' : getPin(match.id)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="no-pin-badge"><Unlock size={12} /> {t('tournament.noPinBadge')}</span>
                                    )}
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleWatchLive(match.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <Eye size={14} /> Live
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bracket */}
            <div className="mb-4">
                <Bracket rounds={tournament.rounds} onWatchLive={handleWatchLive} />
            </div>

            {/* Waiting Matches */}
            {waitingMatches.length > 0 && (
                <div className="mt-4">
                    <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> {t('tournament.waitingMatches')}</h3>
                    <div className="active-matches-grid">
                        {waitingMatches.map((match) => (
                            <div key={match.id} className="waiting-match-card" style={{ minWidth: '250px' }}>
                                <div style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
                                    <strong>{match.player1?.name || 'TBD'}</strong>
                                    <span className="text-muted mx-2"> vs </span>
                                    <strong>{match.player2?.name || 'TBD'}</strong>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                                    <button
                                        className="btn btn-primary btn-sm w-full"
                                        onClick={() => handleStartMatch(match.id)}
                                        id={`btn-start-match-${match.id}`}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        <Play size={14} /> {t('tournament.startMatch')}
                                    </button>

                                    {requiresPin ? (
                                        <div className="active-match-pin">
                                            <span className="pin-label">PIN:</span>
                                            <span className="pin-value">
                                                {hidePins ? '••••' : getPin(match.id)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="no-pin-badge"><Unlock size={12} /> {t('tournament.open')}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* QR Code */}
            <div className="mt-5">
                <QRCodeDisplay />
            </div>

            {/* Match Error Toast */}
            {matchError && (
                <div style={{
                    position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--accent-danger)', color: '#fff', padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.9rem',
                    zIndex: 300, boxShadow: 'var(--shadow-lg)',
                }} className="animate-fade-in">
                    {matchError}
                </div>
            )}

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '0.75rem' }}>{t('tournament.resetTitle')}</h3>
                        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            {t('tournament.resetText')}
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                className="btn btn-ghost"
                                onClick={() => setShowResetConfirm(false)}
                                style={{ flex: 1 }}
                            >
                                {t('tournament.cancel')}
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={confirmReset}
                                style={{ flex: 1 }}
                            >
                                <Trash2 size={14} /> {t('tournament.reset')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
