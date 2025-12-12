import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

export const router = Router();

// GET /api/dashboard/metrics - Get dashboard metrics
router.get('/metrics', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    // 1. Get Reading Progress Count & Time (Estimate)
    const { data: readingData, error: readingError } = await supabase
      .from('reading_progress')
      .select('created_at')
      .eq('user_id', userId);

    // 2. Get Speaking Progress Count & Time (Estimate)
    const { data: speakingData, error: speakingError } = await supabase
      .from('speaking_progress')
      .select('created_at')
      .eq('user_id', userId);

    // 3. Get Words Learned Count
    const { count: wordsCount, error: wordsError } = await supabase
      .from('library_words')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (readingError || speakingError || wordsError) {
      console.error('Error fetching metrics:', readingError, speakingError, wordsError);
      return res.status(500).json({ error: 'Failed to fetch metrics' });
    }

    const readingSessions = readingData?.length || 0;
    const speakingSessions = speakingData?.length || 0;

    // Estimate time: 5 mins per reading, 3 mins per speaking (since we don't have duration yet)
    const totalReadingMinutes = readingSessions * 5;
    const totalSpeakingMinutes = speakingSessions * 3;

    // Calculate Streak
    const allDates = [
      ...(readingData?.map(d => new Date(d.created_at)) || []),
      ...(speakingData?.map(d => new Date(d.created_at)) || [])
    ].sort((a, b) => b.getTime() - a.getTime());

    let streakDays = 0;
    if (allDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastActivity = new Date(allDates[0]);
      lastActivity.setHours(0, 0, 0, 0);

      // If last activity was today or yesterday, streak is alive
      const diffTime = Math.abs(today.getTime() - lastActivity.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        streakDays = 1;
        let currentDate = lastActivity;

        for (let i = 1; i < allDates.length; i++) {
          const prevDate = new Date(allDates[i]);
          prevDate.setHours(0, 0, 0, 0);

          const dTime = Math.abs(currentDate.getTime() - prevDate.getTime());
          const dDays = Math.ceil(dTime / (1000 * 60 * 60 * 24));

          if (dDays === 1) {
            streakDays++;
            currentDate = prevDate;
          } else if (dDays > 1) {
            break;
          }
        }
      }
    }

    res.json({
      totalReadingMinutes,
      totalSpeakingMinutes,
      completedSessions: readingSessions + speakingSessions,
      wordsLearned: wordsCount || 0,
      streakDays,
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/recent-reading - Get recent reading preview
router.get('/recent-reading', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const { data, error } = await supabase
    .from('reading_progress')
    .select('created_at, texts:content_ref_id(textid, title, content)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json(error);
  }

  if (!data) {
    // Return default/placeholder if no reading history
    return res.json({
      title: 'Chào mừng!',
      preview: 'Hãy bắt đầu bài đọc đầu tiên của bạn.',
      materialId: null,
      lastReadAt: null
    });
  }

  const text = data.texts as any; // Type assertion since Supabase join returns object or array
  const preview = text.content ? text.content.substring(0, 150) + '...' : '';

  res.json({
    title: text.title,
    preview: preview,
    materialId: text.textid,
    lastReadAt: data.created_at,
  });
});

// GET /api/dashboard/new-words - Get new words from library
router.get('/new-words', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  const limit = parseInt(req.query.limit as string) || 3;

  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const { data, error } = await supabase
    .from('library_words')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json(error);

  // Map to frontend expected format if needed, but library_words has 'word' and 'definition' (if added)
  // Our schema has: word_id, user_id, word, tts_url, created_at. Definition might be missing in schema?
  // Checking schema: library_words (word_id, user_id, word, tts_url, created_at)
  // It seems we don't have 'definition' in the table. We might need to fetch it or just return word.
  // For now, we'll return word and a placeholder definition or empty.

  const mappedData = data.map(item => ({
    word: item.word,
    definition: '' // Definition not in table currently
  }));

  res.json(mappedData);
});



