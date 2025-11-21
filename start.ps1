# Date Randomizer - Quick Start Script
# Run this script to start the application with Docker

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Date Randomizer Quick Start  " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if (-not $dockerInstalled) {
    Write-Host "ERROR: Docker is not installed!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Docker found!" -ForegroundColor Green
Write-Host ""

# Check if Docker is running
Write-Host "Checking if Docker is running..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Docker is running!" -ForegroundColor Green
Write-Host ""

# Start the application
Write-Host "Starting Date Randomizer..." -ForegroundColor Cyan
Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
Write-Host ""

docker-compose up --build

# This line only runs if user stops the containers with Ctrl+C
Write-Host ""
Write-Host "Application stopped." -ForegroundColor Yellow
Write-Host "To restart, run this script again or use: docker-compose up" -ForegroundColor Cyan
