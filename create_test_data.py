from app_sqlite import SessionLocal, User, Item, get_password_hash
import h3

# Create a new database session
db = SessionLocal()

try:
    # Test users with diverse profiles and locations in NYC area
    test_users_data = [
        {
            "username": "sarah_tech",
            "email": "sarah@example.com",
            "password": "test123",
            "latitude": 40.7489,  # Upper East Side
            "longitude": -73.9680,
            "items": [
                {
                    "title": "MacBook Pro 2021",
                    "description": "16-inch, M1 Pro, 32GB RAM, excellent condition",
                    "price": 1800,
                    "category": "electronics",
                    "type": "selling",
                },
                {
                    "title": "Standing Desk",
                    "description": "Electric adjustable height desk, bamboo top",
                    "price": 400,
                    "category": "furniture",
                    "type": "selling",
                },
                {
                    "title": "Web Development Services",
                    "description": "Full-stack development, React/Node.js specialist",
                    "price": 100,
                    "category": "services",
                    "type": "selling",
                },
            ],
            "wants": [
                {
                    "title": "Dog Walking Service",
                    "description": "Need someone to walk my dog weekday mornings",
                    "price": 25,
                    "category": "pet care",
                    "type": "buying",
                },
            ],
        },
        {
            "username": "mike_handyman",
            "email": "mike@example.com",
            "password": "test123",
            "latitude": 40.7282,  # Brooklyn
            "longitude": -73.9506,
            "items": [
                {
                    "title": "Home Repair Services",
                    "description": "Plumbing, electrical, general maintenance",
                    "price": 75,
                    "category": "services",
                    "type": "selling",
                },
                {
                    "title": "Tool Set",
                    "description": "Complete DeWalt power tool set, barely used",
                    "price": 350,
                    "category": "tools",
                    "type": "selling",
                },
                {
                    "title": "Pickup Truck Rental",
                    "description": "Ford F-150 available for moving/hauling",
                    "price": 100,
                    "category": "transportation",
                    "type": "selling",
                },
            ],
            "wants": [
                {
                    "title": "Laptop for Work",
                    "description": "Need a reliable laptop for invoicing and scheduling",
                    "price": 800,
                    "category": "electronics",
                    "type": "buying",
                },
                {
                    "title": "Marketing Help",
                    "description": "Need help setting up online presence",
                    "price": 500,
                    "category": "services",
                    "type": "buying",
                },
            ],
        },
        {
            "username": "emma_artist",
            "email": "emma@example.com",
            "password": "test123",
            "latitude": 40.7614,  # Williamsburg
            "longitude": -73.9776,
            "items": [
                {
                    "title": "Custom Portrait Paintings",
                    "description": "Oil paintings from photos, various sizes",
                    "price": 300,
                    "category": "art",
                    "type": "selling",
                },
                {
                    "title": "Art Classes",
                    "description": "Beginner watercolor classes, materials included",
                    "price": 60,
                    "category": "education",
                    "type": "selling",
                },
                {
                    "title": "Vintage Easel",
                    "description": "French easel from 1950s, excellent condition",
                    "price": 200,
                    "category": "art supplies",
                    "type": "selling",
                },
            ],
            "wants": [
                {
                    "title": "Studio Space",
                    "description": "Looking for shared art studio space",
                    "price": 400,
                    "category": "real estate",
                    "type": "buying",
                },
                {
                    "title": "Website Design",
                    "description": "Need portfolio website for art",
                    "price": 1000,
                    "category": "services",
                    "type": "buying",
                },
            ],
        },
        {
            "username": "carlos_fitness",
            "email": "carlos@example.com",
            "password": "test123",
            "latitude": 40.7580,  # Midtown
            "longitude": -73.9855,
            "items": [
                {
                    "title": "Personal Training Sessions",
                    "description": "1-on-1 training, nutrition planning included",
                    "price": 80,
                    "category": "fitness",
                    "type": "selling",
                },
                {
                    "title": "Home Gym Equipment",
                    "description": "Dumbbells, resistance bands, yoga mats",
                    "price": 250,
                    "category": "sports",
                    "type": "selling",
                },
                {
                    "title": "Meal Prep Service",
                    "description": "Healthy meals delivered weekly",
                    "price": 120,
                    "category": "food",
                    "type": "selling",
                },
            ],
            "wants": [
                {
                    "title": "Video Editing",
                    "description": "Need help editing workout videos",
                    "price": 200,
                    "category": "services",
                    "type": "buying",
                },
                {
                    "title": "Massage Therapy",
                    "description": "Looking for sports massage therapist",
                    "price": 100,
                    "category": "health",
                    "type": "buying",
                },
            ],
        },
        {
            "username": "jenny_pets",
            "email": "jenny@example.com",
            "password": "test123",
            "latitude": 40.7736,  # Upper West Side
            "longitude": -73.9566,
            "items": [
                {
                    "title": "Pet Sitting Services",
                    "description": "In-home pet care, all animals welcome",
                    "price": 40,
                    "category": "pet care",
                    "type": "selling",
                },
                {
                    "title": "Dog Training Classes",
                    "description": "Basic obedience and behavior training",
                    "price": 50,
                    "category": "pet care",
                    "type": "selling",
                },
                {
                    "title": "Pet Supplies Bundle",
                    "description": "Leashes, toys, beds - moving sale",
                    "price": 100,
                    "category": "pets",
                    "type": "selling",
                },
            ],
            "wants": [
                {
                    "title": "Veterinary Services",
                    "description": "Looking for affordable vet check-ups",
                    "price": 150,
                    "category": "health",
                    "type": "buying",
                },
                {
                    "title": "Carpentry Work",
                    "description": "Need custom cat furniture built",
                    "price": 300,
                    "category": "services",
                    "type": "buying",
                },
            ],
        },
        {
            "username": "david_music",
            "email": "david@example.com",
            "password": "test123",
            "latitude": 40.7260,  # Greenwich Village
            "longitude": -74.0000,
            "items": [
                {
                    "title": "Guitar Lessons",
                    "description": "Acoustic/electric, all levels, jazz specialty",
                    "price": 60,
                    "category": "education",
                    "type": "selling",
                },
                {
                    "title": "Recording Studio Time",
                    "description": "Professional home studio, mixing included",
                    "price": 75,
                    "category": "services",
                    "type": "selling",
                },
                {
                    "title": "Vintage Fender Stratocaster",
                    "description": "1976 Strat, original parts, great condition",
                    "price": 3500,
                    "category": "music",
                    "type": "selling",
                },
            ],
            "wants": [
                {
                    "title": "Piano Tuning",
                    "description": "Need grand piano tuned",
                    "price": 200,
                    "category": "services",
                    "type": "buying",
                },
                {
                    "title": "Music Video Production",
                    "description": "Looking for videographer for music video",
                    "price": 1500,
                    "category": "services",
                    "type": "buying",
                },
            ],
        },
        {
            "username": "lisa_chef",
            "email": "lisa@example.com",
            "password": "test123",
            "latitude": 40.7425,  # Queens
            "longitude": -73.9397,
            "items": [
                {
                    "title": "Private Chef Services",
                    "description": "Dinner parties, meal prep, special diets",
                    "price": 150,
                    "category": "food",
                    "type": "selling",
                },
                {
                    "title": "Cooking Classes",
                    "description": "Italian cuisine, hands-on, max 6 people",
                    "price": 85,
                    "category": "education",
                    "type": "selling",
                },
                {
                    "title": "Professional Kitchen Equipment",
                    "description": "Commercial grade mixer, food processor",
                    "price": 600,
                    "category": "appliances",
                    "type": "selling",
                },
            ],
            "wants": [
                {
                    "title": "Garden Vegetables",
                    "description": "Looking for fresh, organic produce supplier",
                    "price": 50,
                    "category": "food",
                    "type": "buying",
                },
                {
                    "title": "Food Photography",
                    "description": "Need photos for cookbook",
                    "price": 800,
                    "category": "services",
                    "type": "buying",
                },
            ],
        },
        {
            "username": "alex_photo",
            "email": "alex@example.com",
            "password": "test123",
            "latitude": 40.7060,  # DUMBO
            "longitude": -73.9968,
            "items": [
                {
                    "title": "Photography Services",
                    "description": "Events, portraits, product photography",
                    "price": 250,
                    "category": "services",
                    "type": "selling",
                },
                {
                    "title": "Canon 5D Mark IV",
                    "description": "Full frame DSLR with 3 lenses",
                    "price": 2200,
                    "category": "electronics",
                    "type": "selling",
                },
                {
                    "title": "Photo Editing Workshop",
                    "description": "Lightroom and Photoshop basics",
                    "price": 120,
                    "category": "education",
                    "type": "selling",
                },
            ],
            "wants": [
                {
                    "title": "Studio Lighting",
                    "description": "Looking for used studio strobe lights",
                    "price": 600,
                    "category": "electronics",
                    "type": "buying",
                },
                {
                    "title": "Model for Portfolio",
                    "description": "Need models for fashion shoot",
                    "price": 200,
                    "category": "services",
                    "type": "buying",
                },
            ],
        },
    ]

    print("Creating test users and items...")
    print("=" * 50)

    for user_data in test_users_data:
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == user_data["username"]).first()
        if existing_user:
            print(f"User {user_data['username']} already exists, skipping...")
            continue

        # Create user
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            hashed_password=get_password_hash(user_data["password"]),
            latitude=user_data["latitude"],
            longitude=user_data["longitude"],
            is_active=True,
        )
        db.add(user)
        db.flush()  # Get user ID without committing

        print(f"\nCreated user: {user.username} ({user.email})")

        # Create items for sale
        for item_data in user_data.get("items", []):
            h3_index = h3.latlng_to_cell(user.latitude, user.longitude, 9)
            item = Item(
                title=item_data["title"],
                description=item_data["description"],
                price=item_data["price"],
                category=item_data["category"],
                latitude=user.latitude,
                longitude=user.longitude,
                h3_index=h3_index,
                owner_id=user.id,
                is_available=True,
            )
            db.add(item)
            print(f"  - Added: {item_data['title']} (${item_data['price']})")

        # Create wanted items/services
        for want_data in user_data.get("wants", []):
            h3_index = h3.latlng_to_cell(user.latitude, user.longitude, 9)
            want = Item(
                title=f"[WANTED] {want_data['title']}",
                description=want_data["description"],
                price=want_data["price"],
                category=want_data["category"],
                latitude=user.latitude,
                longitude=user.longitude,
                h3_index=h3_index,
                owner_id=user.id,
                is_available=True,
            )
            db.add(want)
            print(f"  - Wants: {want_data['title']} (${want_data['price']})")

    db.commit()
    print("\n" + "=" * 50)
    print("Test data created successfully!")

    # Show statistics
    total_users = db.query(User).count()
    total_items = db.query(Item).count()
    print("\nDatabase statistics:")
    print(f"  Total users: {total_users}")
    print(f"  Total items/services: {total_items}")

    # Show potential matches
    print("\n" + "=" * 50)
    print("Potential matches:")
    print("  - Sarah (tech) wants dog walking → Jenny offers pet sitting")
    print("  - Mike (handyman) wants laptop → Sarah selling MacBook")
    print("  - Emma (artist) wants website → Sarah offers web development")
    print("  - Carlos (fitness) wants video editing → Alex offers photography/editing")
    print("  - Lisa (chef) wants food photography → Alex offers photography")
    print("  - David (music) wants video production → Alex offers video services")
    print("  - Jenny (pets) wants carpentry → Mike offers home repair services")

except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
