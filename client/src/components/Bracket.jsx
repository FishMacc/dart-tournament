export default function Bracket({ rounds }) {
    if (!rounds || rounds.length === 0) return null;

    const getRoundName = (roundIndex, totalRounds) => {
        const remaining = totalRounds - roundIndex;
        if (remaining === 1) return 'Finale';
        if (remaining === 2) return 'Halbfinale';
        if (remaining === 3) return 'Viertelfinale';
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
                        {round.map((match) => (
                            <BracketMatch key={match.id} match={match} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

function BracketMatch({ match }) {
    const statusClass =
        match.status === 'active'
            ? 'active'
            : match.status === 'finished'
                ? 'finished'
                : '';

    const isWinner = (playerKey) =>
        match.winner && match[playerKey] && match.winner.id === match[playerKey].id;

    return (
        <div className={`bracket-match ${statusClass} animate-scale-in`} id={`match-${match.id}`}>
            <PlayerRow
                player={match.player1}
                score={match.scores?.player1}
                isWinner={isWinner('player1')}
                status={match.status}
                legs={match.legs?.player1}
            />
            <PlayerRow
                player={match.player2}
                score={match.scores?.player2}
                isWinner={isWinner('player2')}
                status={match.status}
                legs={match.legs?.player2}
            />
        </div>
    );
}

function PlayerRow({ player, score, isWinner, status, legs }) {
    if (!player) {
        return (
            <div className="bracket-match-player tbd">
                <span>TBD</span>
                <span className="bracket-match-score">—</span>
            </div>
        );
    }

    return (
        <div className={`bracket-match-player ${isWinner ? 'winner' : ''}`}>
            <span>
                {isWinner && '🏆 '}{player.name}
                {legs > 0 && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', opacity: 0.6 }}>({legs}L)</span>}
            </span>
            {(status === 'active' || status === 'finished') && (
                <span className="bracket-match-score">{score}</span>
            )}
        </div>
    );
}
