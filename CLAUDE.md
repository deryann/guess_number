# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a classic 4A0B number guessing game with a Python FastAPI backend and vanilla HTML/CSS/JavaScript frontend. The application uses SQLite for data persistence and supports Docker deployment.

## Architecture

**Backend (`/backend/`)**:
- FastAPI application in `main.py` with CORS enabled
- SQLite database (`ranking.db`) with three tables: `games`, `rankings`, `game_history`
- UUID-based game session management
- Version information from environment variables (`MAIN_VERSION`, `MINOR_VERSION`)

**Frontend (`/frontend/`)**:
- Vanilla JavaScript with dynamic API URL detection
- Game state management with session-based tracking
- Dynamic table generation for game history (5 rows per table)
- Real-time timer and guess counter

**Database Schema**:
- `games`: Stores active game sessions with UUID, answer, player info
- `rankings`: TOP 10 leaderboard sorted by guess count then duration
- `game_history`: Individual guess records linked to game sessions

## Common Commands

### Development
```bash
# Backend setup (first time only)
cd backend
pip install -r requirements.txt
python database_setup.py

# Run backend server
cd backend
uvicorn main:app --reload --port 12527

# Frontend: Open frontend/index.html in browser
```

### Docker Deployment
```bash
# Build with versioning
chmod +x start_build.sh
./start_build.sh

# Run container
docker run -p 12527:12527 guess-number-game:latest
```

### Testing
No automated tests are configured. Manual testing through the web interface.

## Key Development Patterns

- **Game Flow**: Player name → UUID game creation → guess submission → completion with ranking
- **API Versioning**: Uses build date (YYYYMMDD) as main version and Git hash as minor version
- **Static File Serving**: Backend serves frontend files via FastAPI static mount
- **Database Connections**: Uses `get_db_connection()` helper with row factory for dict-like access
- **CORS**: Configured to allow all origins for development flexibility

## Important Files

- `backend/main.py`: All API endpoints and game logic
- `frontend/script.js`: Game state management and UI interactions
- `backend/database_setup.py`: Database initialization script
- `start_build.sh`: Docker build script with automatic versioning
- `ranking.db`: SQLite database (created by setup script)

## API Endpoints

- `POST /new_game`: Initialize game session with UUID
- `POST /guess`: Submit guess and get A/B results
- `GET /ranking`: Retrieve TOP 10 leaderboard
- `GET /version`: Get application version info
- `GET /`: Serve main HTML page
- `/static/*`: Frontend static files