# Test Female and Male Voice APIs
# Make sure the server is running before executing these commands

$baseUrl = "http://localhost:8000"

Write-Host "🎤 Testing Female & Male Voice APIs" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

# Test 1: Female Voice (Clara - English)
Write-Host "1️⃣  Testing Female Voice (Clara)..." -ForegroundColor Yellow
try {
    $femaleBody = @{
        text = "Hello! This is a female voice test. Nice to meet you!"
        volume = 0
        speed = 0
        pitch = 0
        format = "mp3"
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$baseUrl/chat/female-voice" -Method Post -Body $femaleBody -ContentType "application/json"
    Write-Host "✅ Female Voice Success: $($result.message)" -ForegroundColor Green
    Write-Host "   Speaker: Clara (English Female)" -ForegroundColor White
    Write-Host "   Audio data length: $($result.audio_data.Length) chars" -ForegroundColor White
} catch {
    Write-Host "❌ Female voice failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 2: Male Voice (Matt - English)
Write-Host "2️⃣  Testing Male Voice (Matt)..." -ForegroundColor Yellow
try {
    $maleBody = @{
        text = "Hello! This is a male voice test. Welcome to our service!"
        volume = 0
        speed = 0
        pitch = 0
        format = "mp3"
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$baseUrl/chat/male-voice" -Method Post -Body $maleBody -ContentType "application/json"
    Write-Host "✅ Male Voice Success: $($result.message)" -ForegroundColor Green
    Write-Host "   Speaker: Matt (English Male)" -ForegroundColor White
    Write-Host "   Audio data length: $($result.audio_data.Length) chars" -ForegroundColor White
} catch {
    Write-Host "❌ Male voice failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 3: Download Female Voice Audio
Write-Host "3️⃣  Downloading Female Voice Audio..." -ForegroundColor Yellow
try {
    $downloadFemale = @{
        text = "This is a downloadable female voice audio file."
        speed = 0
        format = "mp3"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$baseUrl/chat/female-voice/audio" -Method Post -Body $downloadFemale -ContentType "application/json" -OutFile "female_voice.mp3"
    Write-Host "✅ Female voice audio saved: female_voice.mp3" -ForegroundColor Green
    
    $fileInfo = Get-Item "female_voice.mp3"
    Write-Host "   File size: $($fileInfo.Length) bytes" -ForegroundColor White
} catch {
    Write-Host "❌ Download failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 4: Download Male Voice Audio
Write-Host "4️⃣  Downloading Male Voice Audio..." -ForegroundColor Yellow
try {
    $downloadMale = @{
        text = "This is a downloadable male voice audio file."
        speed = 0
        format = "mp3"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$baseUrl/chat/male-voice/audio" -Method Post -Body $downloadMale -ContentType "application/json" -OutFile "male_voice.mp3"
    Write-Host "✅ Male voice audio saved: male_voice.mp3" -ForegroundColor Green
    
    $fileInfo = Get-Item "male_voice.mp3"
    Write-Host "   File size: $($fileInfo.Length) bytes" -ForegroundColor White
} catch {
    Write-Host "❌ Download failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 5: Compare Female and Male with same text
Write-Host "5️⃣  Comparing Female vs Male Voice (same text)..." -ForegroundColor Yellow
$compareText = "Thank you for using our voice service. Have a great day!"

try {
    Write-Host "   Creating female version..." -ForegroundColor Gray
    $compareBody = @{
        text = $compareText
        format = "mp3"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$baseUrl/chat/female-voice/audio" -Method Post -Body $compareBody -ContentType "application/json" -OutFile "compare_female.mp3"
    
    Write-Host "   Creating male version..." -ForegroundColor Gray
    Invoke-RestMethod -Uri "$baseUrl/chat/male-voice/audio" -Method Post -Body $compareBody -ContentType "application/json" -OutFile "compare_male.mp3"
    
    $femaleSize = (Get-Item "compare_female.mp3").Length
    $maleSize = (Get-Item "compare_male.mp3").Length
    
    Write-Host "✅ Comparison files created:" -ForegroundColor Green
    Write-Host "   - compare_female.mp3 ($femaleSize bytes)" -ForegroundColor White
    Write-Host "   - compare_male.mp3 ($maleSize bytes)" -ForegroundColor White
} catch {
    Write-Host "❌ Comparison failed: $_" -ForegroundColor Red
}

Write-Host "`n===================================" -ForegroundColor Cyan
Write-Host "✨ Testing Complete!" -ForegroundColor Cyan
Write-Host "`nAPI Endpoints:" -ForegroundColor Yellow
Write-Host "  POST /chat/female-voice - Female voice (Clara) JSON response" -ForegroundColor White
Write-Host "  POST /chat/male-voice - Male voice (Matt) JSON response" -ForegroundColor White
Write-Host "  POST /chat/female-voice/audio - Female voice audio file" -ForegroundColor White
Write-Host "  POST /chat/male-voice/audio - Male voice audio file" -ForegroundColor White
Write-Host "`nRequest Format:" -ForegroundColor Yellow
Write-Host '  { "text": "Your text here", "volume": 0, "speed": 0, "pitch": 0, "format": "mp3" }' -ForegroundColor White
