import { Sidebar } from './Sidebar';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, Search, Filter, Edit2, Trash2, Check, X, BookOpen, Mic } from 'lucide-react';
import { Input } from './ui/input';
import { api } from '../utils/api';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';
import { OCRPreviewModal } from './OCRPreviewModal';
import { AddToTextModal } from './AddToTextModal';
import { useTheme } from './ThemeContext';

interface OCRImportPageProps {
  onNavigate?: (page: 'Home' | 'Reading' | 'ReadingSelection' | 'Speaking' | 'SpeakingSelection' | 'Library' | 'SettingsOverview' | 'DisplaySettings' | 'AudioSettings' | 'OCRImport' | 'Exercise') => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSignOut?: () => void;
  userId?: string;
}

interface ReadingFile {
  id: string;
  name: string;
  dateAdded: string;
}

export function OCRImportPage({ onNavigate, isSidebarCollapsed = false, onToggleCollapse, onSignOut, userId = 'demo-user-id' }: OCRImportPageProps) {
  const { themeColors } = useTheme();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editedFileName, setEditedFileName] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  // OCR Preview states
  const [showPreview, setShowPreview] = useState(false);
  const [previewFilename, setPreviewFilename] = useState('');
  const [previewContent, setPreviewContent] = useState('');

  // Add to Text Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalFileId, setAddModalFileId] = useState<string>('');
  const [addModalFilename, setAddModalFilename] = useState('');
  const [addModalContent, setAddModalContent] = useState('');

  // Reading files from OCRImport table
  const [readingFiles, setReadingFiles] = useState<ReadingFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load OCR files from backend API on mount
  useEffect(() => {
    const loadOCRFiles = async () => {
      try {
        setIsLoading(true);
        const currentUserId = userId;

        // Use backend API instead of direct Supabase
        const response = await fetch(`http://localhost:4000/api/ocr/files?userId=${currentUserId}`);

        if (!response.ok) {
          console.error('Error loading OCR files:', response.statusText);
          toast.error('Không thể tải danh sách file OCR');
          return;
        }

        const data = await response.json();

        if (data) {
          const files = data.map((item: any) => ({
            id: item.ocrid,
            name: item.filename,
            dateAdded: new Date(item.createdat).toISOString().split('T')[0],
          }));
          setReadingFiles(files);
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Lỗi kết nối server');
      } finally {
        setIsLoading(false);
      }
    };

    loadOCRFiles();
  }, [userId]);

  // Filter files based on search query
  const filteredReadings = useMemo(() => {
    if (!searchQuery.trim()) return readingFiles;

    const query = searchQuery.toLowerCase();
    return readingFiles.filter(file =>
      file.name.toLowerCase().includes(query)
    );
  }, [readingFiles, searchQuery]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };


  const handleConfirm = async () => {
    if (uploadedFile) {
      try {
        toast.info('Đang xử lý OCR...');
        const response = await api.ocr.upload(uploadedFile);

        console.log('OCR Full Response:', response); // Debug log

        if (response.error) {
          toast.error('Lỗi OCR: ' + response.error);
          return;
        }

        // Check if we got text back
        if (!response.data?.text) {
          console.error('No text in response:', response.data); // Debug log
          toast.error('Không trích xuất được văn bản từ ảnh');
          return;
        }

        const extractedText = response.data.text;
        console.log('Extracted text:', extractedText);
        console.log('Text length:', extractedText.length); // Debug log

        // Show preview modal instead of saving directly
        setPreviewFilename(uploadedFile.name.replace(/\.[^/.]+$/, ''));
        setPreviewContent(extractedText);
        console.log('Setting preview content:', extractedText); // Debug log
        setShowPreview(true);
        setUploadedFile(null); // Clear uploaded file

      } catch (error) {
        console.error('OCR Error:', error);
        toast.error('Không thể xử lý tệp. Vui lòng thử lại.');
      }
    }
  };

  // Handle save from preview modal
  const handleSaveFromPreview = async (editedFilename: string, editedContent: string) => {
    try {
      const currentUserId = userId;

      // Call backend API to save OCR
      const response = await fetch(`http://localhost:4000/api/ocr/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          filename: editedFilename,
          content: editedContent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error('Lỗi khi lưu văn bản: ' + (error.error || 'Unknown error'));
        return;
      }

      const savedOCR = await response.json();

      // Add the file to the reading list
      const newReading: ReadingFile = {
        id: savedOCR.ocrid,
        name: editedFilename,
        dateAdded: new Date().toISOString().split('T')[0],
      };

      setReadingFiles([newReading, ...readingFiles]);
      setShowPreview(false);
      toast.success(`Đã lưu văn bản thành công! (${editedContent.length} ký tự)`);

    } catch (error) {
      console.error('Save Error:', error);
      toast.error('Không thể lưu tệp. Vui lòng thử lại.');
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreviewFilename('');
    setPreviewContent('');
  };

  // Add to Reading tab - open modal
  const handleAddToReading = async (fileId: string) => {
    try {
      const file = readingFiles.find(f => f.id === fileId);
      if (!file) return;

      // Get content from backend API
      const response = await fetch(`http://localhost:4000/api/ocr/files/${fileId}?userId=${userId}`);
      if (!response.ok) {
        toast.error('Không thể tải nội dung file OCR');
        return;
      }

      const ocrData = await response.json();

      // Open modal with file data
      setAddModalFileId(fileId);
      setAddModalFilename(ocrData.filename);
      setAddModalContent(ocrData.content);
      setShowAddModal(true);
    } catch (error) {
      console.error('Add to Reading error:', error);
      toast.error('Không thể tải nội dung file');
    }
  };

  // Handle confirm from modal  
  const handleConfirmAddToText = async (addTo: 'Đọc' | 'Nói' | 'both', level: string, category: string) => {
    try {
      // Note: Database doesn't have a field to distinguish Reading vs Speaking
      // So we only insert ONE record that can be used for both purposes
      const textToInsert = {
        textid: crypto.randomUUID(),
        title: addModalFilename,
        content: addModalContent,
        level: level,
        topic: category, // topic field stores category (Động vật, Thiên nhiên...)
      };

      const { error: saveError } = await supabase
        .from('Text')
        .insert([textToInsert]);

      if (saveError) {
        console.error('Error saving to Text:', saveError);
        toast.error('Lỗi khi thêm bài: ' + saveError.message);
        return;
      }

      setShowAddModal(false);

      const addToText = addTo === 'both' ? 'Đọc & Nói' : addTo;
      toast.success(`✅ Đã thêm vào ${addToText}! (Cấp ${level}, ${category})`, {
        duration: 3000,
      });
    } catch (error) {
      console.error('Add to Text error:', error);
      toast.error('Không thể thêm bài');
    }
  };


  const handleDelete = () => {
    setUploadedFile(null);
  };

  const handleEditReading = (id: string) => {
    const file = readingFiles.find(f => f.id === id);
    if (file) {
      setEditingFileId(id);
      setEditedFileName(file.name);
      setIsEditPopupOpen(true);
    }
  };

  const handleConfirmEdit = async () => {
    if (editingFileId && editedFileName.trim()) {
      try {
        // Update in database via backend API
        const response = await fetch(`http://localhost:4000/api/ocr/files/${editingFileId}?userId=${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editedFileName.trim() }),
        });

        if (!response.ok) {
          toast.error('Lỗi khi sửa tên file');
          return;
        }

        // Update local state
        setReadingFiles(readingFiles.map(file =>
          file.id === editingFileId
            ? { ...file, name: editedFileName.trim() }
            : file
        ));
        handleCancelEdit();
        toast.success('Đã sửa tên file!');
      } catch (error) {
        console.error('Edit error:', error);
        toast.error('Lỗi khi sửa tên file');
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditPopupOpen(false);
    setEditingFileId(null);
    setEditedFileName('');
  };

  const handleDeleteReading = async (id: string) => {
    try {
      // Delete from database via backend API
      const response = await fetch(`http://localhost:4000/api/ocr/files/${id}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        toast.error('Lỗi khi xóa file');
        return;
      }

      // Update local state
      setReadingFiles(readingFiles.filter(file => file.id !== id));
      toast.success('Đã xóa file!');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Lỗi khi xóa file');
    }
  };

  // Close popup when clicking outside or pressing Escape
  useEffect(() => {
    if (isEditPopupOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
          handleCancelEdit();
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleCancelEdit();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isEditPopupOpen]);

  // Import custom Theme Context
  // const { useTheme } = require('./ThemeContext');
  // Wait, imports are at top. In App-1 original it was: import { useTheme } from './ThemeContext';
  // Let's rely on top imports.

  return (
    <div className="flex h-screen" style={{ backgroundColor: themeColors.appBackground }}>
      {/* Sidebar */}
      <Sidebar
        activePage="Nhập OCR"
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={onToggleCollapse}
        onSignOut={onSignOut}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-12">
          {/* File Upload Section */}
          <div className="mb-10">
            <div className="flex gap-6 items-stretch">
              {/* Upload Area */}
              <div className="flex-1">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".jpg,.png,.docx"
                  onChange={handleFileSelect}
                />
                <label
                  htmlFor="file-upload"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex items-center justify-center h-full min-h-[200px] cursor-pointer border-2 border-dashed rounded-xl p-8 transition-all`}
                  style={{
                    backgroundColor: isDragging ? '#F0F8FF' : themeColors.cardBackground,
                    borderColor: isDragging ? '#B8D4E8' : (isDragging ? themeColors.border : themeColors.border), // Simplified logic
                  }}
                >
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColors.accentMain }}>
                      <Upload className="w-8 h-8" style={{ color: themeColors.textMain }} />
                    </div>
                    <div className="text-center">
                      <p
                        className="mb-2"
                        style={{
                          fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                          fontSize: '26px',
                          letterSpacing: '0.12em',
                          color: themeColors.textMain,
                        }}
                      >
                        {uploadedFile ? uploadedFile.name : 'Kéo thả hoặc chọn tệp để thêm bài đọc'}
                      </p>
                      <p
                        style={{
                          fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                          fontSize: '24px',
                          letterSpacing: '0.12em',
                          color: themeColors.textMuted,
                        }}
                      >
                        Hỗ trợ: .jpg, .png, .docx
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 justify-center">
                <button
                  onClick={handleDelete}
                  disabled={!uploadedFile}
                  className="w-32 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all"
                  style={{
                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                    fontSize: '24px',
                    backgroundColor: uploadedFile ? '#FFE8E8' : '#F5F5F5',
                    borderColor: uploadedFile ? '#FFCCCC' : '#E0E0E0',
                    color: uploadedFile ? themeColors.textMain : '#999999',
                    cursor: uploadedFile ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Trash2 className="w-6 h-6" />
                  <span>Xóa</span>
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!uploadedFile}
                  className="w-32 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all"
                  style={{
                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                    fontSize: '24px',
                    backgroundColor: uploadedFile ? themeColors.accentMain : '#F5F5F5',
                    borderColor: uploadedFile ? themeColors.accentHover : '#E0E0E0',
                    color: uploadedFile ? themeColors.textMain : '#999999',
                    cursor: uploadedFile ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Check className="w-5 h-5" />
                  <span>Xác nhận</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: themeColors.textMuted }} />
                <Input
                  type="text"
                  placeholder="Tìm bài đọc theo tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-6 rounded-xl focus:ring-2 focus:ring-opacity-20 border-2"
                  style={{
                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                    fontSize: '24px',
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.border,
                    color: themeColors.textMain,
                  }}
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: themeColors.textMuted }}>
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Reading Files List */}
          <div className="space-y-4">
            <h2
              className="mb-6"
              style={{
                fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                fontSize: '30px',
                letterSpacing: '0.12em',
                color: themeColors.textMain,
              }}
            >
              Danh sách bài đọc ({filteredReadings.length})
            </h2>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredReadings.map((file) => (
                <div
                  key={file.id}
                  className="rounded-xl border-2 p-6 shadow-sm hover:shadow-md transition-all"
                  style={{
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.border,
                  }}
                >
                  {/* File Info */}
                  <div className="mb-4">
                    <p
                      className="mb-2"
                      style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '26px',
                        letterSpacing: '0.12em',
                        color: themeColors.textMain,
                      }}
                    >
                      <span style={{ color: themeColors.textMuted }}>Tên:</span> {file.name}
                    </p>
                    <p
                      style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '24px',
                        letterSpacing: '0.12em',
                        color: themeColors.textMuted,
                      }}
                    >
                      Ngày tạo: {file.dateAdded}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleEditReading(file.id)}
                      className="px-4 py-3 border-2 rounded-xl transition-all flex items-center justify-center gap-2"
                      style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '22px',
                        backgroundColor: themeColors.accentMain,
                        borderColor: themeColors.accentHover,
                        color: themeColors.textMain,
                      }}
                    >
                      <Edit2 className="w-5 h-5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDeleteReading(file.id)}
                      className="px-4 py-3 bg-[#FFE8E8] border-2 border-[#FFCCCC] rounded-xl hover:bg-[#FFD8D8] transition-all flex items-center justify-center gap-2"
                      style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '22px',
                        color: themeColors.textMain,
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>Xóa</span>
                    </button>
                    <button
                      onClick={() => handleAddToReading(file.id)}
                      className="px-4 py-3 border-2 rounded-xl transition-all flex items-center justify-center gap-2"
                      style={{
                        fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                        fontSize: '22px',
                        backgroundColor: '#D4E7F5',
                        borderColor: '#B8D4E8',
                        color: themeColors.textMain,
                      }}
                    >
                      <BookOpen className="w-5 h-5" />
                      <span>Thêm bài</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredReadings.length === 0 && (
              <div className="text-center py-12">
                <p
                  className="text-[#888888]"
                  style={{
                    fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                    fontSize: '24px',
                    letterSpacing: '0.12em',
                  }}
                >
                  Không tìm thấy bài đọc nào
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Name Popup */}
        {isEditPopupOpen && (
          <div
            className="fixed inset-0 backdrop-blur-sm bg-opacity-60 z-40 flex items-center justify-center"
            style={{ backgroundColor: `${themeColors.appBackground}99` }}
          >
            <div
              ref={popupRef}
              className="rounded-3xl border-2 shadow-2xl p-8 w-[420px]"
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
                Sửa tên bài đọc
              </h3>

              {/* Input Field */}
              <input
                type="text"
                value={editedFileName}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 50) {
                    setEditedFileName(value);
                  }
                }}
                maxLength={50}
                placeholder="Nhập tên bài đọc..."
                autoFocus
                className="w-full border-2 rounded-2xl px-6 py-4 mb-2 placeholder:text-[#999999] focus:outline-none focus:ring-0 shadow-sm transition-all"
                style={{
                  fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                  fontSize: '24px',
                  letterSpacing: '0.12em',
                  backgroundColor: themeColors.appBackground,
                  borderColor: themeColors.border,
                  color: themeColors.textMain,
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmEdit();
                  }
                }}
              />

              {/* Character Counter */}
              <div
                className="text-right mb-6"
                style={{
                  fontFamily: "'OpenDyslexic', 'Lexend', sans-serif",
                  fontSize: '18px',
                  color: themeColors.textMuted,
                }}
              >
                {editedFileName.length}/50
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                {/* Cancel Button (X) */}
                <button
                  onClick={handleCancelEdit}
                  className="w-14 h-14 rounded-full bg-[#FAD4D4] hover:bg-[#F5BABA] border-2 border-[#F5BABA] flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                  aria-label="Huỷ"
                  title="Huỷ"
                >
                  <X className="w-7 h-7" style={{ color: themeColors.textMain }} strokeWidth={3} />
                </button>

                {/* Confirm Button (✓) */}
                <button
                  onClick={handleConfirmEdit}
                  disabled={!editedFileName.trim()}
                  className="w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: themeColors.accentMain,
                    borderColor: themeColors.accentHover,
                  }}
                  aria-label="Xác nhận"
                  title="Xác nhận"
                >
                  <Check className="w-8 h-8" style={{ color: themeColors.textMain }} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OCR Preview Modal */}
        <OCRPreviewModal
          isOpen={showPreview}
          filename={previewFilename}
          extractedText={previewContent}
          onCancel={handleCancelPreview}
          onSave={handleSaveFromPreview}
        />

        {/* Add to Text Modal */}
        <AddToTextModal
          isOpen={showAddModal}
          filename={addModalFilename}
          content={addModalContent}
          onCancel={() => setShowAddModal(false)}
          onConfirm={handleConfirmAddToText}
        />
      </main>
    </div>
  );
}