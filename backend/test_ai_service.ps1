# Test AI Service API - Text to Voice
# Make sure the server is running before executing these commands

$baseUrl = "http://localhost:8000"

Write-Host "🎤 Testing AI Service - Text to Voice API" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Korean Voice (nara - female)
Write-Host "1️⃣  Testing Korean Voice (nara)..." -ForegroundColor Yellow
try {
    $koreanBody = @{
        text = "안녕하세요, 반갑습니다. 네이버 AI 해커톤입니다."
        speaker = "nara"
        volume = 0
        speed = 0
        pitch = 0
        format = "mp3"
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$baseUrl/chat/text-to-voice" -Method Post -Body $koreanBody -ContentType "application/json"
    Write-Host "✅ Korean Voice Success: $($result.message)" -ForegroundColor Green
    Write-Host "   Format: $($result.format), Audio Length: $($result.audio_data.Length) chars (base64)" -ForegroundColor White
} catch {
    Write-Host "❌ Korean voice failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 2: English Voice (clara - female)
Write-Host "2️⃣  Testing English Voice (clara)..." -ForegroundColor Yellow
try {
    $englishBody = @{
        text = "Hello! Nice to meet you. Welcome to Naver AI Hackathon."
        speaker = "clara"
        volume = 0
        speed = 0
        pitch = 0
        format = "mp3"
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$baseUrl/chat/text-to-voice" -Method Post -Body $englishBody -ContentType "application/json"
    Write-Host "✅ English Voice Success: $($result.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ English voice failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 3: Download Audio File (Korean)
Write-Host "3️⃣  Downloading audio file..." -ForegroundColor Yellow
try {
    $downloadBody = @{
        text = "이것은 음성 파일 다운로드 테스트입니다."
        speaker = "jinho"
        speed = 1
        format = "mp3"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$baseUrl/chat/text-to-voice/audio" -Method Post -Body $downloadBody -ContentType "application/json" -OutFile "test_output.mp3"
    Write-Host "✅ Audio file saved: test_output.mp3" -ForegroundColor Green
    
    # Check file size
    $fileInfo = Get-Item "test_output.mp3"
    Write-Host "   File size: $($fileInfo.Length) bytes" -ForegroundColor White
} catch {
    Write-Host "❌ Download failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 4: Mixed Language (Korean + English)
Write-Host "4️⃣  Testing Mixed Language..." -ForegroundColor Yellow
try {
    $mixedBody = @{
        text = "안녕하세요. Hello. 반갑습니다. Nice to meet you."
        speaker = "nara"
        volume = 1
        speed = -1
        pitch = 0
        format = "mp3"
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$baseUrl/chat/text-to-voice" -Method Post -Body $mixedBody -ContentType "application/json"
    Write-Host "✅ Mixed Language Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Mixed language failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 5: Different Parameters
Write-Host "5️⃣  Testing Different Voice Parameters..." -ForegroundColor Yellow
try {
    $customBody = @{
        text = "This is a test with custom voice parameters."
        speaker = "matt"
        volume = 2
        speed = -2
        pitch = 1
        format = "mp3"
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$baseUrl/chat/text-to-voice" -Method Post -Body $customBody -ContentType "application/json"
    Write-Host "✅ Custom Parameters Success" -ForegroundColor Green
    Write-Host "   Speaker: matt, Volume: 2, Speed: -2, Pitch: 1" -ForegroundColor White
} catch {
    Write-Host "❌ Custom parameters failed: $_" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✨ Testing Complete!" -ForegroundColor Cyan
Write-Host "`nAvailable Speakers:" -ForegroundColor Yellow
Write-Host "  Korean: nara (여성), jinho (남성)" -ForegroundColor White
Write-Host "  English: clara (여성), matt (남성)" -ForegroundColor White
Write-Host "  Japanese: shinji (남성)" -ForegroundColor White
Write-Host "  Chinese: meimei (여성), liangliang (남성)" -ForegroundColor White
Write-Host "  Spanish: jose (남성), carmen (여성)" -ForegroundColor White
Write-Host "`nEndpoints:" -ForegroundColor Yellow
Write-Host "  POST /chat/text-to-voice - Returns JSON with base64 audio" -ForegroundColor White
Write-Host "  POST /chat/text-to-voice/audio - Returns audio file directly" -ForegroundColor White
