# Deploy API to Vercel

## Quick Setup Steps:

1. **Install Vercel CLI** (if you haven't):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy the API**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variable**:
   After deployment, add your OpenAI API key:
   ```bash
   vercel env add OPENAI_API_KEY
   ```
   Paste your OpenAI API key when prompted.

5. **Redeploy with Environment**:
   ```bash
   vercel --prod
   ```

## After Deployment:

- You'll get a URL like: `https://ninety-abc123.vercel.app`
- Your API endpoint will be: `https://ninety-abc123.vercel.app/api/chat`
- Update the `.env.local` file with your deployment URL:
  ```
  EXPO_PUBLIC_API_BASE_URL=https://ninety-abc123.vercel.app
  ```

## Testing:

Test your deployed API with curl:
```bash
curl -X POST https://ninety-abc123.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello Ava!"}]}'
```