"""Script for manual/automated backup of SQLite database (RNF09)."""

import os
import shutil
import sqlite3
from datetime import datetime

def backup_sqlite_database(
    source_db: str = "hotelwork.db",
    backup_dir: str = "backups"
) -> str:
    """
    Creates a timestamped, consistent snapshot of the SQLite database
    using SQLite's online backup API to ensure ACID integrity even under active writes.
    """
    if not os.path.exists(source_db):
        raise FileNotFoundError(f"Database file '{source_db}' not found.")

    os.makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"hotelwork_backup_{timestamp}.db"
    backup_path = os.path.join(backup_dir, backup_filename)

    print(f"Creating backup from '{source_db}' to '{backup_path}'...")

    # Using SQLite Online Backup API for zero-lock consistent snapshot
    src_conn = sqlite3.connect(source_db)
    dst_conn = sqlite3.connect(backup_path)

    with dst_conn:
        src_conn.backup(dst_conn, pages=100)

    dst_conn.close()
    src_conn.close()

    file_size_kb = round(os.path.getsize(backup_path) / 1024, 2)
    print(f"[OK] Database backup completed successfully: {backup_path} ({file_size_kb} KB)")
    return backup_path

if __name__ == "__main__":
    backup_sqlite_database()
