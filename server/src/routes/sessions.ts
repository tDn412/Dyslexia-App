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
      .from('ReadingProgress')
      .select('*, Text(title, topic)')
      .eq('userid', userId)
      .order('createdat', { ascending: false });

    if (!error && data) {
      readingSessions = data.map(item => ({
        id: item.progressid,
        type: 'reading',
        userId: item.userid,
        materialId: item.contentrefid,
        materialTitle: item.Text?.title,
        startedAt: item.createdat,
        progress: item.progresspercent,
        accuracy: item.progresspercent
      }));
    } else if (error) {
      console.error('Error fetching reading sessions:', error);
    }
  }

  // Fetch Speaking Progress
  if (!type || type === 'speaking') {
    const { data, error } = await supabase
      .from('SpeakingProgress')
      .select('*, Text(title, topic)') // Assuming reference to Text exists via contentrefid
      .eq('userid', userId)
      .order('createdat', { ascending: false });

    if (!error && data) {
      speakingSessions = data.map(item => ({
        id: item.progressid,
        type: 'speaking',
        userId: item.userid,
        materialId: item.contentrefid,
        materialTitle: item.Text?.title,
        startedAt: item.createdat,
        accuracy: item.progresspercent,
        analysis: item.analysis
      }));
    } else if (error) {
      console.error('Error fetching speaking sessions:', error);
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



