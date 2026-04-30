# Deployment Guide (Frontend + Backend + Atlas)

This project is deployable online with your current dependencies.

## 1) Deploy Backend (Render/Railway/Fly.io)

Set backend root to `n95/backend` and start command to:

```bash
npm start
```

### Required backend environment variables

```env
MONGO_URI=<your-atlas-connection-string>
JWT_SECRET=<long-random-secret>
EMAIL_USER=<smtp-or-gmail-user>
EMAIL_PASS=<smtp-or-gmail-app-password>
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com
OPENROUTER_KEY=<optional-if-ai-routes-used>
OPENROUTER_MODEL=<optional-model-name>
```

Notes:
- `CORS_ORIGINS` supports multiple origins with commas.
- Example: `CORS_ORIGINS=https://app.com,https://www.app.com`.
- Health check endpoint: `/api/health`.

## 2) Deploy Frontend (Vercel/Netlify)

Set frontend root to `n95/frontend` and build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

### Required frontend environment variables

```env
VITE_API_URL=https://your-backend-domain.com
```

## 3) Atlas Free Tier checklist

- Keep total DB size under 512 MB.
- Do not store images/files directly in MongoDB documents.
- Store file URLs instead (Cloudinary/S3/etc.).
- Add TTL indexes for temporary records (OTP/tokens).

## 4) Post-deploy verification

1. Open backend URL `/api/health` and confirm `{ "ok": true }`.
2. Load frontend and test register/login.
3. Add a product and open chat.
4. Verify Socket.IO works across two browser sessions.
5. Test password reset and contact email flow.
