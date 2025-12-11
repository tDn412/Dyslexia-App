import { X, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface OCRPreviewModalProps {
    isOpen: boolean;
    filename: string;
    extractedText: string;
    onCancel: () => void;
    onSave: (editedFilename: string, editedContent: string) => void;
}

export function OCRPreviewModal({
    isOpen,
    filename,
    extractedText,
    onCancel,
    onSave,
}: OCRPreviewModalProps) {
    const [editedFilename, setEditedFilename] = useState(filename);
    const [editedContent, setEditedContent] = useState(extractedText);

    // Sync state when props change
    useEffect(() => {
        setEditedFilename(filename);
        setEditedContent(extractedText);
    }, [filename, extractedText]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(editedFilename, editedContent);
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-[#fff8e7] bg-opacity-80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#fffcf2] rounded-3xl border-2 border-[#e0dccc] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-8 border-b-2 border-[#e0dccc]">
                    <h2
                        className="text-[#111111] mb-4"
                        style={{
                            fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                            fontSize: '32px',
                            letterSpacing: '0.12em',
                        }}
                    >
                        Xem trước văn bản OCR
                    </h2>

                    {/* Filename Input */}
                    <div className="space-y-2">
                        <label
                            className="text-[#666666]"
                            style={{
                                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                                fontSize: '20px',
                                letterSpacing: '0.12em',
                            }}
                        >
                            Tên file:
                        </label>
                        <input
                            type="text"
                            value={editedFilename}
                            onChange={(e) => setEditedFilename(e.target.value)}
                            className="w-full bg-[#fff8e7] border-2 border-[#e0dccc] rounded-2xl px-6 py-4 text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#d4c5a9] shadow-sm"
                            style={{
                                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                                fontSize: '24px',
                                letterSpacing: '0.12em',
                            }}
                        />
                    </div>
                </div>

                {/* Content Editor */}
                <div className="flex-1 overflow-auto p-8">
                    <label
                        className="text-[#666666] mb-3 block"
                        style={{
                            fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                            fontSize: '20px',
                            letterSpacing: '0.12em',
                        }}
                    >
                        Nội dung ({editedContent.length} ký tự):
                    </label>
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full h-[400px] bg-[#fff8e7] border-2 border-[#e0dccc] rounded-2xl px-6 py-4 text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#d4c5a9] shadow-sm resize-none"
                        style={{
                            fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                            fontSize: '24px',
                            lineHeight: '1.8',
                            letterSpacing: '0.14em',
                        }}
                    />
                </div>

                {/* Action Buttons */}
                <div className="p-8 border-t-2 border-[#e0dccc] flex gap-4 justify-center">
                    {/* Cancel Button */}
                    <button
                        onClick={onCancel}
                        className="px-8 py-4 rounded-2xl bg-[#FAD4D4] hover:bg-[#F5BABA] border-2 border-[#F5BABA] flex items-center gap-3 transition-all shadow-md hover:shadow-lg"
                        style={{
                            fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                            fontSize: '24px',
                            letterSpacing: '0.12em',
                        }}
                    >
                        <X className="w-6 h-6" />
                        <span>Huỷ</span>
                    </button>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={!editedFilename.trim() || !editedContent.trim()}
                        className="px-8 py-4 rounded-2xl bg-[#D4E7F5] hover:bg-[#C5DCF0] border-2 border-[#B8D4E8] flex items-center gap-3 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                            fontSize: '24px',
                            letterSpacing: '0.12em',
                        }}
                    >
                        <Check className="w-6 h-6" />
                        <span>Lưu vào OCR</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
