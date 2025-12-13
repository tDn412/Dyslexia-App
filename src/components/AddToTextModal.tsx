import { useState } from 'react';
import { X, Check, BookOpen, Mic, Loader2 } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface AddToTextModalProps {
    isOpen: boolean;
    filename: string;
    content: string;
    onCancel: () => void;
    onConfirm: (topic: 'Đọc' | 'Nói' | 'both', level: string) => void;
}

export function AddToTextModal({ isOpen, filename, content, onCancel, onConfirm }: AddToTextModalProps) {
    const { themeColors } = useTheme();
    const [selectedTopic, setSelectedTopic] = useState<'Đọc' | 'Nói' | 'both'>('both');
    const [isAssessing, setIsAssessing] = useState(false);
    const [assessmentResult, setAssessmentResult] = useState<any>(null);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsAssessing(true);

        try {
            // Call Gemini AI to assess reading level
            const response = await fetch('http://localhost:4000/api/ai/assess-level', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) {
                throw new Error('Failed to assess level');
            }

            const result = await response.json();
            setAssessmentResult(result);

            // Pass to parent with assessed level
            onConfirm(selectedTopic, result.level);
        } catch (error) {
            console.error('Assessment error:', error);
            // Fallback to A1 if AI fails
            onConfirm(selectedTopic, 'A1');
        } finally {
            setIsAssessing(false);
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'A1': return '#87CEEB';
            case 'A2': return '#90EE90';
            case 'B1': return '#FFD700';
            case 'B2': return '#FFA07A';
            default: return themeColors.accentMain;
        }
    };

    const getLevelDescription = (level: string) => {
        switch (level) {
            case 'A1': return 'Rất dễ - Phù hợp trẻ mới bắt đầu';
            case 'A2': return 'Dễ - Phù hợp trẻ đang luyện tập';
            case 'B1': return 'Trung bình - Cần hướng dẫn';
            case 'B2': return 'Khó - Thách thức cao';
            default: return '';
        }
    };

    return (
        <div
            className="fixed inset-0 backdrop-blur-sm bg-opacity-60 z-50 flex items-center justify-center"
            style={{ backgroundColor: `${themeColors.appBackground}99` }}
        >
            <div
                className="rounded-3xl border-2 shadow-2xl p-8 w-[500px] max-h-[80vh] overflow-y-auto"
                style={{
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.border,
                }}
            >
                <h3
                    className="mb-6 text-center"
                    style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '28px',
                        letterSpacing: '0.12em',
                        color: themeColors.textMain,
                    }}
                >
                    Thêm bài: {filename}
                </h3>

                {/* Topic Selection */}
                <div className="mb-6">
                    <p
                        className="mb-3"
                        style={{
                            fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                            fontSize: '22px',
                            color: themeColors.textMain,
                        }}
                    >
                        Chọn chủ đề:
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                        {/* Đọc */}
                        <button
                            onClick={() => setSelectedTopic('Đọc')}
                            className="p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2"
                            style={{
                                backgroundColor: selectedTopic === 'Đọc' ? themeColors.accentMain : themeColors.cardBackground,
                                borderColor: selectedTopic === 'Đọc' ? themeColors.accentHover : themeColors.border,
                            }}
                        >
                            <BookOpen className="w-6 h-6" style={{ color: themeColors.textMain }} />
                            <span
                                style={{
                                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                                    fontSize: '20px',
                                    color: themeColors.textMain,
                                }}
                            >
                                Đọc
                            </span>
                        </button>

                        {/* Nói */}
                        <button
                            onClick={() => setSelectedTopic('Nói')}
                            className="p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2"
                            style={{
                                backgroundColor: selectedTopic === 'Nói' ? themeColors.accentMain : themeColors.cardBackground,
                                borderColor: selectedTopic === 'Nói' ? themeColors.accentHover : themeColors.border,
                            }}
                        >
                            <Mic className="w-6 h-6" style={{ color: themeColors.textMain }} />
                            <span
                                style={{
                                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                                    fontSize: '20px',
                                    color: themeColors.textMain,
                                }}
                            >
                                Nói
                            </span>
                        </button>

                        {/* Cả hai */}
                        <button
                            onClick={() => setSelectedTopic('both')}
                            className="p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2"
                            style={{
                                backgroundColor: selectedTopic === 'both' ? themeColors.accentMain : themeColors.cardBackground,
                                borderColor: selectedTopic === 'both' ? themeColors.accentHover : themeColors.border,
                            }}
                        >
                            <div className="flex gap-1">
                                <BookOpen className="w-5 h-5" style={{ color: themeColors.textMain }} />
                                <Mic className="w-5 h-5" style={{ color: themeColors.textMain }} />
                            </div>
                            <span
                                style={{
                                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                                    fontSize: '20px',
                                    color: themeColors.textMain,
                                }}
                            >
                                Cả hai
                            </span>
                        </button>
                    </div>
                </div>

                {/* Assessment Info */}
                {assessmentResult && (
                    <div
                        className="mb-6 p-4 rounded-xl border-2"
                        style={{
                            backgroundColor: themeColors.appBackground,
                            borderColor: getLevelColor(assessmentResult.level),
                        }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div
                                className="px-3 py-1 rounded-lg"
                                style={{ backgroundColor: getLevelColor(assessmentResult.level) }}
                            >
                                <span
                                    style={{
                                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: '#000',
                                    }}
                                >
                                    Cấp {assessmentResult.level}
                                </span>
                            </div>
                            <span
                                style={{
                                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                                    fontSize: '18px',
                                    color: themeColors.textMuted,
                                }}
                            >
                                {getLevelDescription(assessmentResult.level)}
                            </span>
                        </div>

                        <p
                            style={{
                                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                                fontSize: '18px',
                                color: themeColors.textMain,
                            }}
                        >
                            {assessmentResult.reason}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={onCancel}
                        disabled={isAssessing}
                        className="w-14 h-14 rounded-full bg-[#FAD4D4] hover:bg-[#F5BABA] border-2 border-[#F5BABA] flex items-center justify-center transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        <X className="w-7 h-7" style={{ color: themeColors.textMain }} strokeWidth={3} />
                    </button>

                    <button
                        onClick={handleConfirm}
                        disabled={isAssessing}
                        className="w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        style={{
                            backgroundColor: themeColors.accentMain,
                            borderColor: themeColors.accentHover,
                        }}
                    >
                        {isAssessing ? (
                            <Loader2 className="w-8 h-8 animate-spin" style={{ color: themeColors.textMain }} />
                        ) : (
                            <Check className="w-8 h-8" style={{ color: themeColors.textMain }} strokeWidth={3} />
                        )}
                    </button>
                </div>

                {isAssessing && (
                    <p
                        className="text-center mt-4"
                        style={{
                            fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                            fontSize: '18px',
                            color: themeColors.textMuted,
                        }}
                    >
                        Đang đánh giá độ khó bằng AI...
                    </p>
                )}
            </div>
        </div>
    );
}
