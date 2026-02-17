import { useNavigate } from 'react-router-dom';
import { Moon, Zap, Coffee, Activity, Settings, CheckCircle, Volume2, VolumeX } from 'lucide-react';

export default function Header({ tournament, theme, setTheme }) {
    const navigate = useNavigate();

    const getStatusBadge = () => {
        if (!tournament) return null;
        switch (tournament.status) {
            case 'setup': return (
                <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Settings size={12} /> Setup
                </span>
            );
            case 'active': return (
                <span className="badge badge-live" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Activity size={12} /> Live
                </span>
            );
            case 'finished': return (
                <span className="badge badge-finished" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle size={12} /> Beendet
                </span>
            );
            default: return null;
        }
    };

    return (
        <header className="header">
            <div className="header-container">
                {/* Logo & Brand */}
                <div className="header-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src="/logo.svg" alt="DartVault Logo" width="32" height="32" className="animate-spin-slow" />
                    <div style={{ lineHeight: 1 }}>
                        <h1 className="header-title">DartVault</h1>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6, letterSpacing: '0.1em' }}>TOURNAMENT MANAGER</div>
                    </div>
                </div>

                {/* Status & Name (Desktop) */}
                {tournament && (
                    <div className="header-status hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {getStatusBadge()}
                        {(tournament.name || tournament.status !== 'setup') && (
                            <span style={{ fontWeight: 500, opacity: 0.8 }}>
                                {tournament.name || tournament.type}
                            </span>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="header-actions">
                    <div className="theme-switcher-group">

                        <button
                            className={`theme-btn ${theme === 'obsidian' ? 'active' : ''}`}
                            onClick={() => setTheme('obsidian')}
                            title="Obsidian (Dark)"
                        >
                            <Moon size={16} />
                        </button>
                        <button
                            className={`theme-btn ${theme === 'neon' ? 'active' : ''}`}
                            onClick={() => setTheme('neon')}
                            title="Neon"
                        >
                            <Zap size={16} />
                        </button>
                        <button
                            className={`theme-btn ${theme === 'classic' ? 'active' : ''}`}
                            onClick={() => setTheme('classic')}
                            title="Classic"
                        >
                            <Coffee size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
