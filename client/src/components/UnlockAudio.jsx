import React, { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';

export default function UnlockAudio({ audio }) {
    const [needsUnlock, setNeedsUnlock] = useState(false);

    useEffect(() => {
        // Check if audio context exists and is suspended
        const checkAudio = () => {
            if (audio && audio.ctx && audio.ctx.state === 'suspended') {
                setNeedsUnlock(true);
            } else {
                setNeedsUnlock(false);
            }
        };

        // Check initially
        checkAudio();

        // Check periodically (in case it gets suspended or created late)
        const interval = setInterval(checkAudio, 1000);
        return () => clearInterval(interval);
    }, [audio]);

    const handleUnlock = async () => {
        if (audio && audio.ctx) {
            try {
                await audio.ctx.resume();
                // Also try to prime speech synthesis
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.resume();
                    // Speak a silent empty string to "warm up" iOS/mobile
                    const utterance = new SpeechSynthesisUtterance('');
                    window.speechSynthesis.speak(utterance);
                }
                setNeedsUnlock(false);
            } catch (err) {
                console.error("Failed to resume audio context:", err);
            }
        }
    };

    if (!needsUnlock) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
        }}>
            <button
                className="btn btn-primary"
                onClick={handleUnlock}
                style={{
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    animation: 'pulse 2s infinite'
                }}
            >
                <Volume2 size={18} style={{ marginRight: '8px' }} />
                Tap to Enable Audio
            </button>
        </div>
    );
}
