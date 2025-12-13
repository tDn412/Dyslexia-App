import { useTheme } from './ThemeContext';

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

    return (
        <div className="flex flex-wrap gap-3">
            {topics.map((topic) => (
                <button
                    key={topic.name}
                    onClick={() => onTopicSelect(selectedTopic === topic.name ? null : topic.name)}
                    className="px-5 py-3 rounded-2xl border-2 transition-all whitespace-nowrap hover:scale-105"
                    style={{
                        backgroundColor: selectedTopic === topic.name ? themeColors.accentMain : themeColors.cardBackground,
                        borderColor: selectedTopic === topic.name ? themeColors.accentHover : themeColors.border,
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '20px',
                        letterSpacing: '0.1em',
                        color: themeColors.textMain,
                    }}
                >
                    {topic.icon} {topic.name}
                </button>
            ))}
        </div>
    );
}
