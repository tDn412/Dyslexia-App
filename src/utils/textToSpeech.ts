import { aiApi as api } from './aiService';
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
}

/**
 * Speak text using Backend API
 */
export const speakText = async (options: SpeakOptions): Promise<void> => {
  try {
    // Stop any currently playing audio
    stopSpeaking();

    const { text } = options;

    if (!text.trim()) {
      return;
    }

    // Call API to get audio from Google Cloud TTS
    const response = await api.tts.speak(text);

    if (response.error || !response.data?.audio_base64) {
      throw new Error(response.error || 'Failed to generate speech');
    }

    // Decode base64 and play
    const audioSrc = `data:audio/mp3;base64,${response.data.audio_base64}`;
    const audio = new Audio(audioSrc);

    // Apply playback speed
    if (options.rate) {
      audio.playbackRate = options.rate;
    }

    currentAudio = audio;

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        currentAudio = null;
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
