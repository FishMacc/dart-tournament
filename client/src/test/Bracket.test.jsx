import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Bracket from '../components/Bracket.jsx';

const makeMockMatch = (p1Name, p2Name, status = 'waiting', winner = null) => ({
    id: `match-${Math.random()}`,
    round: 0,
    matchIndex: 0,
    player1: p1Name ? { id: '1', name: p1Name } : null,
    player2: p2Name ? { id: '2', name: p2Name } : null,
    scores: { player1: 501, player2: 501 },
    legs: { player1: 0, player2: 0 },
    status,
    winner: winner ? { id: winner === p1Name ? '1' : '2', name: winner } : null,
});

describe('Bracket', () => {
    it('should render nothing when rounds is null', () => {
        const { container } = render(<Bracket rounds={null} />);
        expect(container.innerHTML).toBe('');
    });

    it('should render nothing when rounds is empty', () => {
        const { container } = render(<Bracket rounds={[]} />);
        expect(container.innerHTML).toBe('');
    });

    it('should render round names correctly', () => {
        const rounds = [
            [makeMockMatch('A', 'B'), makeMockMatch('C', 'D')],
            [makeMockMatch(null, null)],
        ];
        render(<Bracket rounds={rounds} />);
        expect(screen.getByText('Halbfinale')).toBeInTheDocument();
        expect(screen.getByText('Finale')).toBeInTheDocument();
    });

    it('should display player names', () => {
        const rounds = [[makeMockMatch('Alice', 'Bob')]];
        render(<Bracket rounds={rounds} />);
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should show TBD for empty slots', () => {
        const rounds = [[makeMockMatch(null, null)]];
        render(<Bracket rounds={rounds} />);
        expect(screen.getAllByText('TBD')).toHaveLength(2);
    });

    it('should highlight winner', () => {
        const match = makeMockMatch('Alice', 'Bob', 'finished', 'Alice');
        const rounds = [[match]];
        render(<Bracket rounds={rounds} />);
        // Winner should have trophy emoji
        expect(screen.getByText(/🏆/)).toBeInTheDocument();
    });
});
