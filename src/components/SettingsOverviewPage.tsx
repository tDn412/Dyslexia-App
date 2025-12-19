import { Sidebar } from './Sidebar';
import { SettingsCard } from './SettingsCard';
import { Volume2 } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface SettingsOverviewPageProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport' | 'Exercise' | 'QuizPlayer') => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSignOut?: () => void;
  user?: any;
}

export function SettingsOverviewPage({ onNavigate, isSidebarCollapsed = false, onToggleCollapse, onSignOut, user }: SettingsOverviewPageProps) {
  const { themeColors } = useTheme();

  const handleDisplaySettingsClick = () => {
    if (onNavigate) {
      onNavigate('DisplaySettings');
    }
  };

  const handleAudioSettingsClick = () => {
    if (onNavigate) {
      onNavigate('AudioSettings');
    }
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: themeColors.appBackground }}>
      {/* Sidebar */}
      <Sidebar activePage="Cài đặt" onNavigate={onNavigate} isCollapsed={isSidebarCollapsed} onToggleCollapse={onToggleCollapse} onSignOut={onSignOut} user={user} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-12 h-full flex flex-col">
          {/* Settings Cards Grid */}
          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-16 max-w-5xl w-full">
              {/* Display & Text Settings Card */}
              <SettingsCard
                icon="Ab"
                title="Hiển thị & Văn bản"
                onClick={handleDisplaySettingsClick}
              />

              {/* Audio & Voice Settings Card */}
              <SettingsCard
                icon={Volume2}
                title="Âm thanh & Giọng nói"
                onClick={handleAudioSettingsClick}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}