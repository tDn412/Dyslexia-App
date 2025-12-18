import { useState, useEffect } from 'react';
import { X, Star, Award, Volume2, Lightbulb } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { fetchQuizzes, api } from '../utils/api';
import { toast } from 'sonner';

interface ListenSpellingExerciseProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport' | 'Exercise' | 'VisualSpelling' | 'ListenSpelling') => void;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface Question {
  id: number | string;
  word: string;
  syllables: string[][]; // Grouped by syllables: [['c','o','n'], ['c','ò']]
  letterPool: string[]; // Available letters for drag and drop
  audioText: string;
}

interface FeedbackModalProps {
  isCorrect: boolean;
  onContinue: () => void;
  onExit: () => void;
  themeColors: any;
}

function FeedbackModal({ isCorrect, onContinue, onExit, themeColors }: FeedbackModalProps) {
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
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)',
              }}
            >
              <Award
                style={{
                  width: '64px',
                  height: '64px',
                  color: '#FFFFFF',
                  strokeWidth: '3',
                }}
              />
            </div>
          ) : (
            <div
              className="flex items-center justify-center"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)',
              }}
            >
              <X
                style={{
                  width: '64px',
                  height: '64px',
                  color: '#FFFFFF',
                  strokeWidth: '3',
                }}
              />
            </div>
          )}
        </div>

        {/* Message */}
        <div className="text-center mb-8">
          <h3
            className="text-4xl font-bold mb-4"
            style={{ color: themeColors.textMain }}
          >
            {isCorrect ? 'Tuyệt vời!' : 'Thử lại nhé!'}
          </h3>
          <p
            className="text-xl"
            style={{ color: themeColors.textSecondary }}
          >
            {isCorrect
              ? 'Bạn đã ghép đúng từ rồi.'
              : 'Hãy nghe kỹ và thử ghép lại nhé.'}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onExit}
            className="px-8 py-4 rounded-2xl font-bold text-lg transition-transform hover:scale-105 active:scale-95"
            style={{
              backgroundColor: themeColors.background,
              color: themeColors.textSecondary,
              boxShadow: themeColors.pressedParams,
            }}
          >
            Thoát
          </button>
          <button
            onClick={onContinue}
            className="px-8 py-4 rounded-2xl font-bold text-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
            style={{
              backgroundColor: themeColors.accentMain,
              color: themeColors.textMain,
              boxShadow: `0 4px 12px ${themeColors.accentMain}66`,
            }}
          >
            Tiếp tục
          </button>
        </div>

        {/* Close Button */}
        <div className="absolute top-6 right-6">
          <button
            onClick={onExit}
            className="p-2 rounded-full transition-colors hover:bg-black/5"
            style={{ color: themeColors.textSecondary }}
          >
            <X size={32} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Helper to shuffle array
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function ListenSpellingExercise({ onNavigate, onSignOut, isSidebarCollapsed, onToggleCollapse }: ListenSpellingExerciseProps) {
  const { themeColors } = useTheme();

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      word: 'con cò',
      syllables: [['c', 'o', 'n'], ['c', 'ò']],
      letterPool: ['c', 'a', 'ò', 'ó', 'o', 'n', 'm', 'c', 'd'],
      audioText: 'Con cò',
    },
    {
      id: 2,
      word: 'quả cam',
      syllables: [['q', 'u', 'ả'], ['c', 'a', 'm']],
      letterPool: ['p', 'c', 'q', 'a', 'u', 'n', 'ả', 'a', 'm'],
      audioText: 'Quả cam',
    },
  ]);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await fetchQuizzes('listen_spelling');

        if (data && data.length > 0) {
          console.log('Fetched Data:', data);
          const allQuestions: Question[] = [];

          const processQuestion = (q: any, list: Question[]) => {
            // Generate syllables if missing
            let syllables = q.syllables;
            if (!syllables && q.word) {
              const words = q.word.trim().split(/\s+/);
              syllables = words.map((w: string) => w.split(''));
            }

            // Generate letterPool if missing
            let letterPool = q.letterPool;
            if (!letterPool && syllables) {
              // Flatten syllables to get all chars
              const chars = syllables.flat();
              // Add some distractors? Or just shuffle
              letterPool = shuffleArray([...chars]);
            }

            if (q.word && syllables && letterPool) {
              list.push({
                id: q.id || Math.random(),
                word: q.word,
                syllables: syllables,
                letterPool: letterPool,
                audioText: q.audioText || q.word
              });
            }
          };

          data.forEach((quiz: any) => {
            console.log('Processing Item:', quiz);
            let qContent: any = null;

            // Normalize content structure
            // If the row 'content' is the question itself (matches DB screenshot)
            if (quiz.content && quiz.content.word) {
              qContent = { ...quiz.content };
              // Ensure ID is present from row if not in content
              if (!qContent.id) qContent.id = quiz.id;
              processQuestion(qContent, allQuestions);
            }
            // If 'content' has a 'questions' array (nested structure)
            else if (quiz.content && quiz.content.questions && Array.isArray(quiz.content.questions)) {
              quiz.content.questions.forEach((q: any) => {
                processQuestion(q, allQuestions);
              });
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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize slots and available letters
  const totalSlots = currentQuestion.syllables.flat().length;
  const [filledSlots, setFilledSlots] = useState<(string | null)[]>(Array(totalSlots).fill(null));
  const [availableLetters, setAvailableLetters] = useState<string[]>(currentQuestion.letterPool);
  const [draggedLetter, setDraggedLetter] = useState<string | null>(null);
  const [draggedFromIndex, setDraggedFromIndex] = useState<number | null>(null);

  // Reset state when question changes
  useEffect(() => {
    const newTotalSlots = currentQuestion.syllables.flat().length;
    setFilledSlots(Array(newTotalSlots).fill(null));
    setAvailableLetters([...currentQuestion.letterPool]);
  }, [currentQuestionIndex]);

  const playAudio = async () => {
    setIsPlayingAudio(true);
    try {
      // Use shared textToSpeech utility which respects global settings (voice, speed)
      await import('../utils/textToSpeech').then(m => m.speakText({
        text: currentQuestion.audioText,
        onEnded: () => setIsPlayingAudio(false)
      }));
    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlayingAudio(false);
    }
  };

  const handleLetterClick = (letter: string, index: number) => {
    // Find first empty slot
    const firstEmptySlot = filledSlots.findIndex(slot => slot === null);
    if (firstEmptySlot !== -1) {
      const newFilledSlots = [...filledSlots];
      newFilledSlots[firstEmptySlot] = letter;
      setFilledSlots(newFilledSlots);

      // Remove letter from available pool
      const newAvailable = [...availableLetters];
      newAvailable.splice(index, 1);
      setAvailableLetters(newAvailable);
    }
  };

  const handleSlotClick = (slotIndex: number) => {
    const letter = filledSlots[slotIndex];
    if (letter) {
      // Remove from slot and return to pool
      const newFilledSlots = [...filledSlots];
      newFilledSlots[slotIndex] = null;
      setFilledSlots(newFilledSlots);

      setAvailableLetters([...availableLetters, letter]);
    }
  };

  const handleDragStart = (letter: string, fromPool: boolean, index: number) => {
    setDraggedLetter(letter);
    setDraggedFromIndex(fromPool ? null : index);
  };

  const handleDrop = (targetSlotIndex: number) => {
    if (draggedLetter) {
      const newFilledSlots = [...filledSlots];

      // If dragging from a slot, swap or move
      if (draggedFromIndex !== null) {
        const temp = newFilledSlots[targetSlotIndex];
        newFilledSlots[targetSlotIndex] = draggedLetter;
        newFilledSlots[draggedFromIndex] = temp;
      } else {
        // Dragging from pool
        const existingLetter = newFilledSlots[targetSlotIndex];
        newFilledSlots[targetSlotIndex] = draggedLetter;

        // Remove from available pool
        const letterIndex = availableLetters.indexOf(draggedLetter);
        const newAvailable = [...availableLetters];
        newAvailable.splice(letterIndex, 1);
        setAvailableLetters(newAvailable);

        // If slot had a letter, return it to pool
        if (existingLetter) {
          setAvailableLetters([...newAvailable, existingLetter]);
        }
      }

      setFilledSlots(newFilledSlots);
      setDraggedLetter(null);
      setDraggedFromIndex(null);
    }
  };

  const checkAnswer = () => {
    const userAnswer = filledSlots.join('');
    const correctAnswer = currentQuestion.syllables.flat().join('');
    const isCorrect = userAnswer === correctAnswer;

    setIsLastAnswerCorrect(isCorrect);
    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }
    setShowFeedback(true);
  };

  const handleContinue = () => {
    setShowFeedback(false);
    if (isLastAnswerCorrect) {
      // Move to next question
      setCurrentQuestionIndex((currentQuestionIndex + 1) % questions.length);
    }
  };

  const handleModalExit = () => {
    setShowFeedback(false);
    onNavigate?.('Exercise');
  };

  const handleHint = () => {
    // Find the first empty slot
    const firstEmptySlot = filledSlots.findIndex(slot => slot === null);
    if (firstEmptySlot === -1) return; // All slots filled

    // Get the correct answer for this slot
    const correctAnswer = currentQuestion.syllables.flat();
    const correctLetter = correctAnswer[firstEmptySlot];

    // Find this letter in available pool
    const letterIndex = availableLetters.indexOf(correctLetter);
    if (letterIndex !== -1) {
      // Fill the slot with correct letter
      const newFilledSlots = [...filledSlots];
      newFilledSlots[firstEmptySlot] = correctLetter;
      setFilledSlots(newFilledSlots);

      // Remove letter from available pool
      const newAvailable = [...availableLetters];
      newAvailable.splice(letterIndex, 1);
      setAvailableLetters(newAvailable);
    }
  };

  // Check if all slots are filled
  const allSlotsFilled = filledSlots.every(slot => slot !== null);

  // Create slot groups for rendering
  const slotGroups: { startIndex: number; letters: string[] }[] = [];
  let currentIndex = 0;
  currentQuestion.syllables.forEach(syllable => {
    slotGroups.push({
      startIndex: currentIndex,
      letters: syllable,
    });
    currentIndex += syllable.length;
  });

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

        <div className="flex items-center gap-4">
          {/* Hint Button - only show when there are empty slots */}
          {!allSlotsFilled && (
            <button
              onClick={handleHint}
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
              <Lightbulb
                style={{
                  width: '36px',
                  height: '36px',
                  color: '#FFD700',
                  strokeWidth: '2.5',
                  fill: 'none',
                }}
              />
            </button>
          )}

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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center w-full max-w-5xl"
          >
            {/* Audio Section */}
            <div className="mb-16">
              <button
                onClick={playAudio}
                className="relative transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  backgroundColor: themeColors.accentMain,
                  border: `3px solid ${themeColors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 6px 20px ${themeColors.shadow}`,
                }}
              >
                <Volume2
                  style={{
                    width: '60px',
                    height: '60px',
                    color: themeColors.textMain,
                    strokeWidth: '2.5',
                  }}
                />

                {/* Sound Waves Animation */}
                {isPlayingAudio && (
                  <>
                    <motion.div
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: `3px solid ${themeColors.textMain}`,
                      }}
                    />
                    <motion.div
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                      className="absolute"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: `3px solid ${themeColors.textMain}`,
                      }}
                    />
                  </>
                )}
              </button>
            </div>

            {/* Filling Area - Letter Slots */}
            <div className="mb-16 flex items-center gap-8">
              {slotGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="flex gap-3">
                  {group.letters.map((_, letterIndex) => {
                    const slotIndex = group.startIndex + letterIndex;
                    const letter = filledSlots[slotIndex];

                    return (
                      <motion.button
                        key={slotIndex}
                        onClick={() => handleSlotClick(slotIndex)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(slotIndex)}
                        layout
                        className="relative transition-all duration-200"
                        style={{
                          width: '90px',
                          height: '100px',
                          borderRadius: '20px',
                          backgroundColor: letter ? themeColors.cardBackground : 'transparent',
                          border: letter
                            ? `3px solid ${themeColors.border}`
                            : `3px dashed ${themeColors.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: letter ? `0 4px 12px ${themeColors.shadow}` : 'none',
                          cursor: letter ? 'pointer' : 'default',
                        }}
                      >
                        {letter && (
                          <motion.span
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                            draggable
                            onDragStart={() => handleDragStart(letter, false, slotIndex)}
                            style={{
                              fontFamily: 'var(--display-font-family)',
                              fontSize: 'calc(var(--display-font-size) * 2)',
                              lineHeight: '1',
                              letterSpacing: 'var(--display-letter-spacing)',
                              color: themeColors.textMain,
                              cursor: 'grab',
                            }}
                          >
                            {letter}
                          </motion.span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Letter Pool */}
            <div className="mb-12 flex flex-wrap justify-center gap-4 max-w-4xl" style={{ minHeight: '200px' }}>
              {availableLetters.map((letter, index) => (
                <motion.button
                  key={`${letter}-${index}`}
                  onClick={() => handleLetterClick(letter, index)}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  draggable
                  onDragStart={() => handleDragStart(letter, true, index)}
                  className="transition-all duration-200"
                  style={{
                    width: '85px',
                    height: '85px',
                    borderRadius: '18px',
                    backgroundColor: themeColors.cardBackground,
                    border: `3px solid ${themeColors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${themeColors.shadow}`,
                    cursor: 'grab',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--display-font-family)',
                      fontSize: 'calc(var(--display-font-size) * 1.8)',
                      lineHeight: '1',
                      color: themeColors.textMain,
                    }}
                  >
                    {letter}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Submit Button */}
            {allSlotsFilled && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={checkAnswer}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: '#4CAF50',
                  color: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '20px 60px',
                  boxShadow: `0 6px 20px ${themeColors.shadow}`,
                  border: 'none',
                  fontFamily: 'var(--display-font-family)',
                  fontSize: 'calc(var(--display-font-size) * 1.2)',
                  letterSpacing: 'var(--display-letter-spacing)',
                }}
              >
                Kiểm tra
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <FeedbackModal
            isCorrect={isLastAnswerCorrect}
            onContinue={handleContinue}
            onExit={handleModalExit}
            themeColors={themeColors}
          />
        )}
      </AnimatePresence>
    </div>
  );
}