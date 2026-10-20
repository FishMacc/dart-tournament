import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket.js';
import { ChevronLeft, Lock, Play, SlidersHorizontal, Trophy } from 'lucide-react';
import ScorePad from '../components/ScorePad.jsx';
import { useI18n } from '../i18n.jsx';

function ErrorFallback({ error }) {
    const { t } = useI18n();
    return (
        <div className="phone center-state">
            <h2 className="display">{t('scoring.error')}</h2>
            <p className="muted">{t('scoring.error.text')}</p>
            <pre className="note" style={{ textAlign: 'left', overflow: 'auto', margin: '16px 0' }}>
                {error?.toString()}
            </pre>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
                {t('scoring.reload')}
            </button>
        </div>
    );
}

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
        if (this.state.hasError) return <ErrorFallback error={this.state.error} />;
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
    const { t, errorText } = useI18n();

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
                setPinError(t('scoring.wrongPin'));
                setPinInput('');
            }
        });
    };

    const handleStartMatch = () => {
        socket.emit('start_match', { matchId }, (res) => {
            if (!res.success) setPinError(errorText(res));
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
                setPinError(errorText(res));
                setAuthorized(false);
            } else if (res.error) {
                alert(errorText(res));
            }
        });
    };

    const handleUndo = () => {
        socket.emit('undo_throw', { matchId }, (res) => {
            if (res.code === 'UNAUTHORIZED') {
                sessionStorage.removeItem(pinStorageKey);
                setPinError(errorText(res));
                setAuthorized(false);
            } else if (!res.success) {
                alert(errorText(res));
            } else {
                setLastThrow(null);
                setCheckout(res.checkout);
            }
        });
    };

    // --- Loading ---
    if (!match) {
        return <p className="phone center-state muted">{t('scoring.loading')}</p>;
    }

    // --- Finished ---
    if (match.status === 'finished') {
        return (
            <div className="phone center-state">
                <Trophy size={44} style={{ color: 'var(--amber)' }} />
                <h2 className="display">{t('scoring.finished')}</h2>
                <p className="eyebrow" style={{ marginTop: 20 }}>{t('scoring.winner')}</p>
                <p className="display" style={{ fontSize: 48, marginTop: 4 }}>{match.winner?.name}</p>
                <button className="btn btn-secondary" style={{ marginTop: 28 }} onClick={() => navigate('/mobile')} id="btn-back-to-lobby">
                    <ChevronLeft size={16} /> {t('scoring.backToLobby')}
                </button>
            </div>
        );
    }

    // --- PIN Entry ---
    if (!authorized) {
        if (!requiresPin) {
            return <p className="phone center-state muted">{t('scoring.connecting')}</p>;
        }

        return (
            <div className="phone">
                <div className="center-state" style={{ paddingBottom: 24 }}>
                    <Lock size={36} />
                    <h2 className="display">{t('scoring.enterPin')}</h2>
                    <p className="muted">{match.player1?.name} vs {match.player2?.name}</p>
                    <p className="faint" style={{ fontSize: 14 }}>{t('scoring.pinHint')}</p>
                </div>

                <form onSubmit={handlePinSubmit} className="stack">
                    <input
                        className="input pin-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="····"
                        aria-label={t('scoring.enterPin')}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        autoFocus
                        id="input-match-pin"
                    />
                    {pinError && <div className="alert-error">{pinError}</div>}
                    <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={pinInput.length !== 4} id="btn-verify-pin">
                        {t('scoring.confirm')}
                    </button>
                    <button type="button" className="btn btn-ghost btn-block" onClick={() => navigate('/mobile')}>
                        <ChevronLeft size={16} /> {t('scoring.back')}
                    </button>
                </form>
            </div>
        );
    }

    // --- Scoring Interface (authorized) ---
    const turnCount = match.currentTurnThrows || 0;
    const throwerThrows = match.throws?.[match.currentThrower] || [];
    const currentTurnDarts = turnCount > 0 ? throwerThrows.slice(-turnCount) : [];
    const turnTotal = currentTurnDarts.reduce((sum, d) => sum + (d.isBust ? 0 : d.score), 0);

    return (
        <div className="phone">
            <div className="scoring-top">
                <button className="icon-btn" onClick={() => navigate('/mobile')} aria-label={t('scoring.back')}>
                    <ChevronLeft size={18} />
                </button>
                <span className="title">{match.player1?.name} vs {match.player2?.name}</span>
                <button className="icon-btn" onClick={() => setShowSettings(true)} aria-label={t('scoring.settings')}>
                    <SlidersHorizontal size={16} />
                </button>
            </div>

            {showSettings && (
                <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <h3 className="display" style={{ fontSize: 28, marginBottom: 8 }}>{t('scoring.settings')}</h3>
                        <div className="setting-row">
                            <div>
                                <div className="setting-label">{t('scoring.checkoutHints')}</div>
                                <div className="setting-desc">{t('scoring.checkoutHints.desc')}</div>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={showCheckoutHints}
                                    onChange={(e) => setShowCheckoutHints(e.target.checked)}
                                    aria-label={t('scoring.checkoutHints')}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={() => setShowSettings(false)}>{t('scoring.done')}</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="score-rows">
                {['player1', 'player2'].map((key) => {
                    const isThrowing = match.currentThrower === key;
                    return (
                        <div key={key} className={`score-row ${isThrowing ? 'is-throwing' : ''}`}>
                            <span className="indicator" />
                            <div className="who">
                                <div className="name">{match[key]?.name}</div>
                                <div className="sub">
                                    <span>{t('scoring.legs', { n: match.legs?.[key] || 0 })}</span>
                                    {isThrowing && showCheckoutHints && checkout && <span className="checkout">{checkout}</span>}
                                </div>
                            </div>
                            <span className="score num">{match.scores?.[key]}</span>
                        </div>
                    );
                })}
            </div>

            <div className="turn" aria-label={t('scoring.turn')}>
                {[0, 1, 2].map((i) => {
                    const dart = currentTurnDarts[i];
                    const isNext = i === turnCount && turnCount < 3 && match.status === 'active';
                    return (
                        <div key={i} className={`dart-slot num ${dart?.isBust ? 'is-bust' : ''} ${isNext ? 'is-next' : ''}`}>
                            <span className="slot-label">{t('scoring.dart', { n: i + 1 })}</span>
                            {dart ? (dart.isBust ? 'BUST' : getThrowLabel(dart.value, dart.multiplier)) : <span className="faint">–</span>}
                        </div>
                    );
                })}
                <div className="turn-total num">
                    <span className="slot-label" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--faint)', fontStretch: '100%' }}>{t('scoring.total')}</span>
                    {turnTotal}
                </div>
            </div>

            {match.status === 'waiting' && (
                <div className="panel panel-body" style={{ marginBottom: 12, textAlign: 'center' }}>
                    <p className="muted" style={{ marginBottom: 12 }}>{t('scoring.ready')}</p>
                    <button className="btn btn-primary btn-lg btn-block" onClick={handleStartMatch} id="btn-mobile-start-match">
                        <Play size={16} /> {t('scoring.start')}
                    </button>
                    {pinError && <div className="alert-error" style={{ marginTop: 12 }}>{pinError}</div>}
                </div>
            )}

            <ScorePad
                onThrow={handleThrow}
                onUndo={handleUndo}
                disabled={match.status !== 'active'}
                canUndo={match.throws?.player1?.length > 0 || match.throws?.player2?.length > 0}
            />

            {lastThrow && (
                <div className={`throw-status ${lastThrow.isBust ? 'is-bust' : lastThrow.isFinish ? 'is-finish' : ''}`} role="status">
                    {lastThrow.isBust ? t('scoring.bust') : lastThrow.isFinish ? t('scoring.checkoutDone') : `${lastThrow.label} · ${lastThrow.score}`}
                </div>
            )}
        </div>
    );
}

function getThrowLabel(value, multiplier) {
    if (value === 0) return 'Miss';
    const prefix = multiplier === 1 ? 'S' : multiplier === 2 ? 'D' : 'T';
    if (value === 25) return multiplier === 2 ? 'BULL' : '25';
    return `${prefix}${value}`;
}
