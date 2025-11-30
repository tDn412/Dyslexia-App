// src/utils/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';
// 'dotenv/config' đã được gọi trong index.ts, nhưng bạn có thể thêm lại để đảm bảo
// import 'dotenv/config'; 

// Lấy thông tin từ biến môi trường
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Nếu dùng cho backend

// Kiểm tra biến môi trường (TypeScript khuyên dùng)
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_KEY trong .env');
}

// Khởi tạo Supabase Client
// Sử dụng Service Role Key (secret) cho môi trường backend để có quyền truy cập đầy đủ
export const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
    // Tùy chọn: thiết lập cache hoặc schema
    auth: {
        persistSession: false, // Vì đây là server backend, không cần duy trì session
    }
});

// Bạn có thể export thêm client dùng Anon Key nếu cần
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey!);