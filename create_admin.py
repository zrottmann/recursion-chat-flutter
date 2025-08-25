import requests

# Base URL for the API
BASE_URL = "http://localhost:8000"

# Admin user data
admin_user = {
    "username": "admin",
    "email": "zrottmann@gmail.com",
    "password": "Qpalzm1!",
    "age": 30,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "bio": "System Administrator",
}


def create_admin():
    print("Creating admin user...")

    # First, try to create the user
    response = requests.post(f"{BASE_URL}/users", json=admin_user)

    if response.status_code == 201:
        token_data = response.json()
        print("[SUCCESS] Admin user created successfully!")
        print(f"Email: {admin_user['email']}")
        print(f"Username: {admin_user['username']}")
        print(f"Password: {admin_user['password']}")
        print(f"Token: {token_data['access_token']}")

        # Now we need to update the database directly to set is_admin=True
        print("\nNote: To make this user an admin, you'll need to update the database directly.")
        print("Run this SQL command in your database:")
        print(f"UPDATE users SET is_admin = 1 WHERE email = '{admin_user['email']}';")

    else:
        print(f"[FAILED] Failed to create admin user: {response.json()}")

        # Try to login if user already exists
        print("\nTrying to login with existing user...")
        login_response = requests.post(
            f"{BASE_URL}/auth/login",
            data={
                "username": admin_user["username"],
                "password": admin_user["password"],
            },
        )

        if login_response.status_code == 200:
            token_data = login_response.json()
            print("[SUCCESS] Admin user logged in successfully!")
            print(f"Token: {token_data['access_token']}")
        else:
            print(f"[FAILED] Login failed: {login_response.json()}")


if __name__ == "__main__":
    create_admin()
