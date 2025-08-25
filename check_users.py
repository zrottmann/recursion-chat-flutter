import sqlite3

# Connect to the database
conn = sqlite3.connect("tradingpost.db")
cursor = conn.cursor()

# Check what users exist
cursor.execute("SELECT username, email FROM users")
users = cursor.fetchall()

print("Current users in database:")
print("-" * 40)
for username, email in users:
    print(f"Username: {username}, Email: {email}")

conn.close()
