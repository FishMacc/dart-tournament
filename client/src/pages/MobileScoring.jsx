import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket.js';
import ScorePad from '../components/ScorePad.jsx';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>
                    <h2>⚠️ Ein Fehler ist aufgetreten</h2>
                    <p className="text-muted mt-1">Bitte lade die Seite neu.</p>
                    <pre style={{ textAlign: 'left', background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', overflow: 'auto', marginTop: '1rem', fontSize: '0.8rem' }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button className="btn btn-primary mt-3" onClick={() => window.location.reload()}>
                        Neuladen
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function MobileScoring(props) {
    return (
        <ErrorBoundary>
            <MobileScoringContent {...props} />
        </ErrorBoundary>
    );
}

function MobileScoringContent({ tournament, isHost }) {
    const { matchId } = useParams();
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [lastThrow, setLastThrow] = useState(null);
    const [checkout, setCheckout] = useState(null);
    const [authorized, setAuthorized] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');

    // UI State
    const [showSettings, setShowSettings] = useState(false);
    const [showCheckoutHints, setShowCheckoutHints] = useState(true);

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

    const requiresPin = tournament?.settings?.requirePin !== false;
    const pinStorageKey = `dart-pin-${matchId}`;

    // (Re-)authorize on load and after every reconnect: the server only knows
    // socket ids, so a reconnected phone has to present its PIN again.
    useEffect(() => {
        if (!tournament) return;
        const authorize = () => {
            if (isHost) {
                setAuthorized(true);
                return;
            }
            const pin = requiresPin ? sessionStorage.getItem(pinStorageKey) : '';
            if (pin === null) return;
            socket.emit('verify_pin', { matchId, pin }, (res) => {
                if (res.success && res.authorized) {
                    setAuthorized(true);
                } else {
                    sessionStorage.removeItem(pinStorageKey);
                    setAuthorized(false);
                }
            });
        };
        authorize();
        socket.on('connect', authorize);
        return () => socket.off('connect', authorize);
    }, [matchId, requiresPin, isHost, pinStorageKey, !!tournament]);

    const handlePinSubmit = (e) => {
        e.preventDefault();
        socket.emit('verify_pin', { matchId, pin: pinInput }, (res) => {
            if (res.success && res.authorized) {
                sessionStorage.setItem(pinStorageKey, pinInput);
                setAuthorized(true);
                setPinError('');
            } else {
                setPinError('Falscher PIN! Bitte erneut versuchen.');
                setPinInput('');
            }
        });
    };

    const handleStartMatch = () => {
        socket.emit('start_match', { matchId }, (res) => {
            if (!res.success) setPinError(res.error);
        });
    };

    const handleThrow = (value, multiplier) => {
        socket.emit('throw_dart', { matchId, value, multiplier }, (res) => {
            if (res.success) {
                const label = getThrowLabel(value, multiplier);
                const score = value * multiplier;

                setLastThrow({
                    label,
                    score,
                    isBust: res.throwResult.isBust,
                    isFinish: res.throwResult.isFinish,
                });
                setCheckout(res.checkout);
            } else if (res.code === 'UNAUTHORIZED') {
                sessionStorage.removeItem(pinStorageKey);
                setPinError(res.error);
                setAuthorized(false);
            } else if (res.error) {
                alert(res.error);
            }
        });
    };

    // --- Loading ---
    if (!match) {
        return (
            <div className="scoring-container animate-fade-in text-center" style={{ paddingTop: '4rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}>🎯</div>
                <p className="text-muted">Spiel wird geladen...</p>
            </div>
        );
    }

    // --- Finished ---
    if (match.status === 'finished') {
        return (
            <div className="scoring-container animate-fade-in text-center" style={{ paddingTop: '4rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
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

    // --- PIN Entry ---
    if (!authorized) {
        if (!requiresPin) {
            // Should auto-authorize, show loading
            return (
                <div className="scoring-container animate-fade-in text-center" style={{ paddingTop: '4rem' }}>
                    <p className="text-muted">Verbindung wird hergestellt...</p>
                </div>
            );
        }

        return (
            <div className="scoring-container animate-fade-in" style={{ paddingTop: '3rem' }}>
                <div className="text-center mb-2">
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔒</div>
                    <h2>Match-PIN eingeben</h2>
                    <p className="text-muted mt-1" style={{ fontSize: '0.9rem' }}>
                        {match.player1?.name} vs {match.player2?.name}
                    </p>
                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                        Der PIN wird auf dem Host-Bildschirm angezeigt
                    </p>
                </div>

                <form onSubmit={handlePinSubmit}>
                    <input
                        className="input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="● ● ● ●"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        autoFocus
                        id="input-match-pin"
                        style={{
                            textAlign: 'center',
                            fontSize: '2rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            letterSpacing: '0.5em',
                            padding: '1rem',
                            marginBottom: '1rem',
                        }}
                    />

                    {pinError && (
                        <div className="alert-error" style={{ marginBottom: '1rem' }}>
                            {pinError}
                        </div>
                    )}

                    <button
                        className="btn btn-primary btn-lg"
                        type="submit"
                        style={{ width: '100%' }}
                        disabled={pinInput.length !== 4}
                        id="btn-verify-pin"
                    >
                        Bestätigen
                    </button>
                </form>

                <div className="mt-2">
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate('/mobile')}
                        style={{ width: '100%' }}
                    >
                        ← Zurück
                    </button>
                </div>
            </div>
        );
    }

    // --- Scoring Interface (authorized) ---
    const currentThrowerName =
        match.currentThrower === 'player1' ? match.player1?.name : match.player2?.name;

    // Compute current turn darts
    const turnCount = match.currentTurnThrows || 0;
    const throwerKey = match.currentThrower;
    const throwerThrows = match.throws?.[throwerKey] || [];
    const currentTurnDarts = turnCount > 0 ? throwerThrows.slice(-turnCount) : [];

    // Build the 3 dart slot data
    const dartSlots = [0, 1, 2].map((i) => {
        if (i < currentTurnDarts.length) {
            const t = currentTurnDarts[i];
            return {
                filled: true,
                label: getThrowLabel(t.value, t.multiplier),
                score: t.score,
                isBust: t.isBust,
            };
        }
        return { filled: false, label: '—', score: null, isBust: false };
    });

    const turnTotal = currentTurnDarts.reduce((sum, t) => sum + (t.isBust ? 0 : t.score), 0);

    return (
        <div className="scoring-container animate-fade-in">
            {/* ═══════ TOP HEADER BAR ═══════ */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0',
                marginBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
            }}>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate('/mobile')}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                >
                    ←
                </button>
                <span style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                }}>
                    {match.player1?.name} vs {match.player2?.name}
                </span>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowSettings(true)}
                    style={{ fontSize: '1.1rem', padding: '0.4rem 0.6rem', lineHeight: 1 }}
                >
                    ⚙️
                </button>
            </div>

            {/* ═══════ SETTINGS MODAL ═══════ */}
            {showSettings && (
                <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="mb-2">⚙️ Einstellungen</h3>
                        <div className="setting-row" style={{
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: '0.75rem',
                        }}>
                            <div className="setting-info">
                                <span className="setting-label">Checkout-Hinweise</span>
                                <span className="setting-desc">Vorschläge für Finish anzeigen</span>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={showCheckoutHints}
                                    onChange={(e) => setShowCheckoutHints(e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <button
                            className="btn btn-primary mt-3"
                            style={{ width: '100%' }}
                            onClick={() => setShowSettings(false)}
                        >
                            Fertig
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════ SCORE CARDS ═══════ */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                marginBottom: '0.75rem',
            }}>
                {['player1', 'player2'].map((pKey) => {
                    const isActive = match.currentThrower === pKey;
                    const player = match[pKey];
                    const score = match.scores?.[pKey];
                    const legs = match.legs?.[pKey] || 0;
                    return (
                        <div key={pKey} style={{
                            background: isActive
                                ? `linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.12), rgba(var(--accent-secondary-rgb), 0.08))`
                                : 'var(--bg-card)',
                            border: isActive
                                ? '2px solid rgba(var(--accent-primary-rgb), 0.5)'
                                : '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '0.75rem',
                            textAlign: 'center',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                        }}>
                            {isActive && (
                                <div style={{
                                    position: 'absolute', top: '-6px', left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'var(--gradient-accent)',
                                    color: '#fff', fontSize: '0.55rem', fontWeight: 700,
                                    padding: '2px 10px', borderRadius: 'var(--radius-full)',
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                }}>
                                    Am Wurf
                                </div>
                            )}
                            <div style={{
                                fontSize: '0.8rem', fontWeight: 600,
                                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                                marginBottom: '0.2rem',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {player?.name}
                            </div>
                            <div style={{
                                fontSize: '2.2rem', fontWeight: 900,
                                fontFamily: 'var(--font-display)',
                                color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                                lineHeight: 1.1,
                            }}>
                                {score}
                            </div>
                            {legs > 0 && (
                                <div style={{
                                    fontSize: '0.7rem', color: 'var(--text-muted)',
                                    marginTop: '0.15rem',
                                }}>
                                    Legs: {legs}
                                </div>
                            )}
                            {isActive && showCheckoutHints && checkout && (
                                <div style={{
                                    fontSize: '0.75rem', marginTop: '0.3rem',
                                    color: 'var(--accent-success)', fontWeight: 600,
                                }}>
                                    🎯 {checkout}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ═══════ DART SLOTS (3 Fields) ═══════ */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.75rem',
                marginBottom: '0.75rem',
            }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '0.5rem',
                }}>
                    <span style={{
                        fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                        🎯 {currentThrowerName} — Runde
                    </span>
                    {turnCount > 0 && (
                        <span style={{
                            fontSize: '0.85rem', fontWeight: 800,
                            color: 'var(--accent-primary)',
                            fontFamily: 'var(--font-mono)',
                        }}>
                            = {turnTotal}
                        </span>
                    )}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0.5rem',
                }}>
                    {dartSlots.map((slot, i) => {
                        const isNext = i === turnCount && turnCount < 3;
                        return (
                            <div
                                key={i}
                                style={{
                                    background: slot.filled
                                        ? slot.isBust
                                            ? 'rgba(248, 81, 73, 0.12)'
                                            : `rgba(var(--accent-primary-rgb), 0.1)`
                                        : isNext
                                            ? `rgba(var(--accent-primary-rgb), 0.04)`
                                            : 'rgba(255,255,255,0.02)',
                                    border: slot.filled
                                        ? slot.isBust
                                            ? '2px solid rgba(248, 81, 73, 0.4)'
                                            : `2px solid rgba(var(--accent-primary-rgb), 0.3)`
                                        : isNext
                                            ? `2px dashed rgba(var(--accent-primary-rgb), 0.3)`
                                            : '2px solid rgba(255,255,255,0.04)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.6rem 0.3rem',
                                    textAlign: 'center',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    minHeight: '60px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div style={{
                                    fontSize: '0.55rem', fontWeight: 700,
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    marginBottom: '0.15rem',
                                    letterSpacing: '0.06em',
                                }}>
                                    Dart {i + 1}
                                </div>

                                <div style={{
                                    fontSize: slot.filled ? '1.2rem' : '1rem',
                                    fontWeight: 800,
                                    fontFamily: 'var(--font-display)',
                                    color: slot.filled
                                        ? slot.isBust
                                            ? 'var(--accent-danger)'
                                            : 'var(--text-primary)'
                                        : isNext
                                            ? `rgba(var(--accent-primary-rgb), 0.4)`
                                            : 'rgba(255,255,255,0.08)',
                                }}>
                                    {slot.filled
                                        ? slot.isBust ? '💥' : slot.label
                                        : isNext ? '?' : '—'
                                    }
                                </div>

                                {slot.filled && !slot.isBust && (
                                    <div style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--text-muted)',
                                        fontFamily: 'var(--font-mono)',
                                        marginTop: '0.1rem',
                                    }}>
                                        {slot.score} pts
                                    </div>
                                )}
                                {slot.isBust && (
                                    <div style={{
                                        fontSize: '0.6rem',
                                        color: 'var(--accent-danger)',
                                        marginTop: '0.1rem', fontWeight: 700,
                                    }}>
                                        BUST
                                    </div>
                                )}

                                {isNext && (
                                    <div style={{
                                        position: 'absolute', inset: '-2px',
                                        borderRadius: 'var(--radius-md)',
                                        border: `2px solid rgba(var(--accent-primary-rgb), 0.2)`,
                                        animation: 'pulse 2s ease-in-out infinite',
                                        pointerEvents: 'none',
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {match.status === 'waiting' && (
                <div className="card text-center" style={{ padding: '1.25rem', marginBottom: '0.75rem' }}>
                    <p className="text-muted" style={{ marginBottom: '0.75rem' }}>Das Spiel ist bereit.</p>
                    <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleStartMatch} id="btn-mobile-start-match">
                        ▶ Spiel starten
                    </button>
                    {pinError && <div className="alert-error" style={{ marginTop: '0.75rem' }}>{pinError}</div>}
                </div>
            )}

            {/* ═══════ SCORE PAD ═══════ */}
            <ScorePad
                onThrow={handleThrow}
                onUndo={() => {
                    socket.emit('undo_throw', { matchId }, (res) => {
                        if (res.code === 'UNAUTHORIZED') {
                            sessionStorage.removeItem(pinStorageKey);
                            setPinError(res.error);
                            setAuthorized(false);
                        } else if (!res.success) alert(res.error);
                        else {
                            setLastThrow(null);
                            setCheckout(res.checkout);
                        }
                    });
                }}
                disabled={match.status !== 'active'}
                canUndo={match.throws?.player1?.length > 0 || match.throws?.player2?.length > 0}
            />

            {/* ═══════ STATUS BAR ═══════ */}
            {lastThrow && (
                <div style={{
                    textAlign: 'center', padding: '0.5rem',
                    fontSize: '0.85rem', fontWeight: 600,
                    color: lastThrow.isBust ? 'var(--accent-danger)'
                        : lastThrow.isFinish ? 'var(--accent-success)'
                            : 'var(--text-muted)',
                    background: lastThrow.isBust ? 'rgba(248,81,73,0.08)'
                        : lastThrow.isFinish ? 'rgba(63,185,80,0.08)'
                            : 'transparent',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '0.5rem',
                }}>
                    {lastThrow.isBust ? '💥 BUST!' : lastThrow.isFinish ? '🎉 FINISH!' : `${lastThrow.label} (${lastThrow.score})`}
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
