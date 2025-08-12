#!/bin/bash
# Manual Docker Image Publishing Script for Oscillo
# This script can be used to manually build and publish the Docker image to GHCR

set -e

# Configuration
IMAGE_NAME="ghcr.io/zachyzissou/interactive-music-3d"
TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo "🚀 Manual Docker Image Publishing for Oscillo"
echo "Target: $FULL_IMAGE_NAME"
echo "----------------------------------------"

# Check if we're in the right directory
if [ ! -f "Dockerfile" ] || [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the repository root directory"
    exit 1
fi

# Check if user is logged into GitHub Container Registry
echo "Checking GHCR authentication..."
if ! docker info | grep -q "Username"; then
    echo "⚠️  You may need to login to GitHub Container Registry:"
    echo "   docker login ghcr.io -u YOUR_GITHUB_USERNAME"
    echo "   Use a GitHub Personal Access Token as the password"
    echo ""
fi

# Build the image
echo "🏗️  Building Docker image..."
docker build -t $FULL_IMAGE_NAME .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    
    # Test the image locally
    echo "🧪 Testing image locally..."
    CONTAINER_ID=$(docker run -d -p 3002:3000 $FULL_IMAGE_NAME)
    
    # Wait for container to start
    sleep 10
    
    # Test health endpoint
    if curl -s http://localhost:3002/api/health > /dev/null; then
        echo "✅ Local test passed!"
    else
        echo "⚠️  Local test failed, but proceeding with push..."
    fi
    
    # Clean up test container
    docker stop $CONTAINER_ID >/dev/null 2>&1
    docker rm $CONTAINER_ID >/dev/null 2>&1
    
    # Push to GHCR
    echo "📤 Pushing to GitHub Container Registry..."
    docker push $FULL_IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        echo "✅ Image successfully pushed to GHCR!"
        echo ""
        echo "The image is now available at: $FULL_IMAGE_NAME"
        echo "The Unraid template should now work correctly."
        echo ""
        echo "To test manually:"
        echo "docker pull $FULL_IMAGE_NAME"
        echo "docker run -d -p 31415:3000 $FULL_IMAGE_NAME"
    else
        echo "❌ Failed to push image to GHCR"
        echo "Please check your authentication and try again"
        exit 1
    fi
    
else
    echo "❌ Failed to build Docker image"
    exit 1
fi

echo "🎉 Manual deployment completed!"