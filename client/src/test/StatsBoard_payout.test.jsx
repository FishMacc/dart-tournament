import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsBoard from '../components/StatsBoard';

describe('StatsBoard Payout Logic', () => {
    const mockPlayers = [
        { id: 'p1', name: 'Winner' },
        { id: 'p2', name: 'RunnerUp' },
        { id: 'p3', name: 'SemiLoser1' },
        { id: 'p4', name: 'SemiLoser2' },
    ];

    const createTournament = (mode, entryFee = 10) => ({
        id: 't1',
        name: 'Test Tournament',
        players: mockPlayers,
        settings: {
            entryFee: entryFee,
            distributionMode: mode,
        },
        rounds: [
            // Round 1 (Semi-Finals)
            [
                { player1: mockPlayers[0], player2: mockPlayers[2], winner: mockPlayers[0], status: 'finished' },
                { player1: mockPlayers[1], player2: mockPlayers[3], winner: mockPlayers[1], status: 'finished' },
            ],
            // Round 2 (Final)
            [
                { player1: mockPlayers[0], player2: mockPlayers[1], winner: mockPlayers[0], status: 'finished' },
            ],
        ],
        status: 'finished',
        winner: mockPlayers[0],
    });

    it('calculates Winner Takes All (100%) correctly', () => {
        const tournament = createTournament('winner_100', 10); // Pool = 40
        render(<StatsBoard tournament={tournament} />);

        // Winner gets 40.00€
        expect(screen.getByText('€40.00')).toBeDefined();
    });

    it('calculates Split 70/30 correctly', () => {
        const tournament = createTournament('split_70_30', 10); // Pool = 40
        render(<StatsBoard tournament={tournament} />);

        // Winner gets 28.00€ (70%)
        expect(screen.getByText('€28.00')).toBeDefined();
        // RunnerUp gets 12.00€ (30%)
        expect(screen.getByText('€12.00')).toBeDefined();
    });

    it('calculates Split 50/30/20 correctly', () => {
        const tournament = createTournament('split_50_30_20', 10); // Pool = 40
        render(<StatsBoard tournament={tournament} />);

        // Winner gets 20.00€ (50%)
        expect(screen.getByText('€20.00')).toBeDefined();
        // RunnerUp gets 12.00€ (30%)
        expect(screen.getByText('€12.00')).toBeDefined();
        // SemiLosers get 4.00€ each (10% each of 40 = 4)
        // There should be two elements with 4.00€
        const thirdPlacePrizes = screen.getAllByText('€4.00');
        expect(thirdPlacePrizes.length).toBe(2);
    });

    it('calculates Custom Split (60/30/10) correctly', () => {
        const tournament = createTournament('custom', 10);
        tournament.settings.distributionValues = [60, 30, 10]; // Pool = 40
        render(<StatsBoard tournament={tournament} />);

        // Winner gets 24.00€ (60%)
        expect(screen.getByText('€24.00')).toBeDefined();
        // RunnerUp gets 12.00€ (30%)
        expect(screen.getByText('€12.00')).toBeDefined();
        // SemiLosers get 2.00€ each (10% of 40 = 4, split by 2 = 2)
        const thirdPlacePrizes = screen.getAllByText('€2.00');
        expect(thirdPlacePrizes.length).toBe(2);
    });

    it('redistributes unclaimed 3rd-place share in 2-player split_50_30_20', () => {
        const twoPlayers = [
            { id: 'p1', name: 'Winner' },
            { id: 'p2', name: 'RunnerUp' },
        ];
        const tournament = {
            id: 't2',
            name: 'Two Player',
            players: twoPlayers,
            settings: { entryFee: 10, distributionMode: 'split_50_30_20' },
            rounds: [
                [{ player1: twoPlayers[0], player2: twoPlayers[1], winner: twoPlayers[0], status: 'finished' }],
            ],
            status: 'finished',
            winner: twoPlayers[0],
        };
        render(<StatsBoard tournament={tournament} />);

        // Pool = 20. Without fix: winner 10, runner 6, 4 lost.
        // With fix: scale = 20/16 = 1.25 → winner 12.50€, runner 7.50€
        expect(screen.getByText('€12.50')).toBeDefined();
        expect(screen.getByText('€7.50')).toBeDefined();
    });

    it('redistributes unclaimed 3rd-place share in 2-player custom mode', () => {
        const twoPlayers = [
            { id: 'p1', name: 'Winner' },
            { id: 'p2', name: 'RunnerUp' },
        ];
        const tournament = {
            id: 't3',
            name: 'Two Player Custom',
            players: twoPlayers,
            settings: { entryFee: 10, distributionMode: 'custom', distributionValues: [50, 30, 20] },
            rounds: [
                [{ player1: twoPlayers[0], player2: twoPlayers[1], winner: twoPlayers[0], status: 'finished' }],
            ],
            status: 'finished',
            winner: twoPlayers[0],
        };
        render(<StatsBoard tournament={tournament} />);

        // Same redistribution as split_50_30_20
        expect(screen.getByText('€12.50')).toBeDefined();
        expect(screen.getByText('€7.50')).toBeDefined();
    });
});
