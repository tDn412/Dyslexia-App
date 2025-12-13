import { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface AddToTextModalProps {
    isOpen: boolean;
    filename: string;
    content: string;
    onCancel: () => void;
    onConfirm: (addTo: 'Đọc' | 'Nói' | 'both', level: string, topic: string) => void;
}

const TOPICS = [
    { icon: '🐶', name: 'Động vật' },
    { icon: '🌳', name: 'Thiên nhiên' },
    { icon: '🍎', name: 'Thức ăn' },
    { icon: '👪', name: 'Gia đình' },
    { icon: '📚', name: 'Truyện' },
    { icon: '🎨', name: 'Học tập' },
    { icon: '🏖️', name: 'Phiêu lưu' },
    { icon: '⚽', name: 'Thể thao' },
    { icon: '📝', name: 'Khác' },
];

const LEVELS = [
    { value: 'A1', label: 'A1 - Rất dễ', color: '#87CEEB' },
    { value: 'A2', label: 'A2 - Dễ', color: '#90EE90' },
    { value: 'B1', label: 'B1 - Trung bình', color: '#FFD700' },
    { value: 'B2', label: 'B2 - Khó', color: '#FFA07A' },
];

export function AddToTextModal({ isOpen, filename, content, onCancel, onConfirm }: AddToTextModalProps) {
    const { themeColors } = useTheme();
    const [addTo, setAddTo] = useState<'Đọc' | 'Nói' | 'both'>('both');
    const [selectedLevel, setSelectedLevel] = useState<string>('A1');
    const [selectedTopic, setSelectedTopic] = useState<string>('Động vật');
    const [isAssessing, setIsAssessing] = useState(false);
    const [aiRecommendation, setAiRecommendation] = useState<any>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setAddTo('both');
            setSelectedLevel('A1');
            setSelectedTopic('Động vật');
            setAiRecommendation(null);
        }
    }, [isOpen]);

    const handleAIAssess = async () => {
        setIsAssessing(true);

        try {
            const response = await fetch('http://localhost:4000/api/ai/assess-level', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) throw new Error('Assessment failed');

            const result = await response.json();
            setAiRecommendation(result);

            // Apply AI recommendations
            setSelectedLevel(result.level);
            if (result.recommendedTopic) {
                setSelectedTopic(result.recommendedTopic);
            }
        } catch (error) {
            console.error('AI assessment error:', error);
        } finally {
            setIsAssessing(false);
        }
    };

    const handleConfirm = () => {
        onConfirm(addTo, selectedLevel, selectedTopic);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 backdrop-blur-sm bg-opacity-60 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: `${themeColors.appBackground}99` }}
        >
            <div
                className="rounded-2xl border-2 shadow-2xl p-6 w-full"
                style={{
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.border,
                    maxWidth: '450px',
                }}
            >
                {/* Title */}
                <h3
                    className="mb-4 text-center"
                    style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '24px',
                        letterSpacing: '0.08em',
                        color: themeColors.textMain,
                    }}
                >
                    Thêm bài: {filename}
                </h3>

                {/* AI Assessment Button */}
                <button
                    onClick={handleAIAssess}
                    disabled={isAssessing}
                    className="w-full mb-4 px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2"
                    style={{
                        backgroundColor: isAssessing ? themeColors.appBackground : '#E8F5E9',
                        borderColor: '#4CAF50',
                        opacity: isAssessing ? 0.6 : 1,
                    }}
                >
                    <Sparkles className="w-5 h-5" style={{ color: '#4CAF50' }} />
                    <span style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#2E7D32',
                    }}>
                        {isAssessing ? '⏳ Đang đánh giá...' : '✨ AI đánh giá'}
                    </span>
                </button>

                {/* AI Recommendation Display */}
                {aiRecommendation && (
                    <div
                        className="mb-4 p-3 rounded-xl border-2"
                        style={{
                            backgroundColor: themeColors.appBackground,
                            borderColor: LEVELS.find(l => l.value === aiRecommendation.level)?.color || themeColors.border,
                        }}
                    >
                        <p style={{
                            fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                            fontSize: '16px',
                            color: themeColors.textMain,
                            marginBottom: '8px',
                        }}>
                            💡 <strong>Khuyến nghị:</strong> {aiRecommendation.reason}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            <span className="px-3 py-1 rounded-lg text-sm" style={{
                                backgroundColor: LEVELS.find(l => l.value === aiRecommendation.level)?.color,
                                color: '#000',
                                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                                fontWeight: 'bold',
                            }}>
                                Cấp {aiRecommendation.level}
                            </span>
                            <span className="px-3 py-1 rounded-lg text-sm" style={{
                                backgroundColor: themeColors.accentMain,
                                color: themeColors.textMain,
                                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                            }}>
                                {TOPICS.find(t => t.name === aiRecommendation.recommendedTopic)?.icon} {aiRecommendation.recommendedTopic}
                            </span>
                        </div>
                    </div>
                )}

                {/* Section 1: Add To (Thêm vào) */}
                <div className="mb-4">
                    <label style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '18px',
                        color: themeColors.textMain,
                        display: 'block',
                        marginBottom: '8px',
                    }}>
                        Thêm vào:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { value: 'Đọc', label: '📖 Đọc' },
                            { value: 'Nói', label: '🎤 Nói' },
                            { value: 'both', label: '📖🎤 Cả hai' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setAddTo(option.value as any)}
                                className="px-3 py-2 rounded-lg border-2 transition-all"
                                style={{
                                    backgroundColor: addTo === option.value ? themeColors.accentMain : themeColors.cardBackground,
                                    borderColor: addTo === option.value ? themeColors.accentHover : themeColors.border,
                                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                                    fontSize: '16px',
                                    color: themeColors.textMain,
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section 2: Level (Cấp độ) */}
                <div className="mb-4">
                    <label style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '18px',
                        color: themeColors.textMain,
                        display: 'block',
                        marginBottom: '8px',
                    }}>
                        Chọn cấp độ:
                    </label>
                    <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border-2"
                        style={{
                            backgroundColor: themeColors.cardBackground,
                            borderColor: themeColors.border,
                            color: themeColors.textMain,
                            fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                            fontSize: '16px',
                        }}
                    >
                        {LEVELS.map((level) => (
                            <option key={level.value} value={level.value}>
                                {level.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Section 3: Topic (Chủ đề) */}
                <div className="mb-6">
                    <label style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '18px',
                        color: themeColors.textMain,
                        display: 'block',
                        marginBottom: '8px',
                    }}>
                        Chọn chủ đề:
                    </label>
                    <select
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border-2"
                        style={{
                            backgroundColor: themeColors.cardBackground,
                            borderColor: themeColors.border,
                            color: themeColors.textMain,
                            fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                            fontSize: '16px',
                        }}
                    >
                        {TOPICS.map((topic) => (
                            <option key={topic.name} value={topic.name}>
                                {topic.icon} {topic.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 rounded-full border-2 flex items-center gap-2 transition-all"
                        style={{
                            backgroundColor: '#FAD4D4',
                            borderColor: '#F5BABA',
                            fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                            fontSize: '16px',
                            color: themeColors.textMain,
                        }}
                    >
                        <X className="w-5 h-5" />
                        <span>Hủy</span>
                    </button>

                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 rounded-full border-2 flex items-center gap-2 transition-all"
                        style={{
                            backgroundColor: themeColors.accentMain,
                            borderColor: themeColors.accentHover,
                            fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                            fontSize: '16px',
                            color: themeColors.textMain,
                        }}
                    >
                        <Check className="w-5 h-5" />
                        <span>Thêm bài</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
