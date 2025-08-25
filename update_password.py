import sqlite3
from passlib.context import CryptContext

# Initialize password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash the new password
new_password = "Qpalzm1\\!"
hashed_password = pwd_context.hash(new_password)

# Update the database
conn = sqlite3.connect("tradingpost.db")
cursor = conn.cursor()

# Update the password for zrottmann
cursor.execute(
    "UPDATE users SET hashed_password = ? WHERE username = ?",
    (hashed_password, "zrottmann"),
)
affected_rows = cursor.rowcount

if affected_rows > 0:
    conn.commit()
    print("Password updated successfully for user zrottmann")
    print("New password: Qpalzm1\\!")

    # Verify the change
    cursor.execute("SELECT username, email FROM users WHERE username = ?", ("zrottmann",))
    user = cursor.fetchone()
    if user:
        print(f"User confirmed: {user[0]} ({user[1]})")
else:
    print("No user found with username zrottmann")

conn.close()
