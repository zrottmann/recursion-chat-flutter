import sqlite3
from tabulate import tabulate

# Connect to the database
conn = sqlite3.connect("tradingpost.db")
cursor = conn.cursor()

print("Trading Post - Test Data Summary")
print("=" * 80)

# Show all users
print("\n1. TEST USERS")
print("-" * 80)
cursor.execute(
    """
    SELECT username, email, latitude, longitude
    FROM users
    ORDER BY id
"""
)
users = cursor.fetchall()
print(tabulate(users, headers=["Username", "Email", "Latitude", "Longitude"], tablefmt="grid"))

# Show items by category
print("\n2. ITEMS & SERVICES BY CATEGORY")
print("-" * 80)
cursor.execute(
    """
    SELECT
        i.category,
        COUNT(*) as count,
        MIN(i.price) as min_price,
        MAX(i.price) as max_price,
        AVG(i.price) as avg_price
    FROM items i
    GROUP BY i.category
    ORDER BY count DESC
"""
)
categories = cursor.fetchall()
print(
    tabulate(
        categories,
        headers=["Category", "Count", "Min Price", "Max Price", "Avg Price"],
        tablefmt="grid",
        floatfmt=".2f",
    )
)

# Show potential matches
print("\n3. POTENTIAL MATCHES (Based on wants/offers)")
print("-" * 80)
cursor.execute(
    """
    SELECT
        u1.username as seeker,
        i1.title as wants,
        u2.username as provider,
        i2.title as offers,
        i1.category
    FROM items i1
    JOIN users u1 ON i1.owner_id = u1.id
    JOIN items i2 ON i1.category = i2.category
    JOIN users u2 ON i2.owner_id = u2.id
    WHERE i1.title LIKE '[WANTED]%'
    AND i2.title NOT LIKE '[WANTED]%'
    AND u1.id != u2.id
    ORDER BY i1.category, u1.username
    LIMIT 15
"""
)
matches = cursor.fetchall()
print(
    tabulate(
        matches,
        headers=["Seeker", "Wants", "Provider", "Offers", "Category"],
        tablefmt="grid",
    )
)

# Show items for each user
print("\n4. DETAILED LISTINGS BY USER")
print("-" * 80)
cursor.execute(
    """
    SELECT
        u.username,
        i.title,
        i.description,
        i.price,
        i.category,
        CASE WHEN i.title LIKE '[WANTED]%' THEN 'BUYING' ELSE 'SELLING' END as type
    FROM users u
    JOIN items i ON u.id = i.owner_id
    WHERE u.username NOT IN ('alice', 'bob', 'charlie')  -- Exclude default test users
    ORDER BY u.username, type DESC, i.price DESC
"""
)
listings = cursor.fetchall()

current_user = None
for listing in listings:
    if listing[0] != current_user:
        current_user = listing[0]
        print(f"\n{current_user.upper()}'s listings:")
        print("-" * 60)

    type_emoji = "SELL" if listing[5] == "SELLING" else "BUY "
    print(f"  [{type_emoji}] {listing[1]}")
    print(f"        {listing[2]}")
    print(f"        Category: {listing[4]} | Price: ${listing[3]}")

print("\n" + "=" * 80)
print("LOGIN INSTRUCTIONS:")
print("1. Frontend: http://localhost:3000")
print("2. Contact administrator for login credentials")
print("\nAPI DOCUMENTATION: http://localhost:8001/docs")

conn.close()
