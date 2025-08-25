from app_sqlite import SessionLocal, User, Item
import h3

# Add wants/needs for zrottmann user to enable matchmaking
db = SessionLocal()

try:
    # Find zrottmann user
    user = db.query(User).filter(User.username == "zrottmann").first()
    if not user:
        print("User zrottmann not found!")
        exit()

    print(f"Adding wants/needs for {user.username}...")

    # Add some wants that match existing offers
    wants = [
        {
            "title": "[WANTED] Photography Services",
            "description": "Need professional photos for website and social media",
            "price": 300,
            "category": "services",
        },
        {
            "title": "[WANTED] Web Development Help",
            "description": "Looking for React developer for frontend work",
            "price": 150,
            "category": "services",
        },
        {
            "title": "[WANTED] Personal Training",
            "description": "Want to get in shape, need fitness guidance",
            "price": 100,
            "category": "fitness",
        },
        {
            "title": "[WANTED] MacBook or Laptop",
            "description": "Need a powerful laptop for development work",
            "price": 2000,
            "category": "electronics",
        },
        {
            "title": "[WANTED] Dog Walking",
            "description": "Need someone to walk my dog on weekdays",
            "price": 30,
            "category": "pet care",
        },
    ]

    # Also add some offers
    offers = [
        {
            "title": "Tech Consulting",
            "description": "Software architecture and system design consulting",
            "price": 200,
            "category": "services",
        },
        {
            "title": "iPhone 13 Pro",
            "description": "Excellent condition, 256GB, all accessories",
            "price": 800,
            "category": "electronics",
        },
        {
            "title": "Programming Tutoring",
            "description": "Python, JavaScript, React - beginner to advanced",
            "price": 75,
            "category": "education",
        },
    ]

    h3_index = h3.latlng_to_cell(user.latitude, user.longitude, 9)

    # Add wants
    for want_data in wants:
        want = Item(
            title=want_data["title"],
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
        print(f"  Added want: {want_data['title']}")

    # Add offers
    for offer_data in offers:
        offer = Item(
            title=offer_data["title"],
            description=offer_data["description"],
            price=offer_data["price"],
            category=offer_data["category"],
            latitude=user.latitude,
            longitude=user.longitude,
            h3_index=h3_index,
            owner_id=user.id,
            is_available=True,
        )
        db.add(offer)
        print(f"  Added offer: {offer_data['title']}")

    db.commit()
    print("\nSuccessfully added items for zrottmann!")

    # Show potential matches
    print("\nPotential matches created:")
    print("- zrottmann wants Photography → alex_photo offers Photography Services")
    print("- zrottmann wants Web Development → sarah_tech offers Web Development")
    print("- zrottmann wants Personal Training → carlos_fitness offers Training Sessions")
    print("- zrottmann wants MacBook → sarah_tech has MacBook Pro 2021")
    print("- zrottmann wants Dog Walking → jenny_pets offers Pet Sitting")

except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
