#!/bin/bash

set -e 

LOG_FILE="deploy.log"
REPO_DIR="$(pwd)"
echo " Current directory: $REPO_DIR"

exec > >(tee -a "$LOG_FILE") 2>&1 

echo "Starting Deployment at $(date)"

echo "🔑 Logging into Azure..."
az login --service-principal -u "$AZURE_APP_ID" -p "$AZURE_SECRET" --tenant "$AZURE_TENANT_ID"

# Pull latest code from GitLab
if [ ! -d ".git" ]; then
    echo "❌ ERROR: This script must be run from the root of the Git repository."
    exit 1
fi

# Check for uncommitted changes and stash them if necessary
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  WARNING: Uncommitted changes detected. Stashing them..."
    git stash
fi

# Build Angular frontend
echo "Installing Angular dependencies..."
cd hourmap-frontend
npm install || (echo "Angular npm install failed!" && exit 1)
echo "Building Angular app..."
ng build --configuration=production || (echo "❌ Angular build failed!" && exit 1)
cd ..

# Move Angular build to ASP.NET wwwroot (shouldn't be necessary)
# echo "📂 Moving frontend to backend..."
# rm -rf backend/wwwroot/*
# cp -r frontend/dist/frontend/* backend/wwwroot/ || (echo "❌ Failed to copy Angular build!" && exit 1)

# Build and publish .NET backend
echo "Building .NET Core backend..."
cd HourMap
dotnet clean
dotnet build || (echo "❌ .NET Build Failed!" && exit 1)

# We put this on the wrong line, whoops! 
dotnet publish --configuration Release --output bin/Publish || (echo "❌ .NET Publish Failed!" && exit 1)

# Zip up the publish folder for deployment
cd /bin/Publish
zip -r ../publish.zip .  # Create a ZIP of the deployment folder
cd ../../..


#Deploy to Azure App Service
echo "🚀 Deploying to Azure..."
az webapp deployment source config-zip --resource-group "hourmap_group" --name "hourmap" --src "backend/bin/publish.zip" || (echo "❌ Azure deployment failed!" && exit 1)

echo "✅ Deployment successful at $(date)!"
