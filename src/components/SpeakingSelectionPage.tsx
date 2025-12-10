import { Sidebar } from "./Sidebar";
import { ReadingCard } from "./ReadingCard";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";

type PageType =
  | "Home"
  | "Reading"
  | "ReadingSelection"
  | "Speaking"
  | "SpeakingSelection"
  | "Library"
  | "SettingsOverview"
  | "DisplaySettings"
  | "AudioSettings"
  | "OCRImport";

interface SpeakingSelectionPageProps {
  onNavigate: React.Dispatch<React.SetStateAction<PageType>>;
  onSelectSpeaking: (id: string) => void;
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
  onSignOut: () => void;
}

export function SpeakingSelectionPage({
  onNavigate,
  onSignOut,
  isSidebarCollapsed = false,
  onToggleCollapse,
  onSelectSpeaking,
}: SpeakingSelectionPageProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicScrollIndex, setTopicScrollIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [speakings, setSpeakings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false); const [isLoadingNLP, setIsLoadingNLP] = useState(false);
  const [processedSentences, setProcessedSentences] = useState<string[]>([]);
  const [processedWords, setProcessedWords] = useState<string[][]>([]);


  // Level Filter Options
  const levels = ["All", "A1", "A2", "B1", "B2"];

  // Topic List
  const topics = [
    { icon: "🐶", name: "Động vật" },
    { icon: "🌳", name: "Thiên nhiên" },
    { icon: "🍎", name: "Thức ăn" },
    { icon: "👪", name: "Gia đình" },
    { icon: "📚", name: "Truyện" },
    { icon: "🎨", name: "Học tập" },
    { icon: "🏖️", name: "Phiêu lưu" },
    { icon: "⚽", name: "Thể thao" },
  ];

  // Horizontal scroll config
  const topicsPerView = 4;
  const maxScrollIndex =
    Math.max(0, Math.ceil(topics.length / topicsPerView) - 1);

  const visibleTopics = topics.slice(
    topicScrollIndex * topicsPerView,
    (topicScrollIndex + 1) * topicsPerView
  );


  // Load speaking texts from Supabase
  useEffect(() => {
    async function fetchSpeakings() {
      let query = supabase.from("Text").select("*");

      // Level filter
      if (selectedLevel !== "All") {
        query = query.eq("level", selectedLevel);
      }

      // Topic filter
      if (selectedTopic) {
        query = query.eq("topic", selectedTopic);
      }

      const { data, error } = await query;

      if (error) console.error("Error fetching readings:", error);
      else setSpeakings(data);
    }

    fetchSpeakings();
  }, [selectedLevel, selectedTopic]);

  // Filter speakings based on search query (title only)
  const filteredSpeakings = useMemo(() => {
    if (!searchQuery.trim()) return speakings;

    const query = searchQuery.toLowerCase();
    return speakings.filter(speaking =>
      speaking.title?.toLowerCase().includes(query)
    );
  }, [speakings, searchQuery]);

  function handleOpenSpeaking(speaking: any) {
    console.log("OPEN READING:", speaking);            // 👈 xem toàn bộ object
    console.log("TEXT ID:", speaking.textid);          // 👈 xem textid
    onSelectSpeaking(speaking.textid);
  }

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
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-12">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search
                className="absolute left-6 top-1/2 transform -translate-y-1/2 w-7 h-7 text-[#666666]"
              />
              <input
                type="text"
                placeholder="Tìm kiếm bài nói..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FFFCF2] border-2 border-[#E0DCCC] rounded-3xl pl-16 pr-6 py-5 text-[#111] placeholder:text-[#999] focus:outline-none focus:border-[#D4C5A9] shadow-md"
                style={{
                  fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                  fontSize: "24px",
                  letterSpacing: "0.12em",
                }}
              />
            </div>
          </div>

          {/* Level Filter */}
          <div className="mb-8">
            <div className="flex gap-4 flex-wrap">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-8 py-3 rounded-2xl border-2 transition-all shadow-sm ${selectedLevel === level
                    ? "bg-[#D4E7F5] border-[#B8D4E8]"
                    : "bg-[#FFFCF2] border-[#E0DCCC] hover:bg-[#FFF4E0]"
                    }`}
                  style={{
                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                    fontSize: "24px",
                    letterSpacing: "0.12em",
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Filter */}
          <div className="mb-12">
            <div
              className="text-[#111] mb-4"
              style={{
                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                fontSize: "26px",
                letterSpacing: "0.12em",
              }}
            >
              Chủ đề:
            </div>

            <div className="flex items-center gap-4">
              {topicScrollIndex > 0 && (
                <button
                  onClick={() => setTopicScrollIndex(topicScrollIndex - 1)}
                  className="w-12 h-12 rounded-full bg-[#D4E7F5] border-2 border-[#B8D4E8] flex items-center justify-center shadow-md"
                >
                  <ChevronLeft className="w-6 h-6 text-[#111]" />
                </button>
              )}

              <div className="flex-1 overflow-hidden">
                <div className="flex gap-4 transition-all">
                  {visibleTopics.map((topic) => (
                    <button
                      key={topic.name}
                      onClick={() =>
                        setSelectedTopic(
                          selectedTopic === topic.name ? null : topic.name
                        )
                      }
                      className={`flex-shrink-0 px-6 py-3 rounded-2xl border-2 transition-all shadow-sm ${selectedTopic === topic.name
                        ? "bg-[#FFE8CC] border-[#E8DCC8]"
                        : "bg-[#FFFCF2] border-[#E0DCCC] hover:bg-[#FFF4E0]"
                        }`}
                      style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: "24px",
                        letterSpacing: "0.12em",
                      }}
                    >
                      <span className="mr-2">{topic.icon}</span>
                      {topic.name}
                    </button>
                  ))}
                </div>
              </div>

              {topicScrollIndex < maxScrollIndex && (
                <button
                  onClick={() => setTopicScrollIndex(topicScrollIndex + 1)}
                  className="w-12 h-12 rounded-full bg-[#D4E7F5] border-2 border-[#B8D4E8] flex items-center justify-center shadow-md"
                >
                  <ChevronRight className="w-6 h-6 text-[#111]" />
                </button>
              )}
            </div>
          </div>

          {/* Speaking Cards Grid - 2 columns */}
          <div className="grid grid-cols-2 gap-8">
            {filteredSpeakings.map((speaking) => (
              <ReadingCard
                key={speaking.textid}
                title={speaking.title}
                topic={speaking.topic}
                level={`Cấp ${speaking.level}`}
                onClick={() => handleOpenSpeaking(speaking)}   // 🔥 Dùng hàm đúng!
              />
            ))}
          </div>

          {filteredSpeakings.length === 0 && !isLoading && (
            <div
              className="text-center text-[#666] py-12"
              style={{
                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                fontSize: "24px",
                letterSpacing: "0.12em",
              }}
            >
              Không tìm thấy bài nói. Hãy thử chỉnh bộ lọc.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
