#!/usr/bin/env python3
"""
Database migration script to add missing columns to the items table
"""
import sqlite3
import os


def fix_items_table_schema():
    print("=== Fixing Items Table Schema ===")

    # Use the same database file as specified in app_sqlite.py
    db_path = "./tradingpost.db"

    if not os.path.exists(db_path):
        print(f"[ERROR] Database file {db_path} not found!")
        return False

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Get current columns in items table
        cursor.execute("PRAGMA table_info(items)")
        existing_columns = [column[1] for column in cursor.fetchall()]
        print(f"Existing columns: {existing_columns}")

        # Define missing columns with their SQL definitions
        missing_columns = {
            "listing_type": 'TEXT DEFAULT "sale"',
            "condition": 'TEXT DEFAULT "good"',
            "service_type": "TEXT",
            "hourly_rate": "REAL",
            "availability": "TEXT",
            "images": 'TEXT DEFAULT "[]"',
            "views": "INTEGER DEFAULT 0",
            "is_saved": "BOOLEAN DEFAULT 0",
        }

        # Add missing columns
        columns_added = 0
        for column_name, column_def in missing_columns.items():
            if column_name not in existing_columns:
                print(f"Adding column: {column_name}")
                try:
                    cursor.execute(f"ALTER TABLE items ADD COLUMN {column_name} {column_def}")
                    columns_added += 1
                    print(f"  [SUCCESS] Added {column_name}")
                except Exception as e:
                    print(f"  [ERROR] Failed to add {column_name}: {e}")
            else:
                print(f"Column {column_name} already exists")

        if columns_added > 0:
            # Commit changes
            conn.commit()
            print(f"\n[SUCCESS] Added {columns_added} missing columns to items table!")
        else:
            print("\n[INFO] No missing columns found, items table schema is already up to date!")

        # Verify the final schema
        cursor.execute("PRAGMA table_info(items)")
        final_columns = cursor.fetchall()
        print("\nFinal items table schema:")
        for col in final_columns:
            print(f"  {col[1]} ({col[2]}) - {'NOT NULL' if col[3] else 'NULL'} - Default: {col[4]}")

        return True

    except Exception as e:
        print(f"[ERROR] Migration failed: {str(e)}")
        conn.rollback()
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    success = fix_items_table_schema()
    if success:
        print("\n=== Schema Fix Complete ===")
        print("You can now restart the server and test the create_item endpoint")
    else:
        print("\n=== Schema Fix Failed ===")
        print("Please check the errors above and try again")
