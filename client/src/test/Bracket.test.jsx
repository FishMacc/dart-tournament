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

    it('should render round names correctly for 2 rounds', () => {
        const rounds = [
            [makeMockMatch('A', 'B'), makeMockMatch('C', 'D')],
            [makeMockMatch(null, null)],
        ];
        render(<Bracket rounds={rounds} />);
        expect(screen.getByText('Halbfinale')).toBeInTheDocument();
        expect(screen.getByText('Finale')).toBeInTheDocument();
    });

    it('should render round names correctly for 3 rounds', () => {
        const rounds = [
            [makeMockMatch('A', 'B'), makeMockMatch('C', 'D'), makeMockMatch('E', 'F'), makeMockMatch('G', 'H')],
            [makeMockMatch(null, null), makeMockMatch(null, null)],
            [makeMockMatch(null, null)],
        ];
        render(<Bracket rounds={rounds} />);
        expect(screen.getByText('Viertelfinale')).toBeInTheDocument();
        expect(screen.getByText('Halbfinale')).toBeInTheDocument();
        expect(screen.getByText('Finale')).toBeInTheDocument();
    });

    it('should render "Runde X" for early rounds in large brackets', () => {
        const rounds = [
            [makeMockMatch('A', 'B'), makeMockMatch('C', 'D'), makeMockMatch('E', 'F'), makeMockMatch('G', 'H'),
            makeMockMatch('I', 'J'), makeMockMatch('K', 'L'), makeMockMatch('M', 'N'), makeMockMatch('O', 'P')],
            [makeMockMatch(null, null), makeMockMatch(null, null), makeMockMatch(null, null), makeMockMatch(null, null)],
            [makeMockMatch(null, null), makeMockMatch(null, null)],
            [makeMockMatch(null, null)],
        ];
        render(<Bracket rounds={rounds} />);
        expect(screen.getByText('Runde 1')).toBeInTheDocument();
        expect(screen.getByText('Viertelfinale')).toBeInTheDocument();
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

    it('should highlight winner with CSS class', () => {
        const match = makeMockMatch('Alice', 'Bob', 'finished', 'Alice');
        const rounds = [[match]];
        const { container } = render(<Bracket rounds={rounds} />);
        const winnerElements = container.querySelectorAll('.bracket-match-player.winner');
        expect(winnerElements.length).toBe(1);
        expect(winnerElements[0].textContent).toContain('Alice');
    });

    it('should show active match styling', () => {
        const match = makeMockMatch('Alice', 'Bob', 'active');
        const rounds = [[match]];
        const { container } = render(<Bracket rounds={rounds} />);
        const activeMatch = container.querySelector('.bracket-match.active');
        expect(activeMatch).not.toBeNull();
    });

    it('should show bye matches with reduced opacity', () => {
        const match = makeMockMatch('Alice', null, 'bye');
        match.winner = { id: '1', name: 'Alice' };
        const rounds = [[match]];
        const { container } = render(<Bracket rounds={rounds} />);
        expect(screen.getByText('BYE')).toBeInTheDocument();
    });

    it('should display leg scores', () => {
        const match = makeMockMatch('Alice', 'Bob', 'active');
        match.legs = { player1: 2, player2: 1 };
        const rounds = [[match]];
        render(<Bracket rounds={rounds} />);
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should make active matches clickable with onWatchLive', () => {
        let clickedMatchId = null;
        const match = makeMockMatch('Alice', 'Bob', 'active');
        const rounds = [[match]];
        const { container } = render(
            <Bracket rounds={rounds} onWatchLive={(id) => { clickedMatchId = id; }} />
        );
        const activeMatch = container.querySelector('.bracket-match.active');
        activeMatch.click();
        expect(clickedMatchId).toBe(match.id);
    });
});
