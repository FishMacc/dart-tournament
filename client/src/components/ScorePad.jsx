import { useState } from 'react';

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const MULTIPLIER_LABELS = { 1: 'Single', 2: 'Double', 3: 'Triple' };

export default function ScorePad({ onThrow, disabled }) {
    const [multiplier, setMultiplier] = useState(1);

    const handleNumber = (value) => {
        if (disabled) return;
        onThrow(value, multiplier);
        setMultiplier(1); // Reset to single after throw
    };

    const handleBull = () => {
        if (disabled) return;
        // Bull can only be single (25) or double (50)
        const bullMultiplier = multiplier === 3 ? 2 : multiplier;
        onThrow(25, bullMultiplier);
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
                {[1, 2, 3].map((m) => (
                    <button
                        key={m}
                        className={`multiplier-btn ${multiplier === m ? 'selected' : ''}`}
                        onClick={() => setMultiplier(m)}
                        disabled={disabled}
                        id={`multiplier-${MULTIPLIER_LABELS[m].toLowerCase()}`}
                    >
                        {MULTIPLIER_LABELS[m]}
                    </button>
                ))}
            </div>

            {/* Number Pad (4 rows of 5) */}
            <div className="number-pad">
                {NUMBERS.map((n) => (
                    <button
                        key={n}
                        className="number-btn"
                        onClick={() => handleNumber(n)}
                        disabled={disabled}
                        id={`number-${n}`}
                    >
                        {n}
                    </button>
                ))}
            </div>

            {/* Special buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                    className="number-btn bull"
                    onClick={handleBull}
                    disabled={disabled}
                    id="number-bull"
                    style={{ aspectRatio: 'auto', padding: '0.85rem' }}
                >
                    🎯 Bull{multiplier === 2 ? 'seye (50)' : ' (25)'}
                </button>
                <button
                    className="number-btn miss"
                    onClick={handleMiss}
                    disabled={disabled}
                    id="number-miss"
                    style={{ aspectRatio: 'auto', padding: '0.85rem' }}
                >
                    ✕ Miss
                </button>
            </div>
        </div>
    );
}
