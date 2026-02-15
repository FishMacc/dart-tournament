import { useState, useEffect } from 'react';

export default function QRCodeDisplay() {
    const [lanInfo, setLanInfo] = useState(null);

    useEffect(() => {
        fetch('/api/lan-info')
            .then((res) => res.json())
            .then((data) => setLanInfo(data))
            .catch((err) => console.error('Failed to load LAN info:', err));
    }, []);

    if (!lanInfo) {
        return (
            <div className="qr-section">
                <p className="text-muted">Lade QR-Code...</p>
            </div>
        );
    }

    return (
        <div className="qr-section animate-scale-in">
            <div className="qr-code-container">
                <h3>📱 Spieler einladen</h3>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                    QR-Code scannen, um dem Turnier beizutreten
                </p>
                <img
                    src={lanInfo.qrCode}
                    alt="QR Code zum Beitreten"
                    id="qr-code-image"
                    style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '12px' }}
                />
                <div className="qr-url">{lanInfo.url}/mobile</div>
            </div>
        </div>
    );
}
