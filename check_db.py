import os
import sqlite3
import psycopg2
from urllib.parse import urlparse

# Get database URL from environment
db_url = os.environ.get("DB_URL", "sqlite:///local.db")

if db_url.startswith("sqlite"):
    # SQLite connection
    conn = sqlite3.connect("local.db")
    cursor = conn.cursor()
    print("Using SQLite database")
else:
    # PostgreSQL connection
    result = urlparse(db_url)
    conn = psycopg2.connect(
        database=result.path[1:] if result.path else "postgres",
        user=result.username,
        password=result.password,
        host=result.hostname,
        port=result.port,
    )
    cursor = conn.cursor()
    print("Using PostgreSQL database")

# Show users and their listings
print("=== Users and Their Listings ===")
cursor.execute(
    """
    SELECT u.username, u.bio, u.age, u.location_lat, u.location_lon, COUNT(l.id) as listing_count
    FROM users u
    LEFT JOIN listings l ON u.id = l.user_id
    GROUP BY u.id
"""
)
for row in cursor.fetchall():
    print(f"\n{row[0]} (age {row[2]}, location: {row[3]}, {row[4]}):")
    print(f"  Bio: {row[1]}")
    print(f"  Total listings: {row[5]}")

# Show all listings
print("\n=== All Listings ===")
cursor.execute(
    """
    SELECT u.username, l.type, l.category, l.description, l.is_selling, l.price
    FROM listings l
    JOIN users u ON l.user_id = u.id
    ORDER BY u.username, l.is_selling DESC
"""
)
for row in cursor.fetchall():
    action = "Selling" if row[4] else "Buying"
    print(f"\n{row[0]} - {action} {row[1]} ({row[2]}):")
    print(f"  Description: {row[3]}")
    print(f"  Price: ${row[5]}")

# Show matches
print("\n=== AI Matches ===")
cursor.execute(
    """
    SELECT u1.username, u2.username, m.ai_reason, m.score
    FROM matches m
    JOIN users u1 ON m.user1_id = u1.id
    JOIN users u2 ON m.user2_id = u2.id
"""
)
for row in cursor.fetchall():
    print(f"\nMatch: {row[0]} <-> {row[1]} (Score: {row[3]})")
    print(f"  Reason: {row[2]}")

conn.close()
