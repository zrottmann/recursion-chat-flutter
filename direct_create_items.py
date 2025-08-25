from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app_sqlite import User, Item
import h3

# Database connection
engine = create_engine("sqlite:///trading_post.db")
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Get all users
users = db.query(User).all()
print(f"Found {len(users)} users")

# Test items for each user
items_by_username = {
    "alice": [
        {
            "title": "MacBook Air M1",
            "description": "2020 model, 256GB SSD, excellent condition",
            "price": 800,
            "listing_type": "sale",
            "condition": "good",
            "category": "Electronics",
        },
        {
            "title": "IKEA Sectional Sofa",
            "description": "Gray fabric, seats 5, pet-free home",
            "price": 400,
            "listing_type": "sale",
            "condition": "good",
            "category": "Furniture",
        },
        {
            "title": "[WANTED] Gaming Monitor",
            "description": 'Looking for 27" gaming monitor',
            "price": 300,
            "listing_type": "wanted",
            "category": "Electronics",
        },
    ],
    "bob": [
        {
            "title": "PS5 Console",
            "description": "Disc version with 2 controllers",
            "price": 550,
            "listing_type": "sale",
            "condition": "like_new",
            "category": "Electronics",
        },
        {
            "title": "Photography Services",
            "description": "Professional photographer for events",
            "price": 150,
            "listing_type": "service",
            "service_type": "hourly",
            "hourly_rate": 150,
            "category": "Services",
        },
        {
            "title": "[WANTED] Mountain Bike",
            "description": "Need mountain bike for trails",
            "price": 400,
            "listing_type": "wanted",
            "category": "Sports",
        },
    ],
    "charlie": [
        {
            "title": 'iPad Pro 11"',
            "description": "2021 model with Apple Pencil",
            "price": 600,
            "listing_type": "sale",
            "condition": "good",
            "category": "Electronics",
        },
        {
            "title": "House Cleaning",
            "description": "Professional cleaning service",
            "price": 40,
            "listing_type": "service",
            "service_type": "hourly",
            "hourly_rate": 40,
            "category": "Services",
        },
        {
            "title": "[WANTED] Office Chair",
            "description": "Need ergonomic office chair",
            "price": 200,
            "listing_type": "wanted",
            "category": "Furniture",
        },
    ],
    "david": [
        {
            "title": "Gaming PC",
            "description": "RTX 3060, Ryzen 5, 16GB RAM",
            "price": 900,
            "listing_type": "sale",
            "condition": "good",
            "category": "Electronics",
        },
        {
            "title": "Moving Help",
            "description": "2 people with truck",
            "price": 60,
            "listing_type": "service",
            "service_type": "hourly",
            "hourly_rate": 60,
            "category": "Services",
        },
        {
            "title": "[WANTED] Gaming Laptop",
            "description": "Looking for gaming laptop",
            "price": 800,
            "listing_type": "wanted",
            "category": "Electronics",
        },
    ],
    "emma": [
        {
            "title": "2018 Honda Civic",
            "description": "45k miles, clean title",
            "price": 18000,
            "listing_type": "sale",
            "condition": "good",
            "category": "Vehicles",
        },
        {
            "title": "Queen Bed Frame",
            "description": "Solid wood with headboard",
            "price": 250,
            "listing_type": "sale",
            "condition": "good",
            "category": "Furniture",
        },
        {
            "title": "[WANTED] Moving Help",
            "description": "Need help moving apartment",
            "price": 300,
            "listing_type": "wanted",
            "category": "Services",
        },
    ],
    "frank": [
        {
            "title": "Electric Scooter",
            "description": "Xiaomi Pro 2, 20mph max",
            "price": 400,
            "listing_type": "sale",
            "condition": "like_new",
            "category": "Vehicles",
        },
        {
            "title": "Web Development",
            "description": "Custom websites, React specialist",
            "price": 75,
            "listing_type": "service",
            "service_type": "hourly",
            "hourly_rate": 75,
            "category": "Services",
        },
        {
            "title": "[WANTED] iPad",
            "description": "Need tablet for digital art",
            "price": 400,
            "listing_type": "wanted",
            "category": "Electronics",
        },
    ],
    "grace": [
        {
            "title": "Mountain Bike",
            "description": "Trek 21-speed, great condition",
            "price": 350,
            "listing_type": "sale",
            "condition": "good",
            "category": "Sports",
        },
        {
            "title": "Math Tutoring",
            "description": "High school and college math",
            "price": 50,
            "listing_type": "service",
            "service_type": "hourly",
            "hourly_rate": 50,
            "category": "Services",
        },
        {
            "title": "[WANTED] Electric Scooter",
            "description": "Looking for electric scooter",
            "price": 350,
            "listing_type": "wanted",
            "category": "Vehicles",
        },
    ],
}

# Create items for each user
for user in users:
    if user.username in items_by_username:
        print(f"\nCreating items for {user.username}:")

        for item_data in items_by_username[user.username]:
            try:
                # Calculate H3 index
                h3_index = h3.latlng_to_cell(user.latitude, user.longitude, 9)

                # Create item
                item = Item(
                    title=item_data["title"],
                    description=item_data["description"],
                    price=item_data["price"],
                    category=item_data["category"],
                    listing_type=item_data.get("listing_type", "sale"),
                    condition=item_data.get("condition", "good"),
                    service_type=item_data.get("service_type"),
                    hourly_rate=item_data.get("hourly_rate"),
                    images="[]",
                    latitude=user.latitude,
                    longitude=user.longitude,
                    h3_index=h3_index,
                    owner_id=user.id,
                    is_available=True,
                )

                db.add(item)
                print(f"  + Created: {item_data['title']}")

            except Exception as e:
                print(f"  - Error creating {item_data['title']}: {str(e)}")

# Commit all changes
try:
    db.commit()
    print("\nAll items created successfully!")
except Exception as e:
    print(f"\nError committing changes: {str(e)}")
    db.rollback()
finally:
    db.close()
