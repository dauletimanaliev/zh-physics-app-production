# Deployment Instructions

## Frontend (Netlify) ✅ COMPLETED
- **URL**: https://zh-physics-app.windsurf.build
- **Status**: Successfully deployed
- **Project ID**: 0946c40c-4f17-47d2-9b0e-4bd506bf9a93

## Backend (Railway) - Next Steps

### 1. Create GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit for production deployment"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will automatically detect Python and use the configuration

### 3. Set Environment Variables in Railway
```
DATABASE_FILE=ent_bot_production.db
PORT=8000
```

### 4. Update Frontend API URL
Once Railway deployment is complete, update the API URL in:
- `/client/.env.production` → `REACT_APP_API_URL=https://your-railway-url.railway.app/api`

### 5. Redeploy Frontend
After updating the API URL, redeploy the frontend to Netlify.

## Files Created for Production
- `Procfile` - Railway startup command
- `start.py` - Production startup script
- `railway.json` - Railway configuration
- `init_production_db.py` - Database initialization
- Updated `requirements.txt` - Added FastAPI dependencies
- Updated `api_server.py` - Added CORS for production URL

## Production Database
- File: `ent_bot_production.db`
- Initialized with demo teacher (ID: 111333) and student (ID: 222444)
- All materials will be stored in production database

## Testing
After both deployments:
1. Visit https://zh-physics-app.windsurf.build
2. Login as teacher (code: 111333)
3. Create materials - should save to production database
4. Login as student (code: 222444) 
5. View published materials
