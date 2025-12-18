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
# ĐỌC GOOGLE CREDENTIALS TỪ FILE LOCAL
creds_path = os.path.abspath("google_creds.json")
if os.path.exists(creds_path):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path 
    print(f"Đã cấu hình Google Credentials từ: {creds_path}")
else:
    print("CẢNH BÁO: Không tìm thấy file 'google_creds.json'.")


# === 3. KHỞI TẠO GOOGLE CLIENTS (SAU KHI CÓ CREDENTIALS) ===
print("Đang khởi tạo các Google Cloud Clients...")
try:
    tts_client = texttospeech.TextToSpeechClient()
    # speech_client removed as we switched to local evaluation
    vision_client = vision.ImageAnnotatorClient()
    print("Đã khởi tạo xong Google Cloud Clients.")
except Exception as e:
    print(f"LỖI KHI KHỞI TẠO GOOGLE CLIENTS: {e}")
    tts_client = None
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
    voice: str = "female-1" # Default voice ID
    speed: float = 1.0    # Default speed

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
        
        # Mapping voice IDs to Google Cloud TTS voice names
        voice_map = {
            "female-1": {"name": "vi-VN-Standard-A", "gender": texttospeech.SsmlVoiceGender.FEMALE},
            "female-2": {"name": "vi-VN-Standard-C", "gender": texttospeech.SsmlVoiceGender.FEMALE},
            "female-3": {"name": "vi-VN-Wavenet-C", "gender": texttospeech.SsmlVoiceGender.FEMALE},
            "male-1":   {"name": "vi-VN-Standard-D", "gender": texttospeech.SsmlVoiceGender.MALE},
            "male-2":   {"name": "vi-VN-Standard-B", "gender": texttospeech.SsmlVoiceGender.MALE},
            "male-3":   {"name": "vi-VN-Wavenet-D", "gender": texttospeech.SsmlVoiceGender.MALE},
        }
        
        selected_voice = voice_map.get(request.voice, voice_map["female-1"])

        voice = texttospeech.VoiceSelectionParams(
            language_code="vi-VN", 
            name=selected_voice["name"],
            ssml_gender=selected_voice["gender"]
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=request.speed
        )
        response = tts_client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        # Trả về file âm thanh dưới dạng Base64
        audio_base64 = base64.b64encode(response.audio_content).decode('utf-8')
        return {"audioContent": audio_base64}
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
