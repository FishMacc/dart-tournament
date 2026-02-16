import { useState, useEffect } from 'react';

export default function QRCodeDisplay() {
    const [qrData, setQrData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/lan-info')
            .then((res) => res.json())
            .then((data) => setQrData(data))
            .catch((err) => {
                console.error('Failed to load QR code data:', err);
                setError('QR-Code konnte nicht geladen werden');
            });
    }, []);

    if (error) {
        return (
            <div className="qr-section">
                <p className="text-muted">{error}</p>
            </div>
        );
    }

    if (!qrData) {
        return (
            <div className="qr-section">
                <p className="text-muted">QR-Code wird geladen...</p>
            </div>
        );
    }

    return (
        <div className="qr-section">
            <h3 style={{ marginBottom: '1rem' }}>📱 Mobile Ansicht</h3>
            <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                Scanne den QR-Code, um auf deinem Handy Punkte einzutragen
            </p>

            <div className="qr-code-container">
                <img
                    src={qrData.qrCode}
                    alt="QR Code für Mobile Ansicht"
                    width="200"
                    height="200"
                />
                <div className="qr-url">
                    {qrData.url}/mobile
                </div>
            </div>
        </div>
    );
}
