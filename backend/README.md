# Naver AI Hackathon - Backend API

FastAPI backend with example CRUD operations for Users, Chat Messages, and Interview Sessions.

## Project Structure

1. Store all domain directories inside `src` folder
   1. `src/` - highest level of an app, contains common models, configs, and constants, etc.
   2. `src/main.py` - root of the project, which inits the FastAPI app
2. Each package has its own router, schemas, models, etc.
   1. `router.py` - is a core of each module with all the endpoints
   2. `schemas.py` - for pydantic models
   3. `models.py` - for db models
   4. `service.py` - module specific business logic  
   5. `dependencies.py` - router dependencies
   6. `constants.py` - module specific constants and error codes
   7. `config.py` - e.g. env vars
   8. `utils.py` - non-business logic functions, e.g. response normalization, data enrichment, etc.
   9. `exceptions.py` - module specific exceptions, e.g. `PostNotFound`, `InvalidUserData`
3. When package requires services or dependencies or constants from other packages - import them with an explicit module name
```python
from src.auth import constants as auth_constants
from src.notifications import service as notification_service
from src.posts.constants import ErrorCode as PostsErrorCode  # in case we have Standard ErrorCode in constants module of each package
```

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
cd src
uvicorn main:app --reload
```

The API will be available at: http://localhost:8000

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Example API Requests

### Health Check
```bash
curl http://localhost:8000/health
```

### Create a User
```bash
curl -X POST http://localhost:8000/api/v1/examples/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe"
  }'
```

### Get All Users
```bash
curl http://localhost:8000/api/v1/examples/users
```

### Get a Specific User
```bash
curl http://localhost:8000/api/v1/examples/users/1
```

### Update a User
```bash
curl -X PUT http://localhost:8000/api/v1/examples/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Updated Doe"
  }'
```

### Delete a User
```bash
curl -X DELETE http://localhost:8000/api/v1/examples/users/1
```

### Create a Chat Message
```bash
curl -X POST http://localhost:8000/api/v1/examples/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "message": "Hello, how are you?"
  }'
```

### Get Chat Messages
```bash
# All messages
curl http://localhost:8000/api/v1/examples/chat

# Filter by user_id
curl http://localhost:8000/api/v1/examples/chat?user_id=1
```

### Create Interview Session
```bash
curl -X POST http://localhost:8000/api/v1/examples/interviews \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "position": "Software Engineer"
  }'
```

### Update Interview Session
```bash
curl -X PUT http://localhost:8000/api/v1/examples/interviews/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "score": 85,
    "feedback": "Great performance!"
  }'
```

### Get Interview Sessions
```bash
# All sessions
curl http://localhost:8000/api/v1/examples/interviews

# Filter by user_id
curl http://localhost:8000/api/v1/examples/interviews?user_id=1
```

## PowerShell Example Requests (Windows)

### Create a User
```powershell
$body = @{
    username = "johndoe"
    email = "john@example.com"
    full_name = "John Doe"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/examples/users" -Method Post -Body $body -ContentType "application/json"
```

### Get All Users
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/examples/users" -Method Get
```

### Create Chat Message
```powershell
$chatBody = @{
    user_id = 1
    message = "Hello, how are you?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/examples/chat" -Method Post -Body $chatBody -ContentType "application/json"
```

## Features

- ✅ FastAPI framework with automatic API documentation
- ✅ SQLAlchemy ORM with SQLite database
- ✅ Pydantic schemas for request/response validation
- ✅ CRUD operations for Users, Chat Messages, and Interview Sessions
- ✅ CORS middleware configured for frontend integration
- ✅ Database session management with dependency injection
- ✅ Custom exception handling
- ✅ Health check endpoints
