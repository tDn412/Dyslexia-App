import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

export const router = Router();

// GET /api/settings - Get user settings
router.get('/', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const { data, error } = await supabase
    .from('UserSetting')
    .select('*')
    .eq('userid', userId)
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

  // Map DB columns (lowercase) to API expected keys (snake_case from previous implementation)
  const mappedSettings = {
    font_family: data.fontfamily,
    font_size: data.fontsize,
    letter_spacing: data.letterspacing,
    color_theme: data.colortheme,
    reading_voice: data.readingvoice,
    reading_speed: data.readingspeed
  };

  res.json(mappedSettings);
});

// PUT /api/settings - Update settings
router.post('/', async (req, res) => {
  const { userId, settings } = req.body;
  if (!userId || !settings) return res.status(400).json({ error: 'userId and settings are required' });

  // Map API keys to DB columns
  // Map API keys to DB columns
  // Handle both nested format (from frontend) and flat format (legacy/API)
  const dbSettings: any = {
    userid: userId,
    updatedat: new Date().toISOString()
  };

  const display = settings.display || {};
  const audio = settings.audio || {};

  // Display Settings
  if (display.fontFamily || settings.font_family) dbSettings.fontfamily = display.fontFamily || settings.font_family;
  if (display.fontSize || settings.font_size) dbSettings.fontsize = display.fontSize || settings.font_size;
  if (display.letterSpacing || settings.letter_spacing) dbSettings.letterspacing = display.letterSpacing || settings.letter_spacing;
  if (display.theme || settings.color_theme) dbSettings.colortheme = display.theme || settings.color_theme;

  // Audio Settings
  if (audio.voice || settings.reading_voice) dbSettings.readingvoice = audio.voice || settings.reading_voice;
  if (audio.speed || settings.reading_speed) dbSettings.readingspeed = audio.speed || settings.reading_speed;

  // Upsert user settings
  const { data, error } = await supabase
    .from('UserSetting')
    .upsert(dbSettings)
    .select()
    .single();

  if (error) return res.status(500).json(error);

  // Map back
  const mappedData = {
    font_family: data.fontfamily,
    font_size: data.fontsize,
    letter_spacing: data.letterspacing,
    color_theme: data.colortheme,
    reading_voice: data.readingvoice,
    reading_speed: data.readingspeed
  };
  res.json(mappedData);
});
