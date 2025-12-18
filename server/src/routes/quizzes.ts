import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

export const router = Router();

// GET /api/quizzes - Get all quizzes
// Get all quizzes
router.get('/', async (req, res) => {
    const skill = req.query.skill as string;

    let query = supabase.from('exercise_questions').select('*'); // User requested table

    if (skill) {
        query = query.eq('type', skill);
    }

    const { data, error } = await query;

    if (error) return res.status(500).json(error);
    res.json(data);
});

// GET /api/quizzes/:id - Get quiz by ID
router.get('/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('exercise_questions')
        .select('*')
        .eq('id', req.params.id) // using 'id' (UUID) instead of 'quizid'
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
        .from('exercise_questions')
        .select('content')
        .eq('id', quizId) // using 'id'
        .single();

    if (quizError || !quiz) return res.status(404).json({ error: 'Quiz not found' });

    // Assuming content has questions array
    const questions = quiz.content.questions || [];
    let correctCount = 0;
    const totalQuestions = questions.length;

    // Simple scoring logic (assuming items have 'correctAnswer' field)
    // This logic depends on the structure of 'items' JSON
    // Example item: { "question": "...", "options": [...], "correctAnswer": "A" }

    questions.forEach((item: any, index: number) => {
        const userAnswer = answers[index];
        if (userAnswer === item.correctAnswer) {
            correctCount++;
        }
    });

    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Save result
    const { data, error } = await supabase
        .from('QuizResult')
        .insert([{
            userid: userId,
            quizid: quizId,
            score,
            totalquestions: totalQuestions,
            correctanswers: correctCount
            // answers // Schema doesn't have 'answers' column! It has score, correctanswers, totalquestions.
            // If we need to save detailed answers, the schema is missing it. 
            // I will strictly follow schema which only has these columns.
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
