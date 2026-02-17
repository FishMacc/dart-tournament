import { useNavigate } from 'react-router-dom';
import { Zap, Rocket, BookOpen, Trophy, Smartphone, Lock, BarChart, Palette, Award, TrendingUp } from 'lucide-react';

export default function HomePage() {
    const navigate = useNavigate();

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
                        <span>Open Source Dart-Turnier-Software</span>
                    </div>

                    <h1 className="hero-title">
                        Dein Dart-Turnier.{' '}
                        <span style={{
                            background: 'var(--gradient-accent)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            Professionell.
                        </span>
                    </h1>

                    <p className="hero-subtitle">
                        Erstelle und verwalte Dart-Turniere in Echtzeit. Automatische Turnierbäume,
                        Live-Scoring über mobile Geräte und professionelle Verwaltung — alles lokal in deinem Netzwerk.
                    </p>

                    <div className="hero-actions">
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleGetStarted}
                            id="btn-get-started"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Rocket size={20} /> Turnier erstellen
                        </button>
                        <a href="#tutorial" className="btn btn-secondary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen size={20} /> Anleitung
                        </a>
                    </div>
                </div>
            </section>

            {/* ═══════ FEATURES ═══════ */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Alles was du brauchst</h2>
                        <p>Professionelle Features für dein nächstes Dart-Turnier</p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <span className="feature-icon"><Trophy size={32} /></span>
                            <h3>Auto-Turnierbaum</h3>
                            <p>Automatische Bracket-Erstellung für beliebig viele Spieler. Unterstützt Byes und Seeding.</p>
                        </div>
                        <div className="feature-card">
                            <span className="feature-icon"><Smartphone size={32} /></span>
                            <h3>Mobile Scoring</h3>
                            <p>Punkte über QR-Code auf dem Handy eintragen. Kein Extra-Gerät oder App nötig.</p>
                        </div>
                        <div className="feature-card">
                            <span className="feature-icon"><Lock size={32} /></span>
                            <h3>PIN-Schutz</h3>
                            <p>Optionaler Match-PIN verhindert unbefugtes Eintragen von Ergebnissen.</p>
                        </div>
                        <div className="feature-card">
                            <span className="feature-icon"><BarChart size={32} /></span>
                            <h3>Live Tracking</h3>
                            <p>Zuschauer können das Spiel live verfolgen — Scores, Würfe und Legs in Echtzeit.</p>
                        </div>
                        <div className="feature-card">
                            <span className="feature-icon"><Palette size={32} /></span>
                            <h3>Themes</h3>
                            <p>Wähle aus verschiedenen Themes: Obsidian, Neon oder Classic. Dein Turnier, dein Style.</p>
                        </div>
                        <div className="feature-card">
                            <span className="feature-icon"><Award size={32} /></span>
                            <h3>Preispool</h3>
                            <p>Spiele um echtes Geld mit Entry-Fee und automatischer Gewinnberechnung. Flexible Verteilung: Winner-takes-all, Top-4-Split oder benutzerdefiniert.</p>
                        </div>
                        <div className="feature-card">
                            <span className="feature-icon"><TrendingUp size={32} /></span>
                            <h3>Statistiken</h3>
                            <p>Detaillierte Turnierstatistiken: Averages, Best Leg, Highest Finish und Preisgeld — alles auf einen Blick.</p>
                        </div>
                        <div className="feature-card">
                            <span className="feature-icon"><Zap size={32} /></span>
                            <h3>Instant Start</h3>
                            <p>Kein Account, kein Cloud — starte sofort. Alles läuft lokal in deinem Netzwerk.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ TUTORIAL ═══════ */}
            <section className="tutorial-section" id="tutorial">
                <div className="container">
                    <div className="section-header">
                        <h2>So funktioniert's</h2>
                        <p>In 5 einfachen Schritten zum perfekten Turnier</p>
                    </div>

                    <div className="tutorial-steps">
                        <div className="tutorial-step animate-fade-in">
                            <div className="tutorial-step-number">1</div>
                            <div className="tutorial-step-content">
                                <h3>Turnier erstellen</h3>
                                <p>
                                    Klicke auf „Turnier erstellen" und wähle deinen Spielmodus (301, 501 oder 701),
                                    die Anzahl der Legs und zusätzliche Einstellungen wie PIN-Schutz, Double-Out
                                    oder einen Preispool mit Entry-Fee und Gewinnverteilung.
                                </p>
                            </div>
                        </div>

                        <div className="tutorial-step animate-fade-in">
                            <div className="tutorial-step-number">2</div>
                            <div className="tutorial-step-content">
                                <h3>Spieler hinzufügen</h3>
                                <p>
                                    Gib die Namen aller Teilnehmer ein. Es werden mindestens 2 Spieler benötigt.
                                    Der Turnierbaum wird automatisch generiert — auch bei ungerader Spieleranzahl (Freilose).
                                </p>
                            </div>
                        </div>

                        <div className="tutorial-step animate-fade-in">
                            <div className="tutorial-step-number">3</div>
                            <div className="tutorial-step-content">
                                <h3>QR-Code teilen</h3>
                                <p>
                                    Nach dem Start wird ein QR-Code angezeigt. Spieler scannen diesen mit dem Handy,
                                    um in die Mobile-Ansicht zu gelangen und dort Punkte einzutragen.
                                </p>
                            </div>
                        </div>

                        <div className="tutorial-step animate-fade-in">
                            <div className="tutorial-step-number">4</div>
                            <div className="tutorial-step-content">
                                <h3>Spiele durchführen</h3>
                                <p>
                                    Starte Matches über den Host-Bildschirm oder lasse sie automatisch starten.
                                    Spieler geben den Match-PIN auf ihrem Handy ein und tragen ihre Würfe ein.
                                    Das System berechnet Scores, erkennt Busts und Finishes automatisch.
                                </p>
                            </div>
                        </div>

                        <div className="tutorial-step animate-fade-in">
                            <div className="tutorial-step-number">5</div>
                            <div className="tutorial-step-content">
                                <h3>Gewinner feiern!</h3>
                                <p>
                                    Der Turnierbaum aktualisiert sich automatisch. Gewinner rücken in die nächste Runde vor,
                                    bis der Turniersieger feststeht. 🏆
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
