# Development Commands Cheat Sheet

## Docker Commands

```bash
# Start application (builds if needed)
docker-compose up --build

# Start in detached mode (background)
docker-compose up -d

# Stop application
docker-compose down

# View logs
docker-compose logs -f

# Rebuild specific service
docker-compose build frontend
docker-compose build backend

# Remove all containers and volumes
docker-compose down -v
```

## Local Development Commands

```bash
# Install all dependencies (first time setup)
npm run install:all

# Start backend (Terminal 1)
cd backend
npm run dev

# Start frontend (Terminal 2)
cd frontend
npm run dev

# Build frontend for production
cd frontend
npm run build
```

## Git Commands (if using version control)

```bash
# Initialize repository
git init
git add .
git commit -m "Initial commit: Couple's Date Randomizer MVP"

# Create .gitignore is already set up to ignore:
# - node_modules/
# - backend/db.json (your data)
# - .env files
```

## Useful Scripts

```bash
# Check if ports are available (PowerShell)
Test-NetConnection -ComputerName localhost -Port 3000
Test-NetConnection -ComputerName localhost -Port 8080

# Clear npm cache if having issues
npm cache clean --force
```

## Database Management

```bash
# Backup database
copy backend\db.json backend\db.backup.json

# Reset database (delete to recreate with defaults)
del backend\db.json

# View database contents
type backend\db.json
```

## Troubleshooting

```bash
# If Docker containers won't stop
docker-compose down --remove-orphans

# Remove all Docker images and start fresh
docker system prune -a

# Check what's running on a port (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
```
