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

    it('should render Bull button', () => {
        render(<ScorePad onThrow={() => { }} disabled={false} />);
        expect(screen.getByText(/Bull/)).toBeInTheDocument();
    });

    it('should render Miss button', () => {
        render(<ScorePad onThrow={() => { }} disabled={false} />);
        expect(screen.getByText(/Miss/)).toBeInTheDocument();
    });

    it('should send value=0, multiplier=1 on Miss click', () => {
        let received = null;
        render(<ScorePad onThrow={(v, m) => { received = { v, m }; }} disabled={false} />);
        fireEvent.click(screen.getByText(/Miss/));
        expect(received).toEqual({ v: 0, m: 1 });
    });

    it('should send value=25 on Bull click with single multiplier', () => {
        let received = null;
        render(<ScorePad onThrow={(v, m) => { received = { v, m }; }} disabled={false} />);
        fireEvent.click(screen.getByText(/Bull/));
        expect(received).toEqual({ v: 25, m: 1 });
    });

    it('should send value=25, multiplier=2 on Bull click with Double', () => {
        let received = null;
        render(<ScorePad onThrow={(v, m) => { received = { v, m }; }} disabled={false} />);
        fireEvent.click(screen.getByText('Double'));
        fireEvent.click(screen.getByText(/Bull/));
        expect(received).toEqual({ v: 25, m: 2 });
    });

    it('should map triple to double on Bull (no triple bull)', () => {
        let received = null;
        render(<ScorePad onThrow={(v, m) => { received = { v, m }; }} disabled={false} />);
        fireEvent.click(screen.getByText('Triple'));
        fireEvent.click(screen.getByText(/Bull/));
        // Triple on bull maps to double (no triple bull allowed)
        expect(received).toEqual({ v: 25, m: 2 });
    });

    it('should render Undo button', () => {
        render(<ScorePad onThrow={() => { }} onUndo={() => { }} disabled={false} canUndo={true} />);
        expect(screen.getByText(/Undo/)).toBeInTheDocument();
    });

    it('should call onUndo when Undo button is clicked', () => {
        let undoCalled = false;
        render(<ScorePad onThrow={() => { }} onUndo={() => { undoCalled = true; }} disabled={false} canUndo={true} />);
        fireEvent.click(screen.getByText(/Undo/));
        expect(undoCalled).toBe(true);
    });

    it('should disable Undo button when canUndo is false', () => {
        render(<ScorePad onThrow={() => { }} onUndo={() => { }} disabled={false} canUndo={false} />);
        const undoBtn = screen.getByText(/Undo/).closest('button');
        expect(undoBtn.disabled).toBe(true);
    });

    it('should not fire Miss when disabled', () => {
        let called = false;
        render(<ScorePad onThrow={() => { called = true; }} disabled={true} />);
        fireEvent.click(screen.getByText(/Miss/));
        expect(called).toBe(false);
    });

    it('should not fire Bull when disabled', () => {
        let called = false;
        render(<ScorePad onThrow={() => { called = true; }} disabled={true} />);
        fireEvent.click(screen.getByText(/Bull/));
        expect(called).toBe(false);
    });

    it('should render 25 button (number 25 / Bull)', () => {
        render(<ScorePad onThrow={() => { }} disabled={false} />);
        // Bull button represents 25
        expect(screen.getByText(/Bull/)).toBeInTheDocument();
    });
});
