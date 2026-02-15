import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header.jsx';

describe('Header', () => {
    it('should render the logo text', () => {
        render(
            <MemoryRouter>
                <Header tournament={null} />
            </MemoryRouter>
        );
        expect(screen.getByText('Dart Tournament')).toBeInTheDocument();
    });

    it('should show "Bereit" badge when no tournament', () => {
        render(
            <MemoryRouter>
                <Header tournament={null} />
            </MemoryRouter>
        );
        expect(screen.getByText('Bereit')).toBeInTheDocument();
    });

    it('should show "Einrichtung" when tournament is in setup', () => {
        render(
            <MemoryRouter>
                <Header tournament={{ status: 'setup' }} />
            </MemoryRouter>
        );
        expect(screen.getByText('Einrichtung')).toBeInTheDocument();
    });

    it('should show "Aktiv" when tournament is active', () => {
        render(
            <MemoryRouter>
                <Header tournament={{ status: 'active' }} />
            </MemoryRouter>
        );
        expect(screen.getByText('Aktiv')).toBeInTheDocument();
    });

    it('should show "Beendet" when tournament is finished', () => {
        render(
            <MemoryRouter>
                <Header tournament={{ status: 'finished' }} />
            </MemoryRouter>
        );
        expect(screen.getByText('Beendet')).toBeInTheDocument();
    });
});
