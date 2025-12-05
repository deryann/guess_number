
import sqlite3

# Connect to the database (this will create the file if it doesn't exist)
conn = sqlite3.connect('ranking.db')

# Create a cursor object
cursor = conn.cursor()

# SQL statements to create the tables
create_rankings_table_sql = """
CREATE TABLE IF NOT EXISTS rankings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration REAL NOT NULL,
    guess_count INTEGER NOT NULL
);
"""

create_games_table_sql = """
CREATE TABLE IF NOT EXISTS games (
    game_id TEXT PRIMARY KEY,
    answer TEXT NOT NULL,
    start_time TEXT NOT NULL,
    player_name TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_time TEXT
);
"""

create_game_history_table_sql = """
CREATE TABLE IF NOT EXISTS game_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    guess_number TEXT NOT NULL,
    result_a INTEGER NOT NULL,
    result_b INTEGER NOT NULL,
    guess_time TEXT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games (game_id)
);
"""

# Execute the SQL statements
cursor.execute(create_rankings_table_sql)
cursor.execute(create_games_table_sql)
cursor.execute(create_game_history_table_sql)

print("Database and tables 'rankings', 'games', and 'game_history' created successfully.")

# Commit the changes and close the connection
conn.commit()
conn.close()
