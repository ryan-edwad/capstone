#!/bin/bash

set -e 

LOG_FILE="local_run.log"
REPO_DIR="$(pwd)"
PASSWORD="Password@1"

echo " Current directory: $REPO_DIR"

exec > >(tee -a "$LOG_FILE") 2>&1 

echo "Starting Local Environment at $(date)"

CONTAINER_NAME="sql"
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "SQL Server container is already running!"
else
    echo "Starting SQL Server container..."
    docker-compose up -d || (echo "❌ Docker Compose failed!" && exit 1)
    
    # Wait for SQL Server to be available
    echo "Waiting for SQL Server to start..."
    until docker exec $CONTAINER_NAME /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P "$PASSWORD" -Q "SELECT 1" &> /dev/null
    do
        echo "⏳ SQL Server is not ready yet..."
        sleep 3
    done

    echo "✅ SQL Server is ready!"
fi

# ANGULAR BUILD
echo "Installing Angular dependencies..."
cd hourmap-frontend
npm install || (echo "Angular npm install failed!" && exit 1)
echo "Building Angular app..."
ng build --configuration=development || (echo "❌ Angular build failed!" && exit 1)
cd ..

# ASP.NET BUILD/RUN
echo "Building .NET Core backend..."
cd HourMap
dotnet clean
dotnet build || (echo "❌ .NET Build Failed!" && exit 1)

echo "Running .NET API Locally..."
dotnet run --no-launch-profile

echo "✅ Local environment is running!"
