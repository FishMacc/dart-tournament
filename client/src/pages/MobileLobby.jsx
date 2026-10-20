import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';

export default function MobileLobby({ tournament }) {
    const navigate = useNavigate();
    const { t, money } = useI18n();

    if (!tournament) {
        return (
            <div className="scoring-container animate-fade-in text-center" style={{ paddingTop: '4rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.6 }}>🎯</div>
                <h2>{t('lobby.waitTournament')}</h2>
                <p className="text-muted mt-1">
                    {t('lobby.waitTournament.text')}
                </p>
            </div>
        );
    }

    if (tournament.status === 'setup') {
        return (
            <div className="scoring-container animate-fade-in text-center" style={{ paddingTop: '4rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                <h2>{t('lobby.setup')}</h2>
                <p className="text-muted mt-1">
                    {t('lobby.setup.text')}
                </p>
                <p className="mt-2 text-muted" style={{ fontSize: '0.85rem' }}>
                    {t('lobby.setup.players', { count: tournament.players?.length || 0 })}
                </p>
            </div>
        );
    }

    if (tournament.status === 'finished') {
        return (
            <div className="scoring-container animate-fade-in text-center" style={{ paddingTop: '4rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏆</div>
                <h2>{t('lobby.finished')}</h2>
                <p className="mt-1" style={{ fontSize: '1.3rem', color: 'var(--accent-primary)' }}>
                    {t('lobby.winner')} <strong>{tournament.winner?.name}</strong>
                </p>
                {tournament.settings?.entryFee > 0 && (() => {
                    const pool = tournament.settings.entryFee * (tournament.players?.length || 0);
                    const mode = tournament.settings.distributionMode || 'winner_100';
                    let winnerShare = 1;
                    let totalShares = 1;
                    if (mode === 'split_70_30') { winnerShare = 0.7; totalShares = 1; }
                    else if (mode === 'split_50_30_20') {
                        winnerShare = 0.5;
                        // Check if semi-finalists exist
                        const rounds = [...tournament.rounds].reverse();
                        const hasSemis = rounds.length > 1 && rounds[1].some(m => m.winner && m.player1 && m.player2);
                        totalShares = hasSemis ? 1 : 0.8;
                    } else if (mode === 'custom' && tournament.settings.distributionValues) {
                        const vals = tournament.settings.distributionValues;
                        winnerShare = vals[0] / 100;
                        const rounds = [...tournament.rounds].reverse();
                        const hasRunner = rounds.length > 0 && rounds[0][0]?.player1 && rounds[0][0]?.player2;
                        const hasSemis = rounds.length > 1 && rounds[1].some(m => m.winner && m.player1 && m.player2);
                        totalShares = (winnerShare)
                            + (hasRunner && vals[1] > 0 ? vals[1] / 100 : 0)
                            + (hasSemis && vals[2] > 0 ? vals[2] / 100 : 0);
                    }
                    const winnerPrize = pool * (winnerShare / totalShares);
                    return (
                        <p className="mt-2" style={{ fontSize: '1.1rem', color: '#eab308', fontWeight: 700 }}>
                            {t('lobby.won', { amount: money(winnerPrize) })}
                        </p>
                    );
                })()}
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
                    {tournament.type} • {t('lobby.players', { count: tournament.players?.length || 0 })}
                    {tournament.name && ` • ${tournament.name}`}
                </p>

                {/* Prize Pool Display */}
                {tournament.settings?.entryFee > 0 && (
                    <div className="mt-2 text-center animate-scale-in">
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'rgba(234, 179, 8, 0.1)',
                            border: '1px solid rgba(234, 179, 8, 0.3)',
                            borderRadius: 'var(--radius-full)',
                            padding: '0.3rem 1rem',
                            color: '#eab308',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                        }}>
                            <span>{t('tournament.prizePool')}</span>
                            <span style={{ fontSize: '1.1rem' }}>
                                {money(tournament.settings.entryFee * (tournament.players?.length || 0))}
                            </span>
                        </div>
                    </div>
                )}

                {/* Prize Breakdown */}
                {tournament.settings?.entryFee > 0 && (
                    <div className="mt-1 text-muted animate-fade-in" style={{ fontSize: '0.8rem' }}>
                        {(() => {
                            const pool = tournament.settings.entryFee * (tournament.players?.length || 0);
                            const mode = tournament.settings.distributionMode || 'winner_100';

                            if (pool === 0) return null;

                            if (mode === 'winner_100') {
                                return <span>1.: {money(pool)}</span>;
                            } else if (mode === 'split_70_30') {
                                return (
                                    <span>
                                        1.: {money(pool * 0.7)} • 2.: {money(pool * 0.3)}
                                    </span>
                                );
                            } else if (mode === 'split_50_30_20') {
                                return (
                                    <span>
                                        1.: {money(pool * 0.5)} • 2.: {money(pool * 0.3)} • 3./4.: {money(pool * 0.2)}
                                    </span>
                                );
                            } else if (mode === 'custom' && tournament.settings.distributionValues) {
                                const vals = tournament.settings.distributionValues;
                                return (
                                    <span>
                                        {vals[0] > 0 && `1.: ${money(pool * vals[0] / 100)}`}
                                        {vals[1] > 0 && ` • 2.: ${money(pool * vals[1] / 100)}`}
                                        {vals[2] > 0 && ` • 3./4.: ${money(pool * vals[2] / 100)}`}
                                    </span>
                                );
                            }
                        })()}
                    </div>
                )}
            </div>

            {/* Active Matches */}
            {activeMatches.length > 0 && (
                <div className="mb-2">
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-live" style={{ fontSize: '0.7rem' }}>LIVE</span>
                        {t('lobby.activeMatches')}
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
                                        {t('lobby.score')}
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        style={{ flex: 1 }}
                                        onClick={() => handleWatchLive(match.id)}
                                    >
                                        {t('lobby.watch')}
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
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>{t('lobby.waitingMatches')}</h3>
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
                                <span className="badge badge-warning">{t('lobby.ready')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Finished Matches */}
            {finishedMatches.length > 0 && (
                <div className="mb-2">
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>{t('lobby.finishedMatches')}</h3>
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
                    <p className="text-muted">{t('lobby.none')}</p>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {t('lobby.none.text')}
                    </p>
                </div>
            )}
        </div>
    );
}
