-- Create tables for Dyslexia App

-- Texts table
create table if not exists "Texts" (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  level text,
  topic text,
  content text,
  "timingJSON" jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users/Profiles table (extends auth.users)
-- Note: This table should be automatically populated via a trigger on auth.users, or manually created on first login.
create table if not exists "Users" (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  "settingsJSON" jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Progress table
create table if not exists "Progress" (
  id uuid default gen_random_uuid() primary key,
  "userId" uuid references "Users"(id) on delete cascade,
  "textId" uuid references "Texts"(id) on delete cascade,
  accuracy float,
  wpm float,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SpeakingLogs table
create table if not exists "SpeakingLogs" (
  id uuid default gen_random_uuid() primary key,
  "userId" uuid references "Users"(id) on delete cascade,
  "textId" uuid references "Texts"(id) on delete cascade,
  "audioUrl" text,
  errors jsonb, -- Array of errors
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- LibraryWords table
create table if not exists "LibraryWords" (
  id uuid default gen_random_uuid() primary key,
  "userId" uuid references "Users"(id) on delete cascade,
  word text not null,
  examples text,
  efactor float,
  interval float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Quizzes table
create table if not exists "Quizzes" (
  id uuid default gen_random_uuid() primary key,
  title text,
  skill text, -- 'Reading' or 'Listening'
  items jsonb, -- Array of questions
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- QuizResults table
create table if not exists "QuizResults" (
  id uuid default gen_random_uuid() primary key,
  "userId" uuid references "Users"(id) on delete cascade,
  "quizId" uuid references "Quizzes"(id) on delete cascade,
  score float,
  answers jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- OCRFiles table (for Module 3)
create table if not exists "OCRFiles" (
  id uuid default gen_random_uuid() primary key,
  "userId" uuid references "Users"(id) on delete cascade,
  name text,
  content text,
  status text, -- 'pending', 'processed', 'error'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table "Texts" enable row level security;
alter table "Users" enable row level security;
alter table "Progress" enable row level security;
alter table "SpeakingLogs" enable row level security;
alter table "LibraryWords" enable row level security;
alter table "Quizzes" enable row level security;
alter table "QuizResults" enable row level security;
alter table "OCRFiles" enable row level security;

-- Policies
-- Texts: Everyone can read
create policy "Public texts are viewable by everyone" on "Texts" for select using (true);

-- Users: Users can view/update their own profile
create policy "Users can view own profile" on "Users" for select using (auth.uid() = id);
create policy "Users can update own profile" on "Users" for update using (auth.uid() = id);
create policy "Users can insert own profile" on "Users" for insert with check (auth.uid() = id);

-- Progress: Users can view/insert their own progress
create policy "Users can view own progress" on "Progress" for select using (auth.uid() = "userId");
create policy "Users can insert own progress" on "Progress" for insert with check (auth.uid() = "userId");

-- SpeakingLogs: Users can view/insert their own logs
create policy "Users can view own speaking logs" on "SpeakingLogs" for select using (auth.uid() = "userId");
create policy "Users can insert own speaking logs" on "SpeakingLogs" for insert with check (auth.uid() = "userId");

-- LibraryWords: Users can view/manage their own library
create policy "Users can view own library" on "LibraryWords" for select using (auth.uid() = "userId");
create policy "Users can insert own library" on "LibraryWords" for insert with check (auth.uid() = "userId");
create policy "Users can update own library" on "LibraryWords" for update using (auth.uid() = "userId");
create policy "Users can delete own library" on "LibraryWords" for delete using (auth.uid() = "userId");

-- Quizzes: Everyone can read quizzes
create policy "Public quizzes are viewable by everyone" on "Quizzes" for select using (true);

-- QuizResults: Users can view/insert their own results
create policy "Users can view own quiz results" on "QuizResults" for select using (auth.uid() = "userId");
create policy "Users can insert own quiz results" on "QuizResults" for insert with check (auth.uid() = "userId");

-- OCRFiles: Users can view/manage their own files
create policy "Users can view own OCR files" on "OCRFiles" for select using (auth.uid() = "userId");
create policy "Users can insert own OCR files" on "OCRFiles" for insert with check (auth.uid() = "userId");
create policy "Users can update own OCR files" on "OCRFiles" for update using (auth.uid() = "userId");
create policy "Users can delete own OCR files" on "OCRFiles" for delete using (auth.uid() = "userId");
