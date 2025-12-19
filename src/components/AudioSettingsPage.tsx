import { Sidebar } from './Sidebar';
import { ArrowLeft, Save, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { useTheme } from './ThemeContext';
import { saveSettings } from '../utils/api';
import { speakText } from '../utils/textToSpeech';
import { toast } from 'sonner';

interface AudioSettingsPageProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport' | 'Exercise' | 'QuizPlayer') => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSignOut?: () => void;
  userId?: string;
  user?: any;
}

const maleVoices = [
  { id: 'male-1', label: 'Nam 1', name: 'Vietnamese Male Voice 1' },
  { id: 'male-2', label: 'Nam 2', name: 'Vietnamese Male Voice 2' },
  { id: 'male-3', label: 'Nam 3', name: 'Vietnamese Male Voice 3' },
];

const femaleVoices = [
  { id: 'female-1', label: 'Nữ 1', name: 'Vietnamese Female Voice 1' },
  { id: 'female-2', label: 'Nữ 2', name: 'Vietnamese Female Voice 2' },
  { id: 'female-3', label: 'Nữ 3', name: 'Vietnamese Female Voice 3' },
];

export function AudioSettingsPage({ onNavigate, isSidebarCollapsed = false, onToggleCollapse, onSignOut, userId = 'dbe2f7eb-4b2f-49d0-a7fa-b6fb5a5a0ab2', user }: AudioSettingsPageProps) {
  const { themeColors } = useTheme();
  const [selectedVoice, setSelectedVoice] = useState('male-1');
  const [readingSpeed, setReadingSpeed] = useState(1.0);
  const [previewText, setPreviewText] = useState("Nội dung nghe thử");

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedVoice = localStorage.getItem('audio-preferred-voice');
    const savedSpeed = Number(localStorage.getItem('audio-reading-speed'));
    if (savedVoice) {
      setSelectedVoice(savedVoice);
    }
    if (Number.isFinite(savedSpeed) && savedSpeed >= 0.5 && savedSpeed <= 2.5) {
      setReadingSpeed(savedSpeed);
    }
  }, []);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('SettingsOverview');
    }
  };

  const handleSave = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('audio-preferred-voice', selectedVoice);
      localStorage.setItem('audio-reading-speed', readingSpeed.toString());
    }

    try {
      await saveSettings(userId, {
        audio: {
          voice: selectedVoice,
          speed: readingSpeed,
        }
      });
      toast.success("Đã lưu cài đặt âm thanh!");
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error("Lỗi khi lưu cài đặt.");
    }

    if (onNavigate) {
      onNavigate('SettingsOverview');
    }
  };

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId);
    playPreview(voiceId);
  };

  const playPreview = async (voiceId?: string) => {
    const voice = voiceId || selectedVoice;
    console.log('Playing preview with voice:', voice, 'Text:', previewText, 'Speed:', readingSpeed);

    if (!previewText.trim()) {
      toast.error("Vui lòng nhập nội dung nghe thử");
      return;
    }

    try {
      await speakText({ text: previewText, rate: readingSpeed, voice: voice });
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Không thể phát âm thanh mẫu');
    }
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: themeColors.appBackground }}>
      {/* Sidebar */}
      <Sidebar activePage="Cài đặt" onNavigate={onNavigate} isCollapsed={isSidebarCollapsed} onToggleCollapse={onToggleCollapse} onSignOut={onSignOut} user={user} />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-12 py-10">
          {/* Header with Back Button */}
          <div className="flex items-start gap-6 mb-6 flex-shrink-0">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all flex-shrink-0"
              style={{
                backgroundColor: themeColors.cardBackground,
                borderColor: themeColors.border,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.accentMain;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.cardBackground;
              }}
              aria-label="Back to Settings"
            >
              <ArrowLeft className="w-6 h-6" style={{ color: themeColors.textMain }} />
            </button>
            <h1
              style={{
                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                fontSize: '38px',
                letterSpacing: '0.05em',
                color: themeColors.textMain,
              }}
            >
              Cài Đặt Âm Thanh
            </h1>
          </div>

          {/* Main Settings Panel */}
          <div
            className="rounded-2xl border-2 shadow-lg p-8 flex-1 flex flex-col overflow-hidden"
            style={{
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.border,
            }}
          >
            {/* Listening Preview Section */}
            <div className="mb-6 flex-shrink-0">
              <label
                className="block mb-3"
                style={{
                  fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                  fontSize: '20px',
                  letterSpacing: '0.02em',
                  color: themeColors.textMain,
                }}
              >
                Nghe thử (tối đa 50 ký tự)
              </label>
              <div
                className="rounded-2xl border-2 p-2 pl-4 flex items-center justify-between"
                style={{
                  backgroundColor: themeColors.accentMain,
                  borderColor: themeColors.border,
                  minHeight: '80px'
                }}
              >
                <Input
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value.slice(0, 50))}
                  placeholder="Nhập nội dung để nghe thử..."
                  className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-lg h-auto p-0"
                  style={{
                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                    fontSize: '20px',
                    letterSpacing: '0.05em',
                    color: themeColors.textMain,
                  }}
                />

                <button
                  onClick={() => playPreview()}
                  className="ml-4 mr-2 w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm hover:shadow-md flex-shrink-0"
                  style={{
                    backgroundColor: '#D4E7F5',
                    borderColor: '#B8D4E8',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#C5DCF0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#D4E7F5';
                  }}
                  aria-label="Play preview"
                >
                  <Volume2 className="w-5 h-5" style={{ color: themeColors.textMain }} />
                </button>
              </div>
            </div>

            {/* Reading Speed Section */}
            <div className="mb-6 flex-shrink-0">
              <div className="flex items-center gap-6">
                <label
                  className="w-48 flex-shrink-0"
                  style={{
                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                    fontSize: '20px',
                    letterSpacing: '0.02em',
                    color: themeColors.textMain,
                  }}
                >
                  Tốc độ đọc
                </label>
                <div className="w-80">
                  <Slider
                    value={[readingSpeed * 10]}
                    onValueChange={(value: number[]) => setReadingSpeed(value[0] / 10)}
                    min={5}
                    max={20}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                <Input
                  type="number"
                  value={readingSpeed}
                  onChange={(e) => setReadingSpeed(Number(e.target.value))}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-20 text-center border-2 rounded-xl h-11"
                  style={{
                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                    fontSize: '18px',
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.border,
                    color: themeColors.textMain,
                  }}
                />
              </div>
            </div>

            {/* Male Voices Section */}
            <div className="mb-6 flex-shrink-0">
              <label
                className="block mb-3"
                style={{
                  fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                  fontSize: '20px',
                  letterSpacing: '0.02em',
                  color: themeColors.textMain,
                }}
              >
                Nam (Male)
              </label>
              <div className="flex gap-4">
                {maleVoices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => handleVoiceSelect(voice.id)}
                    className="flex-1 px-5 py-4 rounded-2xl border-2 transition-all shadow-sm"
                    style={{
                      fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                      fontSize: '18px',
                      letterSpacing: '0.02em',
                      backgroundColor: selectedVoice === voice.id ? '#D4E7F5' : themeColors.cardBackground,
                      borderColor: selectedVoice === voice.id ? '#B8D4E8' : themeColors.border,
                      color: themeColors.textMain,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedVoice !== voice.id) {
                        e.currentTarget.style.backgroundColor = themeColors.accentMain;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedVoice !== voice.id) {
                        e.currentTarget.style.backgroundColor = themeColors.cardBackground;
                      }
                    }}
                  >
                    {voice.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Female Voices Section */}
            <div className="mb-6 flex-shrink-0">
              <label
                className="block mb-3"
                style={{
                  fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                  fontSize: '20px',
                  letterSpacing: '0.02em',
                  color: themeColors.textMain,
                }}
              >
                Nữ (Female)
              </label>
              <div className="flex gap-4">
                {femaleVoices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => handleVoiceSelect(voice.id)}
                    className="flex-1 px-5 py-4 rounded-2xl border-2 transition-all shadow-sm"
                    style={{
                      fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                      fontSize: '18px',
                      letterSpacing: '0.02em',
                      backgroundColor: selectedVoice === voice.id ? '#D4E7F5' : themeColors.cardBackground,
                      borderColor: selectedVoice === voice.id ? '#B8D4E8' : themeColors.border,
                      color: themeColors.textMain,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedVoice !== voice.id) {
                        e.currentTarget.style.backgroundColor = themeColors.accentMain;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedVoice !== voice.id) {
                        e.currentTarget.style.backgroundColor = themeColors.cardBackground;
                      }
                    }}
                  >
                    {voice.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center mt-auto pt-4 flex-shrink-0">
              <button
                onClick={handleSave}
                className="px-12 py-3.5 rounded-2xl border-2 shadow-md hover:shadow-lg transition-all flex items-center gap-3"
                style={{
                  fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                  fontSize: '20px',
                  letterSpacing: '0.02em',
                  backgroundColor: '#D4E7F5',
                  borderColor: '#B8D4E8',
                  color: themeColors.textMain,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#C5DCF0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#D4E7F5';
                }}
              >
                <Save className="w-5 h-5" />
                Lưu
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}