import { useTheme } from './ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Topic {
    icon: string;
    name: string;
}

interface ScrollableTopicsProps {
    topics: Topic[];
    selectedTopic: string | null;
    onTopicSelect: (topic: string | null) => void;
}

export function ScrollableTopics({ topics, selectedTopic, onTopicSelect }: ScrollableTopicsProps) {
    const { themeColors } = useTheme();
    const [currentPage, setCurrentPage] = useState(0);

    // Show 3 topics per page for optimal dyslexia processing
    const topicsPerPage = 3;
    const totalPages = Math.ceil(topics.length / topicsPerPage);

    const visibleTopics = topics.slice(
        currentPage * topicsPerPage,
        (currentPage + 1) * topicsPerPage
    );

    const handlePrev = () => {
        setCurrentPage((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
    };

    return (
        <div>
            <div className="flex items-center gap-6">
                {/* Previous Button - Large for accessibility */}
                <button
                    onClick={handlePrev}
                    disabled={currentPage === 0}
                    className="flex-shrink-0 rounded-2xl flex items-center justify-center transition-all border-2 shadow-lg"
                    style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: currentPage === 0 ? themeColors.cardBackground : themeColors.accentMain,
                        borderColor: themeColors.accentHover,
                        opacity: currentPage === 0 ? 0.4 : 1,
                        cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                    }}
                    aria-label="Previous topics"
                >
                    <ChevronLeft className="w-8 h-8" style={{ color: themeColors.textMain }} />
                </button>

                {/* Topics Container - 3 topics with large spacing */}
                <div className="flex-1 flex gap-6 justify-center items-center" style={{ minHeight: '80px' }}>
                    {visibleTopics.map((topic) => (
                        <button
                            key={topic.name}
                            onClick={() => onTopicSelect(selectedTopic === topic.name ? null : topic.name)}
                            className="px-6 py-4 rounded-2xl border-2 transition-all whitespace-nowrap hover:scale-105 shadow-md"
                            style={{
                                backgroundColor: selectedTopic === topic.name ? themeColors.accentMain : themeColors.cardBackground,
                                borderColor: selectedTopic === topic.name ? themeColors.accentHover : themeColors.border,
                                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                                fontSize: '22px',
                                fontWeight: '600',
                                letterSpacing: '0.12em',
                                color: themeColors.textMain,
                                minWidth: '160px',
                            }}
                        >
                            <span style={{ fontSize: '28px', marginRight: '8px' }}>{topic.icon}</span>
                            {topic.name}
                        </button>
                    ))}
                </div>

                {/* Next Button - Large for accessibility */}
                <button
                    onClick={handleNext}
                    disabled={currentPage >= totalPages - 1}
                    className="flex-shrink-0 rounded-2xl flex items-center justify-center transition-all border-2 shadow-lg"
                    style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: currentPage >= totalPages - 1 ? themeColors.cardBackground : themeColors.accentMain,
                        borderColor: themeColors.accentHover,
                        opacity: currentPage >= totalPages - 1 ? 0.4 : 1,
                        cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                    }}
                    aria-label="Next topics"
                >
                    <ChevronRight className="w-8 h-8" style={{ color: themeColors.textMain }} />
                </button>
            </div>

            {/* Page Indicators - Dots showing current page */}
            <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentPage(index)}
                        className="transition-all rounded-full"
                        style={{
                            width: currentPage === index ? '12px' : '8px',
                            height: currentPage === index ? '12px' : '8px',
                            backgroundColor: currentPage === index ? themeColors.accentMain : themeColors.border,
                            border: 'none',
                            cursor: 'pointer',
                        }}
                        aria-label={`Go to page ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
