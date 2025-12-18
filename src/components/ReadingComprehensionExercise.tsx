import { useState, useEffect } from 'react';
import { X, Check, ChevronRight, Star } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { fetchQuizzes } from '../utils/api';
import { toast } from 'sonner';

interface ReadingComprehensionExerciseProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport' | 'Exercise' | 'VisualSpelling' | 'ListenSpelling' | 'ReadingComprehension') => void;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct answer
}

interface Exercise {
  id: string;
  title: string;
  text: string;
  questions: Question[];
}

interface CompletionModalProps {
  onBackToList: () => void;
  themeColors: any;
}

function CompletionModal({ onBackToList, themeColors }: CompletionModalProps) {
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
          Chúc mừng! Bạn đã hoàn thành bài đọc "Bé Hà"
        </h2>

        {/* Back Button */}
        <div className="flex justify-center">
          <button
            onClick={onBackToList}
            className="transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: '#4CAF50',
              color: '#FFFFFF',
              borderRadius: '20px',
              padding: '18px 50px',
              boxShadow: `0 6px 20px ${themeColors.shadow}`,
              border: 'none',
              border: 'none',
              fontFamily: 'var(--display-font-family)',
              fontSize: 'calc(var(--display-font-size) * 1.1)',
              letterSpacing: 'var(--display-letter-spacing)',
            }}
          >
            Về danh sách
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ReadingComprehensionExercise({ onNavigate, onSignOut, isSidebarCollapsed, onToggleCollapse }: ReadingComprehensionExerciseProps) {
  const { themeColors } = useTheme();

  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: 'be-ha',
      title: 'Bé Hà',
      text: 'Ở nhà, bạn Hà rất chăm chỉ. Đi học về là Hà làm luyện tập viết ở lớp cô cho. Hà còn tập vẽ. Nhìn mẹ bận rộn suốt việc nhà nên Hà phụ mẹ quét nhà, giặt khăn, dỗ em bé ngủ. Bố mẹ rất yên tâm khi có Hà ở nhà.',
      questions: [
        {
          id: 1,
          question: 'Trong bài tiếng có chứa vần iết là',
          options: ['suốt', 'viết', 'việc'],
          correctAnswer: 1,
        },
        {
          id: 2,
          question: 'Bạn Hà như thế nào?',
          options: ['Hà làm biếng học bài', 'Hà rất tốt bụng', 'Hà rất chăm chỉ'],
          correctAnswer: 2,
        },
        {
          id: 3,
          question: 'Hà học gì ở nhà?',
          options: ['tập viết và tập vẽ', 'tập viết', 'tập vẽ'],
          correctAnswer: 0,
        },
        {
          id: 4,
          question: 'Hà phụ mẹ làm gì?',
          options: ['Hà phụ mẹ quét nhà', 'Hà phụ mẹ giặt khăn', 'Cả 2 phương án trên'],
          correctAnswer: 2,
        },
        {
          id: 5,
          question: 'Bố mẹ rất ....... khi có Hà ở nhà',
          options: ['yên tâm', 'lo lắng', 'buồn'],
          correctAnswer: 0,
        },
      ],
    },
  ]);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const data = await fetchQuizzes('reading_comprehension');

        if (data && data.length > 0) {
          const fetchedExercises: Exercise[] = data.map((quiz: any) => ({
            id: quiz.content?.id || quiz.id, // Fallback to row ID if content ID missing
            title: quiz.content?.title || 'Bài tập không tên',
            text: quiz.content?.text || '',
            questions: quiz.content?.questions || [],
          }));

          if (fetchedExercises.length > 0) {
            setExercises(fetchedExercises);
          }
        }
      } catch (error) {
        console.error('Failed to load exercises:', error);
        toast.error('Không thể tải bài tập, đang sử dụng dữ liệu mẫu.');
      }
    };

    loadExercises();
  }, []);

  const [showExerciseList, setShowExerciseList] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseList(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setHasChecked(false);
  };

  const handleBackToList = () => {
    setShowExerciseList(true);
    setSelectedExercise(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setHasChecked(false);
    setShowCompletion(false);
  };

  const handleAnswerSelect = (index: number) => {
    if (!hasChecked) {
      setSelectedAnswer(index);
    }
  };

  const handleCheck = () => {
    if (selectedAnswer !== null) {
      setHasChecked(true);
    }
  };

  const handleNext = () => {
    if (selectedExercise) {
      if (currentQuestionIndex < selectedExercise.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setHasChecked(false);
      } else {
        // Show completion modal
        setShowCompletion(true);
      }
    }
  };

  const handleExitToExercises = () => {
    onNavigate?.('Exercise');
  };

  // Exercise List View
  if (showExerciseList) {
    return (
      <div
        className="flex flex-col h-screen"
        style={{ backgroundColor: themeColors.appBackground }}
      >
        {/* Header */}
        <div className="flex items-center px-8 py-6">
          <button
            onClick={handleExitToExercises}
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
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-12 py-8">
          <h1
            className="mb-12"
            style={{
              fontFamily: 'var(--display-font-family)',
              fontSize: 'calc(var(--display-font-size) * 1.6)',
              fontWeight: '500',
              lineHeight: 'var(--display-line-spacing)',
              letterSpacing: 'var(--display-letter-spacing)',
              color: themeColors.textMain,
            }}
          >
            Bài tập Đọc hiểu
          </h1>

          {/* Exercise Cards */}
          <div className="grid gap-6">
            {exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleExerciseSelect(exercise)}
                className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: themeColors.cardBackground,
                  border: `3px solid ${themeColors.border}`,
                  borderRadius: '28px',
                  padding: '32px 40px',
                  textAlign: 'left',
                  boxShadow: `0 6px 16px ${themeColors.shadow}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2
                      style={{
                        fontFamily: 'var(--display-font-family)',
                        fontSize: 'calc(var(--display-font-size) * 1.2)',
                        lineHeight: 'var(--display-line-spacing)',
                        letterSpacing: 'var(--display-letter-spacing)',
                        color: themeColors.textMain,
                        marginBottom: '8px',
                      }}
                    >
                      {exercise.title}
                    </h2>
                    <p
                      style={{
                        fontFamily: 'var(--display-font-family)',
                        fontSize: 'calc(var(--display-font-size) * 0.9)',
                        lineHeight: 'var(--display-line-spacing)',
                        letterSpacing: 'var(--display-letter-spacing)',
                        color: themeColors.textSecondary,
                      }}
                    >
                      {exercise.questions.length} câu hỏi
                    </p>
                  </div>
                  <ChevronRight
                    style={{
                      width: '40px',
                      height: '40px',
                      color: themeColors.textMain,
                      strokeWidth: '2.5',
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Exercise View (Split Screen)
  if (selectedExercise) {
    const currentQuestion = selectedExercise.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    return (
      <div
        className="flex flex-col h-screen"
        style={{ backgroundColor: themeColors.appBackground }}
      >
        {/* Header */}
        <div className="flex items-center px-8 py-6">
          <button
            onClick={handleBackToList}
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
        </div>

        {/* Split Screen Content Wrapper */}
        <div className="flex-1 w-full overflow-hidden flex justify-center px-6 pb-6">
          {/* Centered Content Container */}
          <div className="w-full max-w-[1600px] h-full flex gap-6">
            {/* Left Column - Reading Text */}
            <div
              className="flex-[7] overflow-auto"
              style={{
                backgroundColor: themeColors.cardBackground,
                border: `3px solid ${themeColors.border}`,
                borderRadius: '28px',
                padding: '40px',
                boxShadow: `0 6px 16px ${themeColors.shadow}`,
              }}
            >
              <h2
                className="mb-6"
                style={{
                  fontFamily: 'var(--display-font-family)',
                  fontSize: 'calc(var(--display-font-size) * 1.2)',
                  lineHeight: 'var(--display-line-spacing)',
                  letterSpacing: 'var(--display-letter-spacing)',
                  color: themeColors.textMain,
                }}
              >
                {selectedExercise.title}
              </h2>
              <p
                style={{
                  fontFamily: 'var(--display-font-family)',
                  fontSize: 'var(--display-font-size)',
                  lineHeight: 'var(--display-line-spacing)',
                  letterSpacing: 'var(--display-letter-spacing)',
                  color: themeColors.textMain,
                }}
              >
                {selectedExercise.text}
              </p>
            </div>

            {/* Right Column - Questions */}
            <div
              className="flex-[3] flex flex-col"
              style={{
                backgroundColor: themeColors.cardBackground,
                border: `3px solid ${themeColors.border}`,
                borderRadius: '28px',
                padding: '40px',
                boxShadow: `0 6px 16px ${themeColors.shadow}`,
              }}
            >
              {/* Question Number */}
              <div
                className="mb-6"
                style={{
                  fontFamily: 'var(--display-font-family)',
                  fontSize: 'calc(var(--display-font-size) * 0.9)',
                  lineHeight: 'var(--display-line-spacing)',
                  letterSpacing: 'var(--display-letter-spacing)',
                  color: themeColors.textSecondary,
                }}
              >
                Câu {currentQuestionIndex + 1}/{selectedExercise.questions.length}
              </div>

              {/* Question Text */}
              <h3
                className="mb-8"
                style={{
                  fontFamily: 'var(--display-font-family)',
                  fontSize: 'calc(var(--display-font-size) * 1.1)',
                  fontWeight: '600',
                  lineHeight: 'var(--display-line-spacing)',
                  letterSpacing: 'var(--display-letter-spacing)',
                  color: themeColors.textMain,
                }}
              >
                {currentQuestion.question}
              </h3>

              {/* Answer Options */}
              <div className="flex-1 flex flex-col gap-4 mb-8">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectAnswer = index === currentQuestion.correctAnswer;

                  let backgroundColor = themeColors.cardBackground;
                  let borderColor = themeColors.border;
                  let showCheck = false;

                  if (hasChecked) {
                    if (isSelected && isCorrect) {
                      backgroundColor = '#E8F5E9';
                      borderColor = '#4CAF50';
                      showCheck = true;
                    } else if (isSelected && !isCorrect) {
                      backgroundColor = '#FFE9ED';
                      borderColor = '#FFC0CB';
                    } else if (!isSelected && isCorrectAnswer) {
                      backgroundColor = '#E8F5E9';
                      borderColor = '#4CAF50';
                      showCheck = true;
                    }
                  } else if (isSelected) {
                    backgroundColor = themeColors.accentMain;
                  }

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={hasChecked}
                      whileHover={!hasChecked ? { scale: 1.02 } : {}}
                      whileTap={!hasChecked ? { scale: 0.98 } : {}}
                      className="transition-all duration-200"
                      style={{
                        backgroundColor,
                        border: `3px solid ${borderColor}`,
                        borderRadius: '20px',
                        padding: '20px 28px',
                        textAlign: 'left',
                        boxShadow: `0 4px 12px ${themeColors.shadow}`,
                        cursor: hasChecked ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--display-font-family)',
                          fontSize: 'var(--display-font-size)',
                          lineHeight: 'var(--display-line-spacing)',
                          letterSpacing: 'var(--display-letter-spacing)',
                          color: themeColors.textMain,
                        }}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </span>
                      {showCheck && (
                        <Check
                          style={{
                            width: '28px',
                            height: '28px',
                            color: '#4CAF50',
                            strokeWidth: '3',
                          }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Action Button */}
              {!hasChecked ? (
                <button
                  onClick={handleCheck}
                  disabled={selectedAnswer === null}
                  className="transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: selectedAnswer !== null ? '#4CAF50' : themeColors.border,
                    color: '#FFFFFF',
                    borderRadius: '20px',
                    padding: '18px 40px',
                    boxShadow: `0 6px 20px ${themeColors.shadow}`,
                    border: 'none',
                    fontFamily: 'var(--display-font-family)',
                    fontSize: 'calc(var(--display-font-size) * 1.1)',
                    letterSpacing: 'var(--display-letter-spacing)',
                    cursor: selectedAnswer !== null ? 'pointer' : 'not-allowed',
                    opacity: selectedAnswer !== null ? 1 : 0.5,
                  }}
                >
                  Kiểm tra
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: '#4CAF50',
                    color: '#FFFFFF',
                    borderRadius: '20px',
                    padding: '18px 40px',
                    boxShadow: `0 6px 20px ${themeColors.shadow}`,
                    border: 'none',
                    fontFamily: 'var(--display-font-family)',
                    fontSize: 'calc(var(--display-font-size) * 1.1)',
                    letterSpacing: 'var(--display-letter-spacing)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                  }}
                >
                  <span>Câu tiếp theo</span>
                  <ChevronRight
                    style={{
                      width: '28px',
                      height: '28px',
                      strokeWidth: '3',
                    }}
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Completion Modal */}
        <AnimatePresence>
          {showCompletion && (
            <CompletionModal
              onBackToList={handleBackToList}
              themeColors={themeColors}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
