# ==============================================================================
# Production Dockerfile for Enterprise AWS Masterclass Platform
# ==============================================================================
FROM python:3.11-slim

# Install system dependencies for PostgreSQL (asyncpg/psycopg2) and curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy Backend application code
COPY backend ./backend

# Copy Interactive Masterclass Web App (exact UI/UX assets)
COPY aws-lambda-masterclass ./aws-lambda-masterclass

# Create data directory for local fallback persistence
RUN mkdir -p /app/data

# Environment configuration
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Expose port (Render automatically overrides via $PORT)
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["sh", "-c", "exec uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8080}"]
