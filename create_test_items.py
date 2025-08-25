import requests

# API base URL
BASE_URL = "http://localhost:8080"

# Test users and their items/services
test_data = {
    "alice": {
        "password": "test123",
        "items": [
            {
                "title": "MacBook Air M1",
                "description": "2020 model, 256GB SSD, 8GB RAM, excellent condition",
                "price": 800,
                "listing_type": "sale",
                "condition": "good",
            },
            {
                "title": "IKEA Sectional Sofa",
                "description": "Gray fabric, seats 5, excellent condition, pet-free home",
                "price": 400,
                "listing_type": "sale",
                "condition": "good",
            },
            {
                "title": "Kayak with Paddle",
                "description": "Single person kayak, includes life jacket and paddle",
                "price": 300,
                "listing_type": "sale",
                "condition": "good",
            },
            {
                "title": "[WANTED] Gaming Monitor",
                "description": 'Looking for 27" or larger gaming monitor, 144Hz preferred',
                "price": 300,
                "listing_type": "wanted",
            },
        ],
    },
    "bob": {
        "password": "test123",
        "items": [
            {
                "title": "PS5 Console",
                "description": "Disc version with 2 controllers and 5 games (Spider-Man, God of War, etc)",
                "price": 550,
                "listing_type": "sale",
                "condition": "like_new",
            },
            {
                "title": "Standing Desk",
                "description": 'Electric adjustable height desk, 60" wide, very sturdy',
                "price": 350,
                "listing_type": "sale",
                "condition": "like_new",
            },
            {
                "title": "Photography Services",
                "description": "Professional photographer for events, portraits, and products",
                "price": 150,
                "listing_type": "service",
                "service_type": "hourly",
                "hourly_rate": 150,
            },
            {
                "title": "[WANTED] Mountain Bike",
                "description": "Need a good mountain bike for trails, prefer Trek or Specialized",
                "price": 400,
                "listing_type": "wanted",
            },
        ],
    },
    "charlie": {
        "password": "test123",
        "items": [
            {
                "title": 'iPad Pro 11"',
                "description": "2021 model with Apple Pencil and keyboard case",
                "price": 600,
                "listing_type": "sale",
                "condition": "good",
            },
            {
                "title": "House Cleaning Service",
                "description": "Professional cleaning service, 3-4 hours typical home",
                "price": 40,
                "listing_type": "service",
                "service_type": "hourly",
                "hourly_rate": 40,
            },
            {
                "title": "[WANTED] Office Chair",
                "description": "Need ergonomic office chair for home office",
                "price": 200,
                "listing_type": "wanted",
            },
            {
                "title": "Vintage Record Collection",
                "description": "200+ vinyl records, classic rock and jazz",
                "price": 500,
                "listing_type": "sale",
                "condition": "good",
            },
        ],
    },
    "david": {
        "password": "test123",
        "items": [
            {
                "title": "Gaming PC",
                "description": "RTX 3060, Ryzen 5 5600X, 16GB RAM, 1TB SSD",
                "price": 900,
                "listing_type": "sale",
                "condition": "good",
            },
            {
                "title": "Moving Help Service",
                "description": "2 people with truck for local moves, furniture delivery",
                "price": 60,
                "listing_type": "service",
                "service_type": "hourly",
                "hourly_rate": 60,
            },
            {
                "title": "Electric Guitar",
                "description": "Fender Stratocaster with amp and accessories",
                "price": 450,
                "listing_type": "sale",
                "condition": "good",
            },
            {
                "title": "[WANTED] Gaming Laptop",
                "description": "Looking for gaming laptop with RTX graphics",
                "price": 800,
                "listing_type": "wanted",
            },
        ],
    },
    "emma": {
        "password": "test123",
        "items": [
            {
                "title": "2018 Honda Civic",
                "description": "45k miles, one owner, clean title, well maintained",
                "price": 18000,
                "listing_type": "sale",
                "condition": "good",
            },
            {
                "title": "Queen Bed Frame",
                "description": "Solid wood frame with headboard, very sturdy",
                "price": 250,
                "listing_type": "sale",
                "condition": "good",
            },
            {
                "title": "[WANTED] Moving Help",
                "description": "Need help moving 2BR apartment next weekend",
                "price": 300,
                "listing_type": "wanted",
            },
            {
                "title": "Designer Handbag Collection",
                "description": "5 authentic designer bags, excellent condition",
                "price": 1200,
                "listing_type": "sale",
                "condition": "like_new",
            },
        ],
    },
    "frank": {
        "password": "test123",
        "items": [
            {
                "title": "Electric Scooter",
                "description": "Xiaomi Pro 2, 20mph max speed, great for commuting",
                "price": 400,
                "listing_type": "sale",
                "condition": "like_new",
            },
            {
                "title": "Web Development Services",
                "description": "Custom websites, React/Node.js specialist",
                "price": 75,
                "listing_type": "service",
                "service_type": "hourly",
                "hourly_rate": 75,
            },
            {
                "title": "Home Gym Equipment",
                "description": "Dumbbells, bench, resistance bands, yoga mat",
                "price": 300,
                "listing_type": "sale",
                "condition": "good",
            },
            {
                "title": "[WANTED] iPad or Tablet",
                "description": "Need tablet for digital art and note-taking",
                "price": 400,
                "listing_type": "wanted",
            },
        ],
    },
    "grace": {
        "password": "test123",
        "items": [
            {
                "title": "Mountain Bike",
                "description": "Trek 21-speed, recently serviced, great for trails",
                "price": 350,
                "listing_type": "sale",
                "condition": "good",
            },
            {
                "title": "Math Tutoring",
                "description": "High school and college level math tutoring",
                "price": 50,
                "listing_type": "service",
                "service_type": "hourly",
                "hourly_rate": 50,
            },
            {
                "title": "Handyman Services",
                "description": "General repairs, installations, and maintenance",
                "price": 45,
                "listing_type": "service",
                "service_type": "hourly",
                "hourly_rate": 45,
            },
            {
                "title": "[WANTED] Electric Scooter",
                "description": "Looking for electric scooter for commuting",
                "price": 350,
                "listing_type": "wanted",
            },
        ],
    },
}


def login(username, password):
    """Login and get access token"""
    response = requests.post(
        f"{BASE_URL}/token",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed for {username}: {response.text}")
        return None


def create_item(token, item_data):
    """Create an item listing"""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Auto-generate category based on title and description
    text = f"{item_data['title']} {item_data['description']}".lower()

    if any(
        word in text
        for word in [
            "iphone",
            "macbook",
            "ipad",
            "pc",
            "gaming",
            "laptop",
            "console",
            "ps5",
            "xbox",
        ]
    ):
        category = "Electronics"
    elif any(word in text for word in ["furniture", "chair", "desk", "sofa", "bed", "table"]):
        category = "Furniture"
    elif any(word in text for word in ["car", "vehicle", "honda", "toyota", "scooter", "bike"]):
        category = "Vehicles"
    elif any(word in text for word in ["service", "help", "tutoring", "cleaning", "moving"]):
        category = "Services"
    elif any(word in text for word in ["sport", "bike", "kayak", "gym", "fitness"]):
        category = "Sports"
    else:
        category = "Other"

    item_data["category"] = category

    # Ensure all required fields are present
    if "listing_type" not in item_data:
        item_data["listing_type"] = "sale"
    if "condition" not in item_data and item_data["listing_type"] == "sale":
        item_data["condition"] = "good"
    if "images" not in item_data:
        item_data["images"] = []

    response = requests.post(f"{BASE_URL}/items", json=item_data, headers=headers)

    if response.status_code in [200, 201]:
        return response.json()
    else:
        print(f"Failed to create item: {response.text}")
        return None


def main():
    print("Creating test items for all users...")

    for username, user_data in test_data.items():
        print(f"\nProcessing user: {username}")

        # Login
        token = login(username, user_data["password"])
        if not token:
            continue

        # Create items
        for item in user_data["items"]:
            result = create_item(token, item)
            if result:
                print(f"  + Created: {item['title']}")
            else:
                print(f"  - Failed: {item['title']}")

    print("\nTest data creation complete!")


if __name__ == "__main__":
    main()
