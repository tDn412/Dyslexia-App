import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

export const router = Router();

// GET /api/sessions - Get all sessions (progress) for user
router.get('/', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  const type = req.query.type as 'reading' | 'speaking' | undefined;

  if (!userId) return res.status(400).json({ error: 'userId is required' });

  let readingSessions: any[] = [];
  let speakingSessions: any[] = [];

  // Fetch Reading Progress
  if (!type || type === 'reading') {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*, texts:content_ref_id(title, topic)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      readingSessions = data.map(item => ({
        id: item.progress_id,
        type: 'reading',
        userId: item.user_id,
        materialId: item.content_ref_id,
        materialTitle: item.texts?.title,
        startedAt: item.created_at, // Using created_at as start time
        progress: item.progress_percent,
        accuracy: item.progress_percent // Assuming progress implies accuracy for reading
      }));
    }
  }

  // Fetch Speaking Progress
  if (!type || type === 'speaking') {
    const { data, error } = await supabase
      .from('speaking_progress')
      .select('*, texts:text_id(title, topic)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      speakingSessions = data.map(item => ({
        id: item.progress_id,
        type: 'speaking',
        userId: item.user_id,
        materialId: item.text_id,
        materialTitle: item.texts?.title,
        startedAt: item.created_at,
        accuracy: item.progress_percent,
        errorCount: item.error_count,
        analysis: item.analysis
      }));
    }
  }

  // Combine and Sort
  const allSessions = [...readingSessions, ...speakingSessions].sort((a, b) =>
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  res.json(allSessions);
});

// POST /api/sessions - Start/Log a session (Simplified to just return success as real logging happens in specific routes)
router.post('/', (req, res) => {
  // In this simplified architecture, sessions are created via reading/speaking progress updates
  // This endpoint is kept for compatibility if frontend calls it
  res.status(201).json({ message: 'Session started', id: `temp_${Date.now()}` });
});

// PUT /api/sessions/:id/end - End session
router.put('/:id/end', (req, res) => {
  // Logic handled in specific progress routes
  res.json({ message: 'Session ended' });
});



