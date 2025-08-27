# Quick PostgreSQL Setup with Supabase (Free)

## Option 1: Supabase (Recommended - includes PostGIS)

1. Go to https://supabase.com and click "Start your project"
2. Sign up with GitHub or email
3. Create a new project:
   - Name: tradingpost
   - Database Password: (choose a strong password)
   - Region: (select closest to you)
4. Wait ~2 minutes for setup
5. Go to Settings → Database
6. Copy the connection string (URI)
7. Run in PowerShell:
   ```powershell
   $env:DB_URL = "YOUR_CONNECTION_STRING_HERE"
   python db_init.py --migrate --seed
   ```

## Option 2: Local Installation (Already Downloaded)

1. Go to your Downloads folder
2. Run `postgresql-installer.exe`
3. Follow the setup wizard
4. After installation, run:
   ```powershell
   $env:DB_URL = "postgresql://postgres:YOUR_PASSWORD@localhost:5432/tradingpost"
   python db_init.py --migrate --seed
   ```

## Current Status

Your SQLite database is already working with:
- ✅ 2 users (Frank & Bill)
- ✅ 8 listings
- ✅ AI matching enabled
- ✅ Geospatial data ready

You can continue using SQLite or upgrade to PostgreSQL anytime!