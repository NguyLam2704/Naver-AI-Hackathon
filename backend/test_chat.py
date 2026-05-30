# Test Gemini Chat Service
# Run: python test_chat.py

import requests
import json

BASE_URL = "http://localhost:8000"


def test_chat_non_streaming():
    """Test non-streaming chat endpoint"""
    print("\n=== Testing Non-Streaming Chat ===")

    url = f"{BASE_URL}/chat/message"
    payload = {
        "message": "Xin chào, tôi tên là Nguyễn Văn A, tôi muốn ứng tuyển vị trí Backend Developer"
    }

    print(f"Sending: {payload['message']}")
    response = requests.post(url, json=payload)

    if response.status_code == 200:
        data = response.json()
        print(f"\nSession ID: {data['session_id']}")
        print(f"Response: {data['response']}")
        return data["session_id"]
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None


def test_chat_streaming():
    """Test streaming chat endpoint"""
    print("\n\n=== Testing Streaming Chat ===")

    url = f"{BASE_URL}/chat/message/stream"
    payload = {"message": "Tôi có 3 năm kinh nghiệm làm việc với Python và FastAPI"}

    print(f"Sending: {payload['message']}")
    print("\nStreaming response:")

    response = requests.post(url, json=payload, stream=True)

    if response.status_code == 200:
        session_id = None
        for line in response.iter_lines():
            if line:
                line_str = line.decode("utf-8")
                if line_str.startswith("data: "):
                    data = json.loads(line_str[6:])

                    if data["type"] == "session_id":
                        session_id = data["session_id"]
                        print(f"\nSession ID: {session_id}\n")
                    elif data["type"] == "chunk":
                        print(data["text"], end="", flush=True)
                    elif data["type"] == "done":
                        print("\n\n[Stream completed]")
                    elif data["type"] == "error":
                        print(f"\nError: {data['message']}")

        return session_id
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None


def test_clear_session(session_id):
    """Test clearing a session"""
    print(f"\n\n=== Testing Clear Session ===")

    url = f"{BASE_URL}/chat/session/{session_id}"
    response = requests.delete(url)

    if response.status_code == 200:
        data = response.json()
        print(f"Result: {data['message']}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)


if __name__ == "__main__":
    print("Starting Chat Service Tests...")

    # Test 1: Non-streaming
    session_id = test_chat_non_streaming()

    # Test 2: Streaming
    if session_id:
        test_chat_streaming()

    # Test 3: Clear session
    if session_id:
        test_clear_session(session_id)
