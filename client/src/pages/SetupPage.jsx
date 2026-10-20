import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Users, Settings, Lock, Zap, Shuffle, Sparkles, RotateCcw, Rocket, Check, X, Plus } from 'lucide-react';
import socket from '../socket.js';
import { useI18n } from '../i18n.jsx';

export default function SetupPage({ tournament }) {
    const navigate = useNavigate();
    const { t, errorText } = useI18n();
    const [gameType, setGameType] = useState('501');
    const [legsToWin, setLegsToWin] = useState(1);
    const [playerName, setPlayerName] = useState('');
    const [error, setError] = useState('');

    // Settings
    const [requirePin, setRequirePin] = useState(true);
    const [doubleOut, setDoubleOut] = useState(true);
    const [autoStartMatches, setAutoStartMatches] = useState(false);
    const [shufflePlayers, setShufflePlayers] = useState(true);
    const [tournamentName, setTournamentName] = useState('');
    const [entryFee, setEntryFee] = useState('');
    const [distributionMode, setDistributionMode] = useState('winner_100');
    const [customDist, setCustomDist] = useState([50, 30, 20]);
    const [enablePrizePool, setEnablePrizePool] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateTournament = () => {
        if (isLoading) return;
        if (enablePrizePool && (!entryFee || Number(entryFee) < 0.50)) {
            setError(t('setup.err.fee'));
            return;
        }
        if (enablePrizePool && distributionMode === 'custom') {
            const sum = customDist.reduce((a, b) => a + b, 0);
            if (sum !== 100) {
                setError(t('setup.err.sum', { sum }));
                return;
            }
        }

        setIsLoading(true);
        socket.emit('create_tournament', {
            type: gameType,
            legsToWin: parseInt(legsToWin),
            settings: {
                name: tournamentName.trim(),
                requirePin,
                doubleOut,
                autoStartMatches,
                shufflePlayers,
                entryFee: enablePrizePool ? (Number(entryFee) || 0) : 0,
                distributionMode: enablePrizePool ? distributionMode : 'winner_100',
                distributionValues: (enablePrizePool && distributionMode === 'custom') ? customDist : null,
            }
        }, (res) => {
            setIsLoading(false);
            if (!res.success) setError(errorText(res));
            else setError('');
        });
    };

    const handleAddPlayer = (e) => {
        e.preventDefault();
        if (!playerName.trim()) return;
        socket.emit('add_player', { name: playerName.trim() }, (res) => {
            if (res.success) {
                setPlayerName('');
                setError('');
            } else {
                setError(errorText(res));
            }
        });
    };

    const handleRemovePlayer = (playerId) => {
        socket.emit('remove_player', { playerId });
    };

    const handleStartTournament = () => {
        if (isLoading) return;
        setIsLoading(true);
        socket.emit('start_tournament', {}, (res) => {
            setIsLoading(false);
            if (res.success) {
                navigate('/');
            } else {
                setError(errorText(res));
            }
        });
    };

    const players = tournament?.players || [];
    const isTournamentCreated = tournament !== null;

    return (
        <div className="setup-page animate-fade-in">
            {/* Hero */}
            <div className="setup-hero">
                <h1>
                    <Target className="inline-icon" size={32} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                    {isTournamentCreated && tournament?.name ? tournament.name : t('setup.newTournament')}
                </h1>
                <p>
                    {isTournamentCreated ? t('setup.subtitle.players') : t('setup.subtitle.create')}
                </p>
            </div>

            {error && (
                <div className="alert-error" role="alert">
                    {error}
                </div>
            )}

            <div className="setup-grid">
                {/* ═══════ LEFT: Game Settings ═══════ */}
                <div className="card">
                    <div className="setup-section-title">
                        <Settings size={20} />
                        <span>{t('setup.settings')}</span>
                    </div>

                    {/* Tournament Name */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="input-tournament-name">{t('setup.name')}</label>
                        <input
                            className="input"
                            type="text"
                            placeholder={t('setup.namePlaceholder')}
                            value={tournamentName}
                            onChange={(e) => setTournamentName(e.target.value)}
                            disabled={isTournamentCreated}
                            id="input-tournament-name"
                        />
                    </div>

                    {/* Game Mode */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="select-game-type">{t('setup.gameMode')}</label>
                        <select
                            className="input select"
                            value={gameType}
                            onChange={(e) => setGameType(e.target.value)}
                            disabled={isTournamentCreated}
                            id="select-game-type"
                        >
                            <option value="301">301</option>
                            <option value="501">501</option>
                            <option value="701">701</option>
                        </select>
                    </div>

                    {/* Legs */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="select-legs">{t('setup.legs')}</label>
                        <select
                            className="input select"
                            value={legsToWin}
                            onChange={(e) => setLegsToWin(e.target.value)}
                            disabled={isTournamentCreated}
                            id="select-legs"
                        >
                            <option value="1">{t('setup.legs.single')}</option>
                            <option value="2">{t('setup.legs.bestOf', { n: 3 })}</option>
                            <option value="3">{t('setup.legs.bestOf', { n: 5 })}</option>
                            <option value="4">{t('setup.legs.bestOf', { n: 7 })}</option>
                            <option value="5">{t('setup.legs.bestOf', { n: 9 })}</option>
                        </select>
                    </div>

                    {/* Advanced Settings */}
                    <div className="settings-group">
                        <div className="settings-group-title">{t('setup.advanced')}</div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label"><Lock size={16} /> {t('setup.pin')}</span>
                                <span className="setting-desc">{t('setup.pin.desc')}</span>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={requirePin}
                                    onChange={(e) => setRequirePin(e.target.checked)}
                                    disabled={isTournamentCreated}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label"><Target size={16} /> {t('setup.doubleOut')}</span>
                                <span className="setting-desc">{t('setup.doubleOut.desc')}</span>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={doubleOut}
                                    onChange={(e) => setDoubleOut(e.target.checked)}
                                    disabled={isTournamentCreated}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label"><Zap size={16} /> {t('setup.autoStart')}</span>
                                <span className="setting-desc">{t('setup.autoStart.desc')}</span>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={autoStartMatches}
                                    onChange={(e) => setAutoStartMatches(e.target.checked)}
                                    disabled={isTournamentCreated}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label"><Shuffle size={16} /> {t('setup.shuffle')}</span>
                                <span className="setting-desc">{t('setup.shuffle.desc')}</span>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={shufflePlayers}
                                    onChange={(e) => setShufflePlayers(e.target.checked)}
                                    disabled={isTournamentCreated}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        {/* Prize Pool Toggle */}
                        <div className="setting-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                            <div className="setting-info">
                                <span className="setting-label">💰 {t('setup.prize')}</span>
                                <span className="setting-desc">{t('setup.prize.desc')}</span>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={enablePrizePool}
                                    onChange={(e) => setEnablePrizePool(e.target.checked)}
                                    disabled={isTournamentCreated}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        {/* Money Settings (Conditional, nested) */}
                        {enablePrizePool && (
                            <div className="animate-fade-in" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                {/* Entry Fee */}
                                <div className="form-group">
                                    <label className="form-label" htmlFor="input-entry-fee">{t('setup.entryFee')}</label>
                                    <input
                                        className="input"
                                        type="number"
                                        min="0.50"
                                        step="0.50"
                                        placeholder="0.50"
                                        id="input-entry-fee"
                                        value={entryFee}
                                        onChange={(e) => setEntryFee(e.target.value)}
                                        disabled={isTournamentCreated}
                                    />
                                </div>

                                {/* Distribution Mode */}
                                <div className="form-group">
                                    <label className="form-label" htmlFor="select-distribution">{t('setup.distribution')}</label>
                                    <select
                                        className="input select"
                                        value={distributionMode}
                                        onChange={(e) => setDistributionMode(e.target.value)}
                                        id="select-distribution"
                                        disabled={isTournamentCreated}
                                    >
                                        <option value="winner_100">{t('setup.dist.winner')}</option>
                                        <option value="split_70_30">{t('setup.dist.final')}</option>
                                        <option value="split_50_30_20">{t('setup.dist.top4')}</option>
                                        <option value="custom">{t('setup.dist.custom')}</option>
                                    </select>
                                </div>

                                {/* Custom Distribution Inputs */}
                                {distributionMode === 'custom' && (
                                    <div className="form-group animate-fade-in" style={{ marginTop: '-0.5rem', marginLeft: '1rem', borderLeft: '2px solid var(--accent-primary)', paddingLeft: '1rem' }}>
                                        <label className="form-label" style={{ fontSize: '0.85rem' }}>{t('setup.dist.customLabel')}</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                            <div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('setup.place1')}</span>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    min="0"
                                                    max="100"
                                                    value={customDist[0]}
                                                    onChange={(e) => {
                                                        const newDist = [...customDist];
                                                        newDist[0] = parseInt(e.target.value) || 0;
                                                        setCustomDist(newDist);
                                                    }}
                                                    disabled={isTournamentCreated}
                                                />
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('setup.place2')}</span>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    min="0"
                                                    max="100"
                                                    value={customDist[1]}
                                                    onChange={(e) => {
                                                        const newDist = [...customDist];
                                                        newDist[1] = parseInt(e.target.value) || 0;
                                                        setCustomDist(newDist);
                                                    }}
                                                    disabled={isTournamentCreated}
                                                />
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('setup.place34')}</span>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    min="0"
                                                    max="100"
                                                    value={customDist[2]}
                                                    onChange={(e) => {
                                                        const newDist = [...customDist];
                                                        newDist[2] = parseInt(e.target.value) || 0;
                                                        setCustomDist(newDist);
                                                    }}
                                                    disabled={isTournamentCreated}
                                                />
                                            </div>
                                        </div>
                                        <div style={{
                                            marginTop: '0.25rem',
                                            fontSize: '0.8rem',
                                            color: (customDist[0] + customDist[1] + customDist[2]) === 100 ? 'var(--accent-success)' : 'var(--accent-danger)',
                                            fontWeight: 700
                                        }}>
                                            {t('setup.sum', { sum: customDist[0] + customDist[1] + customDist[2] })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Create Button */}
                    {!isTournamentCreated && (
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleCreateTournament}
                            disabled={isLoading}
                            style={{ width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: isLoading ? 0.6 : 1 }}
                            id="btn-create-tournament"
                        >
                            <Sparkles size={20} /> {isLoading ? t('setup.creating') : t('setup.create')}
                        </button>
                    )}

                    {isTournamentCreated && (
                        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                            <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.35rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Check size={14} /> {t('setup.created', { type: tournament.type })}
                                {!tournament.settings?.requirePin && t('setup.noPin')}
                            </span>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                    socket.emit('reset_tournament');
                                }}
                                style={{ margin: '0.75rem auto 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <RotateCcw size={14} /> {t('setup.reconfigure')}
                            </button>
                        </div>
                    )}
                </div>

                {/* ═══════ RIGHT: Players ═══════ */}
                <div className="card">
                    <div className="setup-section-title">
                        <Users size={20} />
                        <span>{t('setup.players', { count: players.length })}</span>
                    </div>

                    {isTournamentCreated ? (
                        <>
                            <form onSubmit={handleAddPlayer}>
                                <div className="player-add-row">
                                    <input
                                        className="input"
                                        type="text"
                                        placeholder={t('setup.playerPlaceholder')}
                                        aria-label={t('setup.playerPlaceholder')}
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        id="input-player-name"
                                        autoFocus
                                    />
                                    <button className="btn btn-primary" type="submit" id="btn-add-player" title={t('setup.addPlayer')} aria-label={t('setup.addPlayer')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </form>

                            <ul className="player-list">
                                {players.map((player, idx) => (
                                    <li key={player.id} className="player-item">
                                        <div className="player-item-name">
                                            <span className="player-item-number">{idx + 1}</span>
                                            <span>{player.name}</span>
                                        </div>
                                        <button
                                            className="player-remove-btn"
                                            onClick={() => handleRemovePlayer(player.id)}
                                            title={t('setup.removePlayer')}
                                            aria-label={t('setup.removePlayer')}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            {players.length === 0 && (
                                <div className="text-center mt-2" style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ marginBottom: '0.75rem', opacity: 0.5 }}><Users size={40} /></div>
                                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                                        {t('setup.noPlayers')}
                                    </p>
                                </div>
                            )}

                            {players.length >= 2 && enablePrizePool && players.length < 4 && (distributionMode === 'split_50_30_20' || (distributionMode === 'custom' && customDist[2] > 0)) && (
                                <div className="alert-error" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                                    {t('setup.noSemiWarning')}
                                </div>
                            )}

                            {players.length >= 2 && (
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={handleStartTournament}
                                    disabled={isLoading}
                                    style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: isLoading ? 0.6 : 1 }}
                                    id="btn-start-tournament"
                                >
                                    <Rocket size={20} /> {isLoading ? t('setup.starting') : t('setup.start', { count: players.length })}
                                </button>
                            )}

                            {players.length > 0 && players.length < 2 && (
                                <p className="text-muted text-center mt-2" style={{ fontSize: '0.85rem' }}>
                                    {t('setup.minPlayers')}
                                </p>
                            )}
                        </>
                    ) : (
                        <div className="text-center mt-2" style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ marginBottom: '0.75rem', opacity: 0.4 }}><Settings size={40} /></div>
                            <p className="text-muted">
                                {t('setup.createFirst')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
