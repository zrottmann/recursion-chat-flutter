#!/bin/bash

# Deployment script for Trading Post application

set -e

echo "Trading Post Deployment Script"
echo "=============================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Parse command line arguments
ENVIRONMENT=${1:-dev}
ACTION=${2:-up}

case $ENVIRONMENT in
    dev)
        echo "Deploying development environment..."
        COMPOSE_FILE="docker-compose.yml"
        ;;
    prod)
        echo "Deploying production environment..."
        COMPOSE_FILE="docker-compose.prod.yml"
        ;;
    k8s)
        echo "Deploying to Kubernetes..."
        if ! command -v kubectl &> /dev/null; then
            echo "kubectl is not installed. Please install kubectl first."
            exit 1
        fi
        ;;
    *)
        echo "Invalid environment: $ENVIRONMENT"
        echo "Usage: ./deploy.sh [dev|prod|k8s] [up|down|restart|logs|build]"
        exit 1
        ;;
esac

# Execute action
case $ACTION in
    up)
        if [ "$ENVIRONMENT" = "k8s" ]; then
            echo "Building Docker image..."
            docker build -t tradingpost-backend:latest .
            
            echo "Applying Kubernetes manifests..."
            kubectl apply -f k8s-deployment.yaml
            
            echo "Waiting for pods to be ready..."
            kubectl wait --for=condition=ready pod -l app=tradingpost-backend -n tradingpost --timeout=300s
            
            echo "Kubernetes deployment complete!"
            kubectl get all -n tradingpost
        else
            echo "Starting services..."
            docker-compose -f $COMPOSE_FILE up -d
            
            echo "Waiting for services to be healthy..."
            sleep 10
            
            echo "Running database migrations..."
            docker-compose -f $COMPOSE_FILE exec backend alembic upgrade head
            
            echo "Services are up and running!"
            docker-compose -f $COMPOSE_FILE ps
        fi
        ;;
    down)
        if [ "$ENVIRONMENT" = "k8s" ]; then
            echo "Removing Kubernetes deployment..."
            kubectl delete -f k8s-deployment.yaml
        else
            echo "Stopping services..."
            docker-compose -f $COMPOSE_FILE down
        fi
        ;;
    restart)
        if [ "$ENVIRONMENT" = "k8s" ]; then
            echo "Restarting Kubernetes deployment..."
            kubectl rollout restart deployment -n tradingpost
        else
            echo "Restarting services..."
            docker-compose -f $COMPOSE_FILE restart
        fi
        ;;
    logs)
        if [ "$ENVIRONMENT" = "k8s" ]; then
            echo "Showing Kubernetes logs..."
            kubectl logs -f -l app=tradingpost-backend -n tradingpost
        else
            echo "Showing service logs..."
            docker-compose -f $COMPOSE_FILE logs -f
        fi
        ;;
    build)
        if [ "$ENVIRONMENT" = "k8s" ]; then
            echo "Building Docker image..."
            docker build -t tradingpost-backend:latest .
        else
            echo "Building services..."
            docker-compose -f $COMPOSE_FILE build
        fi
        ;;
    scale)
        if [ "$ENVIRONMENT" = "k8s" ]; then
            REPLICAS=${3:-3}
            echo "Scaling backend to $REPLICAS replicas..."
            kubectl scale deployment tradingpost-backend -n tradingpost --replicas=$REPLICAS
        else
            SERVICE=${3:-backend}
            REPLICAS=${4:-3}
            echo "Scaling $SERVICE to $REPLICAS instances..."
            docker-compose -f $COMPOSE_FILE up -d --scale $SERVICE=$REPLICAS
        fi
        ;;
    backup)
        echo "Creating database backup..."
        if [ "$ENVIRONMENT" = "k8s" ]; then
            kubectl exec -it postgres-0 -n tradingpost -- pg_dump -U tradingpost tradingpost | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
        else
            docker-compose -f $COMPOSE_FILE exec db pg_dump -U tradingpost tradingpost | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
        fi
        echo "Backup completed!"
        ;;
    *)
        echo "Invalid action: $ACTION"
        echo "Usage: ./deploy.sh [dev|prod|k8s] [up|down|restart|logs|build|scale|backup]"
        exit 1
        ;;
esac

echo "Deployment script completed!"