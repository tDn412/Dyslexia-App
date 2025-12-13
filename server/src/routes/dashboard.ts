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
      .from('ReadingProgress')
      .select('createdat')
      .eq('userid', userId);

    // 2. Get Speaking Progress Count & Time (Estimate)
    const { data: speakingData, error: speakingError } = await supabase
      .from('SpeakingProgress')
      .select('createdat')
      .eq('userid', userId);

    // 3. Get Words Learned Count
    const { count: wordsCount, error: wordsError } = await supabase
      .from('LibraryWord')
      .select('*', { count: 'exact', head: true })
      .eq('userid', userId);

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
      ...(readingData?.map(d => new Date(d.createdat)) || []),
      ...(speakingData?.map(d => new Date(d.createdat)) || [])
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

  // Fetch most recent reading progress
  const { data: progressData, error: progressError } = await supabase
    .from('ReadingProgress')
    .select('createdat, contentrefid')
    .eq('userid', userId)
    .order('createdat', { ascending: false })
    .limit(1)
    .single();

  if (progressError && progressError.code !== 'PGRST116') {
    return res.status(500).json(progressError);
  }

  if (!progressData) {
    // Return default/placeholder if no reading history
    return res.json({
      title: 'Chào mừng!',
      preview: 'Hãy bắt đầu bài đọc đầu tiên của bạn.',
      materialId: null,
      lastReadAt: null
    });
  }

  // Fetch the actual text content manually (since FK might be missing)
  const { data: textData, error: textError } = await supabase
    .from('Text')
    .select('textid, title, content')
    .eq('textid', progressData.contentrefid)
    .single();

  // If text not found (maybe deleted), handle gracefully
  if (textError || !textData) {
    return res.json({
      title: 'Bài đọc không tồn tại',
      preview: 'Bài đọc này có thể đã bị xóa.',
      materialId: null,
      lastReadAt: progressData.createdat
    });
  }

  const preview = textData.content ? textData.content.substring(0, 150) + '...' : '';

  res.json({
    title: textData.title,
    preview: preview,
    materialId: textData.textid,
    lastReadAt: progressData.createdat,
  });
});

// GET /api/dashboard/new-words - Get new words from library
router.get('/new-words', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  const limit = parseInt(req.query.limit as string) || 3;

  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const { data, error } = await supabase
    .from('LibraryWord')
    .select('*')
    .eq('userid', userId)
    .order('createdat', { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json(error);

  const mappedData = data.map(item => ({
    word: item.word,
    definition: ''
  }));

  res.json(mappedData);
});



