#!/bin/bash

set -e 

LOG_FILE="deploy.log"
exec > >(tee -a "$LOG_FILE") 2>&1 

echo "Starting Deployment at $(date)"

echo "🔑 Logging into Azure..."
az login --service-principal -u "$AZURE_APP_ID" -p "$AZURE_SECRET" --tenant "$AZURE_TENANT_ID"

echo "📥 Pulling latest code from GitLab..."
git clone https://oauth2:$GITLAB_TOKEN@gitlab.com/your-org/your-repo.git || (echo "❌ Git pull failed!" && exit 1)

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
dotnet publish --configuration Release --output bin/Publish || (echo "❌ .NET Publish Failed!" && exit 1)

# Deploy to Azure App Service
echo "🚀 Deploying to Azure..."
az webapp up --name "HourMapApp" --resource-group "hourmap_group" --runtime "DOTNETCORE|8.0" --src-path bin/Publish || (echo "❌ Azure deployment failed!" && exit 1)

echo "✅ Deployment successful at $(date)!"
