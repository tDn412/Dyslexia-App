import { Sidebar } from './Sidebar';
import { ReadingCard } from './ReadingCard';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { fetchReadings } from '../utils/api';

interface SpeakingSelectionPageProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport') => void;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SpeakingSelectionPage({ onNavigate, onSignOut, isSidebarCollapsed = false, onToggleCollapse }: SpeakingSelectionPageProps) {
  const { themeColors } = useTheme();
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicScrollIndex, setTopicScrollIndex] = useState(0);
  const [readings, setReadings] = useState<any[]>([]); // Dynamic readings
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Level filter options
  const levels = ['All', 'A1', 'A2', 'B1', 'B2'];

  // Topic filter options with emojis
  const topics = [
    { icon: '🐶', name: 'Động vật' },
    { icon: '🌳', name: 'Thiên nhiên' },
    { icon: '🍎', name: 'Thức ăn' },
    { icon: '👪', name: 'Gia đình' },
    { icon: '📚', name: 'Truyện' },
    { icon: '🎨', name: 'Học tập' },
    { icon: '🏖️', name: 'Phiêu lưu' },
    { icon: '⚽', name: 'Thể thao' },
  ];

  // Number of topics to show at once
  const topicsPerView = 4;
  const maxScrollIndex = Math.max(0, Math.ceil(topics.length / topicsPerView) - 1);

  // Get visible topics
  const visibleTopics = topics.slice(
    topicScrollIndex * topicsPerView,
    (topicScrollIndex + 1) * topicsPerView
  );

  useEffect(() => {
    const loadReadings = async () => {
      try {
        setIsLoading(true);
        // Using same API as Reading Selection. Can filter by 'topic', 'level' via API params if needed, 
        // or just fetch all and filter client side like before.
        // Let's rely on client side filtering for consistency with previous mock logic if API doesn't support flexible filtering, 
        // but fetchReadings supports level/topic/search.
        // For broad selection, maybe fetch all (no filters) or use client filters.
        // Let's use the API filters properly:
        const data = await fetchReadings(selectedLevel, selectedTopic || undefined, searchQuery);
        setReadings(data);
      } catch (error) {
        console.error("Failed to load speaking readings", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadReadings();
  }, [selectedLevel, selectedTopic, searchQuery]);

  const handleReadingClick = (id: string) => {
    // Store reading ID for speaking page
    localStorage.setItem('currentReadingId', id);
    if (onNavigate) {
      onNavigate('Speaking');
    }
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: themeColors.appBackground }}>
      {/* Sidebar */}
      <Sidebar
        activePage="Nói"
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={onToggleCollapse}
        onSignOut={onSignOut}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-12">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-7 h-7" style={{ color: themeColors.textMuted }} />
              <input
                type="text"
                placeholder="Tìm kiếm bài nói..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-3xl pl-16 pr-6 py-5 placeholder:text-[#999999] focus:outline-none focus:ring-0 shadow-md transition-all border-2"
                style={{
                  fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                  fontSize: '24px',
                  letterSpacing: '0.12em',
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.border,
                  color: themeColors.textMain,
                }}
              />
            </div>
          </div>

          {/* Level Filter */}
          <div className="mb-8">
            <div className="flex gap-4 flex-wrap">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className="px-8 py-3 rounded-2xl border-2 transition-all shadow-sm"
                  style={{
                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                    fontSize: '24px',
                    letterSpacing: '0.12em',
                    backgroundColor: selectedLevel === level ? themeColors.accentMain : themeColors.cardBackground,
                    borderColor: selectedLevel === level ? themeColors.accentHover : themeColors.border,
                    color: themeColors.textMain,
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Filter with Horizontal Scroll */}
          <div className="mb-12">
            <div
              className="mb-4"
              style={{
                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                fontSize: '26px',
                letterSpacing: '0.12em',
                color: themeColors.textMain,
              }}
            >
              Chủ đề:
            </div>
            <div className="flex items-center gap-4">
              {/* Left Arrow Button */}
              {topicScrollIndex > 0 && (
                <button
                  onClick={() => setTopicScrollIndex(topicScrollIndex - 1)}
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md border-2"
                  style={{
                    backgroundColor: themeColors.accentMain,
                    borderColor: themeColors.accentHover,
                  }}
                  aria-label="Previous topics"
                >
                  <ChevronLeft className="w-6 h-6" style={{ color: themeColors.textMain }} />
                </button>
              )}

              {/* Topic Chips Container */}
              <div className="flex-1 overflow-hidden">
                <div className="flex gap-4 transition-all duration-500 ease-in-out">
                  {visibleTopics.map((topic) => (
                    <button
                      key={topic.name}
                      onClick={() => setSelectedTopic(selectedTopic === topic.name ? null : topic.name)}
                      className="flex-shrink-0 px-6 py-3 rounded-2xl border-2 transition-all shadow-sm"
                      style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '24px',
                        letterSpacing: '0.12em',
                        backgroundColor: selectedTopic === topic.name ? themeColors.accentMain : themeColors.cardBackground,
                        borderColor: selectedTopic === topic.name ? themeColors.accentHover : themeColors.border,
                        color: themeColors.textMain,
                      }}
                    >
                      <span className="mr-2">{topic.icon}</span>
                      {topic.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Arrow Button */}
              {topicScrollIndex < maxScrollIndex && (
                <button
                  onClick={() => setTopicScrollIndex(topicScrollIndex + 1)}
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md border-2"
                  style={{
                    backgroundColor: themeColors.accentMain,
                    borderColor: themeColors.accentHover,
                  }}
                  aria-label="Next topics"
                >
                  <ChevronRight className="w-6 h-6" style={{ color: themeColors.textMain }} />
                </button>
              )}
            </div>
          </div>

          {/* Reading Cards Grid - 2 columns */}
          {isLoading ? (
            <div className="text-center py-20">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              {readings.map((reading) => (
                <ReadingCard
                  key={reading.textid || reading.id}
                  title={reading.title}
                  topic={reading.topic}
                  level={`Cấp ${reading.level}`}
                  onClick={() => handleReadingClick(reading.textid || reading.id)}
                />
              ))}
            </div>
          )}

          {/* No results message */}
          {readings.length === 0 && !isLoading && (
            <div
              className="text-center text-[#666666] py-12"
              style={{
                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                fontSize: '24px',
                letterSpacing: '0.12em',
              }}
            >
              No readings found. Try adjusting your filters.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}