# Quick Start Script for FastAPI Backend
# Run this from the backend directory

Write-Host "🚀 Starting Naver AI Hackathon Backend..." -ForegroundColor Cyan

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
python -m pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Start the server
Write-Host "`n🌟 Starting FastAPI server..." -ForegroundColor Green
Write-Host "API Documentation will be available at:" -ForegroundColor Cyan
Write-Host "  - Swagger UI: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - ReDoc: http://localhost:8000/redoc" -ForegroundColor White
Write-Host "`nPress Ctrl+C to stop the server`n" -ForegroundColor Yellow

Set-Location src
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
