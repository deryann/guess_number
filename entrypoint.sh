#!/bin/bash
set -e

# Default data directory
DATA_DIR="${DATA_DIR:-/app/data}"
DB_FILE="${DATA_DIR}/ranking.db"

echo "=============================================="
echo "Starting Guess Number Game Container"
echo "=============================================="
echo "DATA_DIR: ${DATA_DIR}"
echo "DB_FILE: ${DB_FILE}"
echo ""

# Check if data directory exists
if [ ! -d "${DATA_DIR}" ]; then
    echo "Creating data directory: ${DATA_DIR}"
    mkdir -p "${DATA_DIR}"
fi

# Check data directory permissions
if [ -w "${DATA_DIR}" ]; then
    echo "Data directory is writable"
else
    echo "WARNING: Data directory is not writable!"
    echo "Please check volume permissions."
fi

# Check if database exists
if [ -f "${DB_FILE}" ]; then
    echo "Existing database found: ${DB_FILE}"
    echo "Database size: $(du -h ${DB_FILE} | cut -f1)"

    # Verify database integrity
    echo "Verifying database integrity..."
    if sqlite3 "${DB_FILE}" "PRAGMA integrity_check;" 2>/dev/null | grep -q "ok"; then
        echo "Database integrity check: PASSED"
    else
        echo "WARNING: Database integrity check failed!"
        echo "The database may be corrupted. Consider restoring from backup."
    fi
else
    echo "No existing database found."
    echo "A new database will be created on first request."
fi

echo ""
echo "=============================================="
echo "Starting uvicorn server on port 12527..."
echo "=============================================="

# Start the application
exec uvicorn main:app --host 0.0.0.0 --port 12527
