from fastapi import FastAPI, HTTPException, Depends, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import random
import sqlite3
import uuid
import os
from datetime import datetime
from typing import Optional
import secrets

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

class AdminLogin(BaseModel):
    username: str
    password: str

class RankingUpdate(BaseModel):
    name: str
    start_time: str
    end_time: str
    duration: float
    guess_count: int

class HintRequest(BaseModel):
    game_id: str

# Global answer variable kept for backward compatibility but not used in UUID system
answer = ""

# Simple session management (in-memory storage)
admin_sessions = {}

# Admin credentials
ADMIN_USERNAME = "aaa"
ADMIN_PASSWORD = "bbb"

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

def get_admin_session(request: Request):
    """Check if admin is logged in via session token"""
    # Try to get token from Authorization header first
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        session_token = auth_header.split(" ")[1]
    else:
        # Fall back to cookie
        session_token = request.cookies.get("admin_session")
    
    if not session_token or session_token not in admin_sessions:
        raise HTTPException(status_code=401, detail="Authentication required")
    return admin_sessions[session_token]

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

@app.post("/get_hint")
def get_hint(hint_request: HintRequest):
    """
    Analyze previous guesses and provide hints to the player.
    Returns information about confirmed digits, eliminated digits, and position suggestions.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get game session
    cursor.execute("SELECT answer, is_completed FROM games WHERE game_id = ?", (hint_request.game_id,))
    game_row = cursor.fetchone()
    
    if not game_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Game not found.")
    
    if game_row[1]:  # is_completed
        conn.close()
        raise HTTPException(status_code=400, detail="Game already completed.")
    
    answer = game_row[0]
    
    # Get all previous guesses
    cursor.execute(
        "SELECT guess_number, result_a, result_b FROM game_history WHERE game_id = ? ORDER BY guess_time ASC",
        (hint_request.game_id,)
    )
    history = cursor.fetchall()
    conn.close()
    
    if not history:
        return {
            "message": "請先進行至少一次猜測，系統才能提供提示！",
            "confirmed_digits": [],
            "eliminated_digits": [],
            "position_hints": []
        }
    
    # Analyze the guesses to provide hints
    all_digits = set('0123456789')
    guessed_digits = set()
    confirmed_in_answer = set()  # Digits that are definitely in the answer
    eliminated_digits = set()     # Digits that are definitely not in the answer
    position_info = {}            # Information about positions
    
    for guess_row in history:
        guess = guess_row[0]
        a_count = guess_row[1]
        b_count = guess_row[2]
        total_correct = a_count + b_count
        
        guessed_digits.update(guess)
        
        # If total_correct is 0, all digits in this guess are not in the answer
        if total_correct == 0:
            eliminated_digits.update(guess)
        # If total_correct equals the number of unique digits, they're all in the answer
        elif total_correct == 4:
            confirmed_in_answer.update(guess)
        elif total_correct > 0:
            # At least some of these digits are in the answer
            # We can't be certain which ones without more analysis
            pass
    
    # Digits that haven't been guessed yet
    unguessed_digits = all_digits - guessed_digits
    
    # Digits that we're certain are NOT in the answer
    definitely_not = eliminated_digits
    
    # Build the hint response
    hint_data = {
        "confirmed_digits": sorted(list(confirmed_in_answer)),
        "eliminated_digits": sorted(list(definitely_not)),
        "unguessed_digits": sorted(list(unguessed_digits)),
        "message": ""
    }
    
    # Generate a helpful message based on analysis
    messages = []
    
    if confirmed_in_answer:
        messages.append(f"✓ 確定在答案中的數字: {', '.join(sorted(list(confirmed_in_answer)))}")
    
    if definitely_not:
        messages.append(f"✗ 確定不在答案中的數字: {', '.join(sorted(list(definitely_not)))}")
    
    if unguessed_digits:
        messages.append(f"💡 尚未嘗試的數字: {', '.join(sorted(list(unguessed_digits)))}")
    
    # Provide strategic advice
    if len(confirmed_in_answer) == 4:
        messages.append("⭐ 你已經找到所有4個數字了！現在只需要找出正確的位置！")
    elif len(confirmed_in_answer) > 0:
        remaining = 4 - len(confirmed_in_answer)
        messages.append(f"📍 還需要找到 {remaining} 個數字")
    
    if unguessed_digits and len(confirmed_in_answer) < 4:
        messages.append("💡 提示：嘗試使用尚未猜過的數字可能會有新發現！")
    
    hint_data["message"] = "\n".join(messages) if messages else "繼續加油！仔細分析之前的猜測結果。"
    
    return hint_data

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

# Admin endpoints
@app.get("/admin")
def admin_page():
    """Serve admin page"""
    return FileResponse("../frontend/admin.html")

@app.post("/admin/login")
def admin_login(login_data: AdminLogin):
    """Admin login endpoint"""
    if login_data.username == ADMIN_USERNAME and login_data.password == ADMIN_PASSWORD:
        session_token = secrets.token_urlsafe(32)
        admin_sessions[session_token] = {"username": login_data.username}
        
        from fastapi import Response
        response = {"success": True, "session_token": session_token}
        return response
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/admin/logout")
def admin_logout(request: Request):
    """Admin logout endpoint"""
    session_token = request.cookies.get("admin_session")
    if session_token in admin_sessions:
        del admin_sessions[session_token]
    return {"success": True}

@app.get("/admin/rankings")
def get_all_rankings(request: Request, admin_session = Depends(get_admin_session)):
    """Get all rankings data for admin"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, start_time, end_time, duration, guess_count FROM rankings ORDER BY id DESC"
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.put("/admin/rankings/{ranking_id}")
def update_ranking(ranking_id: int, ranking_data: RankingUpdate, request: Request, admin_session = Depends(get_admin_session)):
    """Update a ranking record"""
    # 資料驗證
    if not ranking_data.name or not ranking_data.name.strip():
        raise HTTPException(status_code=400, detail="Player name cannot be empty")
    
    if ranking_data.duration <= 0:
        raise HTTPException(status_code=400, detail="Duration must be greater than 0")
    
    if ranking_data.guess_count <= 0:
        raise HTTPException(status_code=400, detail="Guess count must be greater than 0")
    
    # 驗證時間格式和邏輯
    try:
        start_time = datetime.fromisoformat(ranking_data.start_time.replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(ranking_data.end_time.replace('Z', '+00:00'))
        
        if start_time >= end_time:
            raise HTTPException(status_code=400, detail="End time must be after start time")
            
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if ranking exists
    cursor.execute("SELECT id FROM rankings WHERE id = ?", (ranking_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Ranking not found")
    
    try:
        # Update the ranking
        cursor.execute(
            "UPDATE rankings SET name = ?, start_time = ?, end_time = ?, duration = ?, guess_count = ? WHERE id = ?",
            (ranking_data.name.strip(), ranking_data.start_time, ranking_data.end_time, ranking_data.duration, ranking_data.guess_count, ranking_id)
        )
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Ranking updated successfully"}
        
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/admin/rankings/{ranking_id}")
def delete_ranking(ranking_id: int, request: Request, admin_session = Depends(get_admin_session)):
    """Delete a ranking record"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if ranking exists
    cursor.execute("SELECT id FROM rankings WHERE id = ?", (ranking_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Ranking not found")
    
    # Delete the ranking
    cursor.execute("DELETE FROM rankings WHERE id = ?", (ranking_id,))
    conn.commit()
    conn.close()
    
    return {"success": True, "message": "Ranking deleted successfully"}
