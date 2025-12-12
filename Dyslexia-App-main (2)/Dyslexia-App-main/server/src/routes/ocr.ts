import axios from 'axios';
import FormData from 'form-data';
import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';
import mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export const router = Router();

// POST /api/ocr/upload - Upload and process OCR
router.post('/upload', async (req, res) => {
  const userId = (req.body.userId as string) || (req.headers['x-user-id'] as string);
  const { fileName, fileData, fileType } = req.body ?? {};

  if (!fileName) {
    return res.status(400).json({ error: 'fileName is required' });
  }

  if (!fileData) {
    return res.status(400).json({ error: 'fileData (base64) is required' });
  }

  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');
    let extractedText = '';

    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      // Handle DOCX
      const result = await mammoth.extractRawText({ buffer: buffer });
      extractedText = result.value;
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Handle PDF
      const data = await pdf(buffer);
      extractedText = data.text;
    } else {
      // Handle Image (OCR via Python Backend)
      const form = new FormData();
      form.append('file', buffer, { filename: fileName, contentType: fileType || 'image/png' });

      const pythonResponse = await axios.post('http://localhost:8000/api/ocr', form, {
        headers: {
          ...form.getHeaders(),
        },
      });
      extractedText = pythonResponse.data.text;
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('ocr_imports')
      .insert([
        {
          user_id: userId,
          file_name: fileName,
          content: extractedText,
          tts_ready: false
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error: any) {
    console.error('OCR/Extraction Error:', error);
    // Check for connection refused (Python backend down)
    if (error.code === 'ECONNREFUSED' || (error.cause && error.cause.code === 'ECONNREFUSED')) {
      return res.status(503).json({
        error: 'OCR Service Unavailable',
        details: 'Python backend is not running. Please start the Python server on port 8000.'
      });
    }
    res.status(500).json({ error: 'Failed to process file', details: error.message });
  }
});

// GET /api/ocr/files - Get all OCR files for user
router.get('/files', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  const search = (req.query.search as string) || '';

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  let query = supabase
    .from('ocr_imports')
    .select('ocr_id, file_name, created_at, tts_ready')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('file_name', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
});

// GET /api/ocr/files/:id - Get OCR file by ID
router.get('/files/:id', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const { data, error } = await supabase
    .from('ocr_imports')
    .select('*')
    .eq('ocr_id', req.params.id)
    .single();

  if (error) {
    return res.status(404).json({ error: 'file not found' });
  }

  if (data.user_id !== userId) {
    return res.status(403).json({ error: 'forbidden' });
  }

  res.json(data);
});

// PUT /api/ocr/files/:id - Update OCR file
router.put('/files/:id', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  const { name, content } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const updates: any = {};
  if (name) updates.file_name = name;
  if (content) updates.content = content;

  const { data, error } = await supabase
    .from('ocr_imports')
    .update(updates)
    .eq('ocr_id', req.params.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return res.status(500).json(error);

  res.json(data);
});

// DELETE /api/ocr/files/:id - Delete OCR file
router.delete('/files/:id', async (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const { error } = await supabase
    .from('ocr_imports')
    .delete()
    .eq('ocr_id', req.params.id)
    .eq('user_id', userId);

  if (error) return res.status(500).json(error);

  res.status(204).send();
});
