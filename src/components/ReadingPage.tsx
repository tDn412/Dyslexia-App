import { Sidebar } from './Sidebar';
import { ReadingToolbar } from './ReadingToolbar';
import { QuickSettingsDrawer } from './QuickSettingsDrawer';
import { useState, useRef, useEffect } from 'react';
import { Plus, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from './ThemeContext';
import { useDisplaySettings } from './DisplaySettingsContext';
import { fetchReadingById, addToLibrary } from '../utils/api';

interface ReadingPageProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport' | 'Exercise') => void;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  userId?: string;
}

interface ContextualToolbarProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
  onAddToLibrary: (word: string) => void;
  onToggleBold: (word: string) => void;
  onPlayWord: (word: string) => void;
  isBold: boolean;
}

function ContextualToolbar({ word, position, onClose, onAddToLibrary, onToggleBold, onPlayWord, isBold }: ContextualToolbarProps) {
  const { themeColors } = useTheme();
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 rounded-xl border-2 shadow-xl p-2 flex gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 60}px`,
        backgroundColor: themeColors.cardBackground,
        borderColor: themeColors.border,
      }}
    >
      {/* Add to Library */}
      <button
        onClick={() => {
          onAddToLibrary(word);
          onClose();
        }}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm hover:shadow-md"
        style={{
          backgroundColor: '#D4E7F5',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#C5DCF0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#D4E7F5';
        }}
        aria-label="Add to library"
        title="Thêm vào thư viện"
      >
        <Plus className="w-5 h-5" style={{ color: themeColors.textMain }} />
      </button>

      {/* Bold Toggle */}
      <button
        onClick={() => {
          onToggleBold(word);
        }}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm hover:shadow-md"
        style={{
          backgroundColor: isBold ? themeColors.accentMain : '#D4E7F5',
          fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
        }}
        onMouseEnter={(e) => {
          if (!isBold) {
            e.currentTarget.style.backgroundColor = '#C5DCF0';
          }
        }}
        onMouseLeave={(e) => {
          if (!isBold) {
            e.currentTarget.style.backgroundColor = '#D4E7F5';
          }
        }}
        aria-label="Toggle bold"
        title="Đậm"
      >
        <span className={isBold ? 'font-bold' : ''} style={{ color: themeColors.textMain }}>B</span>
      </button>

      {/* Play Word */}
      <button
        onClick={() => {
          onPlayWord(word);
        }}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm hover:shadow-md"
        style={{
          backgroundColor: '#D4E7F5',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#C5DCF0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#D4E7F5';
        }}
        aria-label="Play word"
        title="Nghe"
      >
        <Volume2 className="w-5 h-5" style={{ color: themeColors.textMain }} />
      </button>
    </div>
  );
}

export function ReadingPage({ onNavigate, onSignOut, isSidebarCollapsed = false, onToggleCollapse, userId = 'demo-user-id' }: ReadingPageProps) {
  const { themeColors } = useTheme();
  const { fontFamily, fontSize, letterSpacing, lineSpacing: lineHeight } = useDisplaySettings();
  const [isMirrorEnabled, setIsMirrorEnabled] = useState(false);
  const [isSyllableMode, setIsSyllableMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [boldWords, setBoldWords] = useState<Set<string>>(new Set());
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const readingBoxRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastScrollTime = useRef<number>(0);
  const scrollThrottle = 400; // Milliseconds between line changes

  const [readingContent, setReadingContent] = useState<string>('');
  const [readingTitle, setReadingTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReading = async () => {
      const id = localStorage.getItem('currentReadingId');
      if (!id) {
        // Fallback or redirect
        setReadingContent("Không tìm thấy bài đọc. Vui lòng chọn bài đọc từ danh sách.");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchReadingById(id);
        setReadingContent(data.content);
        setReadingTitle(data.title);
      } catch (error) {
        console.error("Failed to load reading", error);
        setReadingContent("Lỗi khi tải bài đọc.");
      } finally {
        setLoading(false);
      }
    };
    loadReading();
  }, []);

  const handleWordClick = (word: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setSelectedWord(word);
    setToolbarPosition({
      x: rect.left + rect.width / 2 - 70,
      y: rect.top,
    });
  };

  const handleAddToLibrary = async (word: string) => {
    try {
      // Assuming user ID is stored or we use a demo ID
      // userId is now from props
      await addToLibrary(userId, word);
      toast.success(`"${word}" đã được thêm vào thư viện!`);
    } catch (error) {
      toast.error(`Lỗi khi thêm "${word}" vào thư viện.`);
    }
  };

  const handleToggleBold = (word: string) => {
    setBoldWords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(word)) {
        newSet.delete(word);
      } else {
        newSet.add(word);
      }
      return newSet;
    });
  };

  const handlePlayWord = (word: string) => {
    toast.info(`Đang phát âm: "${word}"`);
    // Use Web Speech API
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'vi-VN';

      // Try to find a Vietnamese voice
      const voices = window.speechSynthesis.getVoices();
      const vietnameseVoice = voices.find(voice =>
        voice.lang.includes('vi') || voice.lang.includes('VN')
      );

      if (vietnameseVoice) {
        utterance.voice = vietnameseVoice;
      }

      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Trình duyệt không hỗ trợ đọc văn bản.");
    }
  };


  // Highlight mirror letters
  const highlightMirrorLetters = (text: string) => {
    if (!isMirrorEnabled) return text;

    const mirrorLetters = ['b', 'd', 'p', 'q', 'B', 'D', 'P', 'Q'];
    const chars = text.split('');

    return chars.map((char, index) => {
      if (mirrorLetters.includes(char)) {
        return (
          <span
            key={index}
            className="rounded px-0.5"
            style={{ backgroundColor: '#CBE7FF' }}
          >
            {char}
          </span>
        );
      }
      return char;
    });
  };

  // Split text into interactive words
  const renderInteractiveText = () => {
    const words = readingContent.split(/(\s+)/);
    return words.map((segment, index) => {
      const trimmedWord = segment.trim();
      if (!trimmedWord) return <span key={index}>{segment}</span>;

      const isBold = boldWords.has(trimmedWord);

      return (
        <span
          key={index}
          onClick={(e) => handleWordClick(trimmedWord, e)}
          className="cursor-pointer rounded px-1 transition-colors inline-block"
          style={{
            fontWeight: isBold ? 'bold' : 'normal',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${themeColors.accentMain}80`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {highlightMirrorLetters(segment)}
        </span>
      );
    });
  };

  // Split text into sentences for Focus Mode
  const sentences = readingContent.match(/[^.!?]+[.!?]+/g) || [readingContent];

  // Render text in Focus Mode (line by line)
  const renderFocusModeText = () => {
    return sentences.map((sentence, index) => {
      const words = sentence.split(/(\s+)/);
      const opacity = getLineOpacity(index);

      return (
        <div
          key={index}
          ref={(el) => { lineRefs.current[index] = el; }}
          onClick={() => setCurrentLineIndex(index)}
          className="cursor-pointer transition-opacity duration-500 mb-6"
          style={{
            opacity,
            fontWeight: index === currentLineIndex ? '600' : 'normal',
          }}
        >
          {words.map((segment, wordIndex) => {
            const trimmedWord = segment.trim();
            if (!trimmedWord) return <span key={wordIndex}>{segment}</span>;

            const isBold = boldWords.has(trimmedWord);

            return (
              <span
                key={wordIndex}
                onClick={(e) => {
                  e.stopPropagation();
                  handleWordClick(trimmedWord, e);
                }}
                className="rounded px-1 transition-colors inline-block"
                style={{
                  fontWeight: isBold ? 'bold' : 'normal',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${themeColors.accentMain}80`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {highlightMirrorLetters(segment)}
              </span>
            );
          })}
        </div>
      );
    });
  };

  const handleQuickSettingsToggle = () => {
    if (!isQuickSettingsOpen && !isSidebarCollapsed) {
      // Opening quick settings - collapse left sidebar
      onToggleCollapse?.();
    }
    setIsQuickSettingsOpen(!isQuickSettingsOpen);
  };

  // Auto-scroll to center the current line in Focus Mode
  useEffect(() => {
    if (isFocusMode && readingBoxRef.current && lineRefs.current[currentLineIndex]) {
      const container = readingBoxRef.current;
      const currentLine = lineRefs.current[currentLineIndex];

      if (currentLine) {
        const containerHeight = container.clientHeight;
        const lineTop = currentLine.offsetTop;
        const lineHeight = currentLine.clientHeight;

        // Calculate scroll position to center the line
        const scrollTo = lineTop - (containerHeight / 2) + (lineHeight / 2);

        container.scrollTo({
          top: scrollTo,
          behavior: 'smooth'
        });
      }
    }
  }, [currentLineIndex, isFocusMode]);

  // Handle keyboard navigation in Focus Mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFocusMode) return;

      if (event.key === 'Escape') {
        setIsFocusMode(false);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePreviousLine();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        handleNextLine();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, currentLineIndex, sentences.length]);

  // Handle mouse wheel scrolling in Focus Mode
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (!isFocusMode) return;

      // Prevent default scrolling behavior in Focus Mode
      event.preventDefault();

      // Throttle: only change line if enough time has passed
      const now = Date.now();
      if (now - lastScrollTime.current < scrollThrottle) {
        return;
      }

      lastScrollTime.current = now;

      // Determine scroll direction
      if (event.deltaY > 0) {
        // Scrolling down - next line
        handleNextLine();
      } else if (event.deltaY < 0) {
        // Scrolling up - previous line
        handlePreviousLine();
      }
    };

    const readingBox = readingBoxRef.current;
    if (readingBox && isFocusMode) {
      readingBox.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (readingBox) {
        readingBox.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isFocusMode, currentLineIndex, sentences.length]);

  // Calculate opacity for each line in Focus Mode
  const getLineOpacity = (lineIndex: number) => {
    if (!isFocusMode) return 1;

    const distance = Math.abs(lineIndex - currentLineIndex);

    if (distance === 0) return 1; // Current line - full opacity
    if (distance === 1) return 0.25; // Adjacent lines - mờ hơn gấp đôi
    if (distance === 2) return 0.12; // 2 lines away - mờ hơn gấp đôi
    return 0.08; // Distant lines - mờ hơn gấp đôi
  };

  // Navigate to previous line in Focus Mode
  const handlePreviousLine = () => {
    if (isFocusMode) {
      setCurrentLineIndex((prev) => Math.max(0, prev - 1));
    }
  };

  // Navigate to next line in Focus Mode
  const handleNextLine = () => {
    if (isFocusMode) {
      setCurrentLineIndex((prev) => Math.min(sentences.length - 1, prev + 1));
    }
  };

  // Handle Play/Pause for TTS
  const handlePlayPause = (shouldPlay: boolean) => {
    if (shouldPlay) {
      // Start playing
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(readingContent);
        utterance.lang = 'vi-VN';

        // Try to find a Vietnamese voice
        const voices = window.speechSynthesis.getVoices();
        const vietnameseVoice = voices.find(voice =>
          voice.lang.includes('vi') || voice.lang.includes('VN')
        );

        if (vietnameseVoice) {
          utterance.voice = vietnameseVoice;
        }

        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      } else {
        toast.error("Trình duyệt không hỗ trợ đọc văn bản.");
      }
    } else {
      // Pause/Stop playing
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  // Handle Reset
  const handleReset = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentLineIndex(0);
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: themeColors.appBackground }}>
      {/* Sidebar */}
      <Sidebar
        activePage="Đọc"
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={onToggleCollapse}
        onSignOut={onSignOut}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center px-12 pt-8 pb-4 overflow-hidden">
          {/* Reading Content Frame */}
          <div
            ref={readingBoxRef}
            className={`w-full max-w-4xl h-full max-h-[calc(100vh-180px)] rounded-[2rem] border-2 shadow-lg p-12 relative ${isFocusMode ? 'focus-mode-active overflow-hidden' : 'overflow-y-auto'
              }`}
            style={{
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.border,
            }}
          >
            {loading ? (
              <div className="text-center">Loading...</div>
            ) : (
              <div
                className="mx-auto select-none"
                style={{
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  lineHeight,
                  letterSpacing: `${letterSpacing}em`,
                  maxWidth: '66ch',
                  wordSpacing: '0.16em',
                  color: themeColors.textMain,
                }}
              >
                <h1 className="text-2xl font-bold mb-4">{readingTitle}</h1>
                {isFocusMode ? renderFocusModeText() : renderInteractiveText()}
              </div>
            )}

            {/* Focus Mode Gradient Overlays */}
            {isFocusMode && (
              <>
                <div
                  className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
                  style={{
                    background: `linear-gradient(to bottom, ${themeColors.cardBackground} 0%, transparent 100%)`,
                  }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                  style={{
                    background: `linear-gradient(to top, ${themeColors.cardBackground} 0%, transparent 100%)`,
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="pb-6 flex-shrink-0">
          <ReadingToolbar
            onToggleMirror={setIsMirrorEnabled}
            onToggleSyllable={setIsSyllableMode}
            onToggleFocusMode={setIsFocusMode}
            onPreviousLine={handlePreviousLine}
            onNextLine={handleNextLine}
            onPlayPause={handlePlayPause}
            onReset={handleReset}
            isMirrorEnabled={isMirrorEnabled}
            isSyllableMode={isSyllableMode}
            isPlaying={isPlaying}
            isFocusMode={isFocusMode}
          />
        </div>

        {/* Contextual Toolbar */}
        {selectedWord && (
          <ContextualToolbar
            word={selectedWord}
            position={toolbarPosition}
            onClose={() => setSelectedWord(null)}
            onAddToLibrary={handleAddToLibrary}
            onToggleBold={handleToggleBold}
            onPlayWord={handlePlayWord}
            isBold={boldWords.has(selectedWord)}
          />
        )}
      </main>

      {/* Quick Settings Drawer */}
      <QuickSettingsDrawer
        isCollapsed={!isQuickSettingsOpen}
        onToggle={handleQuickSettingsToggle}
      />
    </div>
  );
}