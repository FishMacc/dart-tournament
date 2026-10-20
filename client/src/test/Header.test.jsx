import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header.jsx';

describe('Header', () => {
    it('should render the brand text', () => {
        render(
            <MemoryRouter>
                <Header tournament={null} theme="obsidian" setTheme={() => { }} />
            </MemoryRouter>
        );
        expect(screen.getByText('DartVault')).toBeInTheDocument();
    });

    it('should not show status badge when no tournament', () => {
        render(
            <MemoryRouter>
                <Header tournament={null} theme="obsidian" setTheme={() => { }} />
            </MemoryRouter>
        );
        expect(screen.queryByText('Setup')).not.toBeInTheDocument();
        expect(screen.queryByText('Live')).not.toBeInTheDocument();
        expect(screen.queryByText('Finished')).not.toBeInTheDocument();
    });

    it('should show "Setup" when tournament is in setup', () => {
        render(
            <MemoryRouter>
                <Header tournament={{ status: 'setup' }} theme="obsidian" setTheme={() => { }} />
            </MemoryRouter>
        );
        expect(screen.getByText('Setup')).toBeInTheDocument();
    });

    it('should show "Live" when tournament is active', () => {
        render(
            <MemoryRouter>
                <Header tournament={{ status: 'active' }} theme="obsidian" setTheme={() => { }} />
            </MemoryRouter>
        );
        expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should show "Finished" when tournament is finished', () => {
        render(
            <MemoryRouter>
                <Header tournament={{ status: 'finished' }} theme="obsidian" setTheme={() => { }} />
            </MemoryRouter>
        );
        expect(screen.getByText('Finished')).toBeInTheDocument();
    });

    it('should render theme switcher buttons', () => {
        render(
            <MemoryRouter>
                <Header tournament={null} theme="obsidian" setTheme={() => { }} />
            </MemoryRouter>
        );
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThanOrEqual(3); // 3 theme buttons
    });

    it('should display tournament name when active', () => {
        render(
            <MemoryRouter>
                <Header tournament={{ status: 'active', name: 'Friday Cup', type: '501' }} theme="obsidian" setTheme={() => { }} />
            </MemoryRouter>
        );
        expect(screen.getByText('Friday Cup')).toBeInTheDocument();
    });

    it('should display tournament type when no name', () => {
        render(
            <MemoryRouter>
                <Header tournament={{ status: 'active', name: '', type: '501' }} theme="obsidian" setTheme={() => { }} />
            </MemoryRouter>
        );
        expect(screen.getByText('501')).toBeInTheDocument();
    });
});
