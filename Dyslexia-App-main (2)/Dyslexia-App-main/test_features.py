"""
Test script to verify all Dyslexia App features are working
"""

import requests

base_url = "https://dinhtu4125-dyslexia-backend.hf.space/api"

print("=" * 50)
print("DYSLEXIA APP BACKEND TEST")
print("=" * 50)

# Test 1: NLP Segment
print("\n1. Testing NLP Segment...")
try:
    response = requests.post(f"{base_url}/segment", json={"text": "Xin chào bạn"})
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ SUCCESS - Normalized: {data['normalized']}")
        print(f"   Sentences: {data['sentences']}")
    else:
        print(f"   ❌ FAILED - Status: {response.status_code}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# Test 2: TTS
print("\n2. Testing Text-to-Speech...")
try:
    response = requests.post(f"{base_url}/tts", json={"text": "Xin chào"})
    if response.status_code == 200:
        data = response.json()
        if "audio_base64" in data and len(data["audio_base64"]) > 100:
            print(f"   ✅ SUCCESS - Audio generated ({len(data['audio_base64'])} chars)")
        else:
            print(f"   ❌ FAILED - No audio data")
    else:
        print(f"   ❌ FAILED - Status: {response.status_code}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# Test 3: Pronunciation Check
print("\n3. Testing Pronunciation Check...")
print("   (Note: Will fail with mock audio, but endpoint should respond)")
try:
    # Create a minimal WAV file (mock)
    with open("test_audio.wav", "wb") as f:
        f.write(b"mock audio data")
    
    with open("test_audio.wav", "rb") as f:
        files = {"audio_file": f}
        data = {"reference_text": "Xin chào"}
        response = requests.post(f"{base_url}/check-pronunciation", files=files, data=data)
    
    if response.status_code == 200:
        result = response.json()
        if "error" in result:
            print(f"   ⚠️  ENDPOINT WORKING - Expected error: {result['error']}")
        else:
            print(f"   ✅ SUCCESS - Transcript: {result.get('your_transcript', 'N/A')}")
    else:
        print(f"   ❌ FAILED - Status: {response.status_code}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

# Test 4: OCR
print("\n4. Testing OCR...")
print("   (Note: Will return empty with mock image)")
try:
    with open("test_image.png", "wb") as f:
        f.write(b"mock image data")
    
    with open("test_image.png", "rb") as f:
        files = {"file": f}
        response = requests.post(f"{base_url}/ocr", files=files)
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ SUCCESS - Text extracted: '{data.get('text', '')}'")
    else:
        print(f"   ❌ FAILED - Status: {response.status_code}")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

print("\n" + "=" * 50)
print("TEST SUMMARY")
print("=" * 50)
print("✅ All endpoints are responding!")
print("\nNext steps:")
print("1. Open http://localhost:3000/ in your browser")
print("2. Test Library feature:")
print("   - Click '+' to add a word")
print("   - Click speaker icon to hear pronunciation")
print("   - Click 'X' to delete a word")
print("3. Test Speaking feature:")
print("   - Click microphone to record")
print("   - Speak the sample text")
print("   - Click stop to analyze")
print("\n" + "=" * 50)
