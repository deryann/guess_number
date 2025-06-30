#!/bin/bash

# Get current date for main version (YYYYMMDD format)
BUILD_DATE=$(date +"%Y%m%d")

# Get Git commit hash for minor version (short hash)
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "dev")

# Set default values if git is not available
if [ "$GIT_HASH" = "dev" ]; then
    echo "Warning: Git not available or not in a git repository. Using 'dev' as version."
fi

# Image name and tag
IMAGE_NAME="guess-number-game"
IMAGE_TAG="${BUILD_DATE}.${GIT_HASH}"

echo "Building Docker image with version: ${IMAGE_TAG}"
echo "Main version (BUILD_DATE): ${BUILD_DATE}"
echo "Minor version (GIT_HASH): ${GIT_HASH}"

# Build Docker image with build arguments
docker build \
    --build-arg BUILD_DATE="${BUILD_DATE}" \
    --build-arg GIT_HASH="${GIT_HASH}" \
    -t "${IMAGE_NAME}:${IMAGE_TAG}" \
    -t "${IMAGE_NAME}:latest" \
    -t "deryannhuang/guess_number:${IMAGE_TAG}" \
    -t "deryannhuang/guess_number:latest" \
    .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo "Image tags:"
    echo "  - ${IMAGE_NAME}:${IMAGE_TAG}"
    echo "  - ${IMAGE_NAME}:latest"
    echo "  - deryannhuang/guess_number:${IMAGE_TAG}"
    echo "  - deryannhuang/guess_number:latest"
    echo ""
    echo "To run the container:"
    echo "  docker run -p 8000:8000 ${IMAGE_NAME}:latest"
else
    echo "❌ Docker build failed!"
    exit 1
fi
