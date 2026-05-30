# Hướng dẫn Test API

## ⚠️ LƯU Ý QUAN TRỌNG KHI DÙNG CURL

### 1. Upload File - ĐÚNG CÁCH ✅

```bash
# ĐÚNG - Không thêm Content-Type header thủ công
curl -X POST "http://localhost:8000/files/upload" \
     -F "file=@test.pdf"

# ĐÚNG - File có dấu cách trong tên (dùng ngoặc kép)
curl -X POST "http://localhost:8000/files/upload" \
     -F "file=@\"CV Nguyen Van A.pdf\""
```

### 2. Upload File - SAI CÁCH ❌

```bash
# SAI - Thêm Content-Type thủ công làm mất boundary
curl -X POST "http://localhost:8000/files/upload" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@test.pdf"
# ❌ Lỗi 400: boundary bị mất

# SAI - Tên file có dấu cách không được quote
curl -X POST "http://localhost:8000/files/upload" \
     -F "file=@CV Nguyen Van A.pdf"
# ❌ Lỗi: curl hiểu sai đường dẫn
```

### Tại sao?

- Khi dùng `-F` (form-data), curl **TỰ ĐỘNG** thêm header:
  ```
  Content-Type: multipart/form-data; boundary=------------------------abc123
  ```
- Nếu bạn thêm `-H 'Content-Type: multipart/form-data'`, bạn **GHI ĐÈ** và **XÓA MẤT** phần `boundary` → Server không parse được file → Lỗi 400

---

## 📋 Danh sách API Endpoints

### 1. File Upload API

#### Upload file để lấy URI

```bash
curl -X POST "http://localhost:8000/files/upload" \
     -F "file=@cv.pdf"
```

Response:

```json
{
  "success": true,
  "file_uri": "files/abc-123-def-456",
  "file_name": "files/abc-123-def-456",
  "mime_type": "application/pdf",
  "size_bytes": 245760,
  "state": "ACTIVE",
  "display_name": "cv.pdf"
}
```

#### Liệt kê tất cả files đã upload

```bash
curl -X GET "http://localhost:8000/files"
```

#### Lấy thông tin 1 file

```bash
curl -X GET "http://localhost:8000/files/files%2Fabc-123-def-456"
```

#### Xóa file

```bash
curl -X DELETE "http://localhost:8000/files/files%2Fabc-123-def-456"
```

---

### 2. Chat API (Streaming)

#### Chat không có file

```bash
curl -X POST "http://localhost:8000/chat/stream" \
     -F "message=Xin chào, tôi tên là Nguyễn Văn A"
```

#### Chat với file upload trực tiếp (không khuyến nghị)

```bash
curl -X POST "http://localhost:8000/chat/stream" \
     -F "message=Đây là CV của tôi, hãy xem và đặt câu hỏi" \
     -F "files=@cv.pdf" \
     -F "files=@certificate.jpg"
```

#### Chat với file URIs (KHUYẾN NGHỊ - file đã upload trước)

```bash
# Bước 1: Upload file lấy URI
curl -X POST "http://localhost:8000/files/upload" \
     -F "file=@cv.pdf"
# Response: {"file_uri": "files/abc-123", ...}

# Bước 2: Dùng URI trong chat (có thể dùng nhiều lần)
curl -X POST "http://localhost:8000/chat/stream" \
     -F "message=Hãy xem CV và đặt câu hỏi phỏng vấn" \
     -F 'file_uris=["files/abc-123", "files/def-456"]'
```

#### Xóa session chat

```bash
curl -X DELETE "http://localhost:8000/chat/session/your-session-id"
```

---

### 3. Voice TTS API

#### Female voice (Clara - English)

```bash
curl -X POST "http://localhost:8000/chat/female-voice" \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello, how are you today?"}' \
     --output female_voice.mp3
```

#### Male voice (Matt - English)

```bash
curl -X POST "http://localhost:8000/chat/male-voice" \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello, how are you today?"}' \
     --output male_voice.mp3
```

---

## 🧪 Test với HTML (test_stream.html)

Mở file `backend/test_stream.html` trong browser:

1. **Test chat đơn giản:**

   - Nhập tin nhắn → Gửi
   - Xem response streaming real-time

2. **Test chat với file upload:**

   - Chọn file (PDF, image, document)
   - Nhập tin nhắn
   - Gửi → File tự động upload và chat

3. **Test với file URI:**
   - Upload file trước qua `/files/upload` API
   - Copy URI từ response
   - Dùng URI trong chat

---

## 🔍 Các loại file được hỗ trợ

### Documents

- PDF: `.pdf`
- Word: `.doc`, `.docx`
- Excel: `.xls`, `.xlsx`
- PowerPoint: `.ppt`, `.pptx`
- Text: `.txt`

### Images

- `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`

### Audio

- `.mp3`, `.wav`

### Video

- `.mp4`, `.avi`, `.mov`

---

## ⚙️ Windows PowerShell

Nếu dùng PowerShell thay vì bash:

```powershell
# Upload file
Invoke-RestMethod -Uri "http://localhost:8000/files/upload" `
    -Method Post `
    -Form @{file = Get-Item "cv.pdf"}

# Chat
Invoke-RestMethod -Uri "http://localhost:8000/chat/stream" `
    -Method Post `
    -Form @{
        message = "Xin chào"
        file_uris = '["files/abc-123"]'
    }
```

---

## 🐛 Troubleshooting

### Lỗi 400 Bad Request

- ✅ Kiểm tra: Không thêm `-H 'Content-Type: multipart/form-data'` khi dùng `-F`
- ✅ Kiểm tra: Tên file có dấu cách phải để trong ngoặc kép
- ✅ Kiểm tra: File có tồn tại không
- ✅ Kiểm tra: API server đang chạy (`uvicorn main:app --reload`)

### Lỗi MIME type

- ✅ Backend tự động detect, nhưng đảm bảo file có extension đúng (`.pdf`, `.jpg`, v.v.)

### File upload nhưng state không ACTIVE

- ✅ Đợi 1-2 giây, Gemini cần thời gian process
- ✅ Kiểm tra file có hợp lệ không (không bị corrupt)

### Streaming không hoạt động

- ✅ Dùng HTML test page hoặc tool hỗ trợ SSE (Server-Sent Events)
- ✅ curl sẽ hiển thị từng chunk, không phải response hoàn chỉnh
