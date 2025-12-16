import { useState, useEffect } from 'react';
import { X, Lightbulb, Star } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { fetchQuizzes } from '../utils/api';
import { toast } from 'sonner';

interface ClozeTestExerciseProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport' | 'Exercise' | 'VisualSpelling' | 'ListenSpelling' | 'ReadingComprehension' | 'ClozeTest') => void;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface BlankSpace {
  id: number;
  correctAnswer: string;
}

interface Question {
  id: number;
  textSegments: (string | BlankSpace)[];
  options: string[];
  lines: number;
}

interface Exercise {
  id: string;
  title: string;
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
          Xuất sắc! Bạn đã hoàn thành bài tập!
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

export function ClozeTestExercise({ onNavigate, onSignOut, isSidebarCollapsed, onToggleCollapse }: ClozeTestExerciseProps) {
  const { themeColors } = useTheme();

  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: 'de-1',
      title: 'Bài tập Điền từ',
      questions: [
        {
          id: 1,
          textSegments: [
            'Cầu ao ',
            { id: 1, correctAnswer: 'l' },
            'oang vết mỡ\n',
            'Em buông cần ngồi câu\n',
            'Phao trắng tênh tênh ',
            { id: 2, correctAnswer: 'n' },
            'ổi\n',
            'Trên trời xanh làu ',
            { id: 3, correctAnswer: 'l' },
            'àu',
          ],
          options: ['l', 'n'],
          lines: 4,
        },
        {
          id: 2,
          textSegments: [
            'Chiều sau khu vườn nhỏ\n',
            'Vòm lá rung tiếng ',
            { id: 1, correctAnswer: 'đàn' },
            '\n',
            'Ca sĩ là chim sẻ\n',
            'Khán giả là hoa ',
            { id: 2, correctAnswer: 'vàng' },
            '\n',
            'Tất cả cùng hợp xướng\n',
            'Những lời ca reo ',
            { id: 3, correctAnswer: 'vang' },
          ],
          options: ['đàn', 'vàng', 'vang', 'đang', 'vân'],
          lines: 6,
        },
        {
          id: 3,
          textSegments: [
            'Em đang làm bài tập\n',
            'Nghe có tiếng gọi ',
            { id: 1, correctAnswer: 'mẹ' },
            '\n',
            'Mẹ dắt em đi chơi\n',
            'Đến công viên gần ',
            { id: 2, correctAnswer: 'nhà' },
          ],
          options: ['mẹ', 'nhà', 'bố', 'xa'],
          lines: 4,
        },
      ],
    },
  ]);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const data = await fetchQuizzes('cloze_test');

        if (data && data.length > 0) {
          const fetchedExercises: Exercise[] = data.map((quiz: any) => ({
            id: quiz.quizid,
            title: quiz.title,
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
  const [filledBlanks, setFilledBlanks] = useState<{ [key: number]: string }>({});
  const [hasChecked, setHasChecked] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseList(false);
    setCurrentQuestionIndex(0);
    setFilledBlanks({});
    setHasChecked(false);
    setShowHint(false);
  };

  const handleBackToList = () => {
    setShowExerciseList(true);
    setSelectedExercise(null);
    setFilledBlanks({});
    setHasChecked(false);
    setShowCompletion(false);
    setShowHint(false);
  };

  const handleExitToExercises = () => {
    onNavigate?.('Exercise');
  };

  const handleDragStart = (option: string) => {
    setDraggedItem(option);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (blankId: number) => {
    if (draggedItem && !hasChecked) {
      setFilledBlanks(prev => ({
        ...prev,
        [blankId]: draggedItem,
      }));
    }
    setDraggedItem(null);
  };

  const handleBlankClick = (blankId: number) => {
    if (!hasChecked && filledBlanks[blankId]) {
      // Remove the filled answer
      const newFilled = { ...filledBlanks };
      delete newFilled[blankId];
      setFilledBlanks(newFilled);
    }
  };

  const handleCheck = () => {
    setHasChecked(true);
    setShowHint(false);
  };

  const handleHint = () => {
    setShowHint(true);
  };

  const handleContinue = () => {
    if (currentQuestionIndex < selectedExercise!.questions.length - 1) {
      // Move to next question
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      setFilledBlanks({});
      setHasChecked(false);
      setShowHint(false);
      setShowCompletion(false);
    } else {
      // Finished all questions
      setShowCompletion(true);
    }
  };

  // Check if all blanks are filled
  const allBlanksFilled = selectedExercise
    ? selectedExercise.questions[currentQuestionIndex].textSegments
      .filter((seg): seg is BlankSpace => typeof seg !== 'string')
      .every(blank => filledBlanks[blank.id])
    : false;

  // Check if all answers are correct
  const allCorrect = selectedExercise
    ? selectedExercise.questions[currentQuestionIndex].textSegments
      .filter((seg): seg is BlankSpace => typeof seg !== 'string')
      .every(blank => filledBlanks[blank.id] === blank.correctAnswer)
    : false;

  // Get incorrect blank IDs for hint
  const incorrectBlanks = selectedExercise
    ? selectedExercise.questions[currentQuestionIndex].textSegments
      .filter((seg): seg is BlankSpace => typeof seg !== 'string')
      .filter(blank => filledBlanks[blank.id] && filledBlanks[blank.id] !== blank.correctAnswer)
      .map(blank => blank.id)
    : [];

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
              fontFamily: "'Lexend', sans-serif",
              fontSize: '42px',
              fontWeight: '500',
              lineHeight: '1.5',
              letterSpacing: '0.12em',
              color: themeColors.textMain,
            }}
          >
            Bài tập Điền từ
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
                <h2
                  style={{
                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                    fontSize: '32px',
                    lineHeight: '1.3',
                    letterSpacing: '0.14em',
                    color: themeColors.textMain,
                  }}
                >
                  {exercise.title}
                </h2>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Exercise View (Split Screen)
  if (selectedExercise) {
    return (
      <div
        className="flex flex-col h-screen"
        style={{ backgroundColor: themeColors.appBackground }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6">
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

          {/* Hint Button */}
          {!hasChecked && allBlanksFilled && (
            <button
              onClick={handleHint}
              className="transition-all duration-200 hover:scale-110 active:scale-95"
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '18px',
                backgroundColor: showHint ? '#FFD700' : themeColors.cardBackground,
                border: `2px solid ${themeColors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${themeColors.shadow}`,
              }}
            >
              <Lightbulb
                style={{
                  width: '36px',
                  height: '36px',
                  color: showHint ? '#FFFFFF' : '#FFD700',
                  strokeWidth: '2.5',
                  fill: showHint ? '#FFFFFF' : 'none',
                }}
              />
            </button>
          )}
        </div>

        {/* Split Screen Content Wrapper - Full Screen */}
        <div className="flex-1 w-full flex overflow-hidden">
          {/* Container chính: Full màn hình không có padding */}
          <div className="flex-1 h-full flex gap-2 w-full p-2">

            {/* Left Column - Text with Blanks */}
            <div
              className="flex flex-col h-full overflow-auto"
              style={{
                flex: '3 0 0%', // Forces 3/4 width regardless of content
                backgroundColor: themeColors.cardBackground,
                border: `3px solid ${themeColors.border}`,
                borderRadius: '28px',
                padding: '40px',
                boxShadow: `0 6px 16px ${themeColors.shadow}`,
              }}
            >
              <h2
                className="mb-8"
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

              {/* Text with inline blanks */}
              <div
                style={{
                  fontFamily: 'var(--display-font-family)',
                  fontSize: 'var(--display-font-size)',
                  lineHeight: 'var(--display-line-spacing)',
                  letterSpacing: 'var(--display-letter-spacing)',
                  color: themeColors.textMain,
                }}
              >
                {selectedExercise.questions[currentQuestionIndex].textSegments.map((segment, index) => {
                  if (typeof segment === 'string') {
                    return segment.split('\n').map((line, i, arr) => (
                      <span key={`${index}-${i}`}>
                        {line}
                        {i < arr.length - 1 && <br />}
                      </span>
                    ));
                  } else {
                    // It's a blank space
                    const blank = segment;
                    const isIncorrect = showHint && incorrectBlanks.includes(blank.id);
                    const isCheckedWrong = hasChecked && filledBlanks[blank.id] !== blank.correctAnswer;

                    let backgroundColor = 'transparent';
                    let borderColor = themeColors.border;

                    if (isIncorrect || isCheckedWrong) {
                      backgroundColor = '#FFE9ED';
                      borderColor = '#FFC0CB';
                    } else if (filledBlanks[blank.id]) {
                      backgroundColor = themeColors.accentMain;
                    }

                    return (
                      <span key={index} className="inline-block relative" style={{ margin: '0 4px' }}>
                        {/* Blank space drop zone */}
                        <button
                          onClick={() => handleBlankClick(blank.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(blank.id)}
                          disabled={hasChecked}
                          className="transition-all duration-200"
                          style={{
                            minWidth: '80px',
                            height: '48px',
                            backgroundColor,
                            border: `3px dashed ${borderColor}`,
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: hasChecked ? 'default' : 'pointer',
                            padding: '0 12px',
                            verticalAlign: 'middle',
                          }}
                        >
                          {filledBlanks[blank.id] && (
                            <span
                              style={{
                                fontFamily: 'var(--display-font-family)',
                                fontSize: 'var(--display-font-size)',
                                color: themeColors.textMain,
                              }}
                            >
                              {filledBlanks[blank.id]}
                            </span>
                          )}
                        </button>
                      </span>
                    );
                  }
                })}
              </div>
            </div>

            {/* Right Column - Options Pool */}
            <div
              className="flex flex-col h-full"
              style={{
                flex: '1 0 0%', // Forces 1/4 width regardless of content
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
                  fontSize: 'calc(var(--display-font-size) * 0.8)',
                  lineHeight: 'var(--display-line-spacing)',
                  letterSpacing: 'var(--display-letter-spacing)',
                  color: themeColors.textSecondary,
                }}
              >
                Câu {currentQuestionIndex + 1}/{selectedExercise.questions.length}
              </div>

              <h3
                className="mb-4"
                style={{
                  fontFamily: 'var(--display-font-family)',
                  fontSize: 'calc(var(--display-font-size) * 0.9)',
                  lineHeight: 'var(--display-line-spacing)',
                  letterSpacing: 'var(--display-letter-spacing)',
                  color: themeColors.textSecondary,
                }}
              >
                Kéo thả vào chỗ trống
              </h3>

              {/* Option Buttons */}
              <div className="flex-1 flex flex-col gap-4 mb-8">
                {selectedExercise.questions[currentQuestionIndex].options.map((option, index) => (
                  <motion.div
                    key={index}
                    draggable={!hasChecked}
                    onDragStart={() => handleDragStart(option)}
                    onDragEnd={handleDragEnd}
                    whileHover={!hasChecked ? { scale: 1.05 } : {}}
                    className="transition-all duration-200 cursor-grab active:cursor-grabbing"
                    style={{
                      backgroundColor: themeColors.accentMain,
                      border: `3px solid ${themeColors.border}`,
                      borderRadius: '20px',
                      padding: '24px',
                      boxShadow: `0 6px 16px ${themeColors.shadow}, 0 2px 8px rgba(0,0,0,0.1)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      cursor: hasChecked ? 'default' : 'grab',
                    }}
                  >
                    {/* 3D Stack Effect */}
                    <div
                      className="absolute inset-0 rounded-[20px]"
                      style={{
                        backgroundColor: themeColors.accentMain,
                        opacity: 0.5,
                        transform: 'translate(4px, 4px)',
                        zIndex: -1,
                        border: `3px solid ${themeColors.border}`,
                      }}
                    />

                    <span
                      style={{
                        fontFamily: 'var(--display-font-family)',
                        fontSize: 'calc(var(--display-font-size) * 1.4)',
                        lineHeight: '1',
                        letterSpacing: 'var(--display-letter-spacing)',
                        color: themeColors.textMain,
                        fontWeight: '600',
                      }}
                    >
                      {option}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Check Button at bottom of right column */}
              {!hasChecked ? (
                <button
                  onClick={handleCheck}
                  disabled={!allBlanksFilled}
                  className="transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: allBlanksFilled ? '#4CAF50' : themeColors.border,
                    color: '#FFFFFF',
                    borderRadius: '20px',
                    padding: '18px 40px',
                    boxShadow: `0 6px 20px ${themeColors.shadow}`,
                    border: 'none',
                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                    fontSize: '28px',
                    letterSpacing: '0.12em',
                    cursor: allBlanksFilled ? 'pointer' : 'not-allowed',
                    opacity: allBlanksFilled ? 1 : 0.5,
                  }}
                >
                  Kiểm tra
                </button>
              ) : (
                <div>
                  {allCorrect ? (
                    <button
                      onClick={handleContinue}
                      className="transition-all duration-200 hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: '#4CAF50',
                        color: '#FFFFFF',
                        borderRadius: '20px',
                        padding: '18px 40px',
                        boxShadow: `0 6px 20px ${themeColors.shadow}`,
                        border: 'none',
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '28px',
                        letterSpacing: '0.12em',
                      }}
                    >
                      Câu tiếp theo
                    </button>
                  ) : (
                    <div>
                      <p
                        className="mb-4"
                        style={{
                          fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                          fontSize: '24px',
                          color: '#FF6B6B',
                          letterSpacing: '0.12em',
                        }}
                      >
                        Chưa chính xác, bé thử lại nhé
                      </p>
                      <button
                        onClick={() => setHasChecked(false)}
                        className="transition-all duration-200 hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: '#4CAF50',
                          color: '#FFFFFF',
                          borderRadius: '20px',
                          padding: '18px 40px',
                          boxShadow: `0 6px 20px ${themeColors.shadow}`,
                          border: 'none',
                          fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                          fontSize: '28px',
                          letterSpacing: '0.12em',
                        }}
                      >
                        Thử lại
                      </button>
                    </div>
                  )}
                </div>
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