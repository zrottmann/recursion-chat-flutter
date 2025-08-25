import sqlite3
import os


def migrate_database():
    # Connect to the database
    db_path = "./trading_post.db"

    if not os.path.exists(db_path):
        print("[ERROR] Database file not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]

        # Add email column if it doesn't exist
        if "email" not in columns:
            print("Adding email column...")
            cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
            # Set default emails for existing users
            cursor.execute("UPDATE users SET email = username || '@example.com' WHERE email IS NULL")
            print("[SUCCESS] Email column added")

        # Add is_admin column if it doesn't exist
        if "is_admin" not in columns:
            print("Adding is_admin column...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
            print("[SUCCESS] is_admin column added")

        # Commit changes
        conn.commit()
        print("\n[SUCCESS] Database migration completed!")

    except Exception as e:
        print(f"[ERROR] Migration failed: {str(e)}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    migrate_database()
