import { useState, useEffect } from 'react';
import { useI18n } from '../i18n.jsx';

export default function QRCodeDisplay() {
    const { t } = useI18n();
    const [qrData, setQrData] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch('/api/lan-info')
            .then((res) => res.json())
            .then((data) => setQrData(data))
            .catch((err) => {
                console.error('Failed to load QR code data:', err);
                setError(true);
            });
    }, []);

    if (error) {
        return (
            <div className="qr-section">
                <p className="text-muted">{t('qr.error')}</p>
            </div>
        );
    }

    if (!qrData) {
        return (
            <div className="qr-section">
                <p className="text-muted">{t('qr.loading')}</p>
            </div>
        );
    }

    return (
        <div className="qr-section">
            <h3 style={{ marginBottom: '1rem' }}>{t('qr.title')}</h3>
            <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                {t('qr.text')}
            </p>

            <div className="qr-code-container">
                <img
                    src={qrData.qrCode}
                    alt={t('qr.alt')}
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
