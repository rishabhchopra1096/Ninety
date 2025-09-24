# Deploy API to Railway

## Quick Setup Steps:

1. **Go to Railway website**:
   ```
   https://railway.app
   ```

2. **Sign up/Login** with GitHub

3. **Create new project**:
   - Click "Deploy from GitHub repo"
   - Select your `ninety` repository 
   - Choose "Deploy from a folder" and select `server/`

4. **Set Environment Variable**:
   - In Railway dashboard → Variables tab
   - Add: `OPENAI_API_KEY` = `your-openai-key`

5. **Deploy**:
   - Railway will auto-deploy from the `server/` folder
   - You'll get a URL like: `https://ninety-production-abc.up.railway.app`

## After Deployment:

Update your `.env.local` file:
```
EXPO_PUBLIC_API_BASE_URL=https://your-railway-url.up.railway.app
```

## Testing:

Test your deployed API:
```bash
curl -X POST https://your-railway-url.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello Ava!"}]}'
```