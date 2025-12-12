import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

export const router = Router();

// GET /api/settings - Get user settings
router.get('/', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
    return res.status(500).json(error);
  }

  if (!data) {
    // Return default settings if no profile found
    return res.json({
      font_family: 'Open Sans',
      font_size: 16,
      letter_spacing: 1.0,
      color_theme: 'light',
      reading_voice: 'vi-VN-Standard-A',
      reading_speed: 1.0
    });
  }

  res.json(data);
});

// PUT /api/settings - Update settings
router.post('/', async (req, res) => {
  const { userId, settings } = req.body;
  if (!userId || !settings) return res.status(400).json({ error: 'userId and settings are required' });

  // Upsert user settings
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) return res.status(500).json(error);
  res.json(data);
});
