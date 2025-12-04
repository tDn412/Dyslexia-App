// --- LOAD READING TEXT FROM SUPABASE FOR SPEAKING PAGE ---
import { Sidebar } from './Sidebar';
import { SpeakingToolbar } from './SpeakingToolbar';
import { QuickSettingsDrawer } from './QuickSettingsDrawer';
import { useState, useEffect, useRef } from 'react';
import { AudioRecorder } from '../utils/recording';
import { toast } from 'sonner';
import { speakText, stopSpeaking, pauseSpeaking, resumeSpeaking, isPaused as checkIsPaused } from '../utils/textToSpeech';
import { api } from '../utils/api';
import { supabase } from '../lib/supabaseClient';

interface SpeakingPageProps {
  textid: string; // <-- nhận id trực tiếp
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport') => void;
  onSignOut?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SpeakingPage({ textid, onNavigate, onSignOut, isSidebarCollapsed = false, onToggleCollapse }: SpeakingPageProps) {
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

  // --- NEW: STATE TO STORE READING TEXT FROM SUPABASE ---
  const [speakingText, setSpeakingText] = useState<string>("");

  // --- NEW: LOAD TEXT FROM SUPABASE /api/text/get ---
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
        setSpeakingText(data.content);
      }
    }

    fetchText();
  }, [textid]);

  // --- SPLIT INTO WORDS AFTER LOADING ---
  const words = speakingText ? speakingText.split(/(\s+)/) : [];

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
    }

    return () => {
      recorderRef.current?.stop().catch(() => { });
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();                   // <<< KHÔNG return gì
      playbackAbortRef.current = true;  // <<< cleanup OK
    };
  }, []);


  // Format time
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // --- MAIN RECORDING HANDLER (UNCHANGED) ---
  const handleToggleRecording = async () => {
    if (!recorderRef.current) {
      toast.error("Microphone không được hỗ trợ.");
      return;
    }

    try {
      if (isRecording) {
        const audioBlob = await recorderRef.current.stop();
        setIsRecording(false);
        toast.success("Đã dừng ghi âm. Đang phân tích...");

        const response = await api.pronunciation.check(speakingText, audioBlob);

        if (response.data?.word_scores) {
          const scores = response.data.word_scores;

          const lowScoreIndices: number[] = [];
          const correctIndices: number[] = [];

          let scoreIndex = 0;
          words.forEach((word, index) => {
            if (word.trim() === '') return;
            if (scoreIndex < scores.length) {
              if (scores[scoreIndex].pronunciation_score < 80)
                lowScoreIndices.push(index);
              else correctIndices.push(index);
              scoreIndex++;
            }
          });

          setIncorrectWords(lowScoreIndices);
          setCorrectWords(correctIndices);
        }

      } else {
        await recorderRef.current.start();
        setIsRecording(true);
        setIncorrectWords([]);
        setCorrectWords([]);
        setCurrentWordIndex(0);
        setSeconds(0);
        toast.success("Bắt đầu ghi âm...");
      }
    } catch (e) {
      console.error(e);
      toast.error("Không thể ghi âm.");
      setIsRecording(false);
    }
  };

  const handleReset = async () => {
    stopSpeaking();
    playbackAbortRef.current = true;

    if (isRecording) {
      await recorderRef.current?.stop();
    }

    setIsRecording(false);
    setIsPlaying(false);
    setIsPaused(false);
    setSeconds(0);
    setCurrentWordIndex(0);
    setIncorrectWords([]);
    setCorrectWords([]);
  };

  // Background color
  const getWordBackground = (index: number) => {
    if (correctWords.includes(index)) return "#D4E7F5";
    if (incorrectWords.includes(index)) return "#FAD4D4";
    return "transparent";
  };

  const handleQuickSettingsToggle = () => {
    if (!isQuickSettingsOpen && !isSidebarCollapsed) {
      onToggleCollapse?.();
    }
    setIsQuickSettingsOpen(!isQuickSettingsOpen);
  };

  return (
    <div className="flex h-screen bg-[#FFF8E7]">
      <Sidebar
        activePage="Nói"
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={onToggleCollapse}
        onSignOut={onSignOut}
      />

      <main className="flex-1 overflow-hidden flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center px-12 pt-8 pb-4 overflow-hidden">
          <div className="w-full max-w-4xl h-full max-h-[calc(100vh-180px)] 
              bg-[#FFF8E7] rounded-[2rem] border-2 border-[#E8DCC8] shadow-lg 
              p-12 overflow-y-auto relative">

            <div className="absolute top-6 right-8 text-[#555] text-[20px]">
              {formatTime(seconds)}
            </div>

            <div
              className="text-[#111] mx-auto"
              style={{
                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                fontSize: '26px',
                lineHeight: '1.8',
                letterSpacing: '0.14em',
                maxWidth: '66ch',
                wordSpacing: '0.16em',
              }}
            >
              {words.map((word, index) =>
                word.trim() === '' ? (
                  word
                ) : (
                  <span
                    key={index}
                    className="rounded-md px-1 transition-colors"
                    style={{ backgroundColor: getWordBackground(index) }}
                  >
                    {word}
                  </span>
                )
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
        onToggle={handleQuickSettingsToggle}
      />
    </div>
  );
}
