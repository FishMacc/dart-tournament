import { useState, useMemo } from 'react';
import { Trophy, Target, Award, ListFilter, ArrowUpDown, TrendingUp, Hash, ArrowUpCircle } from 'lucide-react';

export default function StatsBoard({ tournament }) {
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

                // For Average: Count all valid throws
                // NOTE: Simply summing non-bust scores. 
                // Strict rules (bust forfeits whole turn score) would require turn-by-turn replay.
                legDarts.forEach(d => {
                    dartsThrown++;
                    if (!d.isBust) scoresSum += d.score;
                });

                // Check for 180s (3 darts, same turn, all 60)
                let currentTurnScores = [];
                let currentTurnNum = -1;

                legDarts.forEach(d => {
                    if (d.turnThrowNumber <= currentTurnNum) {
                        // New turn started, verify previous
                        if (currentTurnScores.length === 3 && currentTurnScores.every(s => s === 60)) sum180s++;
                        currentTurnScores = [];
                    }
                    currentTurnNum = d.turnThrowNumber; // 1, 2, 3
                    if (!d.isBust) currentTurnScores.push(d.score);
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
        if (sortField !== field) return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
        return <ArrowUpDown size={14} style={{ transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none' }} />;
    };

    if (!tournament) return null;

    return (
        <div className="stats-board animate-fade-in">
            <div className="stats-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                    <Trophy className="text-accent" size={28} />
                    <span>Turnierstatistik</span>
                </h2>

                <div style={{ position: 'relative' }}>
                    <ListFilter size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        type="text"
                        placeholder="Spieler suchen..."
                        value={filterName}
                        onChange={e => setFilterName(e.target.value)}
                        className="input"
                        style={{ paddingLeft: '2.2rem', width: '200px', fontSize: '0.9rem' }}
                    />
                </div>
            </div>

            <div className="stats-table-container custom-scrollbar">
                <table className="stats-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Name <SortIcon field="name" />
                                </div>
                            </th>
                            <th onClick={() => handleSort('matchesPlayed')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    Spiele <SortIcon field="matchesPlayed" />
                                </div>
                            </th>
                            <th onClick={() => handleSort('wins')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    Siege <SortIcon field="wins" />
                                </div>
                            </th>
                            <th onClick={() => handleSort('legsWon')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    Legs <SortIcon field="legsWon" />
                                </div>
                            </th>
                            <th onClick={() => handleSort('average')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    Avg (3) <SortIcon field="average" />
                                </div>
                            </th>
                            <th onClick={() => handleSort('bestLeg')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    Best Leg <SortIcon field="bestLeg" />
                                </div>
                            </th>
                            <th onClick={() => handleSort('highFinish')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    Hi-Fin <SortIcon field="highFinish" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStats.map((player) => (
                            <tr key={player.id} className="stats-row animate-scale-in">
                                <td style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px 0 0 8px', fontWeight: 600 }}>
                                    {player.name}
                                    {tournament.winner?.id === player.id && <span className="badge badge-success" style={{ marginLeft: '0.75rem', fontSize: '0.7rem' }}>CHAMPION</span>}
                                </td>
                                <td style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-card)' }}>{player.matchesPlayed}</td>
                                <td style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-card)', color: 'var(--accent-success)' }}>{player.wins}</td>
                                <td style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-card)' }}>{player.legsWon}</td>

                                {/* Average */}
                                <td style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-card)', fontWeight: 600 }}>
                                    {player.average}
                                    {player.isBestAvg && <TrendingUp size={14} className="text-accent" style={{ marginLeft: '0.25rem', verticalAlign: 'middle' }} />}
                                </td>

                                {/* Best Leg */}
                                <td style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-card)' }}>
                                    {player.bestLeg} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Darts</span>
                                    {player.isBestLeg && <Hash size={14} className="text-accent" style={{ marginLeft: '0.25rem', verticalAlign: 'middle' }} />}
                                </td>

                                {/* High Finish */}
                                <td style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-card)', borderRadius: '0 8px 8px 0' }}>
                                    {player.highFinish}
                                    {player.isHighFin && <ArrowUpCircle size={14} className="text-accent" style={{ marginLeft: '0.25rem', verticalAlign: 'middle' }} />}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Winner Spotlight */}
            {tournament.winner && (
                <div className="winner-spotlight card gradient-card animate-bounce-in" style={{ marginTop: '2rem', textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👑</div>
                    <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Der Sieger ist</h3>
                    <h1 style={{
                        fontSize: '3.5rem',
                        background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '1rem',
                        backgroundClip: 'text',
                    }}>
                        {tournament.winner.name}
                    </h1>
                    <p className="text-muted">Turnier: {tournament.name || tournament.type}</p>
                </div>
            )}
        </div>
    );
}
