# Naver AI Hackathon - Backend Deployment

## Deploy to Vercel

### Prerequisites

1. Install Vercel CLI: `npm i -g vercel`
2. Sign up at [vercel.com](https://vercel.com)

### Setup Steps

1. **Set Environment Variables in Vercel Dashboard:**

   - Go to Project Settings → Environment Variables
   - Add the following variables:
     ```
     GEMINI_API_KEY=your_api_key
     CLOVA_CLIENT_ID=your_client_id
     CLOVA_CLIENT_SECRET=your_client_secret
     CLOVA_API_URL=https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts
     DATABASE_URL=your_postgres_url (optional)
     ```

2. **Deploy:**

   ```bash
   cd backend
   vercel --prod
   ```

3. **Set Custom Domain (Optional):**
   - Go to Project Settings → Domains
   - Add your custom domain

### Important Notes

- **Streaming Support:** Vercel supports Server-Sent Events (SSE), so `/chat/stream` endpoint will work
- **File Storage:** Uploaded files are stored temporarily and cleaned up after processing
- **Database:** PostgreSQL connection is optional for AI services
- **Cold Starts:** First request may take 5-10 seconds (Vercel serverless limitation)
- **Timeout:** Maximum execution time is 60 seconds on Pro plan, 10 seconds on Hobby plan

### Alternative: Railway.app

If you need longer execution times or persistent storage:

1. Sign up at [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Add environment variables
4. Railway will auto-deploy on every git push

### Local Development

```bash
cd backend/src
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### API Endpoints

- Health Check: `GET /health`
- Chat Stream: `POST /chat/stream`
- File Upload: `POST /files/upload`
- Voice TTS: `POST /chat/female-voice`, `POST /chat/male-voice`

See `API_TESTING_GUIDE.md` for detailed API documentation.
