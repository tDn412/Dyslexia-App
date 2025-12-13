import { Sidebar } from './Sidebar';
import { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { fetchQuizById, submitQuizResult } from '../utils/api';
import { toast } from 'sonner';
import { Check, X, ArrowRight, RotateCcw } from 'lucide-react';

interface QuizPlayerPageProps {
    onNavigate?: (page: any) => void;
    onSignOut?: () => void;
    isSidebarCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string;
}

interface Quiz {
    id: string;
    title: string;
    description: string;
    questions: Question[];
}

export function QuizPlayerPage({ onNavigate, onSignOut, isSidebarCollapsed = false, onToggleCollapse }: QuizPlayerPageProps) {
    const { themeColors } = useTheme();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<any[]>([]);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);

    useEffect(() => {
        const loadQuiz = async () => {
            const quizId = localStorage.getItem('currentQuizId');
            if (!quizId) {
                toast.error("Không tìm thấy bài kiểm tra.");
                onNavigate?.('Exercise');
                return;
            }
            try {
                setLoading(true);
                const data = await fetchQuizById(quizId);

                // Extract questions from 'content' column
                // content might be an object (if JSONB) or string
                let contentObj = data.content;
                if (typeof contentObj === 'string') {
                    try {
                        contentObj = JSON.parse(contentObj);
                    } catch (e) {
                        console.error("Failed to parse quiz content", e);
                        contentObj = { questions: [] };
                    }
                }

                // Questions are inside content.questions
                const questions = contentObj?.questions || [];

                setQuiz({
                    ...data,
                    id: data.quizid, // Map quizid to id for internal interface usage
                    questions: questions
                });
            } catch (error) {
                console.error("Failed to load quiz", error);
                toast.error("Lỗi khi tải bài kiểm tra.");
            } finally {
                setLoading(false);
            }
        };
        loadQuiz();
    }, [onNavigate]);

    const handleOptionSelect = (option: string) => {
        if (isAnswerChecked) return;
        setSelectedOption(option);
    };

    const handleCheckAnswer = () => {
        if (!selectedOption || !quiz) return;

        const currentQuestion = quiz.questions[currentQuestionIndex];
        const isCorrect = selectedOption === currentQuestion.correctAnswer;

        if (isCorrect) {
            setScore(score + 1);
            toast.success("Chính xác!");
        } else {
            toast.error("Chưa chính xác.");
        }

        setAnswers([...answers, { questionId: currentQuestion.id, answer: selectedOption, isCorrect }]);
        setIsAnswerChecked(true);
    };

    const handleNextQuestion = () => {
        if (!quiz) return;

        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedOption(null);
            setIsAnswerChecked(false);
        } else {
            handleFinishQuiz();
        }
    };

    const handleFinishQuiz = async () => {
        if (!quiz) return;
        setShowResult(true);
        try {
            const userId = 'demo-user-id';
            await submitQuizResult(userId, quiz.id, score, answers);
            toast.success("Đã nộp bài thành công!");
        } catch (error) {
            console.error("Failed to submit quiz", error);
            toast.error("Lỗi khi nộp bài.");
        }
    };

    const handleRetry = () => {
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setScore(0);
        setShowResult(false);
        setAnswers([]);
        setIsAnswerChecked(false);
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!quiz) {
        return <div className="flex h-screen items-center justify-center">Quiz not found</div>;
    }

    if (showResult) {
        return (
            <div className="flex h-screen" style={{ backgroundColor: themeColors.appBackground }}>
                <Sidebar
                    activePage="Bài tập"
                    onNavigate={onNavigate}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={onToggleCollapse}
                    onSignOut={onSignOut}
                />
                <main className="flex-1 flex items-center justify-center p-12">
                    <div
                        className="max-w-2xl w-full rounded-[2rem] p-12 text-center shadow-lg border-2"
                        style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.border }}
                    >
                        <h2 className="text-4xl font-bold mb-6" style={{ color: themeColors.textMain }}>Kết quả</h2>
                        <div className="text-6xl font-bold mb-8" style={{ color: themeColors.accentMain }}>
                            {score} / {quiz.questions.length}
                        </div>
                        <p className="text-xl mb-12" style={{ color: themeColors.textMuted }}>
                            Bạn đã hoàn thành bài kiểm tra "{quiz.title}".
                        </p>
                        <div className="flex justify-center gap-6">
                            <button
                                onClick={handleRetry}
                                className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105"
                                style={{ backgroundColor: themeColors.exerciseCard1, color: themeColors.textMain }}
                            >
                                <RotateCcw /> Làm lại
                            </button>
                            <button
                                onClick={() => onNavigate?.('Exercise')}
                                className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105"
                                style={{ backgroundColor: themeColors.accentMain, color: themeColors.textMain }}
                            >
                                Danh sách bài tập
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];

    return (
        <div className="flex h-screen" style={{ backgroundColor: themeColors.appBackground }}>
            <Sidebar
                activePage="Bài tập"
                onNavigate={onNavigate}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={onToggleCollapse}
                onSignOut={onSignOut}
            />

            <main className="flex-1 flex flex-col p-12 overflow-hidden">
                {/* Progress Bar */}
                <div className="w-full h-4 rounded-full mb-8 bg-gray-200 overflow-hidden">
                    <div
                        className="h-full transition-all duration-500"
                        style={{
                            width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
                            backgroundColor: themeColors.accentMain
                        }}
                    />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
                    {/* Question Card */}
                    <div
                        className="w-full rounded-[2rem] p-10 mb-8 border-2 shadow-sm"
                        style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.border }}
                    >
                        <h3
                            className="text-2xl font-medium mb-2"
                            style={{ color: themeColors.textMuted }}
                        >
                            Câu hỏi {currentQuestionIndex + 1}/{quiz.questions.length}
                        </h3>
                        <p
                            className="text-3xl font-bold leading-relaxed"
                            style={{
                                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                                color: themeColors.textMain
                            }}
                        >
                            {currentQuestion.text}
                        </p>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-2 gap-6 w-full mb-8">
                        {currentQuestion.options.map((option, index) => {
                            let bgColor = themeColors.cardBackground;
                            let borderColor = themeColors.border;

                            if (isAnswerChecked) {
                                if (option === currentQuestion.correctAnswer) {
                                    bgColor = '#C9F6C9'; // Green for correct
                                    borderColor = '#86EFAC';
                                } else if (option === selectedOption && option !== currentQuestion.correctAnswer) {
                                    bgColor = '#FAD4D4'; // Red for wrong
                                    borderColor = '#FCA5A5';
                                }
                            } else if (selectedOption === option) {
                                bgColor = themeColors.exerciseCard2; // Highlight selected
                                borderColor = themeColors.accentMain;
                            }

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleOptionSelect(option)}
                                    disabled={isAnswerChecked}
                                    className="p-8 rounded-2xl text-2xl font-medium text-left transition-all border-2 hover:shadow-md active:scale-[0.98]"
                                    style={{
                                        backgroundColor: bgColor,
                                        borderColor: borderColor,
                                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                                        color: themeColors.textMain,
                                        opacity: isAnswerChecked && option !== currentQuestion.correctAnswer && option !== selectedOption ? 0.5 : 1
                                    }}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end w-full">
                        {!isAnswerChecked ? (
                            <button
                                onClick={handleCheckAnswer}
                                disabled={!selectedOption}
                                className="px-10 py-4 rounded-xl text-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                                style={{ backgroundColor: themeColors.accentMain, color: themeColors.textMain }}
                            >
                                Kiểm tra
                            </button>
                        ) : (
                            <button
                                onClick={handleNextQuestion}
                                className="flex items-center gap-2 px-10 py-4 rounded-xl text-xl font-bold transition-all hover:scale-105"
                                style={{ backgroundColor: themeColors.accentMain, color: themeColors.textMain }}
                            >
                                {currentQuestionIndex < quiz.questions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành'} <ArrowRight />
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
