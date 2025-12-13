import { Router } from 'express';
import { supabase } from '../utils/supabaseClient.js';

export const router = Router();

// GET /api/quizzes - Get all quizzes
router.get('/', async (req, res) => {
    const skill = req.query.skill as string;

    let query = supabase.from('Quiz').select('*');

    if (skill) {
        query = query.eq('type', skill); // Note: Schema has 'type', previous code used 'skill' or assumed 'skill' was column?
        // Schema: type text CHECK (type = ANY (ARRAY['listening_dictation', 'phonics_recognition']))
        // Previous code: query.eq('skill', skill). The provided Schema for Quiz table is: 
        // quizid, title, type, content, level, createdat
        // It does NOT have 'skill'. It uses 'type'.
        // I will assume 'skill' query param maps to 'type' column.
    }

    const { data, error } = await query;

    if (error) return res.status(500).json(error);
    res.json(data);
});

// GET /api/quizzes/:id - Get quiz by ID
router.get('/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('Quiz')
        .select('*')
        .eq('quizid', req.params.id)
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
        .from('Quiz')
        .select('content') // Schema has 'content' jsonb, check if it has questions inside
        .eq('quizid', quizId)
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
