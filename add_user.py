import os
import secrets
from app_sqlite import SessionLocal, User, get_password_hash

def generate_secure_password():
    """Generate a secure random password"""
    return secrets.token_urlsafe(16)

# Validate admin password configuration
admin_password = os.getenv("ADMIN_PASSWORD")
if not admin_password:
    print("⚠️  WARNING: ADMIN_PASSWORD environment variable not set!")
    print("   Using fallback password. For security, set ADMIN_PASSWORD environment variable.")
    print(f"   Suggested secure password: {generate_secure_password()}")
    admin_password = "ChangeThisPassword123!"
elif admin_password == "ChangeThisPassword123!":
    print("⚠️  WARNING: Using default password. Please change ADMIN_PASSWORD for security!")

# Create a new database session
db = SessionLocal()

try:
    # Check if user already exists
    existing_user = db.query(User).filter(User.username == "zrottmann").first()
    if existing_user:
        print("User zrottmann already exists")
    else:
        # Create the new user
        new_user = User(
            username="zrottmann",
            email="zrottmann@gmail.com",
            hashed_password=get_password_hash(admin_password),
            latitude=40.7128,
            longitude=-74.0060,
            is_active=True,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"User created successfully! ID: {new_user.id}")

    # List all users
    print("\nAll users in database:")
    print("-" * 40)
    users = db.query(User).all()
    for user in users:
        print(f"ID: {user.id}, Username: {user.username}, Email: {user.email}")

except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
