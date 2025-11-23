import { Sidebar } from './Sidebar';
import { SpeakingToolbar } from './SpeakingToolbar';
import { QuickSettingsDrawer } from './QuickSettingsDrawer';
import { useState, useEffect, useRef } from 'react';
import { AudioRecorder } from '../utils/recording';
import { toast } from 'sonner';
import { speakText, stopSpeaking, pauseSpeaking, resumeSpeaking, isPaused as checkIsPaused } from '../utils/textToSpeech';
import { api } from '../utils/api';

interface SpeakingPageProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport') => void;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SpeakingPage({ onNavigate, onSignOut, isSidebarCollapsed = false, onToggleCollapse }: SpeakingPageProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [incorrectWords, setIncorrectWords] = useState<number[]>([]);
  const [correctWords, setCorrectWords] = useState<number[]>([]);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const playbackAbortRef = useRef<boolean>(false);

  // Sample text split into words
  const sampleText = `Con bướm đáp nhẹ nhàng trên bông hoa đầy màu sắc. Đôi cánh của nó có màu cam và đen tươi sáng, với những hoa văn đẹp trông giống như những ô cửa sổ nhỏ. Con bướm nghỉ ở đó một lúc, tận hưởng ánh nắng ấm áp. Đột nhiên, một cơn gió nhẹ thổi qua khu vườn. Con bướm mở và khép đôi cánh từ từ, như thể nó đang chào gió. Sau đó nó bay lên bầu trời, nhảy múa giữa những đám mây. Lũ trẻ quan sát từ bên dưới, chỉ tay và mỉm cười. Chúng thích nhìn con bướm nhảy múa trên không. Đó là một ngày hè hoàn hảo.`;

  // Split text into words, preserving punctuation
  const words = sampleText.split(/(\s+)/);

  // Initialize recorder
  useEffect(() => {
    if (AudioRecorder.isSupported()) {
      recorderRef.current = new AudioRecorder({
        onError: (error) => {
          console.error('Recording error:', error);
          toast.error('Lỗi khi ghi âm. Vui lòng thử lại.');
          setIsRecording(false);
        },
      });
    } else {
      console.warn('MediaRecorder is not supported');
    }

    return () => {
      if (recorderRef.current) {
        recorderRef.current.stop().catch(() => { });
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Cleanup on unmount or navigation
  useEffect(() => {
    return () => {
      stopSpeaking();
      playbackAbortRef.current = true;
    };
  }, []);

  // Format time as MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleToggleRecording = async () => {
    if (!recorderRef.current) {
      toast.error('Microphone không được hỗ trợ. Vui lòng sử dụng trình duyệt khác.');
      return;
    }

    try {
      if (isRecording) {
        // Stop recording
        const audioBlob = await recorderRef.current.stop();
        setIsRecording(false);
        toast.success('Đã dừng ghi âm. Đang phân tích...');

        // Send to backend for analysis
        try {
          const response = await api.pronunciation.check(sampleText, audioBlob);

          if (response.data && response.data.word_scores) {
            console.log('✅ Pronunciation API Response:', response.data);
            toast.success('Phân tích hoàn tất!');

            // Map response to incorrect words
            const scores = response.data.word_scores;
            console.log('📊 Word Scores:', scores);

            const lowScoreIndices: number[] = [];
            const correctIndices: number[] = [];

            // Simple mapping strategy: iterate through our `words` array (which includes spaces)
            // and match with `scores` array (which likely doesn't).
            let scoreIndex = 0;
            words.forEach((word, index) => {
              if (word.trim() === '') return;

              if (scoreIndex < scores.length) {
                const scoreData = scores[scoreIndex];
                console.log(`Word "${word}" (index ${index}): score = ${scoreData.pronunciation_score}`);

                // Threshold for "incorrect" (e.g., < 80)
                if (scoreData.pronunciation_score < 80) {
                  lowScoreIndices.push(index);
                } else {
                  correctIndices.push(index);
                }
                scoreIndex++;
              }
            });

            console.log('❌ Incorrect word indices:', lowScoreIndices);
            console.log('✅ Correct word indices:', correctIndices);

            setIncorrectWords(lowScoreIndices);
            setCorrectWords(correctIndices);

            if (lowScoreIndices.length === 0) {
              toast.success('Phát âm tuyệt vời!');
            } else {
              toast.info(`Bạn cần cải thiện ${lowScoreIndices.length} từ.`);
            }
          } else {
            // Backend failed or word_scores missing - use simulation for demo
            console.warn('⚠️ Backend failed or word scores missing, using simulation');
            toast.warning('Backend không khả dụng hoặc dữ liệu không đầy đủ. Đang hiển thị kết quả mô phỏng.');

            // Simulate: randomly mark some words as correct (blue) and some as incorrect (red)
            const lowScoreIndices: number[] = [];
            const correctIndices: number[] = [];

            let wordCount = 0;
            words.forEach((word, index) => {
              if (word.trim() === '') return;

              // Simulate: every 3rd word is "incorrect", others are "correct"
              if (wordCount % 3 === 0) {
                lowScoreIndices.push(index);
              } else {
                correctIndices.push(index);
              }
              wordCount++;
            });

            console.log('🎭 Simulated incorrect indices:', lowScoreIndices);
            console.log('🎭 Simulated correct indices:', correctIndices);

            setIncorrectWords(lowScoreIndices);
            setCorrectWords(correctIndices);
            toast.info(`(Mô phỏng) Bạn cần cải thiện ${lowScoreIndices.length} từ.`);
          }
        } catch (apiError) {
          console.error('API Analysis Error:', apiError);
          toast.error('Không thể phân tích phát âm. Vui lòng thử lại.');
        }

      } else {
        // Start recording
        await recorderRef.current.start();
        setIsRecording(true);
        setSeconds(0);
        setIncorrectWords([]);
        setCorrectWords([]);
        setCurrentWordIndex(0);
        toast.success('Bắt đầu ghi âm...');
      }
    } catch (error) {
      console.error('Recording error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Permission')) {
          toast.error('Vui lòng cho phép truy cập microphone.');
        } else {
          toast.error('Không thể bắt đầu ghi âm. Vui lòng thử lại.');
        }
      }
      setIsRecording(false);
    }
  };

  const handleReset = async () => {
    // Stop any ongoing playback
    stopSpeaking();
    playbackAbortRef.current = true;

    // Stop recording if active
    if (isRecording && recorderRef.current) {
      try {
        await recorderRef.current.stop();
      } catch (error) {
        console.error('Error stopping recorder:', error);
      }
    }

    setIsRecording(false);
    setIsPlaying(false);
    setIsPaused(false);
    setSeconds(0);
    setCurrentWordIndex(0);
    setIncorrectWords([]);
    setCorrectWords([]);
  };

  // Get background color for a word
  const getWordBackground = (index: number) => {
    // Blue for correct pronunciation
    if (correctWords.includes(index)) {
      return '#D4E7F5'; // Soft blue for correct words
    }
    // Red for incorrect pronunciation
    if (incorrectWords.includes(index)) {
      return '#FAD4D4'; // Soft red for incorrect words
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
    <div className="flex h-screen bg-[#FFF8E7]">
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
          <div className="w-full max-w-4xl h-full max-h-[calc(100vh-180px)] bg-[#FFF8E7] rounded-[2rem] border-2 border-[#E8DCC8] shadow-lg p-12 overflow-y-auto relative">
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