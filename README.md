# Couple's Date Randomizer 💕

A mobile-first web application for couples to track date ideas and randomly select one based on filters. Built with React, Express, and LowDB.

## Features

- **Date Library**: Manage all your date ideas with full CRUD operations
- **Smart Randomizer**: Select categories and spin for a surprise date
- **AI Date Suggester**: Get personalized date suggestions based on your mood, energy level, and preferences using AI
- **History Tracking**: View completed dates and reset them back to the pool
- **Category Management**: Add, edit, and delete custom categories
- **User Tracking**: Track which partner added each date idea
- **Mobile-First Design**: Responsive UI optimized for mobile devices

## Tech Stack

- **Frontend**: React 18 + Vite, Tailwind CSS, Lucide React (icons)
- **Backend**: Node.js + Express
- **Database**: LowDB (JSON file-based)
- **AI**: Groq API
- **Deployment**: Docker + Docker Compose

## Quick Start

### Option 1: Docker (Recommended)

1. **Prerequisites**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

2. **Set up environment variables**:
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Edit .env and add your Groq API key
   # Get a free key at: https://console.groq.com/keys
   ```

3. **Run the application**:
   ```bash
   docker-compose up --build
   ```

4. **Access the app**:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000

5. **Stop the application**:
   ```bash
   docker-compose down
   ```

### Option 2: Local Development

1. **Prerequisites**: Install [Node.js](https://nodejs.org/) (v20 or higher)

2. **Set up environment variables**:
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Edit .env and add your Groq API key
   # Get a free key at: https://console.groq.com/keys
   ```

3. **Install dependencies**:
   ```bash
   # Install all dependencies
   npm run install:all
   ```

4. **Start backend** (in one terminal):
   ```bash
   cd backend
   npm run dev
   ```

5. **Start frontend** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the app**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## Project Structure

```
dating app/
├── backend/
│   ├── server.js          # Express server with API routes
│   ├── db.json            # LowDB database (auto-generated)
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── DateModal.jsx
│   │   │   └── CategoryModal.jsx
│   │   ├── pages/         # Page components
│   │   │   ├── DateLibrary.jsx
│   │   │   ├── Randomizer.jsx
│   │   │   └── DateHistory.jsx
│   │   ├── context/       # React context
│   │   │   └── UserContext.jsx
│   │   ├── utils/         # Utilities
│   │   │   └── api.js
│   │   ├── App.jsx        # Main app component
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── package.json
```

## Data Model

### Date Idea Object
```json
{
  "id": "uuid",
  "title": "Picnic at Central Park",
  "description": "Bring blanket, snacks, and frisbee",
  "category": "category-uuid",
  "subCategory": "Optional",
  "isUsed": false,
  "author": "User 1",
  "createdAt": "2025-11-22T10:00:00.000Z"
}
```

### Category Object
```json
{
  "id": "uuid",
  "name": "At Home",
  "type": "Home",
  "subCategories": ["Movies", "Board Games", "Cooking"]
}
```

## Default Categories

The app comes pre-seeded with these categories:
1. **Venues** (Restaurants, Cafes)
2. **Active Leisure** (SUP, Archery, Horse Riding)
3. **At Home** (Movies, Board Games, Cooking, Crafts, Gaming)
4. **Long Trip**
5. **Short Trip**
6. **Other Outings** (Massage, Pottery, Cinema, Theater, Picnic)

## API Endpoints

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Dates
- `GET /api/dates` - Get all dates (supports filters: category, author, isUsed)
- `GET /api/dates/:id` - Get single date
- `POST /api/dates` - Create new date
- `PUT /api/dates/:id` - Update date
- `DELETE /api/dates/:id` - Delete date
- `POST /api/dates/random` - Get random date from selected categories

## Usage Guide

### Adding a Date Idea
1. Go to the Library tab
2. Click "Add Date" button
3. Fill in title, description, category, and author
4. Click "Create"

### Managing Categories
1. Go to the Library tab
2. Click "Categories" button
3. Add, edit, or delete categories as needed

### Random Date Selection
1. Go to the Randomizer tab
2. Select one or more categories
3. Click "Spin the Wheel!"
4. Accept the date (marks as used) or reroll for another

### Viewing History
1. Go to the History tab
2. See all completed dates
3. Reset any date back to available pool

### Switching Users
- Use the user dropdown in the header to switch between User 1 and User 2

## Data Persistence

Data is stored in `backend/db.json`. When using Docker, this file is mounted as a volume, so your data persists even when containers are stopped.

**Backup your data**: Simply copy the `backend/db.json` file to a safe location.

## Customization

### Changing Colors
Edit `frontend/tailwind.config.js` to customize the color scheme:
```js
colors: {
  primary: {
    // Change these hex values
    500: '#ef4444',
    600: '#dc2626',
    // ...
  }
}
```

### Adding User Names
Replace "User 1" and "User 2" throughout the app with actual names:
- `frontend/src/App.jsx`
- `frontend/src/components/DateModal.jsx`

## Troubleshooting

### Docker Issues
- Make sure Docker Desktop is running
- Try `docker-compose down` and `docker-compose up --build`

### Port Conflicts
If ports 3000 or 8080 are already in use:
- Edit `docker-compose.yml` to use different ports
- Example: Change `"8080:80"` to `"9090:80"`

### Database Not Persisting
- Ensure `backend/db.json` exists and has write permissions
- Check Docker volume mounts in `docker-compose.yml`

## Development

## Local Development Method

1. Install Node.js from https://nodejs.org/
2. Open terminal in the project folder
3. Run: `npm run install:all`
4. Start backend: `npm run dev:backend` (in one terminal)
5. Start frontend: `npm run dev:frontend` (in another terminal)
6. Open browser to http://localhost:5173

### Hot Reload
When running locally (not Docker), both frontend and backend support hot reload:
- Frontend: Vite auto-reloads on file changes
- Backend: Node.js `--watch` flag auto-restarts on changes

### Building for Production
```bash
# Frontend
cd frontend
npm run build

# The built files will be in frontend/dist/
```

## Future Enhancements

Potential features to add:
- Date ratings and reviews
- Photo attachments
- Budget tracking
- Weather integration for outdoor dates
- Calendar integration
- Real user authentication
- Multiple couples support
- Date recommendations based on history

## License

MIT License - Feel free to use and modify as needed!

## Contributing

This is a personal project, but suggestions and improvements are welcome!

---

Made with ❤️ for couples who love adventure

### Google Calendar Integration

To enable Google Calendar integration:

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Configure OAuth consent screen if prompted
   - Select "Web application" as application type
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (for local development)
     - Your production domain
   - Copy the Client ID

4. **Update Environment Variables**:
   ```bash
   VITE_GOOGLE_CLIENT_ID=your_client_id_here
   VITE_GOOGLE_API_KEY=your_api_key_here
   ```
