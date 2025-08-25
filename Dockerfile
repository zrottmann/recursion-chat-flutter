FROM python:3.11-slim

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Build frontend if package.json exists
RUN if [ -f "trading-app-frontend/package.json" ]; then \
        cd trading-app-frontend && \
        npm install && \
        npm run build && \
        cd ..; \
    fi

# Create necessary directories
RUN mkdir -p uploads static logs

# Copy frontend build to static directory if it exists
RUN if [ -d "trading-app-frontend/build" ]; then \
        cp -r trading-app-frontend/build/* static/ 2>/dev/null || true; \
    fi

# Set proper permissions for created directories
RUN chmod -R 755 uploads static logs trading-app-frontend || true

# Create a non-root user for security
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

# Expose port 8080 (DigitalOcean standard)
EXPOSE 8080

# Add health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start the FastAPI application
CMD ["uvicorn", "app_sqlite:app", "--host", "0.0.0.0", "--port", "8080", "--log-level", "info"]