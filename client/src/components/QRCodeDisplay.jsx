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

    if (error) return <p className="qr-section muted">{t('qr.error')}</p>;
    if (!qrData) return <p className="qr-section muted">{t('qr.loading')}</p>;

    return (
        <div className="qr-section">
            <img className="qr-code" src={qrData.qrCode} alt={t('qr.alt')} width="200" height="200" />
            <div className="qr-url">{qrData.url}/mobile</div>
            <p className="setting-desc" style={{ marginTop: 6 }}>{t('qr.text')}</p>
        </div>
    );
}
