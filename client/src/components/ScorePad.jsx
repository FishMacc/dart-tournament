import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n.jsx';

const NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);

export default function ScorePad({ onThrow, onUndo, disabled, canUndo }) {
    const { t } = useI18n();
    const [multiplier, setMultiplier] = useState(1);

    const handleNumberClick = (num) => {
        if (disabled) return;
        onThrow(num, multiplier);
        setMultiplier(1); // Reset to single after throw
    };

    const handleBull = () => {
        if (disabled) return;
        // Bull: value 25. Single = 25pts, Double = 50pts (bullseye); there is no triple bull
        onThrow(25, multiplier === 3 ? 2 : multiplier);
        setMultiplier(1);
    };

    const handleMiss = () => {
        if (disabled) return;
        onThrow(0, 1);
        setMultiplier(1);
    };

    return (
        <div>
            <div className="segmented multiplier-row" role="group">
                {[[1, 'pad.single'], [2, 'pad.double'], [3, 'pad.triple']].map(([m, key]) => (
                    <button
                        key={m}
                        type="button"
                        className={`mult-${m}`}
                        aria-pressed={multiplier === m}
                        onClick={() => setMultiplier(m)}
                    >
                        {t(key)}
                    </button>
                ))}
            </div>

            <div className="number-pad">
                {NUMBERS.map((num) => (
                    <button key={num} className="number-btn" onClick={() => handleNumberClick(num)} disabled={disabled}>
                        {num}
                    </button>
                ))}
            </div>

            <div className="pad-specials">
                <button className="number-btn bull" onClick={handleBull} disabled={disabled}>
                    {t('pad.bull')}
                </button>
                <button className="number-btn miss" onClick={handleMiss} disabled={disabled}>
                    {t('pad.miss')}
                </button>
                <button className="number-btn undo" onClick={onUndo} disabled={disabled || !canUndo}>
                    <RotateCcw size={17} /> {t('pad.undo')}
                </button>
            </div>
        </div>
    );
}
