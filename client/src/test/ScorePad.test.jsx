import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScorePad from '../components/ScorePad.jsx';

describe('ScorePad', () => {
    it('should render all number buttons (1-20)', () => {
        const mockThrow = () => { };
        render(<ScorePad onThrow={mockThrow} disabled={false} />);
        for (let i = 1; i <= 20; i++) {
            expect(screen.getByText(String(i))).toBeInTheDocument();
        }
    });

    it('should render multiplier buttons', () => {
        render(<ScorePad onThrow={() => { }} disabled={false} />);
        expect(screen.getByText('Single')).toBeInTheDocument();
        expect(screen.getByText('Double')).toBeInTheDocument();
        expect(screen.getByText('Triple')).toBeInTheDocument();
    });

    it('should call onThrow with correct value and default single multiplier', () => {
        let received = null;
        const mockThrow = (v, m) => { received = { v, m }; };
        render(<ScorePad onThrow={mockThrow} disabled={false} />);
        fireEvent.click(screen.getByText('20'));
        expect(received).toEqual({ v: 20, m: 1 });
    });

    it('should use selected multiplier for throw', () => {
        let received = null;
        const mockThrow = (v, m) => { received = { v, m }; };
        render(<ScorePad onThrow={mockThrow} disabled={false} />);
        fireEvent.click(screen.getByText('Triple'));
        fireEvent.click(screen.getByText('20'));
        expect(received).toEqual({ v: 20, m: 3 });
    });

    it('should reset multiplier to single after a throw', () => {
        let calls = [];
        const mockThrow = (v, m) => { calls.push({ v, m }); };
        render(<ScorePad onThrow={mockThrow} disabled={false} />);
        fireEvent.click(screen.getByText('Double'));
        fireEvent.click(screen.getByText('5'));
        // Now multiplier should reset to 1
        fireEvent.click(screen.getByText('10'));
        expect(calls[0]).toEqual({ v: 5, m: 2 });
        expect(calls[1]).toEqual({ v: 10, m: 1 });
    });

    it('should not fire when disabled', () => {
        let called = false;
        render(<ScorePad onThrow={() => { called = true; }} disabled={true} />);
        fireEvent.click(screen.getByText('20'));
        expect(called).toBe(false);
    });
});
