# Stage 1: Builder stage
FROM python:3.11-slim AS builder

# Set build arguments for versioning
ARG BUILD_DATE=dev
ARG GIT_HASH=dev

# Set environment variables for versioning
ENV MAIN_VERSION=${BUILD_DATE}
ENV MINOR_VERSION=${GIT_HASH}

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime stage
FROM python:3.11-slim

# Install sqlite3 for database integrity checks
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

# Set build arguments for versioning (need to redeclare in new stage)
ARG BUILD_DATE=dev
ARG GIT_HASH=dev

# Set environment variables for versioning
ENV MAIN_VERSION=${BUILD_DATE}
ENV MINOR_VERSION=${GIT_HASH}

# Set data directory environment variable
ENV DATA_DIR=/app/data

# Set working directory
WORKDIR /app

# Copy Python packages from builder stage
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable:
ENV PATH=/root/.local/bin:$PATH

# Copy backend files
COPY backend/ ./backend/

# Copy frontend files to serve static content
COPY frontend/ ./frontend/

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create data directory (will be overridden by volume mount)
RUN mkdir -p /app/data

# Set working directory to backend for running the application
WORKDIR /app/backend

# Declare volume for persistent data
VOLUME ["/app/data"]

# Expose port
EXPOSE 12527

# Use entrypoint script to handle initialization
ENTRYPOINT ["/app/entrypoint.sh"]
