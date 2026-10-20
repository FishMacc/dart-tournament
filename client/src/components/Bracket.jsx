import { useI18n } from '../i18n.jsx';

export default function Bracket({ rounds, onWatchLive }) {
    const { t } = useI18n();
    if (!rounds || rounds.length === 0) return null;

    const getRoundName = (roundIndex, totalRounds) => {
        if (roundIndex === totalRounds - 1) return t('bracket.final');
        if (roundIndex === totalRounds - 2) return t('bracket.semi');
        if (roundIndex === totalRounds - 3) return t('bracket.quarter');
        return t('bracket.round', { n: roundIndex + 1 });
    };

    const playerClass = (match, key) => {
        const player = match[key];
        if (!player) return 'bracket-match-player tbd';
        if (match.status !== 'finished' || !match.winner) return 'bracket-match-player';
        return `bracket-match-player ${match.winner.id === player.id ? 'winner' : 'loser'}`;
    };

    return (
        <div className="bracket-container">
            <div className="bracket">
                {rounds.map((round, roundIndex) => (
                    <div key={roundIndex} className="bracket-round">
                        <div className="eyebrow bracket-round-title">{getRoundName(roundIndex, rounds.length)}</div>
                        <div className="bracket-round-matches">
                            {round.map((match) => {
                                if (match.status === 'bye') {
                                    return (
                                        <div key={match.id} className="bracket-match bye">
                                            <div className="bracket-match-player">
                                                <span>{match.winner?.name || t('bracket.bye')}</span>
                                                <span className="eyebrow" style={{ fontSize: 10 }}>BYE</span>
                                            </div>
                                        </div>
                                    );
                                }

                                const isActive = match.status === 'active';
                                return (
                                    <div
                                        key={match.id}
                                        className={`bracket-match ${isActive ? 'active' : ''} ${match.status === 'finished' ? 'finished' : ''}`}
                                        onClick={() => isActive && onWatchLive && onWatchLive(match.id)}
                                    >
                                        {['player1', 'player2'].map((key) => (
                                            <div key={key} className={playerClass(match, key)}>
                                                <span>{match[key]?.name || 'TBD'}</span>
                                                <span className="bracket-match-score">
                                                    {match[key] ? (match.legs?.[key] || 0) : ''}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
