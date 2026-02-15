export default function Header({ tournament }) {
    const statusLabel = tournament
        ? tournament.status === 'setup'
            ? 'Einrichtung'
            : tournament.status === 'active'
                ? 'Aktiv'
                : 'Beendet'
        : 'Bereit';

    const statusClass = tournament
        ? tournament.status === 'active'
            ? 'badge-active'
            : tournament.status === 'finished'
                ? 'badge-finished'
                : 'badge-warning'
        : 'badge-finished';

    return (
        <header className="header">
            <div className="container header-inner">
                <div className="header-logo">
                    <span className="header-logo-icon">🎯</span>
                    <span className="header-logo-gradient">Dart Tournament</span>
                </div>
                <div>
                    <span className={`badge ${statusClass}`}>{statusLabel}</span>
                </div>
            </div>
        </header>
    );
}
