import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, RotateCcw, ArrowRight } from 'lucide-react';
import socket from '../socket.js';
import { useI18n } from '../i18n.jsx';

const GAME_TYPES = ['301', '501', '701'];
const LEG_OPTIONS = [1, 2, 3, 4, 5]; // legs to win: 1 = single leg, 2 = best of 3, …

function Toggle({ label, desc, checked, onChange, disabled }) {
    return (
        <div className="setting-row">
            <div>
                <div className="setting-label">{label}</div>
                <div className="setting-desc">{desc}</div>
            </div>
            <label className="toggle-switch">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    aria-label={label}
                />
                <span className="toggle-slider"></span>
            </label>
        </div>
    );
}

export default function SetupPage({ tournament }) {
    const navigate = useNavigate();
    const { t, money, errorText } = useI18n();
    const [gameType, setGameType] = useState('501');
    const [legsToWin, setLegsToWin] = useState(1);
    const [playerName, setPlayerName] = useState('');
    const [error, setError] = useState('');

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

    const players = tournament?.players || [];
    const isTournamentCreated = !!tournament;
    const customSum = customDist[0] + customDist[1] + customDist[2];

    const handleCreateTournament = () => {
        if (isLoading) return;
        if (enablePrizePool && (!entryFee || Number(entryFee) < 0.50)) {
            setError(t('setup.err.fee'));
            return;
        }
        if (enablePrizePool && distributionMode === 'custom' && customSum !== 100) {
            setError(t('setup.err.sum', { sum: customSum }));
            return;
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

    const setCustomShare = (index, value) => {
        const next = [...customDist];
        next[index] = parseInt(value) || 0;
        setCustomDist(next);
    };

    const legsLabel = (n) => (n === 1 ? t('setup.legs.single') : t('setup.legs.bestOf', { n: n * 2 - 1 }));

    return (
        <div>
            <div className="page-head">
                <div>
                    <div className="eyebrow">{isTournamentCreated ? t('setup.step2') : t('setup.step1')}</div>
                    <h1 className="display page-title">
                        {isTournamentCreated && tournament?.name ? tournament.name : t('setup.newTournament')}
                    </h1>
                </div>
                {isTournamentCreated && (
                    <button className="btn btn-ghost btn-sm" onClick={() => socket.emit('reset_tournament')}>
                        <RotateCcw size={14} /> {t('setup.reconfigure')}
                    </button>
                )}
            </div>

            {error && <div className="alert-error" role="alert" style={{ marginBottom: 20 }}>{error}</div>}

            <div className="setup-grid">
                {/* Settings */}
                <section className="panel">
                    <div className="panel-head">
                        <span className="eyebrow">{t('setup.settings')}</span>
                        {isTournamentCreated && (
                            <span className="badge badge-success">
                                {t('setup.created', { type: tournament.type })}
                                {!tournament.settings?.requirePin && t('setup.noPin')}
                            </span>
                        )}
                    </div>
                    <div className="panel-body">
                        <div className="field">
                            <label className="field-label" htmlFor="input-tournament-name">{t('setup.name')}</label>
                            <input
                                className="input"
                                type="text"
                                placeholder={t('setup.namePlaceholder')}
                                value={isTournamentCreated ? (tournament.name || '') : tournamentName}
                                onChange={(e) => setTournamentName(e.target.value)}
                                disabled={isTournamentCreated}
                                id="input-tournament-name"
                            />
                        </div>

                        <div className="field">
                            <span className="field-label">{t('setup.gameMode')}</span>
                            <div className="segmented" role="group" aria-label={t('setup.gameMode')}>
                                {GAME_TYPES.map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        className="num"
                                        style={{ fontSize: 20 }}
                                        aria-pressed={(isTournamentCreated ? tournament.type : gameType) === type}
                                        onClick={() => setGameType(type)}
                                        disabled={isTournamentCreated}
                                        id={`game-${type}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="field">
                            <span className="field-label">{t('setup.legs')}</span>
                            <div className="segmented" role="group" aria-label={t('setup.legs')}>
                                {LEG_OPTIONS.map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        aria-pressed={(isTournamentCreated ? tournament.legsToWin : Number(legsToWin)) === n}
                                        onClick={() => setLegsToWin(n)}
                                        disabled={isTournamentCreated}
                                        id={`legs-${n}`}
                                    >
                                        {legsLabel(n)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: 24 }}>
                            <div className="eyebrow" style={{ marginBottom: 4 }}>{t('setup.advanced')}</div>
                            <Toggle label={t('setup.pin')} desc={t('setup.pin.desc')} checked={requirePin} onChange={setRequirePin} disabled={isTournamentCreated} />
                            <Toggle label={t('setup.doubleOut')} desc={t('setup.doubleOut.desc')} checked={doubleOut} onChange={setDoubleOut} disabled={isTournamentCreated} />
                            <Toggle label={t('setup.autoStart')} desc={t('setup.autoStart.desc')} checked={autoStartMatches} onChange={setAutoStartMatches} disabled={isTournamentCreated} />
                            <Toggle label={t('setup.shuffle')} desc={t('setup.shuffle.desc')} checked={shufflePlayers} onChange={setShufflePlayers} disabled={isTournamentCreated} />
                            <Toggle label={t('setup.prize')} desc={t('setup.prize.desc')} checked={enablePrizePool} onChange={setEnablePrizePool} disabled={isTournamentCreated} />

                            {enablePrizePool && (
                                <div className="prize-box">
                                    <div className="field">
                                        <label className="field-label" htmlFor="input-entry-fee">{t('setup.entryFee')}</label>
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
                                    <div className="field">
                                        <label className="field-label" htmlFor="select-distribution">{t('setup.distribution')}</label>
                                        <select
                                            className="input"
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
                                    {distributionMode === 'custom' && (
                                        <div className="field">
                                            <span className="field-label">{t('setup.dist.customLabel')}</span>
                                            <div className="split-grid">
                                                {['setup.place1', 'setup.place2', 'setup.place34'].map((key, i) => (
                                                    <label key={key} className="field">
                                                        <span className="setting-desc">{t(key)}</span>
                                                        <input
                                                            type="number"
                                                            className="input"
                                                            min="0"
                                                            max="100"
                                                            value={customDist[i]}
                                                            onChange={(e) => setCustomShare(i, e.target.value)}
                                                            disabled={isTournamentCreated}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                            <span className="setting-desc" style={{ color: customSum === 100 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                                                {t('setup.sum', { sum: customSum })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {!isTournamentCreated && (
                            <button
                                className="btn btn-primary btn-lg btn-block"
                                onClick={handleCreateTournament}
                                disabled={isLoading}
                                style={{ marginTop: 24 }}
                                id="btn-create-tournament"
                            >
                                {isLoading ? t('setup.creating') : t('setup.create')}
                            </button>
                        )}
                    </div>
                </section>

                {/* Players */}
                <section className="panel">
                    <div className="panel-head">
                        <span className="eyebrow">{t('setup.playersTitle')}</span>
                        <span className="num" style={{ fontSize: 22 }}>{players.length}</span>
                    </div>
                    <div className="panel-body">
                        {isTournamentCreated ? (
                            <>
                                <form onSubmit={handleAddPlayer} className="player-add-row">
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
                                    <button className="btn btn-secondary" type="submit" id="btn-add-player" title={t('setup.addPlayer')} aria-label={t('setup.addPlayer')}>
                                        <Plus size={20} />
                                    </button>
                                </form>

                                {players.length > 0 ? (
                                    <ul className="player-list">
                                        {players.map((player, idx) => (
                                            <li key={player.id} className="player-item">
                                                <span className="num player-item-number">{idx + 1}</span>
                                                <span className="player-item-name">{player.name}</span>
                                                <button
                                                    className="player-remove-btn"
                                                    onClick={() => handleRemovePlayer(player.id)}
                                                    title={t('setup.removePlayer')}
                                                    aria-label={t('setup.removePlayer')}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="empty">{t('setup.noPlayers')}</p>
                                )}

                                {players.length >= 2 && enablePrizePool && players.length < 4 && (distributionMode === 'split_50_30_20' || (distributionMode === 'custom' && customDist[2] > 0)) && (
                                    <p className="note" style={{ marginTop: 16 }}>{t('setup.noSemiWarning')}</p>
                                )}

                                {tournament.settings?.entryFee > 0 && players.length > 0 && (
                                    <div className="spread" style={{ marginTop: 16 }}>
                                        <span className="muted">{t('tournament.prizePool')}</span>
                                        <span className="num" style={{ fontSize: 24 }}>{money(tournament.settings.entryFee * players.length)}</span>
                                    </div>
                                )}

                                {players.length >= 2 ? (
                                    <button
                                        className="btn btn-primary btn-lg btn-block"
                                        onClick={handleStartTournament}
                                        disabled={isLoading}
                                        style={{ marginTop: 20 }}
                                        id="btn-start-tournament"
                                    >
                                        {isLoading ? t('setup.starting') : t('setup.start', { count: players.length })}
                                        {!isLoading && <ArrowRight size={18} />}
                                    </button>
                                ) : (
                                    <p className="setting-desc" style={{ marginTop: 16, textAlign: 'center' }}>{t('setup.minPlayers')}</p>
                                )}
                            </>
                        ) : (
                            <p className="empty">{t('setup.createFirst')}</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
