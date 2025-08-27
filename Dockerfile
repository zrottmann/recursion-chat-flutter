# Flutter Web Build Container for Appwrite Sites
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    xz-utils \
    zip \
    libglu1-mesa \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Flutter
ENV FLUTTER_VERSION=3.32.8
ENV FLUTTER_HOME=/usr/local/flutter
ENV PATH=$FLUTTER_HOME/bin:$PATH

RUN wget -q https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_${FLUTTER_VERSION}-stable.tar.xz \
    && tar xf flutter_linux_${FLUTTER_VERSION}-stable.tar.xz -C /usr/local \
    && rm flutter_linux_${FLUTTER_VERSION}-stable.tar.xz

# Configure Flutter for web
RUN flutter config --enable-web --no-analytics
RUN flutter precache --web

# Set working directory
WORKDIR /app

# Copy Flutter project files
COPY pubspec.yaml pubspec.lock ./
COPY lib/ lib/
COPY web/ web/
COPY assets/ assets/

# Install dependencies and build
RUN flutter pub get
RUN flutter build web --release --web-renderer canvaskit

# Create simple HTTP server for serving the app
FROM nginx:alpine
COPY --from=0 /app/build/web /usr/share/nginx/html

# Configure nginx for SPA routing
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    add_header X-Content-Type-Options "nosniff" always; \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]