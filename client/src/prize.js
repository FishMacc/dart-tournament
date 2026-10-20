// Prize pool helpers shared by the host screen and the phone lobby.

export function prizePool(tournament) {
    const fee = tournament?.settings?.entryFee || 0;
    return fee * (tournament?.players?.length || 0);
}

/**
 * Planned payout per place, before the tournament is decided.
 * @returns {{ place: string, share: number, amount: number }[]}
 */
export function prizeLines(tournament) {
    const pool = prizePool(tournament);
    if (!pool) return [];
    const mode = tournament.settings.distributionMode || 'winner_100';
    let shares;
    if (mode === 'split_70_30') shares = [70, 30, 0];
    else if (mode === 'split_50_30_20') shares = [50, 30, 20];
    else if (mode === 'custom' && tournament.settings.distributionValues) shares = tournament.settings.distributionValues;
    else shares = [100, 0, 0];
    return ['1', '2', '3/4']
        .map((place, i) => ({ place, share: shares[i] || 0, amount: (pool * (shares[i] || 0)) / 100 }))
        .filter((line) => line.share > 0);
}
