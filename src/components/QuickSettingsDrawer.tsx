import { Settings, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Slider } from './ui/slider';
import { useTheme, ThemeType } from './ThemeContext';
import { useDisplaySettings } from './DisplaySettingsContext';

interface QuickSettingsDrawerProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

type ColorTheme = {
  name: string;
  themeKey: ThemeType;
  background: string;
  text: string;
  preview: string;
};

const colorThemes: ColorTheme[] = [
  {
    name: 'Kem & Đen',
    themeKey: 'cream',
    background: '#FFF8E7',
    text: '#111111',
    preview: '#FFEB99',
  },
  {
    name: 'Chế độ Tối',
    themeKey: 'dark',
    background: '#111827',
    text: '#FFFFFF',
    preview: '#1F2937',
  },
  {
    name: 'Xanh & Đen',
    themeKey: 'coolBlue',
    background: '#E3F2FD',
    text: '#111111',
    preview: '#BBDEFB',
  },
];

const fontOptions = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Lexend', value: "'Lexend', sans-serif" },
  { name: 'OpenDyslexic', value: "'OpenDyslexic', 'Lexend', sans-serif" },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
];

export function QuickSettingsDrawer(props: QuickSettingsDrawerProps) {
  const { isCollapsed = true, onToggle } = props;
  const { themeColors, currentTheme, setTheme } = useTheme();
  const { fontFamily, fontSize, letterSpacing, lineSpacing, updateSettings } = useDisplaySettings();

  // Ref for click outside
  const drawerRef = useRef<HTMLDivElement>(null);

  // Audio state
  const [readingSpeed, setReadingSpeed] = useState(1.0);
  const [preferredVoice, setPreferredVoice] = useState('female-1');

  // Load settings effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSpeed = localStorage.getItem('audio-reading-speed');
      const savedVoice = localStorage.getItem('audio-preferred-voice');
      if (savedSpeed) setReadingSpeed(parseFloat(savedSpeed));
      if (savedVoice) setPreferredVoice(savedVoice);
    }
  }, [isCollapsed]);

  // Click outside effect
  useEffect(() => {
    if (!isCollapsed) {
      const handleClickOutside = (event: MouseEvent) => {
        if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
          onToggle?.();
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onToggle?.();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isCollapsed, onToggle]);

  const handleSpeedChange = (value: number[]) => {
    const newSpeed = value[0];
    setReadingSpeed(newSpeed);
    localStorage.setItem('audio-reading-speed', newSpeed.toString());
  };

  const handleVoiceChange = (voice: string) => {
    setPreferredVoice(voice);
    localStorage.setItem('audio-preferred-voice', voice);
  };

  if (isCollapsed) {
    return (
      <aside ref={drawerRef} className="w-20 border-l-2 shadow-sm flex flex-col" style={{ backgroundColor: themeColors.sidebarBackground, borderColor: themeColors.border }}>
        <div className="p-4 border-b-2 flex justify-center" style={{ borderColor: themeColors.border }}>
          <button
            onClick={onToggle}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-colors border-2 shadow-sm"
            style={{
              backgroundColor: themeColors.accentMain,
              borderColor: themeColors.border,
              boxShadow: `0 4px 8px ${themeColors.shadow}`
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            aria-label="Open Quick Settings"
            title="Quick Settings"
          >
            <Settings className="w-7 h-7" style={{ color: themeColors.textMain }} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside ref={drawerRef} className="w-80 border-l-2 shadow-sm flex flex-col relative overflow-y-auto" style={{ backgroundColor: themeColors.sidebarBackground, borderColor: themeColors.border }}>
      {/* Header */}
      <div className="p-6 border-b-2 flex flex-col items-center justify-center gap-2" style={{ borderColor: themeColors.border }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-sm"
          style={{
            backgroundColor: themeColors.accentMain,
            borderColor: themeColors.border,
            boxShadow: `0 4px 8px ${themeColors.shadow}`
          }}>
          <Settings className="w-8 h-8" style={{ color: themeColors.textMain }} />
        </div>
        <h2
          className="text-xl font-bold mt-2"
          style={{
            fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
            color: themeColors.textMain
          }}
        >
          Cài đặt nhanh
        </h2>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6 space-y-10 pb-20">

        {/* SECTION: DISPLAY */}
        <div>
          <div className="flex items-center gap-2 mb-6 pb-2 border-b" style={{ borderColor: themeColors.border }}>
            <span className="font-bold text-lg" style={{ fontFamily: "'OpenDyslexic', 'Lexend', sans-serif", color: themeColors.textMain }}>
              Hiển thị & Văn bản
            </span>
          </div>

          <div className="space-y-8">
            {/* Font Selection */}
            <div>
              <label className="block mb-4 font-semibold" style={{ fontFamily: "'OpenDyslexic', 'Lexend', sans-serif", fontSize: '18px', color: themeColors.textMain }}>
                Phông chữ
              </label>
              <div className="grid grid-cols-1 gap-3">
                {fontOptions.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => updateSettings({ fontFamily: font.value })}
                    className="px-4 py-3 rounded-2xl border-2 transition-all shadow-sm flex items-center justify-between group"
                    style={{
                      fontFamily: font.value,
                      fontSize: '17px',
                      backgroundColor: fontFamily === font.value ? (currentTheme === 'dark' ? '#374151' : '#D4E7F5') : themeColors.cardBackground,
                      borderColor: fontFamily === font.value ? (currentTheme === 'dark' ? '#6B7280' : '#B8D4E8') : themeColors.border,
                      color: themeColors.textMain,
                      fontWeight: fontFamily === font.value ? 'bold' : 'normal',
                    }}
                  >
                    <span>{font.name}</span>
                    {fontFamily === font.value && <Check className="w-5 h-5 text-blue-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size, Letter Spacing, Line Spacing Sliders... re-implemented cleanly */}
            {[
              { label: 'Cỡ chữ', val: fontSize, set: (v: number) => updateSettings({ fontSize: v }), min: 16, max: 36, display: (v: number) => `${v}px` },
              { label: 'Khoảng cách chữ', val: letterSpacing * 100, set: (v: number) => updateSettings({ letterSpacing: v / 100 }), min: 0, max: 30, display: (v: number) => `${v.toFixed(1)}%` },
              { label: 'Khoảng cách dòng', val: lineSpacing * 10, set: (v: number) => updateSettings({ lineSpacing: v / 10 }), min: 10, max: 30, display: (v: number) => (v / 10).toFixed(1) }
            ].map((item, idx) => (
              <div key={idx}>
                <label className="block mb-3 font-semibold" style={{ fontFamily: "'OpenDyslexic', 'Lexend', sans-serif", fontSize: '18px', color: themeColors.textMain }}>
                  {item.label}
                </label>
                <Slider
                  value={[item.val]}
                  onValueChange={(val: number[]) => item.set(val[0])}
                  min={item.min}
                  max={item.max}
                  step={0.5}
                  className="w-full"
                />
                <div className="text-center mt-2 font-medium" style={{ fontFamily: "'Lexend', sans-serif", fontSize: '16px', color: themeColors.textSecondary }}>
                  {item.display(item.val)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION: AUDIO */}
        <div>
          <div className="flex items-center gap-2 mb-6 pb-2 border-b" style={{ borderColor: themeColors.border }}>
            <span className="font-bold text-lg" style={{ fontFamily: "'OpenDyslexic', 'Lexend', sans-serif", color: themeColors.textMain }}>
              Âm thanh & Giọng đọc
            </span>
          </div>

          <div className="space-y-8">
            {/* Reading Speed */}
            <div>
              <label className="block mb-3 font-semibold" style={{ fontFamily: "'OpenDyslexic', 'Lexend', sans-serif", fontSize: '18px', color: themeColors.textMain }}>
                Tốc độ đọc
              </label>
              <Slider
                value={[readingSpeed]}
                onValueChange={handleSpeedChange}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between mt-2 px-1">
                <span className="text-xs opacity-60" style={{ color: themeColors.textSecondary }}>Chậm</span>
                <span className="font-medium" style={{ fontFamily: "'Lexend', sans-serif", fontSize: '16px', color: themeColors.textSecondary }}>
                  {readingSpeed.toFixed(1)}x
                </span>
                <span className="text-xs opacity-60" style={{ color: themeColors.textSecondary }}>Nhanh</span>
              </div>
            </div>

            {/* Voice Selection */}
            <div>
              <label className="block mb-4 font-semibold" style={{ fontFamily: "'OpenDyslexic', 'Lexend', sans-serif", fontSize: '18px', color: themeColors.textMain }}>
                Giọng đọc
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'female-1', label: 'Nữ (Bắc)', icon: '👩' },
                  { id: 'male-1', label: 'Nam (Bắc)', icon: '👨' }
                ].map(voice => (
                  <button
                    key={voice.id}
                    onClick={() => handleVoiceChange(voice.id)}
                    className="px-3 py-4 rounded-2xl border-2 transition-all shadow-sm flex flex-col items-center gap-2"
                    style={{
                      backgroundColor: preferredVoice === voice.id ? (currentTheme === 'dark' ? '#374151' : '#D4E7F5') : themeColors.cardBackground,
                      borderColor: preferredVoice === voice.id ? (currentTheme === 'dark' ? '#6B7280' : '#B8D4E8') : themeColors.border,
                      color: themeColors.textMain,
                    }}
                  >
                    <span className="text-2xl">{voice.icon}</span>
                    <span className="font-medium">{voice.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: THEME */}
        <div>
          <div className="flex items-center gap-2 mb-6 pb-2 border-b" style={{ borderColor: themeColors.border }}>
            <span className="font-bold text-lg" style={{ fontFamily: "'OpenDyslexic', 'Lexend', sans-serif", color: themeColors.textMain }}>
              Chủ đề màu
            </span>
          </div>

          <div className="flex gap-4 justify-center">
            {colorThemes.map((theme, index) => (
              <button
                key={index}
                onClick={() => setTheme(theme.themeKey)}
                className="relative w-14 h-14 rounded-full border-4 transition-all shadow-md"
                style={{
                  backgroundColor: theme.background,
                  borderColor: theme.themeKey === currentTheme ? themeColors.textMain : themeColors.border,
                  transform: theme.themeKey === currentTheme ? 'scale(1.15)' : 'scale(1)',
                }}
                aria-label={theme.name}
              >
                {theme.themeKey === currentTheme && (
                  <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-200" style={{ color: theme.text }}>
                    <Check className="w-7 h-7" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}