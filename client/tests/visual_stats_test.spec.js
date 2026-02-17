import { test, expect } from '@playwright/experimental-ct-react';
import StatsBoard from '../src/components/StatsBoard';
import '../src/index.css'; // Import styles

test.use({ viewport: { width: 1280, height: 720 } });

test('StatsBoard Visual Check with Money', async ({ mount, page }) => {
    // Mock Data
    const mockTournament = {
        id: 't1',
        status: 'finished',
        name: 'Money Cup 2026',
        winner: { id: 'p1', name: 'Richie Rich' },
        settings: {
            entryFee: 10,
            distributionMode: 'split_70_30'
        },
        players: [
            { id: 'p1', name: 'Richie Rich' },
            { id: 'p2', name: 'Dagobert Duck' },
            { id: 'p3', name: 'Scrooge' }
        ],
        rounds: [
            // Mock rounds to generate stats
            [
                {
                    id: 'm1', player1: { id: 'p1' }, player2: { id: 'p2' }, winner: { id: 'p1' }, status: 'finished',
                    scores: { player1: 0, player2: 301 },
                    throws: { player1: [], player2: [] },
                    legHistory: [
                        { winner: 'player1', throws: { player1: [], player2: [] } }
                    ]
                }
            ]
        ]
    };

    // Mount component
    const component = await mount(<StatsBoard tournament={mockTournament} />);

    // Screenshot
    await page.screenshot({ path: 'vcheck_5_stats.png' });
});
