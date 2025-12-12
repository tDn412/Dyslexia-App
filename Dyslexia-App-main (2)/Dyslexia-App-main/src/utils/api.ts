const API_URL = 'http://localhost:4000/api';
const AI_API_URL = 'https://dinhtu4125-dyslexia-backend.hf.space/api';

export interface ApiResponse<T> {
    data?: T;
    error?: string;
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {},
    baseUrl: string = API_URL
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

export const api = {
    // NLP
    nlp: {
        segment: (text: string) =>
            request<{ normalized: string; sentences: string[]; words_per_sentence: string[][] }>('/segment', {
                method: 'POST',
                body: JSON.stringify({ text }),
            }, AI_API_URL),
    },

    // Text-to-Speech
    tts: {
        speak: (text: string) =>
            request<{ audio_base64: string }>('/tts', {
                method: 'POST',
                body: JSON.stringify({ text }),
            }, AI_API_URL),
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
            }, AI_API_URL);
        },
    },

    // OCR
    ocr: {
        upload: (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            return request<{ text: string }>('/ocr', {
                method: 'POST',
                body: formData,
                headers: {}, // Let browser set Content-Type for FormData
            }, AI_API_URL);
        },
    }
};


export async function fetchReadings(level?: string, topic?: string, search?: string) {
    const params = new URLSearchParams();
    if (level && level !== 'All') params.append('level', level);
    if (topic) params.append('topic', topic);
    if (search) params.append('search', search);

    const response = await fetch(`${API_URL}/readings?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch readings');
    return response.json();
}

export async function fetchReadingById(id: string) {
    const response = await fetch(`${API_URL}/readings/${id}`);
    if (!response.ok) throw new Error('Failed to fetch reading');
    return response.json();
}

export async function fetchLibrary(userId: string) {
    const response = await fetch(`${API_URL}/library?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch library');
    return response.json();
}

export async function addToLibrary(userId: string, word: string) {
    const response = await fetch(`${API_URL}/library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, word }),
    });
    if (!response.ok) throw new Error('Failed to add to library');
    return response.json();
}

export async function fetchSettings(userId: string) {
    const response = await fetch(`${API_URL}/settings?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
}

export async function saveSettings(userId: string, settings: any) {
    const response = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, settings }),
    });
    if (!response.ok) throw new Error('Failed to save settings');
    return response.json();
}

export async function uploadOCR(userId: string, fileName: string, fileData: string, fileType: string) {
    const response = await fetch(`${API_URL}/ocr/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fileName, fileData, fileType }),
    });
    if (!response.ok) throw new Error('Failed to upload OCR');
    return response.json();
}

export async function fetchOCRFiles(userId: string) {
    const response = await fetch(`${API_URL}/ocr/files?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch OCR files');
    return response.json();
}

export async function fetchOCRFileById(userId: string, id: string) {
    const response = await fetch(`${API_URL}/ocr/files/${id}?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch OCR file');
    return response.json();
}

export async function analyzeSpeaking(userId: string, textId: string, referenceText: string, transcript: string) {
    const response = await fetch(`${API_URL}/speakings/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, textId, referenceText, transcript }),
    });
    if (!response.ok) throw new Error('Failed to analyze speaking');
    return response.json();
}

export async function fetchQuizzes() {
    const response = await fetch(`${API_URL}/quizzes`);
    if (!response.ok) throw new Error('Failed to fetch quizzes');
    return response.json();
}

export async function fetchQuizById(id: string) {
    const response = await fetch(`${API_URL}/quizzes/${id}`);
    if (!response.ok) throw new Error('Failed to fetch quiz');
    return response.json();
}

export async function submitQuizResult(userId: string, quizId: string, score: number, answers: any) {
    const response = await fetch(`${API_URL}/quizzes/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, quizId, score, answers }),
    });
    if (!response.ok) throw new Error('Failed to submit quiz result');
    return response.json();
}

export async function login(credentials: any) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
    }
    return response.json();
}

export async function register(userData: any) {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
    }
    return response.json();
}
