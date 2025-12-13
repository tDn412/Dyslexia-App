import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

export const router = Router();

// GET /api/library - Get all words
router.get('/', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const { data, error } = await supabase
    .from('LibraryWord')
    .select('*')
    .eq('userid', userId)
    .order('createdat', { ascending: false });

  if (error) return res.status(500).json(error);
  // Map back to expected structure if needed by frontend or update frontend to read new keys
  // For now returning raw data, frontend update will handle this.
  const mappedData = data?.map(item => ({
    id: item.wordid,
    word: item.word,
    examples: item.ttsurl,
    created_at: item.createdat,
    user_id: item.userid
  }));
  res.json(mappedData);
});

// POST /api/library - Add word
router.post('/', async (req, res) => {
  const { userId, word, examples } = req.body;
  if (!userId || !word) return res.status(400).json({ error: 'userId and word are required' });

  // Check if word exists
  const { data: existing } = await supabase
    .from('LibraryWord')
    .select('*')
    .eq('userid', userId)
    .eq('word', word)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'Word already in library' });
  }

  const { data, error } = await supabase
    .from('LibraryWord')
    .insert([{ userid: userId, word, ttsurl: examples }])
    .select()
    .single();

  if (error) return res.status(500).json(error);

  // Map result
  const mappedResult = {
    id: data.wordid,
    word: data.word,
    examples: data.ttsurl,
    created_at: data.createdat,
    user_id: data.userid
  };
  res.status(201).json(mappedResult);
});

// DELETE /api/library/:id - Remove word
router.delete('/:id', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const { error } = await supabase
    .from('LibraryWord')
    .delete()
    .eq('wordid', req.params.id)
    .eq('userid', userId);

  if (error) return res.status(500).json(error);
  res.status(204).send();
});
