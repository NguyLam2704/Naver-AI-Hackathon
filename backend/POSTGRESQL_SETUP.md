# PostgreSQL Setup Guide

## 1. Cài đặt PostgreSQL

### Windows:

1. Download PostgreSQL từ: https://www.postgresql.org/download/windows/
2. Chạy installer và làm theo hướng dẫn
3. Nhớ password cho user `postgres`

Hoặc dùng Docker:

```powershell
docker run --name naver-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=naver_ai_hackathon -p 5432:5432 -d postgres:15
```

## 2. Tạo Database

### Cách 1: Sử dụng psql

```bash
psql -U postgres
CREATE DATABASE naver_ai_hackathon;
\q
```

### Cách 2: Sử dụng pgAdmin

1. Mở pgAdmin
2. Right-click trên Databases
3. Create > Database
4. Đặt tên: `naver_ai_hackathon`

## 3. Cấu hình Backend

Tạo file `.env` trong thư mục `backend`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/naver_ai_hackathon
```

Hoặc sửa trong `src/config.py` nếu không dùng .env file.

## 4. Cài đặt Dependencies

```powershell
cd backend
python -m pip install -r requirements.txt
```

## 5. Chạy Server

```powershell
cd src
python -m uvicorn main:app --reload
```

Database tables sẽ được tạo tự động khi start server!

## Connection String Format

```
postgresql://username:password@host:port/database_name
```

Ví dụ:

- Local: `postgresql://postgres:postgres@localhost:5432/naver_ai_hackathon`
- Docker: `postgresql://postgres:postgres@localhost:5432/naver_ai_hackathon`
- Remote: `postgresql://user:pass@your-server.com:5432/dbname`

## Test Connection

```powershell
# Test bằng Python
python -c "from sqlalchemy import create_engine; engine = create_engine('postgresql://postgres:postgres@localhost:5432/naver_ai_hackathon'); print('Connection successful!' if engine.connect() else 'Failed')"
```
