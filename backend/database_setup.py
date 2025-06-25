
import sqlite3

# Connect to the database (this will create the file if it doesn't exist)
conn = sqlite3.connect('ranking.db')

# Create a cursor object
cursor = conn.cursor()

# SQL statement to create the table
create_table_sql = """
CREATE TABLE IF NOT EXISTS rankings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration REAL NOT NULL,
    guess_count INTEGER NOT NULL
);
"""

# Execute the SQL statement
cursor.execute(create_table_sql)

print("Database and table 'rankings' created successfully.")

# Commit the changes and close the connection
conn.commit()
conn.close()
