import { Sidebar } from './Sidebar';
import { SpeakingToolbar } from './SpeakingToolbar';
import { QuickSettingsDrawer } from './QuickSettingsDrawer';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from './ThemeContext';
import { analyzeSpeaking, fetchReadingById } from '../utils/api';
import { toast } from 'sonner';

interface SpeakingPageProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport' | 'Exercise') => void;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  userId?: string;
  textid?: string;
}

export function SpeakingPage({ onNavigate, onSignOut, isSidebarCollapsed = false, onToggleCollapse, userId = 'demo-user-id' }: SpeakingPageProps) {
  const { themeColors } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [incorrectWords, setIncorrectWords] = useState<number[]>([]);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [readingContent, setReadingContent] = useState<string>('');
  const [readingTitle, setReadingTitle] = useState<string>('');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const loadReading = async () => {
      const id = localStorage.getItem('currentReadingId');
      if (!id) {
        setReadingContent("Không tìm thấy bài đọc. Vui lòng chọn bài đọc từ danh sách.");
        return;
      }
      try {
        const data = await fetchReadingById(id);
        setReadingContent(data.content);
        setReadingTitle(data.title);
      } catch (error) {
        console.error("Failed to load reading", error);
        setReadingContent("Lỗi khi tải bài đọc.");
      }
    };
    loadReading();
  }, []);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error("Trình duyệt không hỗ trợ nhận diện giọng nói.");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

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
        console.error(event.error);
        toast.error("Lỗi nhận diện giọng nói: " + event.error);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);


  // Split text into words, preserving punctuation
  const words = useMemo(
    () => readingContent.split(/(\s+)/),
    [readingContent]
  );

  useEffect(() => {
    if (!transcript) return;

    const spokenWords = transcript.trim().split(/\s+/).length;
    setCurrentWordIndex(Math.min(spokenWords * 2, words.length - 1));
  }, [transcript, words]);



  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Format time as MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      setIsRecording(false);


      // Analyze
      try {
        // userId is now from props
        const textId = localStorage.getItem('currentReadingId') || 'unknown';
        const result = await analyzeSpeaking(userId, textId, readingContent, transcript);

        const accuracy =
          typeof result?.accuracy === 'number'
            ? result.accuracy
            : 0;

        toast.success(`Độ chính xác: ${accuracy.toFixed(1)}%`);

        console.log("Analyze result:", result);

        // ===== So khớp transcript để tìm từ sai =====
        const normalize = (text: string) =>
          text
            .toLowerCase()
            .replace(/[.,!?;]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const expectedWords = normalize(readingContent).split(' ');
        const spokenWords = normalize(transcript).split(' ');

        // map word index (bỏ qua space/punctuation)
        const wordIndexes: number[] = [];
        words.forEach((w, i) => {
          if (w.trim() && !/^[.,!?]+$/.test(w)) {
            wordIndexes.push(i);
          }
        });

        const wrongWordIndexes: number[] = [];

        expectedWords.forEach((word, i) => {
          if (spokenWords[i] !== word && wordIndexes[i] !== undefined) {
            wrongWordIndexes.push(wordIndexes[i]);
          }
        });

        setIncorrectWords(wrongWordIndexes);

      } catch (error) {
        console.error("Analysis failed", error);
        toast.error("Lỗi khi phân tích giọng nói.");
      }

    } else {
      // Start recording
      setTranscript('');
      setIncorrectWords([]);
      if (recognitionRef.current) {
        try {
          recognitionRef.current?.start();
          setIsRecording(true);
        } catch {
          toast.error("Không thể bắt đầu ghi âm.");
        }

      }
    }
  };

  const handleReset = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setSeconds(0);
    setCurrentWordIndex(-1);
    setIncorrectWords([]);
    setTranscript('');
  };

  // Get background color for a word
  const getWordBackground = (index: number) => {
    if (index === currentWordIndex) {
      return '#C9F6C9'; // Soft green for current word
    }
    if (incorrectWords.includes(index)) {
      return '#FAD4D4'; // Soft pink for incorrect words
    }
    return 'transparent';
  };

  const handleQuickSettingsToggle = () => {
    if (!isQuickSettingsOpen && !isSidebarCollapsed) {
      // Opening quick settings - collapse left sidebar
      onToggleCollapse?.();
    }
    setIsQuickSettingsOpen(!isQuickSettingsOpen);
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
      <main className="flex-1 overflow-hidden flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center px-12 pt-8 pb-4 overflow-hidden">
          {/* Speaking Content Frame */}
          <div
            className="w-full max-w-4xl h-full max-h-[calc(100vh-180px)] rounded-[2rem] border-2 shadow-lg p-12 overflow-y-auto relative"
            style={{
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.border,
            }}
          >
            {/* Timer Display */}
            <div
              className="absolute top-6 right-8 text-[#555555]"
              style={{
                fontFamily: 'var(--display-font-family)',
                fontSize: 'calc(var(--display-font-size) * 0.8)',
                letterSpacing: 'var(--display-letter-spacing)',
              }}
            >
              {formatTime(seconds)}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-4" style={{
              color: themeColors.textMain,
              fontFamily: 'var(--display-font-family)',
              fontSize: 'calc(var(--display-font-size) * 1.5)',
              letterSpacing: 'var(--display-letter-spacing)',
            }}>{readingTitle}</h1>

            {/* Text with word highlighting */}
            <div
              className="text-[#111111] mx-auto"
              style={{
                fontFamily: 'var(--display-font-family)',
                fontSize: 'var(--display-font-size)',
                lineHeight: 'var(--display-line-spacing)',
                letterSpacing: 'var(--display-letter-spacing)',
                maxWidth: '66ch',
                wordSpacing: '0.16em',
              }}
            >
              {words.map((word, index) => {
                // Skip rendering whitespace as separate elements
                if (word.trim() === '') {
                  return word;
                }

                return (
                  <span
                    key={index}
                    className="rounded-md px-1 transition-colors duration-200"
                    style={{
                      backgroundColor: getWordBackground(index),
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>

            {/* Live Transcript (Optional, for debugging or user feedback) */}
            {transcript && (
              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <h3 className="text-sm font-bold mb-2">Transcript:</h3>
                <p className="text-sm text-gray-600">{transcript}</p>
              </div>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="pb-6 flex-shrink-0">
          <SpeakingToolbar
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
            onReset={handleReset}
          />
        </div>
      </main>

      {/* Quick Settings Drawer */}
      <QuickSettingsDrawer
        isCollapsed={!isQuickSettingsOpen}
        onToggle={handleQuickSettingsToggle}
      />
    </div>
  );
}