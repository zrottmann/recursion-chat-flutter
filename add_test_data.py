import requests

# Base URL for the API
BASE_URL = "http://localhost:8000"

# Test users data
test_users = [
    {
        "username": "alice_smith",
        "password": "password123",
        "age": 25,
        "latitude": 40.7128,
        "longitude": -74.0060,
        "bio": "Love trading vintage items and books!",
    },
    {
        "username": "bob_jones",
        "password": "password123",
        "age": 30,
        "latitude": 40.7580,
        "longitude": -73.9855,
        "bio": "Collector of electronics and gadgets",
    },
    {
        "username": "charlie_brown",
        "password": "password123",
        "age": 28,
        "latitude": 40.7489,
        "longitude": -73.9680,
        "bio": "Furniture and home decor enthusiast",
    },
    {
        "username": "diana_prince",
        "password": "password123",
        "age": 35,
        "latitude": 40.7282,
        "longitude": -73.9942,
        "bio": "Sports equipment and outdoor gear trader",
    },
    {
        "username": "evan_williams",
        "password": "password123",
        "age": 22,
        "latitude": 40.7614,
        "longitude": -73.9776,
        "bio": "Video games and tech accessories",
    },
]

# Test listings data
test_listings = [
    # Alice's listings
    [
        {
            "category": "Books",
            "description": "Complete Harry Potter book series in excellent condition. Hardcover editions.",
            "price": 50.0,
        },
        {
            "category": "Vintage",
            "description": "1960s vintage record player, fully functional with great sound quality",
            "price": 150.0,
        },
    ],
    # Bob's listings
    [
        {
            "category": "Electronics",
            "description": "iPhone 12 Pro, 128GB, excellent condition with original box and charger",
            "price": 500.0,
        },
        {
            "category": "Electronics",
            "description": "Sony WH-1000XM4 wireless headphones, barely used, with carrying case",
            "price": 200.0,
        },
        {
            "category": "Gaming",
            "description": "Nintendo Switch with 5 games including Zelda and Mario Kart",
            "price": 350.0,
        },
    ],
    # Charlie's listings
    [
        {
            "category": "Furniture",
            "description": "Mid-century modern coffee table, solid wood, excellent condition",
            "price": 300.0,
        },
        {
            "category": "Home Decor",
            "description": "Set of 3 abstract canvas paintings, perfect for living room",
            "price": 120.0,
        },
    ],
    # Diana's listings
    [
        {
            "category": "Sports",
            "description": "Professional road bike, carbon frame, Shimano components, size medium",
            "price": 800.0,
        },
        {
            "category": "Outdoor",
            "description": "Complete camping gear set: tent, sleeping bags, cooking equipment",
            "price": 250.0,
        },
        {
            "category": "Sports",
            "description": "Set of dumbbells ranging from 5 to 50 lbs with adjustable bench",
            "price": 400.0,
        },
    ],
    # Evan's listings
    [
        {
            "category": "Gaming",
            "description": "PlayStation 5 with extra controller and charging dock",
            "price": 600.0,
        },
        {
            "category": "Electronics",
            "description": "Mechanical gaming keyboard RGB with Cherry MX switches",
            "price": 100.0,
        },
    ],
]


def add_test_data():
    print("Adding test data to the Trading Post API...")

    tokens = []

    # Create users and collect tokens
    for i, user in enumerate(test_users):
        print(f"\nCreating user: {user['username']}")
        response = requests.post(f"{BASE_URL}/users", json=user)

        if response.status_code == 201:
            token_data = response.json()
            tokens.append(token_data["access_token"])
            print(f"[SUCCESS] User {user['username']} created successfully")
        else:
            print(f"[FAILED] Failed to create user {user['username']}: {response.json()}")
            # Try to login if user already exists
            login_response = requests.post(
                f"{BASE_URL}/auth/login",
                data={"username": user["username"], "password": user["password"]},
            )
            if login_response.status_code == 200:
                token_data = login_response.json()
                tokens.append(token_data["access_token"])
                print(f"[SUCCESS] User {user['username']} logged in successfully")
            else:
                tokens.append(None)

    # Create listings for each user
    for i, (token, user_listings) in enumerate(zip(tokens, test_listings)):
        if token:
            username = test_users[i]["username"]
            print(f"\nCreating listings for {username}:")

            headers = {"Authorization": f"Bearer {token}"}

            for listing in user_listings:
                response = requests.post(f"{BASE_URL}/listings", json=listing, headers=headers)

                if response.status_code == 201:
                    print(f"  [SUCCESS] Created: {listing['category']} - {listing['description'][:50]}...")
                else:
                    print(f"  [FAILED] Failed to create listing: {response.json()}")

    print("\n" + "=" * 50)
    print("Test data added successfully!")
    print("\nYou can now:")
    print("1. View all listings at: http://localhost:8000/docs#/default/get_listings_listings_get")
    print("2. Filter by category: http://localhost:8000/listings?category=Electronics")
    print("3. Filter by location: http://localhost:8000/listings?lat=40.7128&lon=-74.0060&radius=10")
    print("\nTest users created successfully:")
    for user in test_users:
        print(f"  - Username: {user['username']}")


if __name__ == "__main__":
    add_test_data()
