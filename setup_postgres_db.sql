-- Create database and user for Trading Post
CREATE DATABASE tradingpost;
CREATE USER tradinguser WITH PASSWORD 'tradingpass';
GRANT ALL PRIVILEGES ON DATABASE tradingpost TO tradinguser;

-- Connect to the tradingpost database to enable PostGIS
\c tradingpost

-- Enable PostGIS extension (if installed)
CREATE EXTENSION IF NOT EXISTS postgis;