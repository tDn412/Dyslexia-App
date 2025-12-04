import { Router } from 'express';
import { supabase } from '../utils/supabaseClient'; 
import { NextFunction, Request, Response } from 'express';

export const router = Router();

// Kiểu dữ liệu Supabase
type Word = {
  wordid: string; 
  word: string;
  userid: string; 
  createdat: string; 
};

// ======================= GET /words =======================
router.get('/words', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || 'u003';
    const searchQuery = (req.query.search as string) || '';
    const letterFilter = req.query.letter as string | undefined;

    let query = supabase
      .from('LibraryWord')
      .select('wordid, word, userid, createdat')
      .eq('userid', userId)
      .order('createdat', { ascending: false });

    if (searchQuery) query = query.ilike('word', `%${searchQuery}%`);
    if (letterFilter) query = query.ilike('word', `${letterFilter}%`);

    const { data: userWords, error } = await query;

    if (error) throw error;

    // Map lại dữ liệu để frontend dùng
    const mapped = userWords.map((w) => ({
      id: w.wordid,
      text: w.word,
      dateAdded: w.createdat,
    }));

    res.json(mapped);

  } catch (err) {
    console.error('Error fetching words:', err);
    next(err);
  }
});

// ======================= POST /words =======================
router.post('/words', async (req: Request, res: Response) => {
  const userId = (req.body.userId as string) || (req.headers['x-user-id'] as string) || 'u003';
  const { text } = req.body ?? {};

  if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });

  try {
    // 1. Kiểm tra từ đã tồn tại
    const { data: existingWord } = await supabase
      .from('LibraryWord')
      .select('wordid')
      .eq('userid', userId)
      .eq('word', text.trim())
      .limit(1);

    if (existingWord && existingWord.length > 0) return res.status(409).json({ error: 'word already exists' });

    // 2. Lấy wordid lớn nhất hiện tại
    const { data: lastWord } = await supabase
      .from('LibraryWord')
      .select('wordid')
      .eq('userid', userId)
      .order('wordid', { ascending: false })
      .limit(1);

    let newId = 'w001'; // mặc định nếu chưa có từ nào
    if (lastWord && lastWord.length > 0) {
      // lastWord[0].wordid = 'w005' -> tách số
      const num = parseInt(lastWord[0].wordid.slice(1)) + 1;
      newId = 'w' + num.toString().padStart(3, '0'); // vd: 'w006'
    }

    // 3. Thêm từ mới
    const { data: newWord, error: insertError } = await supabase
      .from('LibraryWord')
      .insert({
        wordid: newId,
        word: text.trim(),
        userid: userId,
        createdat: new Date().toISOString(),
      })
      .select();

    if (insertError) throw insertError;

    res.status(201).json({
      id: newWord[0].wordid,
      text: newWord[0].word,
      dateAdded: newWord[0].createdat,
    });
  } catch (err) {
    console.error('Error adding word:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ======================= DELETE /words/:id =======================
router.delete('/words/:id', async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || 'u003';
  const wordId = req.params.id;

  try {
    const { error } = await supabase
      .from('LibraryWord')
      .delete()
      .eq('wordid', wordId)
      .eq('userid', userId);

    if (error) throw error;

    res.status(204).send(); // Xóa thành công
  } catch (err) {
    console.error('Error deleting word:', err);
    next(err);
  }
});

// ======================= POST /words/pronounce =======================
router.post('/words/pronounce', (req, res) => {
  const { word } = req.body ?? {};
  if (!word) return res.status(400).json({ error: 'word is required' });

  // Đây là logic stub
  res.json({ word, audioUrl: null, message: 'pronunciation requested' });
});
