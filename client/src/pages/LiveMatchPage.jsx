import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy } from 'lucide-react';
import socket from '../socket.js';
import { useI18n } from '../i18n.jsx';

export default function LiveMatchPage({ tournament }) {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const { t } = useI18n();
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
        socket.emit('spectate_match', { matchId });

        return () => {
            socket.off('match_update', handleMatchUpdate);
        };
    }, [matchId]);

    if (!match) {
        return <p className="center-state muted">{t('live.loading')}</p>;
    }

    const isActive = match.status === 'active';
    const isFinished = match.status === 'finished';

    return (
        <div className="live">
            <div className="spread" style={{ marginBottom: 20 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} id="btn-back">
                    <ChevronLeft size={16} /> {t('live.back')}
                </button>
                {isActive && <span className="badge badge-live">{t('header.status.active')}</span>}
                {isFinished && <span className="badge badge-success">{t('live.finished')}</span>}
            </div>

            <div className="board live-match-container">
                {['player1', 'player2'].map((key) => {
                    const isThrowing = isActive && match.currentThrower === key;
                    const isWinner = isFinished && match.winner?.id === match[key]?.id;
                    return (
                        <div key={key} className={`board-row ${isThrowing ? 'is-throwing' : ''} ${isWinner ? 'is-winner' : ''}`}>
                            <span className="indicator" />
                            <span className="name">{match[key]?.name}</span>
                            <span className="legs num" title={t('live.legs')}>{match.legs?.[key] || 0}</span>
                            <span className="score num live-player-score">
                                {isFinished ? (isWinner && <Trophy size={48} aria-label={t('live.winner')} />) : match.scores?.[key]}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="live-history">
                {['player1', 'player2'].map((key) => {
                    const recent = (match.throws?.[key] || []).slice(-9);
                    return (
                        <div key={key} className="panel panel-body">
                            <div className="eyebrow">{match[key]?.name}</div>
                            <div className="throw-chips">
                                {recent.map((d, i) => (
                                    <span key={i} className={`throw-chip ${d.isBust ? 'bust' : ''}`}>
                                        {d.isBust ? 'BUST' : getThrowLabel(d.value, d.multiplier)}
                                    </span>
                                ))}
                                {recent.length === 0 && <span className="faint" style={{ fontSize: 14 }}>{t('live.noThrows')}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function getThrowLabel(value, multiplier) {
    if (value === 0) return 'Miss';
    const prefix = multiplier === 1 ? 'S' : multiplier === 2 ? 'D' : 'T';
    if (value === 25) return multiplier === 2 ? 'BULL' : '25';
    return `${prefix}${value}`;
}
