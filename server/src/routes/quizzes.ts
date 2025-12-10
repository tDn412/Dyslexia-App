import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

export const router = Router();

// GET /api/quizzes - Get all quizzes
router.get('/', async (req, res) => {
    const skill = req.query.skill as string;

    let query = supabase.from('quizzes').select('*');

    if (skill) {
        query = query.eq('skill', skill);
    }

    const { data, error } = await query;

    if (error) return res.status(500).json(error);
    res.json(data);
});

// GET /api/quizzes/:id - Get quiz by ID
router.get('/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('quiz_id', req.params.id)
        .single();

    if (error) return res.status(404).json({ error: 'Quiz not found' });
    res.json(data);
});

// POST /api/quizzes/submit - Submit quiz result
router.post('/submit', async (req, res) => {
    const { userId, quizId, answers } = req.body;

    if (!userId || !quizId || !answers) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch quiz to calculate score
    const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('questions')
        .eq('quiz_id', quizId)
        .single();

    if (quizError || !quiz) return res.status(404).json({ error: 'Quiz not found' });

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    // Simple scoring logic (assuming items have 'correctAnswer' field)
    // This logic depends on the structure of 'items' JSON
    // Example item: { "question": "...", "options": [...], "correctAnswer": "A" }

    quiz.questions.forEach((item: any, index: number) => {
        const userAnswer = answers[index];
        if (userAnswer === item.correctAnswer) {
            correctCount++;
        }
    });

    const score = (correctCount / totalQuestions) * 100;

    // Save result
    const { data, error } = await supabase
        .from('quiz_results')
        .insert([{
            user_id: userId,
            quiz_id: quizId,
            score,
            answers
        }])
        .select()
        .single();

    if (error) return res.status(500).json(error);

    res.json({
        result: data,
        score,
        correctCount,
        totalQuestions
    });
});
