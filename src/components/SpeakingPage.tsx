import { Sidebar } from './Sidebar';
import { SpeakingToolbar } from './SpeakingToolbar';
import { QuickSettingsDrawer } from './QuickSettingsDrawer';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from './ThemeContext';
import { api, fetchReadingById } from '../utils/api';
import { toast } from 'sonner';

interface SpeakingPageProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport' | 'Exercise') => void;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  userId?: string;
  user?: any;
}

export function SpeakingPage({ onNavigate, onSignOut, isSidebarCollapsed = false, onToggleCollapse, userId = 'demo-user-id', user }: SpeakingPageProps) {
  const { themeColors } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [incorrectWords, setIncorrectWords] = useState<number[]>([]);
  const [correctWords, setCorrectWords] = useState<number[]>([]);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [readingContent, setReadingContent] = useState<string>('');
  const [readingTitle, setReadingTitle] = useState<string>('');
  const [transcript, setTranscript] = useState('');

  // Real-time Ref
  const recognitionRef = useRef<any>(null);

  // Scores
  const [finalScore, setFinalScore] = useState<{ accuracy: number, details: any[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const loadReading = async () => {
      const id = localStorage.getItem('currentReadingId');
      if (!id) {
        setReadingContent("Không tìm thấy bài đọc. Vui lòng chọn bài đọc từ danh sách.");
        return;
      }
      try {
        const data = await fetchReadingById(id);
        const cleanContent = data.content.replace(/\s+/g, ' ').trim();
        setReadingContent(cleanContent);
        setReadingTitle(data.title);
      } catch (error) {
        console.error("Failed to load reading", error);
        setReadingContent("Lỗi khi tải bài đọc.");
      }
    };
    loadReading();
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error("Trình duyệt không hỗ trợ nhận diện giọng nói realtime.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'vi-VN';

    recognition.onresult = (event: any) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      setTranscript(fullTranscript);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.warn("Speech recognition error:", event.error);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  // Split content into clean words
  const words = useMemo(() => {
    return readingContent.split(/\s+/).filter(w => w.trim().length > 0);
  }, [readingContent]);

  // Real-time Matching Logic (The "Green/Red" Logic)
  useEffect(() => {
    if (!transcript || !isRecording) return;

    // Normalize text for comparison
    const normalize = (s: string) => s.toLowerCase().replace(/[.,!?;:()"]/g, '').trim();

    // Convert transcript to array of words
    const spokenList = transcript.split(/\s+/).map(normalize).filter(Boolean);

    // Current analysis state
    const newCorrect: number[] = [];
    const newIncorrect: number[] = [];
    let processingIndex = 0; // Where we are in the reference text (words)

    // Greedy matching algorithm
    for (const spokenWord of spokenList) {
      // Look ahead up to 3 words to handle skips
      let foundMatch = false;
      for (let offset = 0; offset <= 3; offset++) {
        const targetIndex = processingIndex + offset;
        if (targetIndex >= words.length) break;

        const targetWord = normalize(words[targetIndex]);

        // Fuzzy match could go here, but strict for now or simple includes
        if (targetWord === spokenWord || (targetWord.length > 3 && (targetWord.includes(spokenWord) || spokenWord.includes(targetWord)))) {
          // Found a match at targetIndex
          newCorrect.push(targetIndex);

          // All words strictly *before* this targetIndex (and after previous match) are wrong
          for (let skipped = processingIndex; skipped < targetIndex; skipped++) {
            newIncorrect.push(skipped);
          }

          processingIndex = targetIndex + 1;
          foundMatch = true;
          break;
        }
      }
      // If no match found, this spoken word is extra/wrong, we just ignore it in the UI mapping usually 
      // OR we could mark the *next* word as tentatively wrong? 
      // For this simple logic: we only advance on matches.
    }

    setCorrectWords(newCorrect);
    setIncorrectWords(newIncorrect);
    setCurrentWordIndex(processingIndex); // Auto-scroll cursor

  }, [transcript, isRecording, words]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRecording]);

  const handleToggleRecording = () => {
    if (isRecording) {
      // STOP RECORDING
      setIsRecording(false);
      if (recognitionRef.current) recognitionRef.current.stop();

      // Calculate Score Locally based on "Words Read" (Attempted)
      // We assume the user reads sequentially. The "read" portion is up to the furthest word they engaged with.
      const maxIndex = Math.max(-1, ...correctWords, ...incorrectWords);
      const wordsAttempted = words.slice(0, maxIndex + 1).filter(w => w.trim().length > 0 && !/^[.,!?;:()"]+$/.test(w)).length;

      const uniqueCorrect = new Set(correctWords).size;

      const accuracy = wordsAttempted > 0
        ? Math.min(100, (uniqueCorrect / wordsAttempted) * 100)
        : 0;

      setFinalScore({
        accuracy: accuracy,
        details: []
      });

      toast.success(`Đánh giá hoàn tất!`);

    } else {
      // START RECORDING
      setSeconds(0);
      setTranscript('');
      setCorrectWords([]);
      setIncorrectWords([]);
      setFinalScore(null);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch {
          toast.error("Không thể bắt đầu ghi âm.");
        }
      }
    }
  };

  const handleReset = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    }
    setTranscript('');
    setSeconds(0);
    setCorrectWords([]);
    setIncorrectWords([]);
    setFinalScore(null);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: themeColors.appBackground }}>
      <Sidebar
        activePage="Nói"
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={onToggleCollapse}
        onSignOut={onSignOut}
        user={user}
      />

      <main className="flex-1 overflow-hidden flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center px-12 pt-8 pb-4 overflow-hidden">
          <div
            className="w-full max-w-4xl h-full max-h-[calc(100vh-180px)] rounded-[2rem] border-2 shadow-lg p-12 overflow-y-auto relative flex flex-col"
            style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.border }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: themeColors.textMain, fontFamily: 'var(--display-font-family)' }}>
                  {readingTitle}
                </h1>
                <p className="text-sm opacity-70" style={{ color: themeColors.textSecondary }}>
                  Đọc to đoạn văn bản bên dưới.
                </p>
              </div>
              <div className="text-xl font-mono font-medium" style={{ color: themeColors.textSecondary }}>
                {formatTime(seconds)}
              </div>
            </div>

            {/* Content with Highlighting */}
            <div
              className="flex-1 overflow-y-auto text-lg leading-loose space-x-1"
              style={{
                fontFamily: 'var(--display-font-family)',
                fontSize: 'var(--display-font-size)',
                lineHeight: 'var(--display-line-spacing)',
                color: themeColors.textMain
              }}
            >
              {words.map((word, idx) => {
                let bgColor = 'transparent';
                if (correctWords.includes(idx)) bgColor = '#C9F6C9'; // Green/Success
                else if (incorrectWords.includes(idx)) bgColor = '#FAD4D4'; // Red/Error
                else if (idx === currentWordIndex) bgColor = '#E0F2FE'; // Blue/Active

                return (
                  <span
                    key={idx}
                    className="inline-block px-1 rounded transition-colors duration-200"
                    style={{ backgroundColor: bgColor }}
                  >
                    {word}
                  </span>
                )
              })}
            </div>

            {/* Score / Status Footer */}
            <div className="mt-6 pt-6 border-t shrink-0 h-32 flex flex-col justify-center" style={{ borderColor: themeColors.border }}>
              {isAnalyzing ? (
                <div className="flex items-center gap-3 text-blue-600 animate-pulse">
                  <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Đang phân tích...</span>
                </div>
              ) : finalScore ? (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-bold text-green-600">{finalScore.accuracy.toFixed(0)}</span>
                    <span className="text-lg font-medium text-gray-500">/ 100 điểm</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 italic text-center">
                  {isRecording ? "Đang lắng nghe..." : "Nhấn micro để bắt đầu"}
                </p>
              )}
            </div>

          </div>
        </div>

        <div className="pb-6 flex-shrink-0">
          <SpeakingToolbar
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
            onReset={handleReset}
          />
        </div>
      </main>

      <QuickSettingsDrawer
        isCollapsed={!isQuickSettingsOpen}
        onToggle={() => setIsQuickSettingsOpen(!isQuickSettingsOpen)}
      />
    </div>
  );
}