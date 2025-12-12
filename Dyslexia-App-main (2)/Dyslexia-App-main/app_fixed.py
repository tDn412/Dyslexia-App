import os
import io
import base64
import aiofiles
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# === 1. TẢI THƯ VIỆN ===
try:
    from underthesea import text_normalize, sent_tokenize, word_tokenize
    print("Tải Underthesea thành công.")
except ImportError:
    print("LỖI: Không thể import underthesea.")

try:
    from google.cloud import texttospeech, speech, vision
    print("Tải thư viện Google Cloud thành công.")
except ImportError:
    print("LỖI: Không thể import thư viện Google Cloud.")


# === 2. KHỞI TẠO APP & CẤU HÌNH BẢO MẬT (ĐÃ SỬA THỨ TỰ) ===

# Khởi tạo FastAPI App TRƯỚC
app = FastAPI()

# ĐỌC GOOGLE CREDENTIALS TỪ SECRET TRƯỚC KHI KHỞI TẠO CLIENTS
google_creds_json = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
if google_creds_json:
    creds_path = "/tmp/google_creds.json"
    with open(creds_path, "w") as f:
        f.write(google_creds_json)
    # Đây là dòng quan trọng, set biến môi trường
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path 
    print("Đã cấu hình Google Credentials.")
else:
    print("CẢNH BÁO: Không tìm thấy secret 'GOOGLE_APPLICATION_CREDENTIALS_JSON'.")


# === 3. KHỞI TẠO GOOGLE CLIENTS (SAU KHI CÓ CREDENTIALS) ===
print("Đang khởi tạo các Google Cloud Clients...")
try:
    tts_client = texttospeech.TextToSpeechClient()
    speech_client = speech.SpeechClient()
    vision_client = vision.ImageAnnotatorClient()
    print("Đã khởi tạo xong Google Cloud Clients.")
except Exception as e:
    print(f"LỖI KHI KHỞI TẠO GOOGLE CLIENTS: {e}")
    # Nếu không khởi tạo được, các API sẽ lỗi, nhưng app vẫn chạy để debug
    tts_client = None
    speech_client = None
    vision_client = None


# === 4. CẤU HÌNH CORS ===
origins = ["*"] # Cho phép tất cả
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === 5. ĐỊNH NGHĨA CÁC API ENDPOINTS ===

# Định nghĩa kiểu dữ liệu Input cho các hàm cần text
class TextRequest(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"message": "Backend API cho Dyslexia App đã sẵn sàng!"}

# --- MODULE 1: PHÂN TÁCH VĂN BẢN (Underthesea) ---
@app.post("/api/segment")
async def segment_text(request: TextRequest):
    try:
        normalized = text_normalize(request.text)
        sentences = sent_tokenize(normalized)
        words_per_sentence = [word_tokenize(s) for s in sentences]
        return {
            "normalized": normalized,
            "sentences": sentences,
            "words_per_sentence": words_per_sentence
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- MODULE 2: ĐỌC VĂN BẢN (Google TTS) ---
@app.post("/api/tts")
async def text_to_speech_gcp(request: TextRequest):
    if not tts_client:
        raise HTTPException(status_code=500, detail="Lỗi: Dịch vụ TTS chưa được khởi tạo.")
    try:
        synthesis_input = texttospeech.SynthesisInput(text=request.text)
        voice = texttospeech.VoiceSelectionParams(
            language_code="vi-VN", 
            name="vi-VN-Standard-A", # Giọng nữ
            ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        response = tts_client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        # Trả về file âm thanh dưới dạng Base64
        audio_base64 = base64.b64encode(response.audio_content).decode('utf-8')
        return {"audio_base64": audio_base64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- MODULE 3: KIỂM TRA PHÁT ÂM (Google Speech-to-Text) - FIXED VERSION ---
@app.post("/api/check-pronunciation")
async def check_pronunciation_gcp(
    reference_text: str = Form(...), 
    audio_file: UploadFile = File(...)
):
    if not speech_client:
        raise HTTPException(status_code=500, detail="Lỗi: Dịch vụ Speech-to-Text chưa được khởi tạo.")
    try:
        audio_content = await audio_file.read()
        audio = speech.RecognitionAudio(content=audio_content)

        # Cấu hình nhận dạng - LƯU Ý: Đảm bảo file âm thanh là WAV (LINEAR16)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000, # Đảm bảo frontend ghi âm ở 16000Hz
            language_code="vi-VN",
            enable_automatic_punctuation=True,
            enable_word_time_offsets=True  # Get word-level timing
        )
        
        response = speech_client.recognize(config=config, audio=audio)
        
        if not response.results:
            return {"error": "Không nhận dạng được giọng nói"}

        result = response.results[0]
        transcript = result.alternatives[0].transcript
        
        # Simple word matching for scoring
        # Normalize both texts for comparison
        reference_words = text_normalize(reference_text).lower().split()
        transcript_words = text_normalize(transcript).lower().split()
        
        word_scores = []
        for i, ref_word in enumerate(reference_words):
            # Check if word exists in transcript
            # Give 100 if exact match, 80 if similar, 50 if missing
            score = 50  # Default: missing
            
            if ref_word in transcript_words:
                score = 100  # Exact match
            else:
                # Check for partial match (simple similarity)
                for trans_word in transcript_words:
                    if ref_word in trans_word or trans_word in ref_word:
                        score = 80  # Partial match
                        break
            
            word_scores.append({
                "word": ref_word,
                "pronunciation_score": score
            })

        return {
            "reference_text": reference_text,
            "your_transcript": transcript,
            "word_scores": word_scores
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- MODULE 4: NHẬN DẠNG KÝ TỰ (Google Vision AI) ---
@app.post("/api/ocr")
async def optical_character_recognition_gcp(file: UploadFile = File(...)):
    if not vision_client:
        raise HTTPException(status_code=500, detail="Lỗi: Dịch vụ Vision AI chưa được khởi tạo.")
    try:
        image_content = await file.read()
        image = vision.Image(content=image_content)

        response = vision_client.text_detection(image=image)
        texts = response.text_annotations

        if texts:
            extracted_text = texts[0].description
            return {"text": extracted_text}
        else:
            return {"text": ""}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

print("--- ỨNG DỤNG BACKEND ĐÃ SẴN SÀNG ---")
