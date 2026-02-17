import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for handling Text-to-Speech (TTS) and Sound Effects (SFX).
 * 
 * @returns {Object} { speak, playSfx, isMuted, toggleMute }
 */
export function useAudio() {
    // Persist mute state in localStorage
    const [isMuted, setIsMuted] = useState(() => {
        const saved = localStorage.getItem('dart_audio_muted');
        return saved === 'true';
    });

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const newValue = !prev;
            localStorage.setItem('dart_audio_muted', String(newValue));
            // Cancel any ongoing speech when muting
            if (newValue) {
                window.speechSynthesis.cancel();
            }
            return newValue;
        });
    }, []);

    /**
     * Text-to-Speech
     * @param {string} text - The text to speak
     */
    const speak = useCallback((text) => {
        if (isMuted || !text) return;

        // Verify browser support
        if (!('speechSynthesis' in window)) return;

        // Cancel previous utterances to avoid queue buildup (e.g. fast scoring)
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Optional: configure voice/speed/pitch here
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US'; // Default to English, matches standard caller

        window.speechSynthesis.speak(utterance);
    }, [isMuted]);

    /**
     * Play Sound Effect
     * Play Sound Effect using Web Audio API (Synthesizer)
     * @param {string} type - 'win', 'bust', 'high_score', 'low_score'
     */
    const playSfx = useCallback((type) => {
        if (isMuted || !audioCtx) return;

        try {
            // Check state and try to resume if suspended (might fail without gesture, but worth a try)
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            switch (type) {
                case 'win': // Fanfare-like sequence
                    playTone(audioCtx, 523.25, 'triangle', 0, 0.1); // C5
                    playTone(audioCtx, 659.25, 'triangle', 0.1, 0.1); // E5
                    playTone(audioCtx, 783.99, 'triangle', 0.2, 0.2); // G5
                    playTone(audioCtx, 1046.50, 'square', 0.4, 0.4); // C6
                    break;
                case 'bust': // Sad trombone
                    playTone(audioCtx, 400, 'sawtooth', 0, 0.3);
                    playTone(audioCtx, 380, 'sawtooth', 0.3, 0.3);
                    playTone(audioCtx, 360, 'sawtooth', 0.6, 0.6);
                    break;
                case 'high_score': // High pitch cheer/beeps
                    playTone(audioCtx, 880, 'sine', 0, 0.1);
                    playTone(audioCtx, 1100, 'sine', 0.1, 0.1);
                    playTone(audioCtx, 1320, 'sine', 0.2, 0.3);
                    break;
                case 'low_score': // Short dull thud
                    playTone(audioCtx, 150, 'square', 0, 0.1);
                    break;
                default:
                    break;
            }
        } catch (e) {
            console.error("Audio synthesis failed:", e);
        }
    }, [isMuted, audioCtx]);

    // Helper to play a single tone
    const playTone = (ctx, freq, type, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);

        // Envelope to avoid clicking
        gain.gain.setValueAtTime(0.1, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

        osc.stop(ctx.currentTime + startTime + duration);
    };

    return { speak, playSfx, isMuted, toggleMute, ctx: audioCtx };
}
