
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

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

answer = ""

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
