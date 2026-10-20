import { useState, useMemo } from 'react';
import { Trophy, Search, ArrowUpDown } from 'lucide-react';
import { useI18n } from '../i18n.jsx';

export default function StatsBoard({ tournament }) {
    const { t, money } = useI18n();
    const [sortField, setSortField] = useState('wins');
    const [sortDirection, setSortDirection] = useState('desc');
    const [filterName, setFilterName] = useState('');

    const stats = useMemo(() => {
        if (!tournament || !tournament.players) return [];

        // Calculate stats for each player
        const playerStats = tournament.players.map(player => {
            let matchesPlayed = 0;
            let wins = 0;
            let scoresSum = 0;
            let dartsThrown = 0;
            let legsWon = 0;
            let bestLegDarts = Infinity;
            let highestFinish = 0;
            let sum180s = 0; // Not explicitly displayed but good to have

            // Helper to analyze a sequence of darts (from one leg)
            const analyzeLeg = (darts, isWinner) => {
                const legDarts = darts || [];
                if (legDarts.length === 0) return;

                // For Average: a bust forfeits the whole turn's score
                let turnScore = 0;
                legDarts.forEach(d => {
                    dartsThrown++;
                    if (d.turnThrowNumber === 1 || d.turnThrowNumber === undefined) {
                        scoresSum += turnScore;
                        turnScore = 0;
                    }
                    turnScore = d.isBust ? 0 : turnScore + d.score;
                });
                scoresSum += turnScore;

                // Check for 180s (3 darts, same turn, all T20=60)
                let currentTurnScores = [];

                legDarts.forEach(d => {
                    if (d.isBust) {
                        // Bust invalidates the turn — discard accumulated scores
                        currentTurnScores = [];
                        return;
                    }
                    // turnThrowNumber resets to 1 at each new turn
                    if (d.turnThrowNumber === 1 && currentTurnScores.length > 0) {
                        // Previous turn ended, check if it was a 180
                        if (currentTurnScores.length === 3 && currentTurnScores.every(s => s === 60)) sum180s++;
                        currentTurnScores = [];
                    }
                    currentTurnScores.push(d.score);
                });
                // Check last turn
                if (currentTurnScores.length === 3 && currentTurnScores.every(s => s === 60)) sum180s++;


                if (isWinner) {
                    // Best Leg (Shortest)
                    if (legDarts.length < bestLegDarts) bestLegDarts = legDarts.length;

                    // Highest Finish
                    // The last darts of the winner are the checkout.
                    // The number of darts in the final turn tells us how many to sum.
                    const lastDart = legDarts[legDarts.length - 1];
                    if (lastDart && lastDart.turnThrowNumber) {
                        const turnCount = lastDart.turnThrowNumber;
                        const finishDarts = legDarts.slice(-turnCount);
                        const checkOutScore = finishDarts.reduce((sum, d) => sum + (d.isBust ? 0 : d.score), 0);
                        if (checkOutScore > highestFinish) highestFinish = checkOutScore;
                    }
                }
            };

            // Iterate rounds and matches
            tournament.rounds.forEach(round => {
                round.forEach(match => {
                    const isP1 = match.player1?.id === player.id;
                    const isP2 = match.player2?.id === player.id;
                    if (!isP1 && !isP2) return;

                    // 1. Process Finished Legs from History
                    if (match.legHistory) {
                        match.legHistory.forEach(leg => {
                            const isLegWinner = leg.winner === (isP1 ? 'player1' : 'player2');
                            if (isLegWinner) legsWon++; // Count won legs here mostly

                            const pThrows = isP1 ? leg.throws.player1 : leg.throws.player2;
                            analyzeLeg(pThrows, isLegWinner);
                        });
                    }

                    // 2. Process Current Active Leg Throws
                    // (Only for average, cannot be a won leg/finish yet unless match just finished and it is in history)
                    // Actually, if match is finished, the last leg IS in legHistory.
                    // If match is active, the current throws are for the ongoing leg.
                    if (match.status === 'active') {
                        matchesPlayed++; // Is active
                        const pThrows = isP1 ? match.throws.player1 : match.throws.player2;
                        analyzeLeg(pThrows, false);
                    } else if (match.status === 'finished') {
                        matchesPlayed++;
                        if (match.winner?.id === player.id) wins++;
                        // Note: legsWon is counted in legHistory loop above for accuracy
                    }
                });
            });

            const avg = dartsThrown > 0 ? ((scoresSum / dartsThrown) * 3).toFixed(1) : '0.0';

            return {
                id: player.id,
                name: player.name,
                matchesPlayed,
                wins,
                losses: matchesPlayed - wins,
                legsWon,
                winRate: matchesPlayed > 0 ? ((wins / matchesPlayed) * 100).toFixed(0) + '%' : '0%',
                average: avg,
                bestLeg: bestLegDarts === Infinity ? '-' : bestLegDarts,
                highFinish: highestFinish === 0 ? '-' : highestFinish,
                isBestAvg: false, // will calc later
                isBestLeg: false,
                isHighFin: false,
            };
        });

        // Determine badge winners (Best Avg, etc.)
        const maxAvg = Math.max(...playerStats.map(p => parseFloat(p.average)));
        const minBestLeg = Math.min(...playerStats.map(p => p.bestLeg === '-' ? 999 : p.bestLeg));
        const maxHighFin = Math.max(...playerStats.map(p => p.highFinish === '-' ? 0 : p.highFinish));

        return playerStats.map(p => ({
            ...p,
            isBestAvg: parseFloat(p.average) === maxAvg && maxAvg > 0,
            isBestLeg: p.bestLeg === minBestLeg && minBestLeg < 999,
            isHighFin: p.highFinish === maxHighFin && maxHighFin > 0,
        }));

    }, [tournament]);

    // Calculate Payouts
    const payoutMap = useMemo(() => {
        if (!tournament || !tournament.settings?.entryFee || !tournament.winner) return {};

        const pool = tournament.settings.entryFee * (tournament.players?.length || 0);
        const mode = tournament.settings.distributionMode || 'winner_100';
        const payouts = {};

        // Find ranks based on elimination round
        // Winner is known. Runner-up is the loser of the final match.
        // 3rd place are losers of semi-finals.

        let winnerId = tournament.winner.id;
        let runnerUpId = null;
        let semiLoserIds = [];

        // Reverse rounds to find Final, Semi-Final
        const rounds = [...tournament.rounds].reverse(); // Last round is final

        // Final Round
        if (rounds.length > 0) {
            const finalMatch = rounds[0][0]; // Assuming single final match
            if (finalMatch && finalMatch.player1 && finalMatch.player2) {
                runnerUpId = finalMatch.player1.id === winnerId ? finalMatch.player2.id : finalMatch.player1.id;
            }
        }

        // Semi-Final Round
        if (rounds.length > 1) {
            const semiMatches = rounds[1];
            semiMatches.forEach(m => {
                // The losers here are 3rd place shared
                if (m.winner && m.player1 && m.player2) {
                    const loserId = m.player1.id === m.winner.id ? m.player2.id : m.player1.id;
                    semiLoserIds.push(loserId);
                }
            });
        }

        if (mode === 'winner_100') {
            payouts[winnerId] = pool;
        } else if (mode === 'split_70_30') {
            payouts[winnerId] = pool * 0.7;
            if (runnerUpId) payouts[runnerUpId] = pool * 0.3;
        } else if (mode === 'split_50_30_20') {
            payouts[winnerId] = pool * 0.5;
            if (runnerUpId) payouts[runnerUpId] = pool * 0.3;
            if (semiLoserIds.length > 0) {
                const thirdShare = (pool * 0.2) / semiLoserIds.length;
                semiLoserIds.forEach(id => payouts[id] = thirdShare);
            }
        } else if (mode === 'custom' && tournament.settings.distributionValues) {
            const vals = tournament.settings.distributionValues;
            if (vals[0] > 0) payouts[winnerId] = pool * (vals[0] / 100);
            if (vals[1] > 0 && runnerUpId) payouts[runnerUpId] = pool * (vals[1] / 100);
            if (vals[2] > 0 && semiLoserIds.length > 0) {
                const thirdShare = (pool * (vals[2] / 100)) / semiLoserIds.length;
                semiLoserIds.forEach(id => payouts[id] = thirdShare);
            }
        }

        // Redistribute unclaimed shares proportionally when positions are unfilled
        // (e.g. no semi-finalists in a 2-player tournament with split_50_30_20)
        const totalPaid = Object.values(payouts).reduce((sum, v) => sum + v, 0);
        if (totalPaid > 0 && totalPaid < pool) {
            const scale = pool / totalPaid;
            Object.keys(payouts).forEach(id => { payouts[id] *= scale; });
        }

        return payouts;
    }, [tournament]);

    const sortedStats = useMemo(() => {
        let data = [...stats];
        if (filterName) {
            data = data.filter(p => p.name.toLowerCase().includes(filterName.toLowerCase()));
        }

        return data.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            // Convert numeric strings
            if (typeof valA === 'string' && valA.includes('%')) valA = parseFloat(valA);
            if (typeof valB === 'string' && valB.includes('%')) valB = parseFloat(valB);
            if (!isNaN(parseFloat(valA)) && sortField !== 'name') valA = parseFloat(valA);
            if (!isNaN(parseFloat(valB)) && sortField !== 'name') valB = parseFloat(valB);

            // Handle '-' values (always last)
            if (valA === '-') return 1;
            if (valB === '-') return -1;

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [stats, sortField, sortDirection, filterName]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ArrowUpDown size={12} style={{ opacity: 0.35 }} />;
        return <ArrowUpDown size={12} style={{ color: 'var(--red)', transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none' }} />;
    };

    if (!tournament) return null;

    const hasPrize = tournament.settings?.entryFee > 0;
    const columns = [
        ['matchesPlayed', 'stats.matches'],
        ['wins', 'stats.wins'],
        ['legsWon', 'stats.legs'],
        ['average', 'stats.avg'],
        ['bestLeg', 'stats.bestLeg'],
        ['highFinish', 'stats.hiFin'],
    ];

    return (
        <div className="stats-board stack">
            {tournament.winner && (
                <div className="champion">
                    <Trophy className="champion-icon" size={44} />
                    <div style={{ minWidth: 0 }}>
                        <div className="eyebrow">{t('stats.champion')}</div>
                        <div className="display champion-name">{tournament.winner.name}</div>
                    </div>
                    {payoutMap[tournament.winner.id] > 0 && (
                        <div className="num champion-prize">{money(payoutMap[tournament.winner.id])}</div>
                    )}
                </div>
            )}

            <section className="panel">
                <div className="panel-head wrap">
                    <span className="eyebrow">{t('stats.title')}</span>
                    <div className="search">
                        <Search size={15} />
                        <input
                            type="text"
                            placeholder={t('stats.search')}
                            aria-label={t('stats.search')}
                            value={filterName}
                            onChange={e => setFilterName(e.target.value)}
                            className="input"
                        />
                    </div>
                </div>
                <div className="stats-table-container">
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('name')}>
                                    <span className="th-inner">{t('stats.name')} <SortIcon field="name" /></span>
                                </th>
                                {columns.map(([field, key]) => (
                                    <th key={field} onClick={() => handleSort(field)}>
                                        <span className="th-inner">{t(key)} <SortIcon field={field} /></span>
                                    </th>
                                ))}
                                {hasPrize && <th>{t('stats.prize')}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStats.map((player) => (
                                <tr key={player.id} className="stats-row">
                                    <td className="player-cell">
                                        {player.name}
                                        {tournament.winner?.id === player.id && <span className="badge badge-solid" style={{ marginLeft: 10 }}>{t('stats.championShort')}</span>}
                                    </td>
                                    <td>{player.matchesPlayed}</td>
                                    <td>{player.wins}</td>
                                    <td>{player.legsWon}</td>
                                    <td className={player.isBestAvg ? 'best' : ''}>{player.average}</td>
                                    <td className={player.isBestLeg ? 'best' : ''}>
                                        {player.bestLeg}{player.bestLeg !== '-' && <span className="faint"> {t('stats.darts')}</span>}
                                    </td>
                                    <td className={player.isHighFin ? 'best' : ''}>{player.highFinish}</td>
                                    {hasPrize && (
                                        <td className={payoutMap[player.id] ? 'money' : 'faint'}>
                                            {payoutMap[player.id] ? money(payoutMap[player.id]) : '-'}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
