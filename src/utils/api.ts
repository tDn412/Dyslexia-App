const API_URL = 'http://localhost:4000/api';

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
