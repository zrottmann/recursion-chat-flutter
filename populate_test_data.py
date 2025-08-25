import requests

BASE_URL = "http://localhost:8080"

# Test user credentials
users = ["alice", "bob", "charlie", "david", "emma", "frank", "grace"]

print("Creating test items for users...")

for username in users:
    # Login
    print(f"\nProcessing {username}...")

    try:
        # Get token
        response = requests.post(
            f"{BASE_URL}/token",
            data={"username": username, "password": "test123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if response.status_code != 200:
            print(f"  Failed to login: {response.status_code}")
            continue

        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create a simple item
        item_data = {
            "title": f"{username.title()}'s Test Item",
            "description": f"This is a test item created by {username}",
            "price": 100,
            "category": "Other",
            "listing_type": "sale",
            "condition": "good",
            "images": [],
        }

        response = requests.post(f"{BASE_URL}/items", json=item_data, headers=headers)

        if response.status_code in [200, 201]:
            print("  + Created test item")
        else:
            print(f"  - Failed to create item: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"  Error: {str(e)}")

print("\nDone!")
