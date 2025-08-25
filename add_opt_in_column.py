import sqlite3

# Connect to the database
conn = sqlite3.connect("tradingpost.db")
cursor = conn.cursor()

try:
    # Add opt_in column to users table with default value True
    cursor.execute(
        """
        ALTER TABLE users
        ADD COLUMN opt_in BOOLEAN DEFAULT 1
    """
    )

    # Update existing users to have opt_in = True
    cursor.execute(
        """
        UPDATE users
        SET opt_in = 1
        WHERE opt_in IS NULL
    """
    )

    conn.commit()
    print("Successfully added opt_in column with default value True")

except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("opt_in column already exists")
    else:
        print(f"Error: {e}")

finally:
    conn.close()
