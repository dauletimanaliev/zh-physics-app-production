# Railway PostgreSQL Setup Guide

## 1. Create PostgreSQL Database on Railway

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL service
4. Copy the connection string from Railway dashboard

## 2. Update Environment Variables

Replace the DATABASE_URL in `.env.postgres` with your Railway PostgreSQL URL:

```
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

## 3. Deploy Backend to Railway

1. Connect your GitHub repository
2. Set environment variables in Railway dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `PORT`: 8000

## 4. Migration Commands

Run migration script to transfer data from SQLite to PostgreSQL:

```bash
# Set environment variable
export DATABASE_URL="your_railway_postgresql_url"

# Run migration
python migrate_to_postgres.py
```

## 5. Start New API Server

```bash
# Start PostgreSQL version
python api_server_postgres.py
```

## 6. Update Frontend API URL

Update client configuration to point to Railway deployment URL.

## Features Added:

✅ **PostgreSQL Database Schema**
- Enhanced user management with roles and activity tracking
- Material analytics with view tracking
- Message/notification system
- Schedule management
- User progress tracking
- Leaderboard functionality

✅ **Migration Script**
- Transfers all data from SQLite to PostgreSQL
- Maintains data integrity
- Maps user relationships correctly

✅ **Enhanced API Server**
- Full PostgreSQL integration
- Material view analytics
- Message broadcasting
- Progress tracking endpoints
- Teacher dashboard with statistics

✅ **New Features Ready**
- Real-time notifications
- Material view analytics
- User progress tracking
- Enhanced leaderboard
- Schedule management
