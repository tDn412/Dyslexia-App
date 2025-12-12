import { Sidebar } from './Sidebar';
import { SpeakingToolbar } from './SpeakingToolbar';
import { QuickSettingsDrawer } from './QuickSettingsDrawer';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';
import { analyzeSpeaking, fetchReadingById } from '../utils/api';
import { toast } from 'sonner';

interface SpeakingPageProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport' | 'Exercise') => void;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  userId?: string;
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

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'vi-VN';

      recognitionRef.current.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }

        setTranscript(fullTranscript);
        syncHighlighting(fullTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'no-speech') {
          return; // Ignore no-speech errors
        }
        setIsRecording(false);
        toast.error("Lỗi nhận diện giọng nói: " + event.error);
      };
      // ...
      // Helper to clean text for matching
      const cleanText = (text: string) => text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);

      const syncHighlighting = (currentTranscript: string) => {
        const transcriptWords = cleanText(currentTranscript);
        const contentWords = cleanText(readingContent);

        // Find the last matching word index
        let matchIndex = -1;
        for (let i = 0; i < transcriptWords.length; i++) {
          if (i < contentWords.length && transcriptWords[i] === contentWords[i]) {
            matchIndex = i;
          }
        }

        // Map back to the display 'words' array (which includes spaces/punctuation)
        if (matchIndex >= 0) {
          let realWordCount = 0;
          for (let i = 0; i < words.length; i++) {
            if (words[i].trim().length > 0 && !/^[.,\/#!$%\^&\*;:{}=\-_`~()]+$/.test(words[i])) {
              if (realWordCount === matchIndex) {
                setCurrentWordIndex(i);
                break;
              }
              realWordCount++;
            }
          }
        }
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          // Restart if it stopped unexpectedly while recording
          try {
            recognitionRef.current.start();
          } catch (e) {
            setIsRecording(false);
          }
        }
      };
    } else {
      toast.error("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
    }
  }, [isRecording]);

  // Split text into words, preserving punctuation
  const words = readingContent.split(/(\s+)/);

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
        recognitionRef.current.stop();
      }
      setIsRecording(false);

      // Analyze
      try {
        // userId is now from props
        const textId = localStorage.getItem('currentReadingId') || 'unknown';
        const result = await analyzeSpeaking(userId, textId, readingContent, transcript);

        // Assuming result.wordScores is an array of indices of incorrect words or similar
        // For now, let's just simulate some feedback based on the result
        toast.success(`Độ chính xác: ${result.accuracy.toFixed(1)}%`);

        // This is a simplification. Real alignment is complex.
        // We'll just mark random words as incorrect for demo if accuracy is low
        if (result.accuracy < 80) {
          setIncorrectWords([2, 5, 8]); // Mock
        } else {
          setIncorrectWords([]);
        }

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
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.error("Failed to start recording", e);
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
                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                fontSize: '20px',
                letterSpacing: '0.02em',
              }}
            >
              {formatTime(seconds)}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-4" style={{ color: themeColors.textMain }}>{readingTitle}</h1>

            {/* Text with word highlighting */}
            <div
              className="text-[#111111] mx-auto"
              style={{
                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                fontSize: '26px',
                lineHeight: '1.8',
                letterSpacing: '0.14em',
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