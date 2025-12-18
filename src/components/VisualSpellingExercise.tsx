import { useState, useEffect } from 'react';
import { X, Star, Award } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { fetchQuizzes } from '../utils/api';
import { toast } from 'sonner';

interface VisualSpellingExerciseProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport' | 'Exercise' | 'VisualSpelling') => void;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface Question {
  id: number;
  image: string;
  correctAnswer: string;
  wrongAnswer: string;
  correctIsFirst: boolean;
}

interface FeedbackModalProps {
  isCorrect: boolean;
  correctAnswer: string;
  onContinue: () => void;
  onExit: () => void;
  themeColors: any;
}

function FeedbackModal({ isCorrect, correctAnswer, onContinue, onExit, themeColors }: FeedbackModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        className="relative"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderRadius: '40px',
          padding: '60px 80px',
          boxShadow: `0 8px 32px ${themeColors.shadow}`,
          maxWidth: '600px',
          width: '90%',
        }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-8">
          {isCorrect ? (
            <div
              className="flex items-center justify-center"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '30px',
                backgroundColor: '#4CAF50',
              }}
            >
              <Star
                style={{
                  width: '70px',
                  height: '70px',
                  color: '#FFFFFF',
                  fill: '#FFFFFF',
                }}
              />
            </div>
          ) : (
            <div
              className="flex items-center justify-center"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '30px',
                backgroundColor: '#FFC0CB',
              }}
            >
              <Award
                style={{
                  width: '70px',
                  height: '70px',
                  color: '#FFFFFF',
                  strokeWidth: '2.5',
                }}
              />
            </div>
          )}
        </div>

        {/* Message */}
        <h2
          className="text-center mb-12"
          style={{
            fontFamily: 'var(--display-font-family)',
            fontSize: 'calc(var(--display-font-size) * 1.5)',
            lineHeight: 'var(--display-line-spacing)',
            letterSpacing: 'var(--display-letter-spacing)',
            color: themeColors.textMain,
          }}
        >
          {isCorrect
            ? 'Đúng rồi, bé giỏi quá!'
            : `Tiếc quá, đáp án là ${correctAnswer} cơ. Cố lên!`}
        </h2>

        {/* Action Buttons */}
        <div className="flex gap-6 justify-center">
          {/* Continue Button (O) */}
          <button
            onClick={onContinue}
            className="flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '20px',
              backgroundColor: '#4CAF50',
              boxShadow: `0 4px 12px ${themeColors.shadow}`,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--display-font-family)',
                fontSize: 'calc(var(--display-font-size) * 2)',
                color: '#FFFFFF',
              }}
            >
              O
            </span>
          </button>

          {/* Exit Button (X) */}
          <button
            onClick={onExit}
            className="flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '20px',
              backgroundColor: '#FFC0CB',
              boxShadow: `0 4px 12px ${themeColors.shadow}`,
            }}
          >
            <X
              style={{
                width: '48px',
                height: '48px',
                color: '#FFFFFF',
                strokeWidth: '3',
              }}
            />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function VisualSpellingExercise({ onNavigate, onSignOut, isSidebarCollapsed, onToggleCollapse }: VisualSpellingExerciseProps) {
  const { themeColors } = useTheme();

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1721849282256-8e2b66f03f4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmlnaHQlMjBzdW4lMjBzdW5zaGluZXxlbnwxfHx8fDE3NjU2Mzg4OTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      correctAnswer: 'Nắng',
      wrongAnswer: 'Ngắn',
      correctIsFirst: true,
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1636045466232-539c7bd7817e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMGZpc2glMjBzd2ltbWluZ3xlbnwxfHx8fDE3NjU3MTQzODh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      correctAnswer: 'Cá',
      wrongAnswer: 'Cà',
      correctIsFirst: false,
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1693082895630-45b223dc2796?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjBjaGlsaSUyMHBlcHBlcnxlbnwxfHx8fDE3NjU3MDI1MTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      correctAnswer: 'Ớt',
      wrongAnswer: 'Tớ',
      correctIsFirst: false,
    },
  ]);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // Fetch quizzes of type 'VisualSpelling' or 'visual_spelling'
        // Trying 'visual_spelling' as standard DB convention, fallback to 'VisualSpelling' if needed
        const data = await fetchQuizzes('visual_spelling');

        if (data && data.length > 0) {
          // Aggregate all questions from all matching quizzes
          const allQuestions: Question[] = [];
          data.forEach((quiz: any) => {
            // Check content.questions exists
            if (quiz.content?.questions) {
              allQuestions.push(...quiz.content.questions);
            }
          });

          if (allQuestions.length > 0) {
            setQuestions(allQuestions);
          }
        }
      } catch (error) {
        console.error('Failed to load questions:', error);
        toast.error('Không thể tải bài tập, đang sử dụng dữ liệu mẫu.');
      }
    };

    loadQuestions();
  }, []);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLastAnswerCorrect, setIsLastAnswerCorrect] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (answer: string) => {
    const isCorrect = answer === currentQuestion.correctAnswer;
    setIsLastAnswerCorrect(isCorrect);

    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }

    setShowFeedback(true);
  };

  const handleContinue = () => {
    setShowFeedback(false);
    // Move to next question, loop back to first if at the end
    setCurrentQuestionIndex((currentQuestionIndex + 1) % questions.length);
  };

  const handleModalExit = () => {
    setShowFeedback(false);
    onNavigate?.('Exercise');
  };

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: themeColors.appBackground }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-6">
        {/* Exit Button */}
        <button
          onClick={() => onNavigate?.('Exercise')}
          className="transition-all duration-200 hover:scale-110 active:scale-95"
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '18px',
            backgroundColor: themeColors.cardBackground,
            border: `2px solid ${themeColors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${themeColors.shadow}`,
          }}
        >
          <X
            style={{
              width: '36px',
              height: '36px',
              color: themeColors.textMain,
              strokeWidth: '2.5',
            }}
          />
        </button>

        {/* Correct Count Badge */}
        <div
          className="flex items-center justify-center"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#4CAF50',
            boxShadow: `0 4px 12px ${themeColors.shadow}`,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--display-font-family)',
              fontSize: 'calc(var(--display-font-size) * 1.4)',
              color: '#FFFFFF',
            }}
          >
            {correctCount}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center w-full max-w-4xl"
          >
            {/* Image */}
            <div
              className="mb-12 overflow-hidden"
              style={{
                width: '600px',
                height: '400px',
                borderRadius: '32px',
                boxShadow: `0 8px 24px ${themeColors.shadow}`,
                backgroundColor: themeColors.cardBackground,
              }}
            >
              <ImageWithFallback
                src={currentQuestion.image}
                alt="Question"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Answer Buttons */}
            <div className="flex gap-8 w-full justify-center">
              {/* First Answer */}
              <button
                onClick={() =>
                  handleAnswer(
                    currentQuestion.correctIsFirst
                      ? currentQuestion.correctAnswer
                      : currentQuestion.wrongAnswer
                  )
                }
                className="transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: themeColors.cardBackground,
                  border: `3px solid ${themeColors.border}`,
                  borderRadius: '24px',
                  padding: '32px 80px',
                  boxShadow: `0 6px 16px ${themeColors.shadow}`,
                  minWidth: '300px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--display-font-family)',
                    fontSize: 'calc(var(--display-font-size) * 1.8)',
                    lineHeight: 'var(--display-line-spacing)',
                    letterSpacing: 'var(--display-letter-spacing)',
                    color: themeColors.textMain,
                  }}
                >
                  {currentQuestion.correctIsFirst
                    ? currentQuestion.correctAnswer
                    : currentQuestion.wrongAnswer}
                </span>
              </button>

              {/* Second Answer */}
              <button
                onClick={() =>
                  handleAnswer(
                    currentQuestion.correctIsFirst
                      ? currentQuestion.wrongAnswer
                      : currentQuestion.correctAnswer
                  )
                }
                className="transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: themeColors.cardBackground,
                  border: `3px solid ${themeColors.border}`,
                  borderRadius: '24px',
                  padding: '32px 80px',
                  boxShadow: `0 6px 16px ${themeColors.shadow}`,
                  minWidth: '300px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--display-font-family)',
                    fontSize: 'calc(var(--display-font-size) * 1.8)',
                    lineHeight: 'var(--display-line-spacing)',
                    letterSpacing: 'var(--display-letter-spacing)',
                    color: themeColors.textMain,
                  }}
                >
                  {currentQuestion.correctIsFirst
                    ? currentQuestion.wrongAnswer
                    : currentQuestion.correctAnswer}
                </span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <FeedbackModal
            isCorrect={isLastAnswerCorrect}
            correctAnswer={currentQuestion.correctAnswer}
            onContinue={handleContinue}
            onExit={handleModalExit}
            themeColors={themeColors}
          />
        )}
      </AnimatePresence>
    </div>
  );
}