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
    name: 'Test Turnier',
    winner: null,
    ...overrides,
});

describe('StatsBoard', () => {
    it('should render null when no tournament', () => {
        const { container } = render(<StatsBoard tournament={null} />);
        expect(container.innerHTML).toBe('');
    });

    it('should render Turnierstatistik heading', () => {
        const tournament = createMockTournament();
        render(<StatsBoard tournament={tournament} />);
        expect(screen.getByText('Turnierstatistik')).toBeInTheDocument();
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
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Spiele')).toBeInTheDocument();
        expect(screen.getByText('Siege')).toBeInTheDocument();
        expect(screen.getByText('Legs')).toBeInTheDocument();
        expect(screen.getByText('Avg (3)')).toBeInTheDocument();
        expect(screen.getByText('Best Leg')).toBeInTheDocument();
        expect(screen.getByText('Hi-Fin')).toBeInTheDocument();
    });

    it('should filter players by name', () => {
        const tournament = createMockTournament();
        render(<StatsBoard tournament={tournament} />);

        const filterInput = screen.getByPlaceholderText('Spieler suchen...');
        fireEvent.change(filterInput, { target: { value: 'Alice' } });

        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('should show CHAMPION badge when tournament has a winner', () => {
        const tournament = createMockTournament({
            winner: { id: 'p1', name: 'Alice' },
        });
        render(<StatsBoard tournament={tournament} />);
        expect(screen.getByText('CHAMPION')).toBeInTheDocument();
    });

    it('should show winner spotlight when tournament winner exists', () => {
        const tournament = createMockTournament({
            winner: { id: 'p1', name: 'Alice' },
        });
        render(<StatsBoard tournament={tournament} />);
        expect(screen.getByText('Der Sieger ist')).toBeInTheDocument();
    });

    it('should not show winner spotlight when no winner', () => {
        const tournament = createMockTournament();
        render(<StatsBoard tournament={tournament} />);
        expect(screen.queryByText('Der Sieger ist')).not.toBeInTheDocument();
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
        fireEvent.click(screen.getByText('Name'));

        // Click on "Spiele" to sort
        fireEvent.click(screen.getByText('Spiele'));

        // Should not crash
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });
});
