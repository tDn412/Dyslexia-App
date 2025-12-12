const AI_API_URL = 'https://dinhtu4125-dyslexia-backend.hf.space/api';

export interface ApiResponse<T> {
    data?: T;
    error?: string;
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {},
    baseUrl: string = AI_API_URL
): Promise<ApiResponse<T>> {
    const headers = { ...options.headers } as Record<string, string>;

    // Set Content-Type to application/json by default, unless it's FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            return { error: error.error || `HTTP ${response.status}` };
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return {};
        }

        const data = await response.json();
        return { data };
    } catch (error) {
        console.error('API request error:', error);
        return {
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

export const aiApi = {
    // NLP
    nlp: {
        segment: (text: string) =>
            request<{ normalized: string; sentences: string[]; words_per_sentence: string[][] }>('/segment', {
                method: 'POST',
                body: JSON.stringify({ text }),
            }),
    },

    // Text-to-Speech
    tts: {
        speak: (text: string) =>
            request<{ audio_base64: string }>('/tts', {
                method: 'POST',
                body: JSON.stringify({ text }),
            }),
    },

    // Pronunciation
    pronunciation: {
        check: (referenceText: string, audioFile: Blob) => {
            const formData = new FormData();
            formData.append('reference_text', referenceText);
            formData.append('audio_file', audioFile);

            return request<{ reference_text: string; your_transcript: string; word_scores: { word: string; pronunciation_score: number }[] }>('/check-pronunciation', {
                method: 'POST',
                body: formData,
                headers: {}, // Let browser set Content-Type for FormData
            });
        },
    },

    // OCR - Only upload logic if needed here, but usually OCR page handles it. 
    // Keeping it for completeness if teammate used it via api.ts
    ocr: {
        upload: (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            return request<{ text: string }>('/ocr', {
                method: 'POST',
                body: formData,
                headers: {},
            });
        },
    }
};
