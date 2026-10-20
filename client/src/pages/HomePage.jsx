import { useNavigate } from 'react-router-dom';
import { Zap, Rocket, BookOpen, Trophy, Smartphone, Lock, BarChart, Palette, Award, TrendingUp } from 'lucide-react';
import { useI18n } from '../i18n.jsx';

const FEATURES = [
    { key: 'bracket', Icon: Trophy },
    { key: 'mobile', Icon: Smartphone },
    { key: 'pin', Icon: Lock },
    { key: 'live', Icon: BarChart },
    { key: 'themes', Icon: Palette },
    { key: 'prize', Icon: Award },
    { key: 'stats', Icon: TrendingUp },
    { key: 'instant', Icon: Zap },
];

export default function HomePage() {
    const navigate = useNavigate();
    const { t } = useI18n();

    const handleGetStarted = () => {
        navigate('/setup');
    };

    return (
        <div className="homepage animate-fade-in">
            {/* ═══════ HERO SECTION ═══════ */}
            <section className="hero-section">
                <div className="container hero-content">
                    <div className="hero-badge">
                        <Zap size={14} className="text-accent" />
                        <span>{t('home.badge')}</span>
                    </div>

                    <h1 className="hero-title">
                        {t('home.title')}{' '}
                        <span style={{
                            background: 'var(--gradient-accent)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            {t('home.titleAccent')}
                        </span>
                    </h1>

                    <p className="hero-subtitle">
                        {t('home.subtitle')}
                    </p>

                    <div className="hero-actions">
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleGetStarted}
                            id="btn-get-started"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Rocket size={20} /> {t('home.cta')}
                        </button>
                        <a href="#tutorial" className="btn btn-secondary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen size={20} /> {t('home.guide')}
                        </a>
                    </div>
                </div>
            </section>

            {/* ═══════ FEATURES ═══════ */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2>{t('home.features.title')}</h2>
                        <p>{t('home.features.subtitle')}</p>
                    </div>

                    <div className="features-grid">
                        {FEATURES.map(({ key, Icon }) => (
                            <div key={key} className="feature-card">
                                <span className="feature-icon"><Icon size={32} /></span>
                                <h3>{t(`home.f.${key}.title`)}</h3>
                                <p>{t(`home.f.${key}.text`)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ TUTORIAL ═══════ */}
            <section className="tutorial-section" id="tutorial">
                <div className="container">
                    <div className="section-header">
                        <h2>{t('home.steps.title')}</h2>
                        <p>{t('home.steps.subtitle')}</p>
                    </div>

                    <div className="tutorial-steps">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} className="tutorial-step animate-fade-in">
                                <div className="tutorial-step-number">{n}</div>
                                <div className="tutorial-step-content">
                                    <h3>{t(`home.s${n}.title`)}</h3>
                                    <p>{t(`home.s${n}.text`)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
