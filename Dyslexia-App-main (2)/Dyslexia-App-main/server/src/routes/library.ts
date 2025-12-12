import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

export const router = Router();

// GET /api/library - Get all words
router.get('/', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const { data, error } = await supabase
    .from('library_words')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json(error);
  res.json(data);
});

// POST /api/library - Add word
router.post('/', async (req, res) => {
  const { userId, word, examples } = req.body;
  if (!userId || !word) return res.status(400).json({ error: 'userId and word are required' });

  // Check if word exists
  const { data: existing } = await supabase
    .from('library_words')
    .select('*')
    .eq('user_id', userId)
    .eq('word', word)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'Word already in library' });
  }

  const { data, error } = await supabase
    .from('library_words')
    .insert([{ user_id: userId, word, tts_url: examples }])
    .select()
    .single();

  if (error) return res.status(500).json(error);
  res.status(201).json(data);
});

// DELETE /api/library/:id - Remove word
router.delete('/:id', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const { error } = await supabase
    .from('library_words')
    .delete()
    .eq('word_id', req.params.id)
    .eq('user_id', userId);

  if (error) return res.status(500).json(error);
  res.status(204).send();
});
