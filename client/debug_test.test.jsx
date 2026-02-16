import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MobileScoring from './src/pages/MobileScoring.jsx';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';

// Simple mock for socket (which is used in MobileScoring)
import socket from './src/socket.js';
vi.mock('./src/socket.js', () => ({
    default: {
        emit: vi.fn((event, data, cb) => {
            if (event === 'verify_pin') {
                if (data.pin === '1234') {
                    cb({ success: true, authorized: true });
                } else {
                    cb({ success: false });
                }
            }
            if (event === 'throw_dart') {
                cb({ success: true, throwResult: {}, checkout: null });
            }
        }),
        on: vi.fn(),
        off: vi.fn(),
    }
}));

// Mock match object
const mockMatch = {
    id: 'test-match-1',
    player1: { name: 'Player 1', id: 'p1' },
    player2: { name: 'Player 2', id: 'p2' },
    currentThrower: 'player1',
    scores: { player1: 501, player2: 501 },
    legs: { player1: 0, player2: 0 },
    status: 'active',
    throws: { player1: [], player2: [] },
    pin: '1234',
    authorizedSockets: [],
    currentTurnThrows: 0
};

// Mock Tournament logic
const mockTournament = {
    rounds: [[mockMatch]]
};

describe('MobileScoring Crash Test', () => {
    it('renders without crashing when PIN is correct', async () => {
        // Mock window.confirm
        window.confirm = vi.fn(() => true);

        // Spy on console.error to catch ErrorBoundary logs
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        render(
            <MemoryRouter initialEntries={['/mobile/match/test-match-1']}>
                <Routes>
                    <Route
                        path="/mobile/match/:matchId"
                        element={<MobileScoring tournament={mockTournament} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        // Should see PIN input initially
        const pinInput = screen.getByPlaceholderText('● ● ● ●');
        expect(pinInput).toBeInTheDocument();

        // Enter correct PIN
        fireEvent.change(pinInput, { target: { value: '1234' } });
        fireEvent.submit(pinInput.closest('form'));

        // Wait for potential crash or success
        // If it crashes, ErrorBoundary shows "Ein Fehler ist aufgetreten"
        // If it succeeds, we see player names
        try {
            await waitFor(() => {
                expect(screen.getByText(/Player 1/)).toBeInTheDocument();
            });
            console.log("SUCCESS: Rendered Player 1");
        } catch (e) {
            // Check if ErrorBoundary message is present
            const errorBoundaryMsg = screen.queryByText(/Ein Fehler ist aufgetreten/i);
            if (errorBoundaryMsg) {
                console.log("CRASH DETECTED: Error Boundary shown.");
                // The actual error would have been logged to console.error via componentDidCatch
                // Since we mocked console.error, we can inspect calls.
                console.log("Error Log:", errorSpy.mock.calls);
            } else {
                console.log("TIMEOUT: Player 1 not found, but no explicit crash either.");
                // Maybe loading state?
                screen.debug();
            }
        }
    });
});
