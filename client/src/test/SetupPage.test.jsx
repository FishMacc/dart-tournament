import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SetupPage from '../pages/SetupPage';
import socket from '../socket';

// Mock socket
vi.mock('../socket', () => ({
    default: {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
    },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('SetupPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <MemoryRouter>
                <SetupPage tournament={null} />
            </MemoryRouter>
        );
        expect(screen.getByText(/Neues Turnier/)).toBeDefined();
        // Check for new toggle
        expect(screen.getByText(/Preispool \/ Einsatz/)).toBeDefined();
    });

    it('toggles prize pool inputs', async () => {
        render(
            <MemoryRouter>
                <SetupPage tournament={null} />
            </MemoryRouter>
        );

        // Initially hidden
        expect(screen.queryByText(/Einsatz pro Spieler/)).toBeNull();

        // Toggle ON
        const checkboxes = screen.getAllByRole('checkbox');
        const prizeToggle = checkboxes.find(cb =>
            cb.closest('.setting-row')?.textContent.includes('Preispool / Einsatz')
        );

        expect(prizeToggle).toBeDefined();
        fireEvent.click(prizeToggle);

        // Now visible
        await waitFor(() => {
            expect(screen.getByText(/Einsatz pro Spieler/)).toBeDefined();
        });
        expect(screen.getByText(/Gewinnverteilung/)).toBeDefined();
    });

    it('sends entryFee: 0 when prize pool is disabled', async () => {
        render(
            <MemoryRouter>
                <SetupPage tournament={null} />
            </MemoryRouter>
        );

        // Setup base fields
        fireEvent.change(screen.getByPlaceholderText(/z.B. Freitags-Turnier/), { target: { value: 'Test Cup' } });

        // Mock specific socket response for create
        socket.emit.mockImplementation((event, data, callback) => {
            if (event === 'create_tournament' && callback) {
                callback({ success: true, tournament: { id: 't1' } });
            }
        });

        // Click create
        const createBtn = screen.getByText(/Turnier erstellen/);
        fireEvent.click(createBtn);

        await waitFor(() => {
            expect(socket.emit).toHaveBeenCalledWith('create_tournament', expect.objectContaining({
                settings: expect.objectContaining({
                    name: 'Test Cup',
                    entryFee: 0,
                    distributionMode: 'winner_100', // default fallback
                })
            }), expect.any(Function));
        });
    });

    it('sends correct entryFee when prize pool is enabled', async () => {
        render(
            <MemoryRouter>
                <SetupPage tournament={null} />
            </MemoryRouter>
        );

        // Enable Prize Pool
        const checkboxes = screen.getAllByRole('checkbox');
        const prizeToggle = checkboxes.find(cb =>
            cb.closest('.setting-row')?.textContent.includes('Preispool / Einsatz')
        );
        fireEvent.click(prizeToggle);

        // Set Fee
        const feeInput = screen.getByPlaceholderText(/0.50/);
        fireEvent.change(feeInput, { target: { value: '10' } });

        // Mock socket
        socket.emit.mockImplementation((event, data, callback) => {
            if (event === 'create_tournament' && callback) {
                callback({ success: true });
            }
        });

        // Create
        fireEvent.click(screen.getByText(/Turnier erstellen/));

        await waitFor(() => {
            expect(socket.emit).toHaveBeenCalledWith('create_tournament', expect.objectContaining({
                settings: expect.objectContaining({
                    entryFee: 10,
                })
            }), expect.any(Function));
        });
    });
});
