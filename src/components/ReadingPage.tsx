import { Sidebar } from './Sidebar';
import { ReadingToolbar } from './ReadingToolbar';
import { QuickSettingsDrawer } from './QuickSettingsDrawer';
import { useState, useRef, useEffect } from 'react';
import { Plus, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { speakText, stopSpeaking, pauseSpeaking, resumeSpeaking } from '../utils/textToSpeech';
import { api } from '../utils/api';
import { supabase } from '../lib/supabaseClient';

interface ReadingPageProps {
  textid: string; // <-- nhận id trực tiếp
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport') => void;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
      className="fixed z-50 bg-[#FFFDF5] rounded-xl border-2 border-[#E8DCC8] shadow-xl p-2 flex gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 60}px`,
      }}
    >
      <button onClick={() => { onAddToLibrary(word); onClose(); }} className="w-10 h-10 rounded-full bg-[#D4E7F5] hover:bg-[#C5DCF0] flex items-center justify-center transition-all shadow-sm hover:shadow-md" aria-label="Add to library" title="Thêm vào thư viện">
        <Plus className="w-5 h-5 text-[#111111]" />
      </button>
      <button onClick={() => { onToggleBold(word); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm hover:shadow-md ${isBold ? 'bg-[#FFE8CC] hover:bg-[#FFDDB3]' : 'bg-[#D4E7F5] hover:bg-[#C5DCF0]'}`} aria-label="Toggle bold" title="Đậm" style={{ fontFamily: "'OpenDyslexic', 'Lexend', sans-serif" }}>
        <span className={isBold ? 'font-bold' : ''}>B</span>
      </button>
      <button onClick={() => { onPlayWord(word); onClose(); }} className="w-10 h-10 rounded-full bg-[#D4E7F5] hover:bg-[#C5DCF0] flex items-center justify-center transition-all shadow-sm hover:shadow-md" aria-label="Play pronunciation" title="Phát âm">
        <Volume2 className="w-5 h-5 text-[#111111]" />
      </button>
    </div>
  );
}

export function ReadingPage({ textid, onNavigate, onSignOut, isSidebarCollapsed = false, onToggleCollapse }: ReadingPageProps) {
  const [isMirrorEnabled, setIsMirrorEnabled] = useState(false);
  const [isSyllableMode, setIsSyllableMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [boldWords, setBoldWords] = useState<Set<string>>(new Set());
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [processedSentences, setProcessedSentences] = useState<string[]>([]);
  const [processedWords, setProcessedWords] = useState<string[][]>([]);
  const [isLoadingNLP, setIsLoadingNLP] = useState(true);

  const readingBoxRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastScrollTime = useRef<number>(0);
  const scrollThrottle = 400; // ms between line changes

  const [readingText, setReadingText] = useState<string>("");

  // ---------------- LOAD TEXT FROM SUPABASE -----------------
  useEffect(() => {
    async function fetchText() {
      if (!textid) return;

      const { data, error } = await supabase
        .from("Text")
        .select("content")
        .eq("textid", textid)
        .single();

      if (error) {
        console.error("Supabase error:", error);
      } else {
        setReadingText(data.content);
      }
    }

    fetchText();
  }, [textid]);

  // ---------------- LOAD NLP -----------------
  useEffect(() => {
    if (!readingText) return;

    const loadNLP = async () => {
      try {
        setIsLoadingNLP(true);
        const response = await api.nlp.segment(readingText);

        if (response.data) {
          setProcessedSentences(response.data.sentences);
          setProcessedWords(response.data.words_per_sentence);
        } else {
          setProcessedSentences(readingText.match(/[^.!?]+[.!?]+/g) || [readingText]);
        }
      } catch (error) {
        console.error("NLP Error:", error);
        setProcessedSentences(readingText.match(/[^.!?]+[.!?]+/g) || [readingText]);
      } finally {
        setIsLoadingNLP(false);
      }
    };

    loadNLP();
  }, [readingText]);

  // Cleanup on unmount
  useEffect(() => { return () => stopSpeaking(); }, []);

  const handleWordClick = (word: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setSelectedWord(word);
    setToolbarPosition({ x: rect.left + rect.width / 2 - 70, y: rect.top });
  };

  const handleAddToLibrary = (word: string) => toast.success(`"${word}" đã được thêm vào thư viện!`);
  const handleToggleBold = (word: string) => setBoldWords(prev => { const newSet = new Set(prev); newSet.has(word) ? newSet.delete(word) : newSet.add(word); return newSet; });
  const handlePlayWord = async (word: string) => { try { await speakText({ text: word, lang: 'vi-VN', rate: 1.0 }); } catch { toast.error('Không thể phát âm. Vui lòng thử lại.'); } };

  const handlePlayText = async () => {
    if (isPaused) { resumeSpeaking(); setIsPaused(false); return; }
    if (isPlaying) { pauseSpeaking(); setIsPaused(true); return; }

    setIsPlaying(true); setIsPaused(false);
    try { await speakText({ text: readingText, lang: 'vi-VN', rate: 1.0 }); }
    catch { toast.error('Không thể phát âm. Vui lòng thử lại.'); }
    finally { setIsPlaying(false); setIsPaused(false); }
  };

  const highlightMirrorLetters = (text: string) => {
    if (!isMirrorEnabled) return text;
    return text.split('').map((char, idx) => {
      const lowerChar = char.toLowerCase();
      if (['m', 'n', 'u'].includes(lowerChar)) return <span key={idx} style={{ backgroundColor: '#CBE7FF' }}>{char}</span>;
      if (['q', 'p', 'b', 'd'].includes(lowerChar)) return <span key={idx} style={{ backgroundColor: '#FAD4D4' }}>{char}</span>;
      return char;
    });
  };

  // --- Render text with interactive words ---
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
                  className="cursor-pointer hover:bg-[#FFE8CC] hover:bg-opacity-50 rounded px-1 transition-colors inline-block"
                  style={{
                    fontWeight: isBold ? 'bold' : 'normal',
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

  // --- Tính opacity cho mỗi dòng trong Focus Mode ---
  const getLineOpacity = (lineIndex: number): number => {
    if (!isFocusMode) return 1;

    const distance = Math.abs(lineIndex - currentLineIndex);

    if (distance === 0) return 1;       // dòng hiện tại - full opacity
    if (distance === 1) return 0.25;    // dòng kế bên - mờ hơn
    if (distance === 2) return 0.12;    // cách 2 dòng - mờ hơn
    return 0.08;                         // các dòng xa - mờ hơn nhiều
  };


  // --- Render text in Focus Mode (line by line) ---
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
                  className="hover:bg-[#FFE8CC] hover:bg-opacity-50 rounded px-1 transition-colors inline-block"
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

  return (
    <div className="flex h-screen bg-[#FFF8E7]">
      <Sidebar activePage="Đọc" onNavigate={onNavigate} isCollapsed={isSidebarCollapsed} onToggleCollapse={onToggleCollapse} onSignOut={onSignOut} />
      <main className="flex-1 overflow-hidden flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center px-12 pt-8 pb-4 overflow-hidden">
          <div ref={readingBoxRef} className={`w-full max-w-4xl h-full max-h-[calc(100vh-180px)] bg-[#FFF8E7] rounded-[2rem] border-2 border-[#E8DCC8] shadow-lg p-12 relative ${isFocusMode ? 'focus-mode-active overflow-hidden' : 'overflow-y-auto'}`}>
            <div style={{ fontFamily: "'OpenDyslexic','Lexend',sans-serif", fontSize: '26px', lineHeight: 1.8, maxWidth: '66ch', wordSpacing: '0.16em' }}>
              {isFocusMode ? renderFocusModeText() : renderInteractiveText()}
            </div>
          </div>
        </div>
        <div className="pb-6 flex-shrink-0">
          <ReadingToolbar
            onToggleMirror={setIsMirrorEnabled}
            onToggleSyllable={setIsSyllableMode}
            onToggleFocusMode={setIsFocusMode}
            onPreviousLine={() => setCurrentLineIndex(prev => Math.max(0, prev - 1))}
            onNextLine={() => setCurrentLineIndex(prev => Math.min(processedSentences.length - 1, prev + 1))}
            onPlayText={handlePlayText}
            isMirrorEnabled={isMirrorEnabled}
            isSyllableMode={isSyllableMode}
            isFocusMode={isFocusMode}
            isPlaying={isPlaying || isPaused}
          />
        </div>
        {selectedWord && <ContextualToolbar word={selectedWord} position={toolbarPosition} onClose={() => setSelectedWord(null)} onAddToLibrary={handleAddToLibrary} onToggleBold={handleToggleBold} onPlayWord={handlePlayWord} isBold={boldWords.has(selectedWord)} />}
      </main>
      <QuickSettingsDrawer isCollapsed={!isQuickSettingsOpen} onToggle={() => setIsQuickSettingsOpen(prev => !prev)} />
    </div>
  );
}
