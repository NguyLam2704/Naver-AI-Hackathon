# Test Chat with Files
# Run: python test_chat_files.py

import requests

BASE_URL = "http://localhost:8000"


def test_chat_with_files():
    """Test chat endpoint with file upload"""
    print("\n=== Testing Chat with Files (Non-Streaming) ===")

    url = f"{BASE_URL}/chat/message-with-files"

    # Prepare files (replace with actual file paths)
    files = [
        ("files", ("cv.pdf", open("test_cv.pdf", "rb"), "application/pdf")),
        # ('files', ('certificate.jpg', open('certificate.jpg', 'rb'), 'image/jpeg')),
    ]

    data = {
        "message": "Đây là CV của tôi. Hãy xem qua và đặt câu hỏi về kinh nghiệm làm việc của tôi.",
    }

    print(f"Sending message with files...")
    response = requests.post(url, files=files, data=data)

    # Close files
    for _, file_tuple in files:
        file_tuple[1].close()

    if response.status_code == 200:
        result = response.json()
        print(f"\nSession ID: {result['session_id']}")
        print(f"Response: {result['response']}")
        return result["session_id"]
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None


def test_chat_with_files_stream():
    """Test streaming chat endpoint with file upload"""
    print("\n\n=== Testing Chat with Files (Streaming) ===")

    url = f"{BASE_URL}/chat/message-with-files/stream"

    # Prepare files
    files = [
        ("files", ("cv.pdf", open("test_cv.pdf", "rb"), "application/pdf")),
    ]

    data = {
        "message": "Tôi có 3 năm kinh nghiệm. Theo CV bạn thấy tôi phù hợp với vị trí nào?",
    }

    print(f"Sending message with files (streaming)...")
    print("\nStreaming response:")

    response = requests.post(url, files=files, data=data, stream=True)

    # Close files
    for _, file_tuple in files:
        file_tuple[1].close()

    if response.status_code == 200:
        session_id = None
        for line in response.iter_lines():
            if line:
                line_str = line.decode("utf-8")
                if line_str.startswith("data: "):
                    import json

                    data_obj = json.loads(line_str[6:])

                    if data_obj["type"] == "session_id":
                        session_id = data_obj["session_id"]
                        print(f"\nSession ID: {session_id}\n")
                    elif data_obj["type"] == "chunk":
                        print(data_obj["text"], end="", flush=True)
                    elif data_obj["type"] == "done":
                        print("\n\n[Stream completed]")
                    elif data_obj["type"] == "error":
                        print(f"\nError: {data_obj['message']}")

        return session_id
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None


if __name__ == "__main__":
    print("Starting Chat with Files Tests...")
    print("\nNote: Make sure you have 'test_cv.pdf' in the current directory")
    print("Or modify the file paths in the code\n")

    # Uncomment to test (requires actual files)
    # session_id = test_chat_with_files()
    # if session_id:
    #     test_chat_with_files_stream()

    print("\nTo test, create a 'test_cv.pdf' file and uncomment the test calls")
