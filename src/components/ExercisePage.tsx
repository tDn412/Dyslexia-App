import { Sidebar } from './Sidebar';
import { useState, useEffect } from 'react';
import { Play, Star, Clock, Headphones, Mic, Trophy, Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchQuizzes } from '../utils/api';
import { toast } from 'sonner';
import { useTheme } from './ThemeContext';

interface ExercisePageProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport' | 'Exercise') => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSignOut?: () => void;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  type: string;
  level: string;
  questionCount: number;
  thumbnail: string;
  score?: number;
}

export function ExercisePage({ onNavigate, isSidebarCollapsed = false, onToggleCollapse, onSignOut }: ExercisePageProps) {
  const { themeColors } = useTheme();
  // navigate is unused if we rely on onNavigate or toast, but keeping for future
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        setIsLoading(true);
        const data = await fetchQuizzes();

        // Map API data (Quiz table) to component interface
        const formattedQuizzes: Quiz[] = data.map((item: any) => ({
          id: item.quizid,
          title: item.title,
          description: item.content?.description || 'Bài tập thực hành kỹ năng',
          type: item.type,
          level: item.level,
          questionCount: item.content?.questions?.length || 0,
          thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80', // Default thumbnail
          score: 0 // Fetch from QuizResult if needed, separate API call maybe?
        }));

        setQuizzes(formattedQuizzes);
      } catch (error) {
        console.error('Error fetching quizzes, using mock data:', error);
        // Fallback to mock data as requested
        setQuizzes([
          {
            id: 'mock-1',
            title: 'Bài tập Nghe chép chính tả lớp 1',
            description: 'Luyện kỹ năng nghe và viết lại chính xác.',
            type: 'listening_dictation',
            level: 'A1',
            questionCount: 5,
            thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80',
            score: 0
          },
          {
            id: 'mock-2',
            title: 'Nhận diện âm vị cơ bản',
            description: 'Phân biệt các âm khó trong tiếng Việt.',
            type: 'phonics_recognition',
            level: 'A2',
            questionCount: 10,
            thumbnail: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500&q=80',
            score: 0
          },
          {
            id: 'mock-3',
            title: 'Thử thách Đọc hiểu B1',
            description: 'Đọc đoạn văn và trả lời câu hỏi.',
            type: 'reading_comprehension',
            level: 'B1',
            questionCount: 8,
            thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&q=80', // Book image
            score: 0
          }
        ]);
        toast.info('Đang hiển thị dữ liệu mẫu (mất kết nối máy chủ)');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  const categories = [
    { id: 'all', label: 'Tất cả', icon: Star },
    { id: 'listening_dictation', label: 'Nghe chép chính tả', icon: Headphones },
    { id: 'phonics_recognition', label: 'Nhận diện âm vị', icon: Mic },
  ];

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesCategory = selectedCategory === 'all' || quiz.type === selectedCategory;
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'A1': return '#4CAF50';
      case 'A2': return '#8BC34A';
      case 'B1': return '#FFC107';
      case 'B2': return '#FF9800';
      case 'C1': return '#FF5722';
      default: return '#9E9E9E';
    }
  };

  const getTypeLabel = (type: string) => {
    const cat = categories.find(c => c.id === type);
    return cat ? cat.label : type;
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: themeColors.appBackground }}>
      <Sidebar
        activePage="Exercise"
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={onToggleCollapse}
        onSignOut={onSignOut}
      />

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1
              className="mb-4"
              style={{
                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                fontSize: '48px',
                fontWeight: 'bold',
                color: themeColors.textMain,
              }}
            >
              Bài tập rèn luyện
            </h1>
            <p
              className="text-xl max-w-2xl"
              style={{
                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                color: themeColors.textMuted,
              }}
            >
              Thực hành các kỹ năng đọc, viết và nghe thông qua các bài tập tương tác được thiết kế riêng cho bạn.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-6 mb-10">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: themeColors.textMuted }} />
              <input
                type="text"
                placeholder="Tìm kiếm bài tập..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 focus:ring-2 focus:ring-opacity-20 transition-all"
                style={{
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.border,
                  color: themeColors.textMain,
                  fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                }}
              />
            </div>

            {/* Categories */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {categories.map(category => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all whitespace-nowrap`}
                    style={{
                      backgroundColor: isSelected ? themeColors.accentMain : themeColors.cardBackground,
                      borderColor: isSelected ? themeColors.accentHover : themeColors.border,
                      color: isSelected ? themeColors.textMain : themeColors.textMuted,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span style={{ fontFamily: "'OpenDyslexic', 'Lexend', sans-serif", fontWeight: 'bold' }}>
                      {category.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quiz Grid */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: themeColors.accentMain }}></div>
              <p className="mt-4 text-lg" style={{ color: themeColors.textMuted }}>Đang tải bài tập...</p>
            </div>
          ) : filteredQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredQuizzes.map(quiz => (
                <div
                  key={quiz.id}
                  onClick={() => {
                    toast.info(`Bắt đầu bài tập: ${quiz.title}`);
                  }}
                  className="group rounded-2xl overflow-hidden border-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.border,
                  }}
                >
                  {/* Thumbnail */}
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    <img
                      src={quiz.thumbnail}
                      alt={quiz.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: getDifficultyColor(quiz.level) }}
                    >
                      {quiz.level}
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 backdrop-blur-sm">
                      <Clock className="w-4 h-4" />
                      <span>{quiz.questionCount * 2} phút</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className="px-3 py-1 rounded-lg text-sm font-bold"
                        style={{
                          backgroundColor: `${themeColors.accentMain}20`,
                          color: themeColors.accentMain
                        }}
                      >
                        {getTypeLabel(quiz.type)}
                      </span>
                    </div>

                    <h3
                      className="text-xl font-bold mb-2 line-clamp-2"
                      style={{
                        color: themeColors.textMain,
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif"
                      }}
                    >
                      {quiz.title}
                    </h3>

                    <p
                      className="text-sm line-clamp-2 mb-6"
                      style={{ color: themeColors.textMuted }}
                    >
                      {quiz.description}
                    </p>

                    <button
                      className="w-full py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all group-hover:bg-opacity-90"
                      style={{
                        backgroundColor: themeColors.accentMain,
                        borderColor: themeColors.accentHover,
                        color: themeColors.textMain,
                      }}
                    >
                      <Play className="w-5 h-5" fill="currentColor" />
                      Bắt đầu ngay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 rounded-3xl border-2" style={{ borderColor: themeColors.border, backgroundColor: themeColors.cardBackground }}>
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: themeColors.textMain }}>Không tìm thấy bài tập</h3>
              <p style={{ color: themeColors.textMuted }}>Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}