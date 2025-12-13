import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

export const router = Router();

// ---------------- GET ALL ------------------
router.get('/', async (req, res) => {
  const level = req.query.level as string | undefined;
  const topic = req.query.topic as string | undefined;
  const search = (req.query.search as string) || '';

  let query = supabase.from('Text').select('*');

  if (level && level !== 'All') {
    query = query.eq('level', level);
  }

  if (topic) {
    query = query.eq('topic', topic);
  }

  // ---- SEARCH FIXED ----
  if (search.trim() !== "") {
    query = query.or(
      `title.ilike.%${search}%,topic.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching readings:", error);
    return res.status(500).json(error);
  }

  res.json(data);
});

// ---------------- GET BY ID ------------------
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('Text')
    .select('*')
    .eq('textid', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'reading not found' });

  res.json(data);
});

// ---------------- CREATE ------------------
router.post('/', async (req, res) => {
  const { title, topic, level, content, userId } = req.body;

  if (!title) return res.status(400).json({ error: 'title is required' });

  const { data, error } = await supabase
    .from('Text')
    .insert([{ title, topic, level, content }]) // textid is auto-generated? Schema: textid uuid NOT NULL DEFAULT gen_random_uuid()
    .select()
    .single();

  if (error) return res.status(500).json(error);

  res.status(201).json(data);
});

// ---------------- UPDATE ------------------
router.put('/:id', async (req, res) => {
  const updates = req.body;

  const { data, error } = await supabase
    .from('Text')
    .update(updates)
    .eq('textid', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json(error);

  res.json(data);
});

// ---------------- DELETE ------------------
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('Text')
    .delete()
    .eq('textid', req.params.id);

  if (error) return res.status(500).json(error);

  res.status(204).send();
});
