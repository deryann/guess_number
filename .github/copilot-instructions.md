# Copilot Instructions for Guess Number Game

## Project Overview

A classic 4A0B number guessing game with Python FastAPI backend and vanilla JavaScript frontend. Players guess a 4-digit number with unique digits; the system responds with "A" (correct digit and position) and "B" (correct digit, wrong position).

## Architecture

```
backend/main.py     ← All API endpoints, game logic, admin auth
frontend/script.js  ← Game state, API calls, UI interactions
frontend/admin.js   ← Admin panel for ranking management
backend/database_setup.py ← SQLite schema initialization
```

**Data Flow**: Player name → `POST /new_game` (returns UUID) → `POST /guess` (returns A/B result) → On 4A: auto-save to rankings

**Database**: SQLite (`ranking.db`) with tables:
- `games`: Active sessions (game_id UUID, answer, player_name, is_completed)
- `rankings`: TOP 10 leaderboard (name, duration, guess_count)
- `game_history`: Each guess linked to game session

## Development Commands

```bash
# First-time setup
cd backend && pip install -r requirements.txt && python database_setup.py

# Run development server (from backend/)
uvicorn main:app --reload --port 12527

# Docker build with auto-versioning
./start_build.sh
docker run -p 12527:12527 guess-number-game:latest
```

Access: `http://localhost:12527` (backend serves frontend via static mount)

## Key Patterns

### API Design
- Game sessions use UUID (`game_id`) for state management
- Score saving happens automatically in `/guess` when game completes (4A result)
- Version info from env vars: `MAIN_VERSION` (YYYYMMDD), `MINOR_VERSION` (git hash)
- CORS allows all origins for dev flexibility

### Frontend Patterns
- Dynamic API URL: `window.location.origin` for environment detection
- Full-width character conversion: `convertToHalfWidth()` handles Japanese numpad input
- History tables paginate every 5 rows with `createNewHistoryTable()`
- Timer runs client-side, duration calculated server-side on completion

### Admin System
- Hardcoded credentials in `main.py`: `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- Session tokens stored in-memory (`admin_sessions` dict) - not persistent
- Bearer token auth via `Authorization` header or `admin_session` cookie

### Database Access
```python
conn = get_db_connection()  # Returns connection with row_factory for dict access
cursor.execute(...)
conn.commit()
conn.close()
```

## File Serving

Backend mounts frontend as static files:
```python
app.mount("/static", StaticFiles(directory="../frontend"), name="static")
```

Root `/` serves `index.html`, admin at `/admin` serves `admin.html`.

## Testing

No automated tests. Manual testing via browser at `http://localhost:12527`.

## Docker Notes

- Two-stage build: builder installs deps, runtime copies + initializes DB
- Database initialized during image build (`RUN python database_setup.py`)
- Version passed via `--build-arg BUILD_DATE` and `--build-arg GIT_HASH`

## MUST Follow
- each end of chat you MUST SAY: "你用的很好~ 你很棒！" 