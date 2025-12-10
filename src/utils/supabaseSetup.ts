/**
 * Supabase setup utilities for OCR functionality
 * This file contains SQL commands and helper functions for setting up OCR tables
 */

import { supabase } from '../lib/supabaseClient';

/**
 * SQL commands to create OCR tables (run these in Supabase SQL Editor)
 * 
 * 1. Create OCRDocuments table:
 * 
 * CREATE TABLE IF NOT EXISTS "OCRDocuments" (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   userid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
 *   filename TEXT NOT NULL,
 *   extractedtext TEXT,
 *   imageurl TEXT,
 *   createdat TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
 * );
 * 
 * -- Create index for faster queries
 * CREATE INDEX idx_ocr_userid ON "OCRDocuments"(userid);
 * CREATE INDEX idx_ocr_createdat ON "OCRDocuments"(createdat DESC);
 * 
 * -- Enable Row Level Security
 * ALTER TABLE "OCRDocuments" ENABLE ROW LEVEL SECURITY;
 * 
 * -- Create policy for authenticated users to manage their own documents
 * CREATE POLICY "Users can view their own OCR documents"
 *   ON "OCRDocuments" FOR SELECT
 *   USING (auth.uid() = userid);
 * 
 * CREATE POLICY "Users can insert their own OCR documents"
 *   ON "OCRDocuments" FOR INSERT
 *   WITH CHECK (auth.uid() = userid);
 * 
 * CREATE POLICY "Users can update their own OCR documents"
 *   ON "OCRDocuments" FOR UPDATE
 *   USING (auth.uid() = userid);
 * 
 * CREATE POLICY "Users can delete their own OCR documents"
 *   ON "OCRDocuments" FOR DELETE
 *   USING (auth.uid() = userid);
 * 
 * 2. Create Storage bucket for OCR images:
 * Run in Supabase Dashboard > Storage > Create new bucket
 * Bucket name: ocr-images
 * Public: false (private bucket)
 */

export interface OCRDocument {
    id: string;
    userid: string;
    filename: string;
    extractedtext: string;
    imageurl: string;
    createdat: string;
}

/**
 * Check if OCRDocuments table exists
 */
export async function checkOCRTableExists(): Promise<boolean> {
    const { data, error } = await supabase
        .from('OCRDocuments')
        .select('id')
        .limit(1);

    return !error || error.code !== 'PGRST116'; // PGRST116 = table not found
}

/**
 * Upload OCR document to Supabase
 */
export async function uploadOCRDocument(params: {
    filename: string;
    extractedtext: string;
    imageFile: File;
    userId: string;
}): Promise<{ data?: OCRDocument; error?: string }> {
    try {
        // 1. Upload image to storage
        const fileExt = params.filename.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${params.userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('ocr-images')
            .upload(filePath, params.imageFile);

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return { error: `Failed to upload image: ${uploadError.message}` };
        }

        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('ocr-images')
            .getPublicUrl(filePath);

        // 3. Insert into database
        const { data, error: dbError } = await supabase
            .from('OCRDocuments')
            .insert({
                userid: params.userId,
                filename: params.filename,
                extractedtext: params.extractedtext,
                imageurl: publicUrl,
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database insert error:', dbError);
            return { error: `Failed to save document: ${dbError.message}` };
        }

        return { data: data as OCRDocument };
    } catch (error) {
        console.error('Upload OCR document error:', error);
        return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Get all OCR documents for a user
 */
export async function getOCRDocuments(params: {
    userId: string;
    search?: string;
}): Promise<{ data?: OCRDocument[]; error?: string }> {
    try {
        let query = supabase
            .from('OCRDocuments')
            .select('*')
            .eq('userid', params.userId)
            .order('createdat', { ascending: false });

        if (params.search) {
            query = query.or(`filename.ilike.%${params.search}%,extractedtext.ilike.%${params.search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Get OCR documents error:', error);
            return { error: error.message };
        }

        return { data: data as OCRDocument[] };
    } catch (error) {
        console.error('Get OCR documents error:', error);
        return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Update OCR document filename
 */
export async function updateOCRDocument(params: {
    id: string;
    filename: string;
    userId: string;
}): Promise<{ error?: string }> {
    try {
        const { error } = await supabase
            .from('OCRDocuments')
            .update({ filename: params.filename })
            .eq('id', params.id)
            .eq('userid', params.userId);

        if (error) {
            console.error('Update OCR document error:', error);
            return { error: error.message };
        }

        return {};
    } catch (error) {
        console.error('Update OCR document error:', error);
        return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Delete OCR document
 */
export async function deleteOCRDocument(params: {
    id: string;
    imageurl: string;
    userId: string;
}): Promise<{ error?: string }> {
    try {
        // 1. Delete from storage
        const path = params.imageurl.split('/').slice(-2).join('/'); // Extract path from URL
        const { error: storageError } = await supabase.storage
            .from('ocr-images')
            .remove([path]);

        if (storageError) {
            console.warn('Storage delete warning:', storageError);
            // Continue even if storage delete fails
        }

        // 2. Delete from database
        const { error: dbError } = await supabase
            .from('OCRDocuments')
            .delete()
            .eq('id', params.id)
            .eq('userid', params.userId);

        if (dbError) {
            console.error('Database delete error:', dbError);
            return { error: dbError.message };
        }

        return {};
    } catch (error) {
        console.error('Delete OCR document error:', error);
        return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
