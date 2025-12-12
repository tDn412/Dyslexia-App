import requests
import json

url = "https://dinhtu4125-dyslexia-backend.hf.space/api/tts"
payload = {"text": "Hello"}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:100]}...")
except Exception as e:
    print(f"Error: {e}")
