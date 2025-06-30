from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import random
import sqlite3
import uuid
import os
from datetime import datetime

app = FastAPI()

# 設定 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允許所有來源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Guess(BaseModel):
    game_id: str
    number: str

class NewGameRequest(BaseModel):
    player_name: str

class GameResult(BaseModel):
    name: str
    start_time: str
    end_time: str
    duration: float
    guess_count: int

# Global answer variable kept for backward compatibility but not used in UUID system
answer = ""

# Mount static files for frontend
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

@app.get("/")
def read_root():
    """Serve the main HTML page"""
    from fastapi.responses import FileResponse
    return FileResponse("../frontend/index.html")

# Version information from environment variables
MAIN_VERSION = os.getenv("MAIN_VERSION", "dev")
MINOR_VERSION = os.getenv("MINOR_VERSION", "dev")

def get_db_connection():
    conn = sqlite3.connect('ranking.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.post("/new_game")
def new_game(request: NewGameRequest):
    # Generate a unique game ID
    game_id = str(uuid.uuid4())
    
    # Generate a random 4-digit answer
    digits = [str(i) for i in range(10)]
    random.shuffle(digits)
    answer = "".join(digits[:4])
    
    # Store game session in database
    conn = get_db_connection()
    cursor = conn.cursor()
    start_time = datetime.now().isoformat()
    
    cursor.execute(
        "INSERT INTO games (game_id, answer, start_time, player_name) VALUES (?, ?, ?, ?)",
        (game_id, answer, start_time, request.player_name)
    )
    conn.commit()
    conn.close()
    
    print(f"New game {game_id}: {answer}")  # For debugging
    return {"game_id": game_id, "message": "New game started."}

@app.post("/guess")
def make_guess(guess: Guess):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get game session
    cursor.execute("SELECT answer, player_name, start_time, is_completed FROM games WHERE game_id = ?", (guess.game_id,))
    game_row = cursor.fetchone()
    
    if not game_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Game not found.")
    
    if game_row[3]:  # is_completed
        conn.close()
        raise HTTPException(status_code=400, detail="Game already completed.")
    
    answer = game_row[0]
    player_name = game_row[1] 
    start_time = game_row[2]
    user_guess = guess.number
    
    # Calculate A and B
    a = 0
    b = 0
    for i in range(4):
        if user_guess[i] == answer[i]:
            a += 1
        elif user_guess[i] in answer:
            b += 1
    
    # Record guess in game history
    guess_time = datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO game_history (game_id, guess_number, result_a, result_b, guess_time) VALUES (?, ?, ?, ?, ?)",
        (guess.game_id, user_guess, a, b, guess_time)
    )
    
    response_data = {"a": a, "b": b}
    
    # Check if game is won (4A)
    if a == 4:
        # Mark game as completed
        cursor.execute(
            "UPDATE games SET is_completed = TRUE, completed_time = ? WHERE game_id = ?",
            (guess_time, guess.game_id)
        )
        
        # Calculate game statistics
        cursor.execute(
            "SELECT COUNT(*) FROM game_history WHERE game_id = ?",
            (guess.game_id,)
        )
        guess_count = cursor.fetchone()[0]
        
        # Calculate duration
        start_datetime = datetime.fromisoformat(start_time)
        end_datetime = datetime.fromisoformat(guess_time)
        duration = (end_datetime - start_datetime).total_seconds()
        
        # Add to rankings
        cursor.execute(
            "INSERT INTO rankings (name, start_time, end_time, duration, guess_count) VALUES (?, ?, ?, ?, ?)",
            (player_name, start_time, guess_time, duration, guess_count)
        )
        
        ranking_id = cursor.lastrowid
        response_data["game_completed"] = True
        response_data["ranking_id"] = ranking_id
        response_data["guess_count"] = guess_count
        response_data["duration"] = duration
    
    conn.commit()
    conn.close()
    
    return response_data

@app.post("/add_score")
def add_score(result: GameResult):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO rankings (name, start_time, end_time, duration, guess_count) VALUES (?, ?, ?, ?, ?)",
        (result.name, result.start_time, result.end_time, result.duration, result.guess_count)
    )
    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return {"id": last_id, "message": "Score added successfully."}

@app.get("/ranking")
def get_ranking():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, duration, guess_count FROM rankings ORDER BY guess_count ASC, duration ASC LIMIT 10"
    )
    rows = cursor.fetchall()
    conn.close()
    return rows

@app.get("/version")
def get_version():
    """Get application version information"""
    return {
        "main_version": MAIN_VERSION,
        "minor_version": MINOR_VERSION,
        "version": f"{MAIN_VERSION}.{MINOR_VERSION}"
    }
