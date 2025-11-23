import requests

def test_endpoint(name, url, payload=None, files=None):
    print(f"Testing {name}...")
    try:
        if files:
            response = requests.post(url, files=files, data=payload)
        else:
            response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:100]}...")
    except Exception as e:
        print(f"Error: {e}")
    print("-" * 20)

base_url = "https://dinhtu4125-dyslexia-backend.hf.space/api"

# Test NLP (Segment)
test_endpoint("NLP Segment", f"{base_url}/segment", payload={"text": "Hello world"})

# Test TTS
test_endpoint("TTS", f"{base_url}/tts", payload={"text": "Hello"})

# Test Pronunciation (Mock file)
with open("test_audio.wav", "wb") as f:
    f.write(b"mock audio data")
with open("test_audio.wav", "rb") as f:
    test_endpoint("Pronunciation", f"{base_url}/check-pronunciation", 
                  payload={"reference_text": "Hello"}, 
                  files={"audio_file": f})

# Test OCR (Mock file)
with open("test_image.png", "wb") as f:
    f.write(b"mock image data")
with open("test_image.png", "rb") as f:
    test_endpoint("OCR", f"{base_url}/ocr", 
                  files={"file": f})
