import { useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import Logo from './Logo.jsx';
import { useI18n } from '../i18n.jsx';

export default function Header({ tournament, theme, setTheme }) {
    const navigate = useNavigate();
    const { t, lang, setLang } = useI18n();

    const status = tournament?.status;
    const badgeClass = status === 'active' ? 'badge badge-live' : status === 'finished' ? 'badge badge-success' : 'badge';
    const nextTheme = theme === 'light' ? 'dark' : 'light';

    return (
        <header className="app-header">
            <div className="app-header-inner">
                <button className="brand" onClick={() => navigate('/')} aria-label="DartVault">
                    <Logo className="brand-mark" />
                    <span className="brand-name">DartVault</span>
                </button>

                <div className="header-status">
                    {status && <span className={badgeClass}>{t(`header.status.${status}`)}</span>}
                    {tournament && (tournament.name || status !== 'setup') && (
                        <span className="header-title">{tournament.name || tournament.type}</span>
                    )}
                </div>

                <div className="header-actions">
                    <button
                        className="icon-btn"
                        onClick={() => setTheme(nextTheme)}
                        title={t(`header.theme.${nextTheme}`)}
                        aria-label={t(`header.theme.${nextTheme}`)}
                        id="btn-theme"
                    >
                        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                    <button
                        className="icon-btn"
                        onClick={() => setLang(lang === 'en' ? 'de' : 'en')}
                        title={t('header.language')}
                        aria-label={t('header.language')}
                        id="btn-language"
                    >
                        {lang.toUpperCase()}
                    </button>
                </div>
            </div>
        </header>
    );
}
