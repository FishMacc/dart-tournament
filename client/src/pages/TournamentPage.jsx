import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Eye, EyeOff, Trash2, Play, Unlock, Tv } from 'lucide-react';
import socket from '../socket.js';
import Bracket from '../components/Bracket.jsx';
import QRCodeDisplay from '../components/QRCodeDisplay.jsx';
import StatsBoard from '../components/StatsBoard.jsx';
import { useI18n } from '../i18n.jsx';
import { prizeLines, prizePool } from '../prize.js';

const CONFETTI_COLORS = ['#e8402f', '#35a862', '#f2f0ea'];

function LiveBoard({ match, pin, requiresPin, hidePins, onWatch, t }) {
    return (
        <div className="board">
            {['player1', 'player2'].map((key) => (
                <div key={key} className={`board-row ${match.currentThrower === key ? 'is-throwing' : ''}`}>
                    <span className="indicator" />
                    <span className="name">{match[key]?.name}</span>
                    <span className="legs num" title={t('tournament.legsShort')}>{match.legs?.[key] ?? 0}</span>
                    <span className="score num">{match.scores?.[key]}</span>
                </div>
            ))}
            <div className="board-foot">
                {requiresPin ? (
                    <span className="pin">
                        <span className="pin-label">PIN</span>
                        <span className="pin-value" style={{ fontSize: 20 }}>{hidePins ? '••••' : pin}</span>
                    </span>
                ) : (
                    <span className="no-pin-badge"><Unlock size={13} /> {t('tournament.noPinBadge')}</span>
                )}
                <button className="btn btn-ghost btn-sm" onClick={onWatch}>
                    <Tv size={15} /> {t('tournament.watch')}
                </button>
            </div>
        </div>
    );
}

export default function TournamentPage({ tournament, hostTournament }) {
    const navigate = useNavigate();
    const { t, money, errorText } = useI18n();
    const [hidePins, setHidePins] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [matchError, setMatchError] = useState('');

    // Request host view with PINs on mount
    useEffect(() => {
        socket.emit('request_host_view', {}, () => { });
    }, []);

    useEffect(() => {
        if (tournament?.status !== 'finished') return;
        const end = Date.now() + 3000;
        const interval = setInterval(() => {
            if (Date.now() > end) return clearInterval(interval);
            confetti({ particleCount: 40, spread: 70, startVelocity: 40, origin: { x: Math.random() * 0.6 + 0.2, y: 0.6 }, colors: CONFETTI_COLORS, zIndex: 0 });
        }, 300);
        return () => clearInterval(interval);
    }, [tournament?.status]);

    if (!tournament) return null;

    const requiresPin = tournament.settings?.requirePin !== false;
    const isFinished = tournament.status === 'finished';

    const handleStartMatch = (matchId) => {
        socket.emit('start_match', { matchId }, (res) => {
            if (!res.success) {
                setMatchError(errorText(res));
                setTimeout(() => setMatchError(''), 3000);
            }
        });
    };

    const confirmReset = () => {
        socket.emit('reset_tournament');
        setShowResetConfirm(false);
    };

    const waitingMatches = [];
    const activeMatches = [];
    for (const round of tournament.rounds || []) {
        for (const match of round) {
            if (match.status === 'waiting') waitingMatches.push(match);
            if (match.status === 'active') activeMatches.push(match);
        }
    }

    const pinFor = (matchId) => {
        for (const round of hostTournament?.rounds || []) {
            const match = round.find((m) => m.id === matchId);
            if (match) return match.pin;
        }
        return '····';
    };

    const pool = prizePool(tournament);

    return (
        <div>
            <div className="page-head">
                <div>
                    <div className="eyebrow">{t('tournament.eyebrow')}</div>
                    <h1 className="display page-title">{tournament.name || t('tournament.bracket')}</h1>
                    <div className="meta">
                        <span><strong>{tournament.type}</strong></span>
                        <span>{t('tournament.players', { count: tournament.players?.length || 0 })}</span>
                        <span>{tournament.legsToWin > 1 ? t('setup.legs.bestOf', { n: tournament.legsToWin * 2 - 1 }) : t('setup.legs.single')}</span>
                        {tournament.settings?.doubleOut && <span>{t('setup.doubleOut')}</span>}
                        {!requiresPin && <span>{t('tournament.noPinBadge')}</span>}
                    </div>
                </div>
                <div className="row wrap">
                    {requiresPin && !isFinished && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setHidePins(!hidePins)}>
                            {hidePins ? <><Eye size={15} /> {t('tournament.showPins')}</> : <><EyeOff size={15} /> {t('tournament.hidePins')}</>}
                        </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => setShowResetConfirm(true)} id="btn-reset-tournament">
                        <Trash2 size={15} /> {t('tournament.reset')}
                    </button>
                </div>
            </div>

            {isFinished && (
                <div style={{ marginBottom: 32 }}>
                    <StatsBoard tournament={tournament} />
                </div>
            )}

            <div className="host-grid">
                <div className="host-main">
                    {activeMatches.length > 0 && (
                        <section>
                            <div className="section-title">
                                <span className="badge badge-live">{t('header.status.active')}</span>
                                <span className="eyebrow">{t('tournament.activeMatches')}</span>
                            </div>
                            {activeMatches.map((match) => (
                                <LiveBoard
                                    key={match.id}
                                    match={match}
                                    pin={pinFor(match.id)}
                                    requiresPin={requiresPin}
                                    hidePins={hidePins}
                                    onWatch={() => navigate(`/live/${match.id}`)}
                                    t={t}
                                />
                            ))}
                        </section>
                    )}

                    {waitingMatches.length > 0 && (
                        <section>
                            <div className="section-title">
                                <span className="eyebrow">{t('tournament.waitingMatches')}</span>
                            </div>
                            <div className="queue">
                                {waitingMatches.map((match) => (
                                    <div key={match.id} className="queue-item">
                                        <span className="queue-players">
                                            {match.player1?.name || 'TBD'}
                                            <span className="vs">vs</span>
                                            {match.player2?.name || 'TBD'}
                                        </span>
                                        {requiresPin ? (
                                            <span className="pin">
                                                <span className="pin-label">PIN</span>
                                                <span className="pin-value">{hidePins ? '••••' : pinFor(match.id)}</span>
                                            </span>
                                        ) : (
                                            <span className="no-pin-badge"><Unlock size={13} /> {t('tournament.open')}</span>
                                        )}
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleStartMatch(match.id)}
                                            id={`btn-start-match-${match.id}`}
                                        >
                                            <Play size={14} /> {t('tournament.startMatch')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section>
                        <div className="section-title">
                            <span className="eyebrow">{t('tournament.bracket')}</span>
                        </div>
                        <Bracket rounds={tournament.rounds} onWatchLive={(id) => navigate(`/live/${id}`)} />
                    </section>
                </div>

                <aside className="host-aside">
                    {!isFinished && (
                        <section className="panel">
                            <div className="panel-head"><span className="eyebrow">{t('qr.title')}</span></div>
                            <div className="panel-body"><QRCodeDisplay /></div>
                        </section>
                    )}
                    {pool > 0 && (
                        <section className="panel">
                            <div className="panel-head"><span className="eyebrow">{t('tournament.prizePool')}</span></div>
                            <div className="panel-body">
                                <div className="num prize-total">{money(pool)}</div>
                                <div className="prize-lines">
                                    {prizeLines(tournament).map((line) => (
                                        <div key={line.place}>
                                            <span>{t('tournament.place', { place: line.place })} · {line.share}%</span>
                                            <span>{money(line.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                </aside>
            </div>

            {matchError && <div className="toast" role="alert">{matchError}</div>}

            {showResetConfirm && (
                <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <h3 className="display" style={{ fontSize: 28, marginBottom: 10 }}>{t('tournament.resetTitle')}</h3>
                        <p className="muted">{t('tournament.resetText')}</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowResetConfirm(false)}>
                                {t('tournament.cancel')}
                            </button>
                            <button className="btn btn-danger solid" onClick={confirmReset}>
                                <Trash2 size={15} /> {t('tournament.reset')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
