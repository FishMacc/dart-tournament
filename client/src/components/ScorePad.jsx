import { useState } from 'react';
import { Target, X, RotateCcw } from 'lucide-react';

const NUMBERS = [
    1, 2, 3, 4, 5,
    6, 7, 8, 9, 10,
    11, 12, 13, 14, 15,
    16, 17, 18, 19, 20,
];

export default function ScorePad({ onThrow, onUndo, disabled, canUndo }) {
    const [multiplier, setMultiplier] = useState(1);

    const handleNumberClick = (num) => {
        if (disabled) return;
        onThrow(num, multiplier);
        setMultiplier(1); // Reset to single after throw
    };

    const handleBull = () => {
        if (disabled) return;
        // Bull: value 25. Single = 25pts, Double = 50pts (Bull's Eye)
        onThrow(25, multiplier === 3 ? 2 : multiplier); // No triple bull
        setMultiplier(1);
    };

    const handleMiss = () => {
        if (disabled) return;
        onThrow(0, 1);
        setMultiplier(1);
    };

    return (
        <div>
            {/* Multiplier Row */}
            <div className="multiplier-row">
                <button
                    className={`multiplier-btn ${multiplier === 1 ? 'selected' : ''}`}
                    onClick={() => setMultiplier(1)}
                >
                    Single
                </button>
                <button
                    className={`multiplier-btn ${multiplier === 2 ? 'selected' : ''}`}
                    onClick={() => setMultiplier(2)}
                >
                    Double
                </button>
                <button
                    className={`multiplier-btn ${multiplier === 3 ? 'selected' : ''}`}
                    onClick={() => setMultiplier(3)}
                >
                    Triple
                </button>
            </div>

            {/* Number Pad */}
            <div className="number-pad">
                {NUMBERS.map((num) => (
                    <button
                        key={num}
                        className="number-btn"
                        onClick={() => handleNumberClick(num)}
                        disabled={disabled}
                    >
                        {num}
                    </button>
                ))}
            </div>

            {/* Special Buttons */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '0.5rem',
                marginBottom: '0.75rem',
            }}>
                <button
                    className="number-btn bull"
                    onClick={handleBull}
                    disabled={disabled}
                    style={{ aspectRatio: 'auto', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <Target size={20} /> Bull
                </button>
                <button
                    className="number-btn miss"
                    onClick={handleMiss}
                    disabled={disabled}
                    style={{ aspectRatio: 'auto', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <X size={20} /> Miss
                </button>
                <button
                    className="btn btn-ghost"
                    onClick={onUndo}
                    disabled={disabled || !canUndo}
                    style={{
                        padding: '0.75rem',
                        opacity: canUndo ? 1 : 0.4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                >
                    <RotateCcw size={20} /> Undo
                </button>
            </div>
        </div>
    );
}
