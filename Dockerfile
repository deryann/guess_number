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

# Set build arguments for versioning (need to redeclare in new stage)
ARG BUILD_DATE=dev
ARG GIT_HASH=dev

# Set environment variables for versioning
ENV MAIN_VERSION=${BUILD_DATE}
ENV MINOR_VERSION=${GIT_HASH}

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

# Set working directory to backend for running the application
WORKDIR /app/backend

# Initialize the database
RUN python database_setup.py

# Expose port
EXPOSE 12527

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "12527"]
