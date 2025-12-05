import sqlite3
from pathlib import Path
from typing import Optional

DB_PATH = 'ranking.db'


def check_database_exists(db_path: str) -> bool:
    """
    Check if the database file exists.

    Args:
        db_path: Path to the database file

    Returns:
        True if database exists, False otherwise
    """
    return Path(db_path).exists()


def get_database_connection(db_path: str) -> sqlite3.Connection:
    """
    Create and return a database connection.

    Args:
        db_path: Path to the database file

    Returns:
        sqlite3.Connection object
    """
    return sqlite3.connect(db_path)


def create_rankings_table(cursor: sqlite3.Cursor) -> None:
    """Create the rankings table if it doesn't exist."""
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
    cursor.execute(create_rankings_table_sql)
    print("Table 'rankings' created successfully.")


def create_games_table(cursor: sqlite3.Cursor) -> None:
    """Create the games table if it doesn't exist."""
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
    cursor.execute(create_games_table_sql)
    print("Table 'games' created successfully.")


def create_game_history_table(cursor: sqlite3.Cursor) -> None:
    """Create the game_history table if it doesn't exist."""
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
    cursor.execute(create_game_history_table_sql)
    print("Table 'game_history' created successfully.")


def create_all_tables(cursor: sqlite3.Cursor) -> None:
    """
    Create all required tables for the application.

    Args:
        cursor: Database cursor object
    """
    create_rankings_table(cursor)
    create_games_table(cursor)
    create_game_history_table(cursor)


def setup_database(db_path: str = DB_PATH) -> None:
    """
    Setup the database by checking if it exists and creating necessary tables.

    This function:
    1. Checks if the database file exists
    2. Creates a connection (which creates the file if it doesn't exist)
    3. Creates all required tables
    4. Handles errors gracefully with proper cleanup

    Args:
        db_path: Path to the database file (default: 'ranking.db')
    """
    db_exists = check_database_exists(db_path)

    if not db_exists:
        print(f"Database '{db_path}' does not exist. Creating new database...")
    else:
        print(f"Database '{db_path}' already exists. Ensuring all tables are created...")

    conn: Optional[sqlite3.Connection] = None
    try:
        conn = get_database_connection(db_path)
        cursor = conn.cursor()

        create_all_tables(cursor)

        conn.commit()
        print(f"\nDatabase setup completed successfully for '{db_path}'.")

    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    setup_database()
