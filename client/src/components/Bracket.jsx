export default function Bracket({ rounds, onWatchLive }) {
    if (!rounds || rounds.length === 0) return null;

    const getRoundName = (roundIndex, totalRounds) => {
        if (roundIndex === totalRounds - 1) return 'Finale';
        if (roundIndex === totalRounds - 2) return 'Halbfinale';
        if (roundIndex === totalRounds - 3) return 'Viertelfinale';
        return `Runde ${roundIndex + 1}`;
    };

    return (
        <div className="bracket-container">
            <div className="bracket">
                {rounds.map((round, roundIndex) => (
                    <div key={roundIndex} className="bracket-round">
                        <div className="bracket-round-title">
                            {getRoundName(roundIndex, rounds.length)}
                        </div>
                        {round.map((match) => {
                            const isActive = match.status === 'active';
                            const isFinished = match.status === 'finished';
                            const isBye = match.status === 'bye';

                            if (isBye) {
                                return (
                                    <div
                                        key={match.id}
                                        className="bracket-match finished"
                                        style={{ opacity: 0.4 }}
                                    >
                                        <div className="bracket-match-player">
                                            <span>{match.winner?.name || 'Freilos'}</span>
                                            <span className="bracket-match-score" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BYE</span>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={match.id}
                                    className={`bracket-match ${isActive ? 'active' : ''} ${isFinished ? 'finished' : ''}`}
                                    onClick={() => isActive && onWatchLive && onWatchLive(match.id)}
                                    style={{ cursor: isActive ? 'pointer' : 'default' }}
                                >
                                    <div className={`bracket-match-player ${isFinished && match.winner?.id === match.player1?.id ? 'winner' : ''} ${!match.player1 ? 'tbd' : ''}`}>
                                        <span>{match.player1?.name || 'TBD'}</span>
                                        <span className="bracket-match-score">
                                            {match.player1 ? (match.legs?.player1 || 0) : ''}
                                        </span>
                                    </div>
                                    <div className={`bracket-match-player ${isFinished && match.winner?.id === match.player2?.id ? 'winner' : ''} ${!match.player2 ? 'tbd' : ''}`}>
                                        <span>{match.player2?.name || 'TBD'}</span>
                                        <span className="bracket-match-score">
                                            {match.player2 ? (match.legs?.player2 || 0) : ''}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
