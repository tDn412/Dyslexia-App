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
        // Use gemini-2.5-flash-lite which has quota on this API key
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite'
        });

        const prompt = `Bạn là chuyên gia đánh giá độ khó văn bản cho trẻ em Việt Nam bị chứng khó đọc (Dyslexia).

**Đặc điểm của trẻ dyslexia:**
- Khó nhận diện chữ cái tương tự (b/d, p/q, m/n)
- Khó đọc từ dài nhiều âm tiết
- Dễ mệt mỏi với câu dài, đoạn văn dày
- Cần từ vựng quen thuộc, hay gặp trong đời sống

**Tiêu chí đánh giá cấp độ:**
1. Độ dài từ trung bình (< 3 âm tiết = dễ)
2. Tần suất từ vựng (từ phổ biến trong đời sống hàng ngày)
3. Độ dài câu (< 10 từ/câu = dễ)
4. Cấu trúc ngữ pháp (câu đơn = dễ, câu ghép = khó)
5. Chủ đề (quen thuộc với trẻ 6-12 tuổi = dễ)
6. Số lượng từ mới/khó

**Thang đánh giá cấp độ:**
- A1: Rất dễ - Từ ngắn, câu ngắn, chủ đề quen thuộc. Phù hợp trẻ mới bắt đầu.
- A2: Dễ - Từ phổ biến, câu đơn giản, có một vài từ mới. Phù hợp trẻ đang luyện tập.
- B1: Trung bình - Câu dài hơn, có từ ít phổ biến, chủ đề đa dạng. Cần hướng dẫn.
- B2: Khó - Từ phức tạp, câu ghép, nội dung trừu tượng. Thách thức cao.

**Danh sách chủ đề nội dung:**
- "Động vật": Văn bản về động vật, thú cưng, vật nuôi
- "Thiên nhiên": Thiên nhiên, cây cối, môi trường
- "Thức ăn": Đồ ăn, món ăn, nấu ăn
- "Gia đình": Gia đình, người thân, mối quan hệ
- "Truyện": Truyện cổ tích, truyện ngắn, câu chuyện
- "Học tập": Trường học, học tập, giáo dục
- "Phiêu lưu": Phiêu lưu, khám phá, du lịch
- "Thể thao": Thể thao, vận động, trò chơi
- "Khác": Các chủ đề khác không thuộc các loại trên

**Văn bản cần đánh giá:**
"""
${content}
"""

**Trả về CHÍNH XÁC định dạng JSON sau (không thêm markdown, chỉ JSON thuần):**
{
  "level": "A1",
  "recommendedTopic": "Động vật",
  "reason": "Giải thích ngắn gọn tại sao chọn cấp độ và chủ đề này (1-2 câu)",
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

        // Fallback: simple rule-based assessment when Gemini fails
        const words = content.trim().split(/\s+/);
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
        const avgSentenceLength = words.length / Math.max(sentences.length, 1);

        let level = 'A1';
        let topic = 'Khác';

        // Simple level detection
        if (avgWordLength > 6 && avgSentenceLength > 12) {
            level = 'B2';
        } else if (avgWordLength > 5 || avgSentenceLength > 10) {
            level = 'B1';
        } else if (avgWordLength > 4 || avgSentenceLength > 8) {
            level = 'A2';
        }

        // Simple topic detection (keyword matching)
        const contentLower = content.toLowerCase();
        if (/mèo|chó|gà|chim|thú|động vật/.test(contentLower)) topic = 'Động vật';
        else if (/cây|hoa|rừng|sông|biển|núi|thiên nhiên/.test(contentLower)) topic = 'Thiên nhiên';
        else if (/cơm|phở|bánh|ăn|món|thức ăn/.test(contentLower)) topic = 'Thức ăn';
        else if (/bố|mẹ|con|anh|em|gia đình/.test(contentLower)) topic = 'Gia đình';
        else if (/truyện|cổ tích|ngày xưa/.test(contentLower)) topic = 'Truyện';
        else if (/trường|học|bài|giáo viên/.test(contentLower)) topic = 'Học tập';
        else if (/bóng|chạy|nhảy|thể thao/.test(contentLower)) topic = 'Thể thao';

        const fallbackAssessment = {
            level,
            recommendedTopic: topic,
            reason: `Văn bản có độ dài từ trung bình ${avgWordLength.toFixed(1)} ký tự, ${avgSentenceLength.toFixed(1)} từ/câu. Cấp độ và chủ đề được đề xuất dựa trên phân tích văn bản.`,
            avgWordLength: parseFloat(avgWordLength.toFixed(2)),
            avgSentenceLength: parseFloat(avgSentenceLength.toFixed(1)),
            difficultWords: []
        };

        res.json(fallbackAssessment);
    }
});
