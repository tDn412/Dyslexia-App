import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

export const router = Router();

type SpeakingMaterial = {
  id: string;
  title: string;
  topic: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  content?: string;
  userId?: string;
};

// Sample speaking materials (same as readings for now)
const speakings: SpeakingMaterial[] = [
  { id: '1', title: 'Vườn Bướm', topic: 'Thiên nhiên', level: 'A1', content: 'Con bướm đáp nhẹ nhàng trên bông hoa đầy màu sắc. Đôi cánh của nó có màu cam và đen tươi sáng, với những hoa văn đẹp trông giống như những ô cửa sổ nhỏ. Con bướm nghỉ ở đó một lúc, tận hưởng ánh nắng ấm áp. Đột nhiên, một cơn gió nhẹ thổi qua khu vườn. Con bướm mở và khép đôi cánh từ từ, như thể nó đang chào gió. Sau đó nó bay lên bầu trời, nhảy múa giữa những đám mây. Lũ trẻ quan sát từ bên dưới, chỉ tay và mỉm cười. Chúng thích nhìn con bướm nhảy múa trên không. Đó là một ngày hè hoàn hảo.' },
  { id: '2', title: 'Gia Đình Tôi', topic: 'Gia đình', level: 'A1' },
  { id: '3', title: 'Động Vật Ở Sở Thú', topic: 'Động vật', level: 'A2' },
  { id: '4', title: 'Một Ngày Ở Bãi Biển', topic: 'Thiên nhiên', level: 'A2' },
  { id: '5', title: 'Chú Chó Thân Thiện', topic: 'Động vật', level: 'B1' },
  { id: '6', title: 'Cuộc Phiêu Lưu Mùa Hè', topic: 'Truyện', level: 'B1' },
  { id: '7', title: 'Công Nghệ Tương Lai', topic: 'Khoa học', level: 'B2' },
  { id: '8', title: 'Bảo Vệ Môi Trường', topic: 'Xã hội', level: 'B2' },
];

const speakingsMap = new Map<string, SpeakingMaterial>();
speakings.forEach(s => speakingsMap.set(s.id, s));

// Get all speaking materials
router.get('/', (req, res) => {
  const { level, topic } = req.query;
  let results = speakings;

  if (level && level !== 'All') {
    results = results.filter(s => s.level === level);
  }

  if (topic) {
    results = results.filter(s => s.topic === topic);
  }

  res.json(results);
});

// Get speaking material by ID
router.get('/:id', (req, res) => {
  const material = speakingsMap.get(req.params.id);
  if (material) {
    res.json(material);
  } else {
    res.status(404).json({ message: 'Speaking material not found' });
  }
});

// Save speaking progress
router.post('/progress', async (req, res) => {
  const { userId, textId, accuracy, words } = req.body;

  if (!userId || !textId) {
    return res.status(400).json({ error: 'Missing userId or textId' });
  }

  try {
    // Check if progress exists
    const { data: existingProgress } = await supabase
      .from('speaking_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('content_ref_id', textId)
      .single();

    if (existingProgress) {
      // Update if better or newer
      await supabase
        .from('speaking_progress')
        .update({
          accuracy_score: accuracy,
          words_correct: words, // Assuming words is a count or JSON
          updated_at: new Date()
        })
        .eq('progress_id', existingProgress.progress_id);
    } else {
      await supabase
        .from('speaking_progress')
        .insert({
          user_id: userId,
          content_ref_id: textId,
          accuracy_score: accuracy,
          words_correct: words,
          created_at: new Date()
        });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving speaking progress:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Analyze speaking (Mock for now, or connect to Python/Google Cloud)
router.post('/analyze', async (req, res) => {
  const { audioData, text } = req.body;
  // TODO: Implement actual analysis
  // For now, return a mock score
  const mockScore = Math.floor(Math.random() * 20) + 80; // 80-100
  res.json({ score: mockScore, feedback: 'Good pronunciation!' });
});
