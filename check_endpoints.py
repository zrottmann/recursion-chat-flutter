from app_sqlite import app

print("Checking FastAPI endpoints...")
print("=" * 50)

endpoints = []
for route in app.routes:
    if hasattr(route, "methods") and hasattr(route, "path"):
        endpoints.append(f"{list(route.methods)[0] if route.methods else 'GET'} {route.path}")

endpoints.sort()
for endpoint in endpoints:
    print(endpoint)

print("\n" + "=" * 50)
print(f"Total endpoints: {len(endpoints)}")

# Check if /matches exists
if any("/matches" in ep for ep in endpoints):
    print("\n✓ SUCCESS: /matches endpoint found!")
else:
    print("\n✗ ERROR: /matches endpoint NOT found!")
    print("Make sure you saved the app_sqlite.py file with the matches endpoint")
