import { useNavigate } from 'react-router-dom';
import { ChevronRight, Hourglass, Trophy, Target } from 'lucide-react';
import { useI18n } from '../i18n.jsx';
import { prizeLines, prizePool } from '../prize.js';

function winnerPrize(tournament) {
    const pool = prizePool(tournament);
    if (!pool) return 0;
    const mode = tournament.settings.distributionMode || 'winner_100';
    const rounds = [...tournament.rounds].reverse();
    const hasRunner = rounds.length > 0 && rounds[0][0]?.player1 && rounds[0][0]?.player2;
    const hasSemis = rounds.length > 1 && rounds[1].some((m) => m.winner && m.player1 && m.player2);
    let winnerShare = 1;
    let totalShares = 1;
    if (mode === 'split_70_30') {
        winnerShare = 0.7;
    } else if (mode === 'split_50_30_20') {
        winnerShare = 0.5;
        totalShares = hasSemis ? 1 : 0.8;
    } else if (mode === 'custom' && tournament.settings.distributionValues) {
        const vals = tournament.settings.distributionValues;
        winnerShare = vals[0] / 100;
        totalShares = winnerShare
            + (hasRunner && vals[1] > 0 ? vals[1] / 100 : 0)
            + (hasSemis && vals[2] > 0 ? vals[2] / 100 : 0);
    }
    return pool * (winnerShare / totalShares);
}

function Players({ match }) {
    return (
        <span className="match-card-players">
            <span>{match.player1?.name || 'TBD'}</span>
            <span>{match.player2?.name || 'TBD'}</span>
        </span>
    );
}

export default function MobileLobby({ tournament }) {
    const navigate = useNavigate();
    const { t, money } = useI18n();

    if (!tournament) {
        return (
            <div className="phone center-state">
                <Target size={40} />
                <h2 className="display">{t('lobby.waitTournament')}</h2>
                <p className="muted">{t('lobby.waitTournament.text')}</p>
            </div>
        );
    }

    if (tournament.status === 'setup') {
        return (
            <div className="phone center-state">
                <Hourglass size={40} />
                <h2 className="display">{t('lobby.setup')}</h2>
                <p className="muted">{t('lobby.setup.text')}</p>
                <p className="faint" style={{ marginTop: 12 }}>{t('lobby.setup.players', { count: tournament.players?.length || 0 })}</p>
            </div>
        );
    }

    if (tournament.status === 'finished') {
        const prize = winnerPrize(tournament);
        return (
            <div className="phone center-state">
                <Trophy size={44} style={{ color: 'var(--amber)' }} />
                <h2 className="display">{t('lobby.finished')}</h2>
                <p className="eyebrow" style={{ marginTop: 20 }}>{t('lobby.winner')}</p>
                <p className="display" style={{ fontSize: 48, marginTop: 4 }}>{tournament.winner?.name}</p>
                {prize > 0 && <p className="num" style={{ fontSize: 28, color: 'var(--green)', marginTop: 10 }}>{t('lobby.won', { amount: money(prize) })}</p>}
            </div>
        );
    }

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

    const pool = prizePool(tournament);

    return (
        <div className="phone">
            <div className="phone-head">
                <div className="eyebrow">
                    {tournament.type} · {t('lobby.players', { count: tournament.players?.length || 0 })}
                </div>
                <h1 className="display">{tournament.name || t('tournament.bracket')}</h1>
                {pool > 0 && (
                    <div className="spread" style={{ marginTop: 12 }}>
                        <span className="muted">{t('tournament.prizePool')}</span>
                        <span className="num" style={{ fontSize: 24 }}>{money(pool)}</span>
                    </div>
                )}
                {pool > 0 && (
                    <div className="setting-desc">
                        {prizeLines(tournament).map((line) => `${t('tournament.place', { place: line.place })}: ${money(line.amount)}`).join(' · ')}
                    </div>
                )}
            </div>

            {activeMatches.length > 0 && (
                <section className="lobby-section">
                    <div className="eyebrow"><span className="badge badge-live">{t('header.status.active')}</span> {t('lobby.activeMatches')}</div>
                    <div className="match-list">
                        {activeMatches.map((match) => (
                            <div key={match.id}>
                                <div className="match-card" style={{ cursor: 'default' }}>
                                    <Players match={match} />
                                    <span className="num" style={{ fontSize: 22 }}>{match.legs?.player1 ?? 0}–{match.legs?.player2 ?? 0}</span>
                                </div>
                                <div className="match-actions">
                                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/mobile/match/${match.id}`)}>
                                        {t('lobby.score')}
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/live/${match.id}`)}>
                                        {t('lobby.watch')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {waitingMatches.length > 0 && (
                <section className="lobby-section">
                    <div className="eyebrow">{t('lobby.waitingMatches')}</div>
                    <div className="match-list">
                        {waitingMatches.map((match) => (
                            <button
                                key={match.id}
                                className="match-card"
                                onClick={() => navigate(`/mobile/match/${match.id}`)}
                                id={`mobile-match-${match.id}`}
                            >
                                <Players match={match} />
                                <span className="badge">{t('lobby.ready')}</span>
                                <ChevronRight size={18} className="match-card-chevron" />
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {finishedMatches.length > 0 && (
                <section className="lobby-section">
                    <div className="eyebrow">{t('lobby.finishedMatches')}</div>
                    <div className="match-list">
                        {finishedMatches.slice(-4).map((match) => (
                            <button key={match.id} className="match-card" onClick={() => navigate(`/live/${match.id}`)}>
                                <Players match={match} />
                                <span className="setting-desc">{match.winner?.name}</span>
                                <span className="num" style={{ fontSize: 22 }}>{match.legs?.player1 ?? 0}–{match.legs?.player2 ?? 0}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {activeMatches.length === 0 && waitingMatches.length === 0 && (
                <div className="center-state" style={{ paddingTop: 32 }}>
                    <p>{t('lobby.none')}</p>
                    <p className="muted">{t('lobby.none.text')}</p>
                </div>
            )}
        </div>
    );
}
