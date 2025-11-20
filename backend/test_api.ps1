# Test API Requests - PowerShell Script
# Make sure the server is running before executing these commands

$baseUrl = "http://localhost:8000"

Write-Host "🧪 Testing Naver AI Hackathon API" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1️⃣  Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health Check: " -ForegroundColor Green -NoNewline
    Write-Host ($health | ConvertTo-Json) -ForegroundColor White
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 2: Create a User
Write-Host "2️⃣  Creating a new user..." -ForegroundColor Yellow
try {
    $userBody = @{
        username = "johndoe"
        email = "john@example.com"
        full_name = "John Doe"
    } | ConvertTo-Json

    $newUser = Invoke-RestMethod -Uri "$baseUrl/api/v1/examples/users" -Method Post -Body $userBody -ContentType "application/json"
    Write-Host "✅ User Created: " -ForegroundColor Green -NoNewline
    Write-Host ($newUser | ConvertTo-Json) -ForegroundColor White
    $userId = $newUser.id
} catch {
    Write-Host "❌ Create user failed: $_" -ForegroundColor Red
    $userId = 1  # Use default ID if creation fails
}

Write-Host "`n---`n"

# Test 3: Get All Users
Write-Host "3️⃣  Getting all users..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/api/v1/examples/users" -Method Get
    Write-Host "✅ Users Retrieved: " -ForegroundColor Green -NoNewline
    Write-Host ($users | ConvertTo-Json) -ForegroundColor White
} catch {
    Write-Host "❌ Get users failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 4: Create a Chat Message
Write-Host "4️⃣  Creating a chat message..." -ForegroundColor Yellow
try {
    $chatBody = @{
        user_id = $userId
        message = "Hello! This is a test message from PowerShell."
    } | ConvertTo-Json

    $chatResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/examples/chat" -Method Post -Body $chatBody -ContentType "application/json"
    Write-Host "✅ Chat Message Created: " -ForegroundColor Green -NoNewline
    Write-Host ($chatResponse | ConvertTo-Json) -ForegroundColor White
} catch {
    Write-Host "❌ Create chat failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 5: Create an Interview Session
Write-Host "5️⃣  Creating an interview session..." -ForegroundColor Yellow
try {
    $interviewBody = @{
        user_id = $userId
        position = "Senior Software Engineer"
    } | ConvertTo-Json

    $interview = Invoke-RestMethod -Uri "$baseUrl/api/v1/examples/interviews" -Method Post -Body $interviewBody -ContentType "application/json"
    Write-Host "✅ Interview Session Created: " -ForegroundColor Green -NoNewline
    Write-Host ($interview | ConvertTo-Json) -ForegroundColor White
    $interviewId = $interview.id
} catch {
    Write-Host "❌ Create interview failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 6: Update Interview Session
Write-Host "6️⃣  Updating interview session..." -ForegroundColor Yellow
try {
    $updateBody = @{
        status = "completed"
        score = 92
        feedback = "Excellent performance! Strong technical skills and great communication."
    } | ConvertTo-Json

    $updatedInterview = Invoke-RestMethod -Uri "$baseUrl/api/v1/examples/interviews/$interviewId" -Method Put -Body $updateBody -ContentType "application/json"
    Write-Host "✅ Interview Updated: " -ForegroundColor Green -NoNewline
    Write-Host ($updatedInterview | ConvertTo-Json) -ForegroundColor White
} catch {
    Write-Host "❌ Update interview failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 7: Get Interview Sessions
Write-Host "7️⃣  Getting all interview sessions..." -ForegroundColor Yellow
try {
    $interviews = Invoke-RestMethod -Uri "$baseUrl/api/v1/examples/interviews" -Method Get
    Write-Host "✅ Interviews Retrieved: " -ForegroundColor Green -NoNewline
    Write-Host ($interviews | ConvertTo-Json) -ForegroundColor White
} catch {
    Write-Host "❌ Get interviews failed: $_" -ForegroundColor Red
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "✨ Testing Complete!" -ForegroundColor Cyan
Write-Host "`nVisit http://localhost:8000/docs for interactive API documentation" -ForegroundColor Yellow
