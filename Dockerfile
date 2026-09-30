# Multi-stage Dockerfile for Commerce Hub SPA

# 1. Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies with caching
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build -- --configuration=production

# 2. Production Runtime Stage with Nginx
FROM nginx:alpine
LABEL maintainer="Commerce Hub Team"
LABEL description="Commerce Hub Modern Enterprise SPA"

# Remove default nginx site
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled SPA artifacts from builder
COPY --from=builder /app/dist/commerce-spa/browser /usr/share/nginx/html

# Copy custom Nginx configuration with SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
