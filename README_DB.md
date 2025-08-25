# Trading Post Database

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set database URL (optional, defaults to SQLite):
```bash
export DB_URL=postgresql://user:password@localhost/tradingpost
# or for local development:
export DB_URL=sqlite:///local.db
```

3. Initialize database with migrations and sample data:
```bash
python db_init.py --migrate --seed
```

## Running Tests

```bash
python db_init.py --test
```

## Database Schema

- **Users**: Trading app users with location, bio, and inference opt-in
- **Listings**: Items/services/tasks users want to buy or sell
- **Matches**: AI-suggested matches between users based on their listings
- **Inferences**: AI-inferred user needs and preferences

## Features

- PostgreSQL with PostGIS spatial indexing for production
- SQLite fallback for local development
- Alembic migrations support
- Comprehensive validation and error handling
- Sample data seeding with Frank and Bill users
- Unit tests with pytest