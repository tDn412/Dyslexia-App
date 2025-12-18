import { Sidebar } from './Sidebar';
import { Image, Headphones, BookCheck, FileText } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface ExercisePageProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport' | 'Exercise' | 'VisualSpelling' | 'ListenSpelling' | 'ReadingComprehension' | 'ClozeTest') => void;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ExercisePage({ onNavigate, onSignOut, isSidebarCollapsed = false, onToggleCollapse }: ExercisePageProps) {
  const { themeColors } = useTheme();

  const exercises = [
    {
      id: 1,
      icon: Image,
      title: 'Nhìn và Chọn',
      bgColor: themeColors.exerciseCard1 || '#E3F2FD', // Fallback color if undefined
      onClick: () => {
        if (onNavigate) {
          onNavigate('VisualSpelling');
        }
      }
    },
    {
      id: 2,
      icon: Headphones,
      title: 'Nghe và Điền',

      bgColor: themeColors.exerciseCard2 || '#F3E5F5',
      onClick: () => {
        if (onNavigate) {
          onNavigate('ListenSpelling');
        }
      }
    },
    {
      id: 3,
      icon: BookCheck,
      title: 'Đọc và Chọn',

      bgColor: themeColors.exerciseCard3 || '#E8F5E9',
      onClick: () => {
        if (onNavigate) {
          onNavigate('ReadingComprehension');
        }
      }
    },
    {
      id: 4,
      icon: FileText,
      title: 'Đọc và Điền',

      bgColor: themeColors.exerciseCard4 || '#FFF3E0',
      onClick: () => {
        if (onNavigate) {
          onNavigate('ClozeTest');
        }
      }
    },
  ];

  return (
    <div className="flex h-screen" style={{ backgroundColor: themeColors.appBackground }}>
      {/* Sidebar */}
      <Sidebar
        activePage="Exercise"
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
                fontFamily: 'var(--display-font-family)',
                fontSize: 'calc(var(--display-font-size) * 1.6)',
                fontWeight: '500',
                lineHeight: 'var(--display-line-spacing)',
                letterSpacing: 'var(--display-letter-spacing)',
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
                      fontFamily: 'var(--display-font-family)',
                      fontSize: 'calc(var(--display-font-size) * 1.2)',
                      fontWeight: '600',
                      lineHeight: 'var(--display-line-spacing)',
                      letterSpacing: 'var(--display-letter-spacing)',
                      color: themeColors.textMain,
                    }}
                  >
                    {exercise.title}
                  </h2>

                  {/* Description */}
                  <p
                    style={{
                      fontFamily: 'var(--display-font-family)',
                      fontSize: 'calc(var(--display-font-size) * 0.9)',
                      lineHeight: 'var(--display-line-spacing)',
                      letterSpacing: 'var(--display-letter-spacing)',
                      maxWidth: '400px',
                      color: themeColors.textSecondary,
                      opacity: 0.9,
                    }}
                  >

                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}