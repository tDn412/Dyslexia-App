-- ================================================================
-- Supabase Setup Script for Dyslexia OCR Feature
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. Create OCRDocuments table
CREATE TABLE IF NOT EXISTS "OCRDocuments" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  extractedtext TEXT,
  imageurl TEXT,
  createdat TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ocr_userid ON "OCRDocuments"(userid);
CREATE INDEX IF NOT EXISTS idx_ocr_createdat ON "OCRDocuments"(createdat DESC);

-- 3. Enable Row Level Security
ALTER TABLE "OCRDocuments" ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own OCR documents" ON "OCRDocuments";
DROP POLICY IF EXISTS "Users can insert their own OCR documents" ON "OCRDocuments";
DROP POLICY IF NOT EXISTS "Users can update their own OCR documents" ON "OCRDocuments";
DROP POLICY IF EXISTS "Users can delete their own OCR documents" ON "OCRDocuments";

-- 5. Create RLS policies for authenticated users
CREATE POLICY "Users can view their own OCR documents"
  ON "OCRDocuments" FOR SELECT
  USING (auth.uid() = userid);

CREATE POLICY "Users can insert their own OCR documents"
  ON "OCRDocuments" FOR INSERT
  WITH CHECK (auth.uid() = userid);

CREATE POLICY "Users can update their own OCR documents"
  ON "OCRDocuments" FOR UPDATE
  USING (auth.uid() = userid);

CREATE POLICY "Users can delete their own OCR documents"
  ON "OCRDocuments" FOR DELETE
  USING (auth.uid() = userid);

-- ================================================================
-- Storage Bucket Setup (DO THIS IN SUPABASE DASHBOARD STORAGE TAB)
-- ================================================================
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "Create new bucket"
-- 3. Bucket name: ocr-images
-- 4. Set as Private bucket (not public)
-- 5. Click "Create bucket"
--
-- Then run this SQL to create storage policies:

INSERT INTO storage.buckets (id, name, public)
VALUES ('ocr-images', 'ocr-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ocr-images bucket
CREATE POLICY "Users can upload their own OCR images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ocr-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own OCR images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ocr-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own OCR images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'ocr-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own OCR images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ocr-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ================================================================
-- Verification Queries
-- ================================================================
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'OCRDocuments'
) AS table_exists;

-- Check if storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'ocr-images';

-- View all OCR documents (as logged-in user)
SELECT * FROM "OCRDocuments" ORDER BY createdat DESC;
