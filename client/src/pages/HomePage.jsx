import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n.jsx';

export default function HomePage() {
    const navigate = useNavigate();
    const { t } = useI18n();

    return (
        <section className="home">
            <div>
                <div className="eyebrow">{t('home.eyebrow')}</div>
                <h1 className="display home-title">
                    {t('home.title')} <span className="accent">{t('home.titleAccent')}</span>
                </h1>
                <p className="home-text">{t('home.text')}</p>
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/setup')} id="btn-get-started">
                    {t('home.cta')} <ArrowRight size={18} />
                </button>
            </div>

            <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>{t('home.stepsTitle')}</div>
                <ol className="steps">
                    {[1, 2, 3].map((n) => (
                        <li key={n} className="step">
                            <span className="num step-num">{String(n).padStart(2, '0')}</span>
                            <span className="step-title">{t(`home.s${n}.title`)}</span>
                            <span className="step-text">{t(`home.s${n}.text`)}</span>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
