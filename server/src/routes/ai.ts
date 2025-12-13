import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

router.post('/assess-level', async (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'content is required' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `Bạn là chuyên gia đánh giá độ khó văn bản cho trẻ em Việt Nam bị chứng khó đọc (Dyslexia).

**Đặc điểm của trẻ dyslexia:**
- Khó nhận diện chữ cái tương tự (b/d, p/q, m/n)
- Khó đọc từ dài nhiều âm tiết
- Dễ mệt mỏi với câu dài, đoạn văn dày
- Cần từ vựng quen thuộc, hay gặp trong đời sống

**Tiêu chí đánh giá:**
1. Độ dài từ trung bình (< 3 âm tiết = dễ)
2. Tần suất từ vựng (từ phổ biến trong đời sống hàng ngày)
3. Độ dài câu (< 10 từ/câu = dễ)
4. Cấu trúc ngữ pháp (câu đơn = dễ, câu ghép = khó)
5. Chủ đề (quen thuộc với trẻ 6-12 tuổi = dễ)
6. Số lượng từ mới/khó

**Thang đánh giá:**
- A1: Rất dễ - Từ ngắn, câu ngắn, chủ đề quen thuộc (gia đình, trường học, động vật). Phù hợp trẻ mới bắt đầu.
- A2: Dễ - Từ phổ biến, câu đơn giản, có một vài từ mới. Phù hợp trẻ đang luyện tập.
- B1: Trung bình - Câu dài hơn, có từ ít phổ biến, chủ đề đa dạng. Cần hướng dẫn.
- B2: Khó - Từ phức tạp, câu ghép, nội dung trừu tượng. Thách thức cao.

**Văn bản cần đánh giá:**
"""
${content}
"""

**Trả về CHÍNH XÁC định dạng JSON sau (không thêm markdown, chỉ JSON thuần):**
{
  "level": "A1",
  "reason": "Giải thích ngắn gọn",
  "avgWordLength": 2.5,
  "avgSentenceLength": 8,
  "difficultWords": ["từ khó 1", "từ khó 2"]
}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse JSON từ response
        let jsonText = text.trim();
        // Remove markdown code blocks if present
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const assessment = JSON.parse(jsonText);

        res.json(assessment);
    } catch (error: any) {
        console.error('Gemini API error:', error);
        res.status(500).json({
            error: 'Failed to assess reading level',
            details: error.message
        });
    }
});
