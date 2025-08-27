# Trading Post Deployment Guide

## Overview

This guide covers deployment options for the Trading Post application, including local development, Docker Compose, and Kubernetes deployment.

## Prerequisites

- Docker and Docker Compose
- PostgreSQL with PostGIS extension
- Redis
- Python 3.12+
- kubectl (for Kubernetes deployment)

## Quick Start

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start the application
uvicorn app:app --reload
```

### Docker Compose Development

```bash
# Build and start all services
./deploy.sh dev up

# View logs
./deploy.sh dev logs

# Stop services
./deploy.sh dev down
```

### Production Deployment

```bash
# Create production environment file
cp .env.example .env.prod
# Edit .env.prod with production values

# Deploy to production
./deploy.sh prod up

# Scale backend service
./deploy.sh prod scale backend 5
```

### Kubernetes Deployment

```bash
# Build and deploy to Kubernetes
./deploy.sh k8s up

# Check deployment status
kubectl get all -n tradingpost

# View logs
./deploy.sh k8s logs

# Scale deployment
kubectl scale deployment tradingpost-backend -n tradingpost --replicas=5
```

## Architecture

### Services

1. **Backend API** (FastAPI)
   - RESTful API endpoints
   - Authentication with JWT
   - WebSocket support for real-time features
   - Horizontal scaling support

2. **PostgreSQL Database**
   - PostGIS extension for geospatial queries
   - Connection pooling
   - Automated backups

3. **Redis**
   - Session storage
   - Caching layer
   - Celery message broker

4. **Celery Workers**
   - Asynchronous task processing
   - Scheduled tasks with Celery Beat
   - Email notifications
   - ML model updates

5. **Nginx** (Production)
   - Reverse proxy
   - Load balancing
   - SSL termination
   - Rate limiting

## Configuration

### Environment Variables

Key environment variables:

```bash
DATABASE_URL=postgresql://user:password@host:port/dbname
REDIS_URL=redis://host:6379/0
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Monitoring

### Health Checks

- Backend: `http://localhost:8000/health`
- Database: PostgreSQL health check
- Redis: Redis PING command

### Metrics

- Prometheus metrics at `/metrics`
- Grafana dashboards for visualization
- Application logs in JSON format

## Scaling

### Horizontal Scaling

```bash
# Docker Compose
docker-compose up -d --scale backend=5

# Kubernetes
kubectl scale deployment tradingpost-backend --replicas=5
```

### Database Scaling

- Read replicas for query distribution
- Connection pooling with PgBouncer
- Partitioning for large tables

### Caching Strategy

- Redis for session storage
- API response caching (5-minute TTL)
- Geospatial query result caching

## Backup and Recovery

### Automated Backups

```bash
# Manual backup
./deploy.sh prod backup

# Scheduled backups run daily via cron
0 2 * * * /app/backup.sh
```

### Restore Process

```bash
# Restore from backup
gunzip < backup.sql.gz | docker-compose exec -T db psql -U tradingpost
```

## Security

1. **SSL/TLS**: Nginx handles SSL termination
2. **Rate Limiting**: 10 requests/second per IP
3. **Authentication**: JWT tokens with expiration
4. **Database Security**: Encrypted connections, limited privileges
5. **Secret Management**: Environment variables, K8s secrets

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database logs
   docker-compose logs db
   
   # Test connection
   docker-compose exec backend python -c "from app import engine; engine.connect()"
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis logs
   docker-compose logs redis
   
   # Test connection
   docker-compose exec backend redis-cli -h redis ping
   ```

3. **Migration Errors**
   ```bash
   # Check current revision
   docker-compose exec backend alembic current
   
   # Show migration history
   docker-compose exec backend alembic history
   ```

## Performance Tuning

### Backend
- Worker processes: 4 per CPU core
- Connection pool size: 100 per worker
- Request timeout: 120 seconds

### Database
- shared_buffers: 256MB
- effective_cache_size: 1GB
- max_connections: 200

### Redis
- maxmemory: 256MB
- maxmemory-policy: allkeys-lru

## CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and push Docker image
        run: |
          docker build -t tradingpost:${{ github.sha }} .
          docker push tradingpost:${{ github.sha }}
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/backend backend=tradingpost:${{ github.sha }}
```

## Support

For issues or questions:
1. Check logs: `./deploy.sh [env] logs`
2. Review documentation
3. Submit issues to project repository