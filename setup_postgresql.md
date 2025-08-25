# PostgreSQL Setup Options for Windows

Since Docker is not installed, you have two options:

## Option 1: Install PostgreSQL Directly (Recommended)

1. Download PostgreSQL installer from: https://www.postgresql.org/download/windows/
2. Run the installer and follow these steps:
   - Set password for postgres user (remember this!)
   - Default port: 5432
   - Install Stack Builder (optional, but useful for PostGIS)

3. After installation, install PostGIS:
   - Open Stack Builder
   - Select PostgreSQL installation
   - Choose "Spatial Extensions" → "PostGIS"

4. Create database and user:
   ```sql
   -- Open pgAdmin or psql command line
   CREATE DATABASE tradingpost;
   CREATE USER tradinguser WITH PASSWORD 'tradingpass';
   GRANT ALL PRIVILEGES ON DATABASE tradingpost TO tradinguser;
   
   -- Enable PostGIS
   \c tradingpost
   CREATE EXTENSION postgis;
   ```

5. Set environment variable and run:
   ```cmd
   set DB_URL=postgresql://tradinguser:tradingpass@localhost:5432/tradingpost
   python db_init.py --migrate --seed
   ```

## Option 2: Use Cloud PostgreSQL (Quick Alternative)

You can use a free PostgreSQL service like:
- Supabase: https://supabase.com (Free tier with PostGIS)
- Neon: https://neon.tech (Free tier)
- ElephantSQL: https://www.elephantsql.com (Free tier)

Example with Supabase:
1. Sign up at supabase.com
2. Create new project
3. Get connection string from Settings → Database
4. Run: `set DB_URL=<your-connection-string>`
5. Run: `python db_init.py --migrate --seed`

## Option 3: Continue with SQLite

The app works perfectly with SQLite for development:
```cmd
python db_init.py --migrate --seed
```

SQLite is already configured and working!