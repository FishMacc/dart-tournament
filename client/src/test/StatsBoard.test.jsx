import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatsBoard from '../components/StatsBoard.jsx';

const createMockTournament = (overrides = {}) => ({
    players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
    ],
    rounds: [
        [{
            id: 'm1',
            player1: { id: 'p1', name: 'Alice' },
            player2: { id: 'p2', name: 'Bob' },
            status: 'finished',
            winner: { id: 'p1', name: 'Alice' },
            legs: { player1: 2, player2: 1 },
            throws: { player1: [], player2: [] },
            legHistory: [
                {
                    winner: 'player1',
                    scores: { player1: 0, player2: 120 },
                    throws: {
                        player1: [
                            { value: 20, multiplier: 3, score: 60, isBust: false, turnThrowNumber: 1 },
                            { value: 20, multiplier: 3, score: 60, isBust: false, turnThrowNumber: 2 },
                            { value: 20, multiplier: 3, score: 60, isBust: false, turnThrowNumber: 3 },
                            { value: 20, multiplier: 3, score: 60, isBust: false, turnThrowNumber: 1 },
                            { value: 20, multiplier: 3, score: 60, isBust: false, turnThrowNumber: 2 },
                            { value: 20, multiplier: 3, score: 60, isBust: false, turnThrowNumber: 3 },
                            { value: 20, multiplier: 3, score: 60, isBust: false, turnThrowNumber: 1 },
                            { value: 20, multiplier: 3, score: 60, isBust: false, turnThrowNumber: 2 },
                            { value: 20, multiplier: 2, score: 40, isBust: false, turnThrowNumber: 3 },
                        ],
                        player2: [
                            { value: 20, multiplier: 3, score: 60, isBust: false, turnThrowNumber: 1 },
                            { value: 20, multiplier: 3, score: 60, isBust: false, turnThrowNumber: 2 },
                            { value: 20, multiplier: 3, score: 60, isBust: false, turnThrowNumber: 3 },
                            { value: 20, multiplier: 3, score: 60, isBust: false, turnThrowNumber: 1 },
                            { value: 20, multiplier: 3, score: 60, isBust: false, turnThrowNumber: 2 },
                            { value: 20, multiplier: 1, score: 20, isBust: false, turnThrowNumber: 3 },
                        ],
                    },
                },
                {
                    winner: 'player1',
                    scores: { player1: 0, player2: 200 },
                    throws: {
                        player1: [
                            { value: 20, multiplier: 3, score: 60, isBust: false, turnThrowNumber: 1 },
                            { value: 20, multiplier: 2, score: 40, isBust: false, turnThrowNumber: 2 },
                        ],
                        player2: [
                            { value: 10, multiplier: 1, score: 10, isBust: false, turnThrowNumber: 1 },
                        ],
                    },
                },
            ],
        }],
    ],
    status: 'finished',
    type: '501',
    name: 'Test Cup',
    winner: null,
    ...overrides,
});

describe('StatsBoard', () => {
    it('should render null when no tournament', () => {
        const { container } = render(<StatsBoard tournament={null} />);
        expect(container.innerHTML).toBe('');
    });

    it('should render statistics heading', () => {
        const tournament = createMockTournament();
        render(<StatsBoard tournament={tournament} />);
        expect(screen.getByText('Statistics')).toBeInTheDocument();
    });

    it('should display player names', () => {
        const tournament = createMockTournament();
        render(<StatsBoard tournament={tournament} />);
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should display table headers', () => {
        const tournament = createMockTournament();
        render(<StatsBoard tournament={tournament} />);
        expect(screen.getByText('Player')).toBeInTheDocument();
        expect(screen.getByText('Matches')).toBeInTheDocument();
        expect(screen.getByText('Wins')).toBeInTheDocument();
        expect(screen.getByText('Legs')).toBeInTheDocument();
        expect(screen.getByText('3-dart avg')).toBeInTheDocument();
        expect(screen.getByText('Best leg')).toBeInTheDocument();
        expect(screen.getByText('High finish')).toBeInTheDocument();
    });

    it('should filter players by name', () => {
        const tournament = createMockTournament();
        render(<StatsBoard tournament={tournament} />);

        const filterInput = screen.getByPlaceholderText('Search players');
        fireEvent.change(filterInput, { target: { value: 'Alice' } });

        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('should show the champion badge in the table when tournament has a winner', () => {
        const tournament = createMockTournament({
            winner: { id: 'p1', name: 'Alice' },
        });
        render(<StatsBoard tournament={tournament} />);
        expect(screen.getByRole('table').querySelector('.badge')).toHaveTextContent('Champion');
    });

    it('should show winner spotlight when tournament winner exists', () => {
        const tournament = createMockTournament({
            winner: { id: 'p1', name: 'Alice' },
        });
        const { container } = render(<StatsBoard tournament={tournament} />);
        expect(container.querySelector('.champion')).toHaveTextContent('Alice');
    });

    it('should not show winner spotlight when no winner', () => {
        const tournament = createMockTournament();
        const { container } = render(<StatsBoard tournament={tournament} />);
        expect(container.querySelector('.champion')).toBeNull();
    });

    it('should handle tournament with no players', () => {
        const tournament = createMockTournament({ players: [], rounds: [] });
        const { container } = render(<StatsBoard tournament={tournament} />);
        expect(container.querySelector('.stats-board')).not.toBeNull();
    });

    it('should sort by different fields when clicking headers', () => {
        const tournament = createMockTournament();
        render(<StatsBoard tournament={tournament} />);

        // Click on "Name" to sort
        fireEvent.click(screen.getByText('Player'));

        // Click on "Matches" to sort
        fireEvent.click(screen.getByText('Matches'));

        // Should not crash
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });
});
