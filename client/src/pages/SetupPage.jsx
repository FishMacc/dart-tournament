import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Users, Settings, Lock, Zap, Shuffle, Sparkles, RotateCcw, Rocket, Check, X, Plus } from 'lucide-react';
import socket from '../socket.js';

export default function SetupPage({ tournament }) {
    const navigate = useNavigate();
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

    const handleCreateTournament = () => {
        socket.emit('create_tournament', {
            type: gameType,
            legsToWin: parseInt(legsToWin),
            settings: {
                name: tournamentName.trim(),
                requirePin,
                doubleOut,
                autoStartMatches,
                shufflePlayers,
            }
        }, (res) => {
            if (!res.success) setError(res.error);
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
                setError(res.error);
            }
        });
    };

    const handleRemovePlayer = (playerId) => {
        socket.emit('remove_player', { playerId });
    };

    const handleStartTournament = () => {
        socket.emit('start_tournament', {}, (res) => {
            if (res.success) {
                navigate('/');
            } else {
                setError(res.error);
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
                    {isTournamentCreated && tournament?.name ? tournament.name : 'Neues Turnier'}
                </h1>
                <p>
                    {isTournamentCreated
                        ? 'Füge Spieler hinzu und starte das Turnier'
                        : 'Konfiguriere dein Turnier und starte durch'}
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
                        <span>Einstellungen</span>
                    </div>

                    {/* Tournament Name */}
                    <div className="form-group">
                        <label className="form-label">Turniername (optional)</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="z.B. Freitags-Turnier 🎯"
                            value={tournamentName}
                            onChange={(e) => setTournamentName(e.target.value)}
                            disabled={isTournamentCreated}
                            id="input-tournament-name"
                        />
                    </div>

                    {/* Game Mode */}
                    <div className="form-group">
                        <label className="form-label">Spielmodus</label>
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
                        <label className="form-label">Legs zum Sieg</label>
                        <select
                            className="input select"
                            value={legsToWin}
                            onChange={(e) => setLegsToWin(e.target.value)}
                            disabled={isTournamentCreated}
                            id="select-legs"
                        >
                            <option value="1">Best of 1</option>
                            <option value="2">Best of 3</option>
                            <option value="3">Best of 5</option>
                            <option value="4">Best of 7</option>
                            <option value="5">Best of 9</option>
                        </select>
                    </div>

                    {/* Advanced Settings */}
                    <div className="settings-group">
                        <div className="settings-group-title">Erweiterte Einstellungen</div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label"><Lock size={16} /> PIN-Schutz</span>
                                <span className="setting-desc">Match-PIN zum Eintragen erforderlich</span>
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
                                <span className="setting-label"><Target size={16} /> Double-Out</span>
                                <span className="setting-desc">Letzter Wurf muss ein Double sein</span>
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
                                <span className="setting-label"><Zap size={16} /> Auto-Start</span>
                                <span className="setting-desc">Matches starten automatisch</span>
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
                                <span className="setting-label"><Shuffle size={16} /> Spieler mischen</span>
                                <span className="setting-desc">Zufällige Reihenfolge im Bracket</span>
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
                    </div>

                    {/* Create Button */}
                    {!isTournamentCreated && (
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleCreateTournament}
                            style={{ width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            id="btn-create-tournament"
                        >
                            <Sparkles size={20} /> Turnier erstellen
                        </button>
                    )}

                    {isTournamentCreated && (
                        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                            <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.35rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Check size={14} /> Turnier erstellt — {tournament.type}
                                {!tournament.settings?.requirePin && ' • Ohne PIN'}
                            </span>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                    socket.emit('reset_tournament');
                                }}
                                style={{ margin: '0.75rem auto 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <RotateCcw size={14} /> Neu konfigurieren
                            </button>
                        </div>
                    )}
                </div>

                {/* ═══════ RIGHT: Players ═══════ */}
                <div className="card">
                    <div className="setup-section-title">
                        <Users size={20} />
                        <span>Spieler ({players.length})</span>
                    </div>

                    {isTournamentCreated ? (
                        <>
                            <form onSubmit={handleAddPlayer}>
                                <div className="player-add-row">
                                    <input
                                        className="input"
                                        type="text"
                                        placeholder="Spielername eingeben..."
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        id="input-player-name"
                                        autoFocus
                                    />
                                    <button className="btn btn-primary" type="submit" id="btn-add-player" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                                            title="Spieler entfernen"
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
                                        Noch keine Spieler hinzugefügt
                                    </p>
                                </div>
                            )}

                            {players.length >= 2 && (
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={handleStartTournament}
                                    style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    id="btn-start-tournament"
                                >
                                    <Rocket size={20} /> Turnier starten ({players.length} Spieler)
                                </button>
                            )}

                            {players.length > 0 && players.length < 2 && (
                                <p className="text-muted text-center mt-2" style={{ fontSize: '0.85rem' }}>
                                    Mindestens 2 Spieler benötigt
                                </p>
                            )}
                        </>
                    ) : (
                        <div className="text-center mt-2" style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ marginBottom: '0.75rem', opacity: 0.4 }}><Settings size={40} /></div>
                            <p className="text-muted">
                                Erstelle zuerst ein Turnier, um Spieler hinzuzufügen
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
