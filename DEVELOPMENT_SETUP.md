# Trading Post - Development Environment Setup Guide

This guide will help you set up the Trading Post application for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (3.8 or higher) - [Download](https://www.python.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/)

### Windows Additional Requirements
- Windows 10/11 with WSL2 enabled (for Docker)
- PowerShell or Git Bash

### macOS/Linux Additional Requirements
- Make sure Docker daemon is running
- Bash shell

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Trading\ Post
```

### 2. Environment Setup

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Edit `.env` and update the following minimum required values:
- `SECRET_KEY` - Generate a secure random key
- `DATABASE_URL` - Leave default for local development
- `REDIS_URL` - Leave default for local development

### 3. Run the Setup Script

#### Windows
```powershell
# Using PowerShell
.\setup.bat

# Or for full setup
.\setup.bat setup
```

#### macOS/Linux
```bash
# Make script executable
chmod +x setup.sh

# Run setup
./setup.sh

# Or for full setup
./setup.sh setup
```

The setup script will:
1. Check all prerequisites
2. Create Python virtual environment
3. Install backend dependencies
4. Install frontend dependencies
5. Start PostgreSQL and Redis via Docker
6. Run database migrations
7. Start the application

## Manual Setup (Alternative)

If you prefer to set up manually or the script fails:

### 1. Start Infrastructure Services

```bash
# Start PostgreSQL and Redis
docker compose up -d postgres redis
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 3002 --reload
```

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Accessing the Application

Once everything is running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3002
- **API Documentation**: http://localhost:3002/docs
- **Database**: PostgreSQL on localhost:5432
- **Redis**: Redis on localhost:6379

## Development Workflow

### 1. Backend Development

The backend uses FastAPI with hot-reload enabled:

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload
```

Key directories:
- `backend/app/` - Main application code
- `backend/app/api/` - API endpoints
- `backend/app/models/` - Database models
- `backend/app/services/` - Business logic
- `backend/tests/` - Test files

### 2. Frontend Development

The frontend uses React with hot-reload:

```bash
cd frontend
npm run dev
```

Key directories:
- `frontend/src/` - React source code
- `frontend/src/components/` - React components
- `frontend/src/services/` - API services
- `frontend/src/store/` - Redux store

### 3. Database Migrations

Create a new migration:
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback migration:
```bash
alembic downgrade -1
```

## Common Development Tasks

### Running Tests

Backend tests:
```bash
cd backend
pytest
```

Frontend tests:
```bash
cd frontend
npm test
```

### Code Formatting

Backend (Python):
```bash
cd backend
black .
flake8 .
```

Frontend (JavaScript):
```bash
cd frontend
npm run lint
npm run format
```

### Creating Test Data

```bash
cd backend
python scripts/create_test_data.py
```

### Checking Database

```bash
# Connect to PostgreSQL
docker exec -it tradingpost_postgres psql -U tradingpost -d tradingpost

# Common queries
\dt  # List tables
\d users  # Describe users table
SELECT * FROM users LIMIT 5;  # View users
```

## Troubleshooting

### Port Already in Use

If you get port conflicts:

```bash
# Find process using port (example for port 3000)
# Windows:
netstat -ano | findstr :3000
# macOS/Linux:
lsof -i :3000

# Kill the process or change the port in .env
```

### Docker Issues

```bash
# Reset Docker containers
docker compose down -v
docker compose up -d postgres redis

# Check Docker logs
docker compose logs -f postgres
docker compose logs -f redis
```

### Database Connection Issues

1. Ensure PostgreSQL container is running:
   ```bash
   docker ps
   ```

2. Check connection string in `.env`:
   ```
   DATABASE_URL=postgresql://tradingpost:tradingpost123@localhost:5432/tradingpost
   ```

3. Test connection:
   ```bash
   docker exec -it tradingpost_postgres pg_isready
   ```

### Frontend Can't Connect to Backend

1. Check CORS settings in backend
2. Ensure backend is running on correct port (3002)
3. Check frontend API configuration in `frontend/src/config.js`

## IDE Setup

### VS Code

Recommended extensions:
- Python (ms-python.python)
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Docker (ms-azuretools.vscode-docker)

Settings (.vscode/settings.json):
```json
{
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "eslint.enable": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### PyCharm

1. Set Python interpreter to virtual environment
2. Mark `backend` as Sources Root
3. Enable Django support (even though we use FastAPI)

## Next Steps

- Review the [API Documentation](http://localhost:3002/docs)
- Check out example API calls in `docs/api-examples.md`
- Read the architecture documentation in `docs/architecture.md`
- Set up your IDE with recommended extensions
- Join the development Discord/Slack channel

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review existing GitHub issues
3. Ask in the development chat
4. Create a new GitHub issue with:
   - Your OS and versions
   - Error messages
   - Steps to reproduce