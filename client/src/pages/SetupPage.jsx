import { useState } from 'react';
import socket from '../socket.js';

export default function SetupPage({ tournament }) {
    const [gameType, setGameType] = useState('501');
    const [legsToWin, setLegsToWin] = useState(1);
    const [playerName, setPlayerName] = useState('');
    const [error, setError] = useState('');

    const handleCreateTournament = () => {
        socket.emit('create_tournament', { type: gameType, legsToWin: parseInt(legsToWin) }, (res) => {
            if (!res.success) setError(res.error);
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
            if (!res.success) setError(res.error);
        });
    };

    const players = tournament?.players || [];
    const isTournamentCreated = tournament !== null;

    return (
        <div className="animate-fade-in">
            {/* Hero */}
            <div className="hero">
                <h1>🎯 Dart Tournament</h1>
                <p>Erstelle ein Turnier, füge Spieler hinzu und starte das Spiel!</p>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    color: 'var(--accent-danger)',
                    marginBottom: '1.5rem',
                    textAlign: 'center',
                }}>
                    {error}
                </div>
            )}

            <div className="setup-grid">
                {/* Left Column: Game Settings */}
                <div className="card">
                    <div className="setup-section-title">
                        <span>⚙️</span>
                        <span>Spieleinstellungen</span>
                    </div>

                    <div className="mb-2">
                        <label className="text-muted mb-1" style={{ display: 'block', fontSize: '0.85rem' }}>
                            Spielmodus
                        </label>
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

                    <div className="mb-2">
                        <label className="text-muted mb-1" style={{ display: 'block', fontSize: '0.85rem' }}>
                            Legs zum Sieg
                        </label>
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
                        </select>
                    </div>

                    {!isTournamentCreated && (
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleCreateTournament}
                            style={{ width: '100%', marginTop: '1rem' }}
                            id="btn-create-tournament"
                        >
                            Turnier erstellen
                        </button>
                    )}

                    {isTournamentCreated && (
                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <span className="badge badge-success">✓ Turnier erstellt — {tournament.type}</span>
                        </div>
                    )}
                </div>

                {/* Right Column: Players */}
                <div className="card">
                    <div className="setup-section-title">
                        <span>👥</span>
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
                                    <button className="btn btn-primary" type="submit" id="btn-add-player">
                                        +
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
                                        >
                                            ✕
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            {players.length >= 2 && (
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={handleStartTournament}
                                    style={{ width: '100%', marginTop: '1rem' }}
                                    id="btn-start-tournament"
                                >
                                    🚀 Turnier starten ({players.length} Spieler)
                                </button>
                            )}

                            {players.length < 2 && (
                                <p className="text-muted text-center mt-2" style={{ fontSize: '0.85rem' }}>
                                    Mindestens 2 Spieler benötigt
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-muted text-center mt-2">
                            Erstelle zuerst ein Turnier, um Spieler hinzuzufügen
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
