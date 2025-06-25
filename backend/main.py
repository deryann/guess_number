
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import sqlite3
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
    number: str

class GameResult(BaseModel):
    name: str
    start_time: str
    end_time: str
    duration: float
    guess_count: int

answer = ""

def get_db_connection():
    conn = sqlite3.connect('ranking.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.post("/new_game")
def new_game():
    global answer
    digits = [str(i) for i in range(10)]
    random.shuffle(digits)
    answer = "".join(digits[:4])
    print(answer)
    return {"message": "New game started."}

@app.post("/guess")
def make_guess(guess: Guess):
    global answer
    if not answer:
        raise HTTPException(status_code=400, detail="Please start a new game first.")

    user_guess = guess.number
    a = 0
    b = 0
    for i in range(4):
        if user_guess[i] == answer[i]:
            a += 1
        elif user_guess[i] in answer:
            b += 1
    
    return {"a": a, "b": b}

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
