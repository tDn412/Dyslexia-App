import { Sidebar } from './Sidebar';
import { ReadingToolbar } from './ReadingToolbar';
import { QuickSettingsDrawer } from './QuickSettingsDrawer';
import { useState, useRef, useEffect } from 'react';
import { Plus, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from './ThemeContext';
import { useDisplaySettings } from './DisplaySettingsContext';
import { api, addToLibrary, fetchReadingById } from '../utils/api';
import { speakText, stopSpeaking, pauseSpeaking, resumeSpeaking } from '../utils/textToSpeech';

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
  const [isPaused, setIsPaused] = useState(false);
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

  // NLP States
  const [processedSentences, setProcessedSentences] = useState<string[]>([]);
  const [processedWords, setProcessedWords] = useState<string[][]>([]);
  const [isLoadingNLP, setIsLoadingNLP] = useState(true);

  useEffect(() => {
    const loadReading = async () => {
      const id = localStorage.getItem('currentReadingId');
      if (!id) {
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

  // ---------------- LOAD NLP -----------------
  useEffect(() => {
    if (!readingContent) return;

    const loadNLP = async () => {
      try {
        setIsLoadingNLP(true);
        const response = await api.nlp.segment(readingContent);

        if (response.data) {
          setProcessedSentences(response.data.sentences);
          setProcessedWords(response.data.words_per_sentence);
        } else {
          setProcessedSentences(readingContent.match(/[^.!?]+[.!?]+/g) || [readingContent]);
        }
      } catch (error) {
        console.error("NLP Error:", error);
        setProcessedSentences(readingContent.match(/[^.!?]+[.!?]+/g) || [readingContent]);
      } finally {
        setIsLoadingNLP(false);
      }
    };

    loadNLP();
  }, [readingContent]);

  // Cleanup on unmount
  useEffect(() => { return () => stopSpeaking(); }, []);

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

  const handlePlayWord = async (word: string) => {
    try {
      await speakText({ text: word, lang: 'vi-VN', rate: 1.0 });
    } catch {
      toast.error('Không thể phát âm. Vui lòng thử lại.');
    }
  };

  // Highlight mirror letters
  const highlightMirrorLetters = (text: string) => {
    if (!isMirrorEnabled) return text;
    // Simple mock mirror check
    const mirrorLetters = ['b', 'd', 'p', 'q', 'm', 'n', 'u'];
    return text.split('').map((char, index) => {
      const lowerChar = char.toLowerCase();
      if (mirrorLetters.includes(lowerChar)) {
        let color = '#CBE7FF';
        if (['p', 'q', 'b', 'd'].includes(lowerChar)) color = '#FAD4D4';
        return (
          <span key={index} className="rounded px-0.5" style={{ backgroundColor: color }}>
            {char}
          </span>
        );
      }
      return char;
    });
  };

  // Render text with interactive words using processed NLP data
  const renderInteractiveText = (): React.ReactNode => {
    if (isLoadingNLP) return <p>Đang tải văn bản...</p>;

    return processedSentences.map((sentence, sIdx) => {
      const words = processedWords[sIdx] || sentence.split(/(\s+)/);

      return (
        <span key={sIdx}>
          {words.map((segment, wIdx) => {
            const trimmedWord = segment.trim();

            if (!trimmedWord) return <span key={wIdx}>{segment}</span>;

            const isBold = boldWords.has(trimmedWord);

            return (
              <span key={wIdx}>
                <span
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
                {processedWords[sIdx] ? ' ' : ''}
              </span>
            );
          })}
        </span>
      );
    });
  };

  const handleQuickSettingsToggle = () => {
    if (!isQuickSettingsOpen && !isSidebarCollapsed) {
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
  }, [isFocusMode, currentLineIndex, processedSentences.length]);

  // Handle mouse wheel scrolling in Focus Mode
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (!isFocusMode) return;
      event.preventDefault();
      const now = Date.now();
      if (now - lastScrollTime.current < scrollThrottle) {
        return;
      }
      lastScrollTime.current = now;
      if (event.deltaY > 0) {
        handleNextLine();
      } else if (event.deltaY < 0) {
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
  }, [isFocusMode, currentLineIndex, processedSentences.length]);

  // Calculate opacity for each line in Focus Mode
  const getLineOpacity = (lineIndex: number) => {
    if (!isFocusMode) return 1;
    const distance = Math.abs(lineIndex - currentLineIndex);
    if (distance === 0) return 1;
    if (distance === 1) return 0.25;
    if (distance === 2) return 0.12;
    return 0.08;
  };

  // Render text in Focus Mode (line by line)
  const renderFocusModeText = (): React.ReactNode => {
    if (isLoadingNLP) return <p>Đang tải văn bản...</p>;

    return processedSentences.map((sentence, index) => {
      const words = processedWords[index] || sentence.split(/(\s+)/);
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
              <span key={wordIndex}>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWordClick(trimmedWord, e);
                  }}
                  className="rounded px-1 transition-colors inline-block hover:bg-[#FFE8CC] hover:bg-opacity-50"
                  style={{
                    fontWeight: isBold ? 'bold' : 'normal',
                  }}
                >
                  {highlightMirrorLetters(segment)}
                </span>
                {processedWords[index] ? ' ' : ''}
              </span>
            );
          })}
        </div>
      );
    });
  };

  const handlePreviousLine = () => {
    if (isFocusMode) {
      setCurrentLineIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleNextLine = () => {
    if (isFocusMode) {
      setCurrentLineIndex((prev) => Math.min(processedSentences.length - 1, prev + 1));
    }
  };

  const handlePlayText = async () => {
    if (isPaused) { resumeSpeaking(); setIsPaused(false); return; }
    if (isPlaying) { pauseSpeaking(); setIsPaused(true); return; }

    setIsPlaying(true); setIsPaused(false);
    try { await speakText({ text: readingContent, lang: 'vi-VN', rate: 1.0 }); }
    catch { toast.error('Không thể phát âm. Vui lòng thử lại.'); }
    finally { setIsPlaying(false); setIsPaused(false); }
  };

  const handleReset = () => {
    stopSpeaking();
    setIsPlaying(false);
    setCurrentLineIndex(0);
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: themeColors.appBackground }}>
      <Sidebar
        activePage="Đọc"
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={onToggleCollapse}
        onSignOut={onSignOut}
      />

      <main className="flex-1 overflow-hidden flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center px-12 pt-8 pb-4 overflow-hidden">
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

        <div className="pb-6 flex-shrink-0">
          <ReadingToolbar
            onToggleMirror={setIsMirrorEnabled}
            onToggleSyllable={setIsSyllableMode}
            onToggleFocusMode={setIsFocusMode}
            onPreviousLine={handlePreviousLine}
            onNextLine={handleNextLine}
            onPlayPause={handlePlayText}
            onReset={handleReset}
            isMirrorEnabled={isMirrorEnabled}
            isSyllableMode={isSyllableMode}
            isPlaying={isPlaying || isPaused}
            isFocusMode={isFocusMode}
          />
        </div>

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

      <QuickSettingsDrawer
        isCollapsed={!isQuickSettingsOpen}
        onToggle={handleQuickSettingsToggle}
      />
    </div>
  );
}