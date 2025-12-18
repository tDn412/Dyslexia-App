import { api } from './api';
import { toast } from 'sonner';

/**
 * Text-to-Speech utility using Backend API
 */

let currentAudio: HTMLAudioElement | null = null;
let isPausedState = false;

export interface SpeakOptions {
    text: string;
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: string;
    onWordBoundary?: (wordIndex: number) => void; // Callback for word highlighting
    onTimeUpdate?: (currentTime: number) => void;
    onEnded?: () => void;
    onDuration?: (duration: number) => void;
}

/**
 * Speak text using Backend API
 */
export const speakText = async (options: SpeakOptions): Promise<void> => {
    try {
        // Stop any currently playing audio
        stopSpeaking();

        const { text, onTimeUpdate, onEnded, onDuration } = options;

        if (!text.trim()) {
            return;
        }

        // Get settings from LocalStorage or use defaults
        let preferredVoice = 'female-1';
        let readingSpeed = 1.0;

        if (typeof window !== 'undefined') {
            const savedVoice = localStorage.getItem('audio-preferred-voice');
            const savedSpeed = localStorage.getItem('audio-reading-speed');
            if (savedVoice) preferredVoice = savedVoice;
            if (savedSpeed) readingSpeed = parseFloat(savedSpeed);
        }

        // Allow options to override global settings (e.g. for Preview)
        if (options.voice) preferredVoice = options.voice;
        if (options.rate) readingSpeed = options.rate;

        // Call API to get audio from Google Cloud TTS
        const response = await api.tts.speak(text, preferredVoice, readingSpeed);

        if (response.error || !response.data?.audioContent) {
            throw new Error(response.error || 'Failed to generate speech');
        }

        // Decode base64 and play
        const audioSrc = `data:audio/mp3;base64,${response.data.audioContent}`;
        const audio = new Audio(audioSrc);
        audio.playbackRate = 1.0; // We handle speed at generation time for higher quality, but can fallback to this if needed.
        // Note: Google TTS handles speed in generation, so audio comes back at correct speed.
        // Setting playbackRate on audio element would apply speed *on top* of generated speed.
        // So we keep it 1.0 here unless we want to support dynamic speed change without re-requesting.

        // Attach event listeners
        if (onTimeUpdate) {
            audio.ontimeupdate = () => {
                onTimeUpdate(audio.currentTime);
            };
        }

        if (onDuration) {
            audio.onloadedmetadata = () => {
                onDuration(audio.duration);
            };
        }

        currentAudio = audio;

        return new Promise((resolve, reject) => {
            audio.onended = () => {
                currentAudio = null;
                if (onEnded) onEnded();
                resolve();
            };

            audio.onerror = (e) => {
                console.error('Audio playback error:', e);
                currentAudio = null;
                reject(new Error('Audio playback failed'));
            };

            audio.play().catch((err) => {
                console.error('Play error:', err);
                reject(err);
            });
        });

    } catch (error) {
        console.error('TTS Error:', error);
        toast.error('Không thể đọc văn bản. Vui lòng thử lại.');
        throw error;
    }
};

/**
 * Speak using browser API (Fallback)
 */
const speakWithBrowser = (options: SpeakOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            reject(new Error('Browser TTS not supported'));
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(options.text);
        utterance.lang = 'vi-VN'; // Try Vietnamese
        utterance.rate = options.rate || 1.0;

        // Try to find a Vietnamese voice
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(v => v.lang.includes('vi'));
        if (viVoice) utterance.voice = viVoice;

        utterance.onend = () => resolve();
        utterance.onerror = (e) => reject(e);

        window.speechSynthesis.speak(utterance);
    });
};

/**
 * Stop any ongoing speech
 */
export const stopSpeaking = () => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    isPausedState = false;
};

/**
 * Pause current speech
 */
export const pauseSpeaking = () => {
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        isPausedState = true;
    }
};

/**
 * Resume paused speech
 */
export const resumeSpeaking = () => {
    if (currentAudio && isPausedState) {
        currentAudio.play();
        isPausedState = false;
    }
};

/**
 * Check if speech is currently paused
 */
export const isSpeaking = () => {
    return currentAudio !== null && !currentAudio.paused;
};

/**
 * Check if speech is paused
 */
export const isPaused = () => {
    return isPausedState;
};

/**
 * Get available voices (Mock for compatibility)
 */
export const getVoices = (): SpeechSynthesisVoice[] => {
    // Return empty or mock voices since we use backend
    return [];
};

/**
 * Check if speech synthesis is supported (Always true for API)
 */
export const isSpeechSynthesisSupported = (): boolean => {
    return true;
};
