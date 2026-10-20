import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import QRCodeDisplay from '../components/QRCodeDisplay.jsx';

describe('QRCodeDisplay', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should show loading state initially', () => {
        // Mock fetch to never resolve
        global.fetch = vi.fn(() => new Promise(() => { }));

        render(<QRCodeDisplay />);
        expect(screen.getByText('Loading QR code...')).toBeInTheDocument();
    });

    it('should show error state on fetch failure', async () => {
        global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

        render(<QRCodeDisplay />);

        await waitFor(() => {
            expect(screen.getByText('Could not load the QR code')).toBeInTheDocument();
        });
    });

    it('should display QR data after successful fetch', async () => {
        const mockData = {
            ip: '192.168.1.100',
            port: 3000,
            url: 'http://192.168.1.100:3000',
            mobileUrl: 'http://192.168.1.100:3000/mobile',
            qrCode: 'data:image/png;base64,fakeQRdata',
        };

        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve(mockData),
            })
        );

        render(<QRCodeDisplay />);

        await waitFor(() => {
            expect(screen.getByText('📱 Phone scoring')).toBeInTheDocument();
        });

        const img = screen.getByAltText('QR code for the phone view');
        expect(img).toBeInTheDocument();
        expect(img.getAttribute('src')).toBe('data:image/png;base64,fakeQRdata');

        expect(screen.getByText('http://192.168.1.100:3000/mobile')).toBeInTheDocument();
    });

    it('should show scan instruction text', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({
                    url: 'http://192.168.1.100:3000',
                    qrCode: 'data:image/png;base64,test',
                }),
            })
        );

        render(<QRCodeDisplay />);

        await waitFor(() => {
            expect(screen.getByText(/Scan the QR code/)).toBeInTheDocument();
        });
    });
});
