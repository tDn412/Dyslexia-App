import { Sidebar } from './Sidebar';
import { ReadingCard } from './ReadingCard';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { ScrollableTopics } from './ScrollableTopics';
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
    { icon: '⚽', name: 'Thể thao' },
    { icon: '📝', name: 'Khác' },
  ];

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
      <div
        className="flex-1 p-12"
        style={{
          backgroundColor: themeColors.appBackground,
          overflowX: 'hidden', // Prevent horizontal scroll on page level
          overflowY: 'auto',
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="mb-8"
            style={{
              position: 'relative',
            }}
          >
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

        {/* Topic Filter */}
        <div className="mb-6">
          <h2
            className="mb-4"
            style={{
              fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
              fontSize: '28px',
              letterSpacing: '0.12em',
              color: themeColors.textMain,
            }}
          >
            Chủ đề:
          </h2>

          {/* Horizontal Scroll Container with Mouse Drag */}
          <ScrollableTopics
            topics={topics}
            selectedTopic={selectedTopic}
            onTopicSelect={setSelectedTopic}
          />
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
    </div>
  );
}