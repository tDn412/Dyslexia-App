/**
 * OCR utilities using Tesseract.js for Vietnamese text recognition
 */

import Tesseract from 'tesseract.js';

export interface OCRProgress {
    status: string;
    progress: number; // 0-1
}

export interface OCRResult {
    text: string;
    confidence: number;
}

/**
 * Process image with OCR
 * Supports Vietnamese language
 */
export async function processImageOCR(
    imageFile: File,
    onProgress?: (progress: OCRProgress) => void
): Promise<{ data?: OCRResult; error?: string }> {
    try {
        // Validate file type
        if (!imageFile.type.startsWith('image/')) {
            return { error: 'File must be an image' };
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (imageFile.size > maxSize) {
            return { error: 'Image size must be less than 5MB' };
        }

        // Process with Tesseract
        const result = await Tesseract.recognize(imageFile, 'vie', {
            logger: (m) => {
                if (onProgress) {
                    onProgress({
                        status: m.status,
                        progress: m.progress || 0,
                    });
                }
            },
        });

        // Clean up the text
        const cleanedText = result.data.text
            .trim()
            .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
            .replace(/\s{2,}/g, ' '); // Remove excessive spaces

        return {
            data: {
                text: cleanedText,
                confidence: result.data.confidence,
            },
        };
    } catch (error) {
        console.error('OCR processing error:', error);
        return {
            error: error instanceof Error ? error.message : 'OCR processing failed',
        };
    }
}

/**
 * Preprocess image for better OCR results
 */
export async function preprocessImage(file: File): Promise<File> {
    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            // Resize if too large
            const maxWidth = 2000;
            const maxHeight = 2000;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;

            if (ctx) {
                // Draw image
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to grayscale for better OCR
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg; // R
                    data[i + 1] = avg; // G
                    data[i + 2] = avg; // B
                }

                ctx.putImageData(imageData, 0, 0);

                // Convert canvas to blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        const processedFile = new File([blob], file.name, { type: 'image/png' });
                        resolve(processedFile);
                    } else {
                        resolve(file);
                    }
                }, 'image/png');
            } else {
                resolve(file);
            }
        };

        img.onerror = () => resolve(file);
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Validate image before OCR processing
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Chỉ hỗ trợ file ảnh định dạng JPG, PNG, hoặc WEBP',
        };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'Kích thước file phải nhỏ hơn 5MB',
        };
    }

    return { valid: true };
}
