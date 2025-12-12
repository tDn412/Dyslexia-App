import { Sidebar } from './Sidebar';
import { Image, Headphones, BookCheck, FileText, X, Play } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { fetchQuizzes } from '../utils/api';
import { toast } from 'sonner';

interface ExercisePageProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport' | 'Exercise' | 'QuizPlayer') => void;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  type: string;
}

export function ExercisePage({ onNavigate, onSignOut, isSidebarCollapsed = false, onToggleCollapse }: ExercisePageProps) {
  const { themeColors } = useTheme();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await fetchQuizzes();
        setQuizzes(data);
      } catch (error) {
        console.error("Failed to load quizzes", error);
        toast.error("Lỗi khi tải danh sách bài tập.");
      }
    };
    loadQuizzes();
  }, []);

  const handleCategoryClick = (category: string) => {
    const categoryQuizzes = quizzes.filter(q => q.type === category);
    if (categoryQuizzes.length === 0) {
      toast.info("Chưa có bài tập nào trong danh mục này.");
      return;
    }
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleQuizSelect = (quizId: string) => {
    localStorage.setItem('currentQuizId', quizId);
    onNavigate?.('QuizPlayer');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  // Close popup when clicking outside
  useEffect(() => {
    if (isModalOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          handleCloseModal();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isModalOpen]);

  const exercises = [
    {
      id: 1,
      icon: Image,
      title: 'Nhìn và Đánh Vần',
      description: 'Ghép hình ảnh với từ đúng.',
      bgColor: themeColors.exerciseCard1,
      type: 'visual',
      onClick: () => handleCategoryClick('visual')
    },
    {
      id: 2,
      icon: Headphones,
      title: 'Nghe và Gõ',
      description: 'Gõ những gì bạn nghe.',
      bgColor: themeColors.exerciseCard2,
      type: 'listening',
      onClick: () => handleCategoryClick('listening')
    },
    {
      id: 3,
      icon: BookCheck,
      title: 'Đọc và Chọn',
      description: 'Trả lời câu hỏi trắc nghiệm.',
      bgColor: themeColors.exerciseCard3,
      type: 'reading-choice',
      onClick: () => handleCategoryClick('reading-choice')
    },
    {
      id: 4,
      icon: FileText,
      title: 'Đọc và Điền',
      description: 'Kéo và thả từ vào chỗ trống.',
      bgColor: themeColors.exerciseCard4,
      type: 'reading-fill',
      onClick: () => handleCategoryClick('reading-fill')
    },
  ];

  const filteredQuizzes = selectedCategory ? quizzes.filter(q => q.type === selectedCategory) : [];

  return (
    <div className="flex h-screen" style={{ backgroundColor: themeColors.appBackground }}>
      {/* Sidebar */}
      <Sidebar
        activePage="Bài tập"
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={onToggleCollapse}
        onSignOut={onSignOut}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-12 py-10">
          {/* Header */}
          <div className="mb-12">
            <h1
              style={{
                fontFamily: "'Lexend', sans-serif",
                fontSize: '42px',
                fontWeight: '500',
                lineHeight: '1.5',
                letterSpacing: '0.12em',
                color: themeColors.textMain,
              }}
            >
              Bài Tập Luyện Đọc
            </h1>
          </div>

          {/* Exercise Cards Grid - 2x2 */}
          <div className="grid grid-cols-2 gap-10 max-w-6xl mx-auto w-full">
            {exercises.map((exercise) => {
              const Icon = exercise.icon;
              return (
                <button
                  key={exercise.id}
                  onClick={exercise.onClick}
                  className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.05]"
                  style={{
                    backgroundColor: exercise.bgColor,
                    borderRadius: '28px',
                    boxShadow: `0 4px 12px ${themeColors.shadow}`,
                    padding: '48px 40px',
                    minHeight: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: '24px',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="flex items-center justify-center bg-white/40 backdrop-blur-sm"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '20px',
                    }}
                  >
                    <Icon
                      style={{
                        width: '48px',
                        height: '48px',
                        strokeWidth: '2.5',
                        color: themeColors.textMain,
                      }}
                    />
                  </div>

                  {/* Title */}
                  <h2
                    style={{
                      fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                      fontSize: '32px',
                      fontWeight: '600',
                      lineHeight: '1.3',
                      letterSpacing: '0.14em',
                      color: themeColors.textMain,
                    }}
                  >
                    {exercise.title}
                  </h2>

                  {/* Description */}
                  <p
                    style={{
                      fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                      fontSize: '22px',
                      lineHeight: '1.5',
                      letterSpacing: '0.12em',
                      maxWidth: '400px',
                      color: themeColors.textSecondary,
                      opacity: 0.9,
                    }}
                  >
                    {exercise.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Quiz Selection Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-opacity-60 z-50 flex items-center justify-center"
          style={{ backgroundColor: `${themeColors.appBackground}99` }}
        >
          <div
            ref={modalRef}
            className="rounded-3xl border-2 shadow-2xl p-8 w-[600px] max-h-[80vh] overflow-hidden flex flex-col"
            style={{
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.border,
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3
                style={{
                  fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                  fontSize: '28px',
                  letterSpacing: '0.12em',
                  color: themeColors.textMain,
                }}
              >
                Chọn bài tập
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" style={{ color: themeColors.textMain }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {filteredQuizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => handleQuizSelect(quiz.id)}
                  className="w-full text-left p-6 rounded-xl border-2 hover:shadow-md transition-all flex items-center justify-between group"
                  style={{
                    backgroundColor: themeColors.appBackground,
                    borderColor: themeColors.border,
                  }}
                >
                  <div>
                    <h4
                      className="mb-2"
                      style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '24px',
                        color: themeColors.textMain,
                      }}
                    >
                      {quiz.title}
                    </h4>
                    <p
                      style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '18px',
                        color: themeColors.textMuted,
                      }}
                    >
                      {quiz.description}
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: themeColors.accentMain }}
                  >
                    <Play className="w-6 h-6" style={{ color: themeColors.textMain }} fill={themeColors.textMain} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}