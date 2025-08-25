from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app import User, hash_password

# Database setup
DATABASE_URL = "sqlite:///./trading_post.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def setup_admin():
    db = SessionLocal()
    try:
        # Check if admin user already exists
        existing_user = (
            db.query(User).filter((User.username == "admin") | (User.email == "zrottmann@gmail.com")).first()
        )

        if existing_user:
            # Update existing user to be admin
            existing_user.is_admin = True
            existing_user.email = "zrottmann@gmail.com"
            existing_user.password_hash = hash_password("Qpalzm1!")
            db.commit()
            print(f"[SUCCESS] Updated existing user '{existing_user.username}' to admin")
            print("Email: zrottmann@gmail.com")
            print("Password: Qpalzm1!")
        else:
            # Create new admin user
            admin_user = User(
                username="admin",
                email="zrottmann@gmail.com",
                password_hash=hash_password("Qpalzm1!"),
                age=30,
                latitude=40.7128,
                longitude=-74.0060,
                bio="System Administrator",
                is_admin=True,
            )
            db.add(admin_user)
            db.commit()
            print("[SUCCESS] Admin user created successfully!")
            print("Email: zrottmann@gmail.com")
            print("Username: admin")
            print("Password: Qpalzm1!")

        print("\nAdmin user is now set up and ready to use!")

    except Exception as e:
        print(f"[ERROR] Failed to set up admin user: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    setup_admin()
