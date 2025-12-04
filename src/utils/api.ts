/**
 * API client for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'https://dinhtu4125-dyslexia-backend.hf.space/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Get auth token from localStorage
 */
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Get user ID from localStorage
 */
const getUserId = (): string | null => {
  return localStorage.getItem('userId');
};

/**
 * Make API request
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl: string = API_BASE_URL
): Promise<ApiResponse<T>> {
  try {
    const token = getToken();
    const userId = getUserId();

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Set Content-Type to application/json by default, unless it's FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (userId) {
      headers['x-user-id'] = userId;
    }

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

/**
 * API methods
 */
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

    getFiles: (userId?: string, search?: string) => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (search) params.append('search', search);
      return request<any[]>(`/ocr/files?${params.toString()}`);
    },

    getFile: (id: string, userId?: string) =>
      request<any>(`/ocr/files/${id}${userId ? `?userId=${userId}` : ''}`),

    updateFile: (id: string, data: { name: string }, userId?: string) =>
      request<any>(`/ocr/files/${id}${userId ? `?userId=${userId}` : ''}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteFile: (id: string, userId?: string) =>
      request(`/ocr/files/${id}${userId ? `?userId=${userId}` : ''}`, {
        method: 'DELETE',
      }),
  },

  // Auth
  auth: {
    register: (data: { fullName?: string; username: string; email: string; password: string; confirmPassword: string; birthDate?: string }) =>
      request<{ user: any; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { username: string; password: string }) =>
      request<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: () =>
      request('/auth/logout', {
        method: 'POST',
      }),
  },

  // Settings
  settings: {
    get: (userId?: string) =>
      request<any>(`/settings${userId ? `?userId=${userId}` : ''}`),

    update: (data: any, userId?: string) =>
      request<any>(`/settings${userId ? `?userId=${userId}` : ''}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getAudio: (userId?: string) =>
      request<any>(`/settings/audio${userId ? `?userId=${userId}` : ''}`),

    updateAudio: (data: any, userId?: string) =>
      request<any>(`/settings/audio${userId ? `?userId=${userId}` : ''}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getDisplay: (userId?: string) =>
      request<any>(`/settings/display${userId ? `?userId=${userId}` : ''}`),

    updateDisplay: (data: any, userId?: string) =>
      request<any>(`/settings/display${userId ? `?userId=${userId}` : ''}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Library
  library: {
    getWords: (userId?: string, search?: string, letter?: string) => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (search) params.append('search', search);
      if (letter) params.append('letter', letter);
      return request<any[]>(`/library/words?${params.toString()}`);
    },

    addWord: (data: { text: string; userId?: string }) =>
      request<any>('/library/words', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteWord: (id: string, userId?: string) =>
      request(`/library/words/${id}${userId ? `?userId=${userId}` : ''}`, {
        method: 'DELETE',
      }),
  },


  // Readings
  readings: {
    getAll: (level?: string, topic?: string, search?: string) => {
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      if (topic) params.append('topic', topic);
      if (search) params.append('search', search);
      return request<any[]>(`/readings?${params.toString()}`);
    },

    getById: (id: string) =>
      request<any>(`/readings/${id}`),
  },

  // Speakings
  speakings: {
    getAll: (level?: string, topic?: string, search?: string) => {
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      if (topic) params.append('topic', topic);
      if (search) params.append('search', search);
      return request<any[]>(`/speakings?${params.toString()}`);
    },

    getById: (id: string) =>
      request<any>(`/speakings/${id}`),
  },

  // Sessions
  sessions: {
    create: (data: { type: 'reading' | 'speaking'; materialId?: string; userId?: string }) =>
      request<any>('/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getAll: (userId?: string, type?: 'reading' | 'speaking') => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (type) params.append('type', type);
      return request<any[]>(`/sessions?${params.toString()}`);
    },

    getById: (id: string) =>
      request<any>(`/sessions/${id}`),

    update: (id: string, data: any) =>
      request<any>(`/sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    end: (id: string, data: any) =>
      request<any>(`/sessions/${id}/end`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Dashboard
  dashboard: {
    getMetrics: (userId?: string) =>
      request<any>(`/dashboard/metrics${userId ? `?userId=${userId}` : ''}`),

    getRecentReading: (userId?: string) =>
      request<any>(`/dashboard/recent-reading${userId ? `?userId=${userId}` : ''}`),

    getNewWords: (userId?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (limit) params.append('limit', limit.toString());
      return request<any[]>(`/dashboard/new-words?${params.toString()}`);
    },
  },
};

