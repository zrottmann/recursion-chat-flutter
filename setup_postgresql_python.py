import subprocess
import os
import getpass

print("PostgreSQL Database Setup for Trading Post")
print("=========================================\n")

# Get PostgreSQL details
postgres_password = getpass.getpass("Enter the password for 'postgres' user (set during installation): ")

# Try to find psql.exe
psql_paths = [
    r"C:\Program Files\PostgreSQL\16\bin\psql.exe",
    r"C:\Program Files\PostgreSQL\15\bin\psql.exe",
    r"C:\Program Files\PostgreSQL\14\bin\psql.exe",
    r"C:\Program Files\PostgreSQL\13\bin\psql.exe",
]

psql_exe = None
for path in psql_paths:
    if os.path.exists(path):
        psql_exe = path
        break

if not psql_exe:
    psql_exe = input("PostgreSQL not found in standard locations. Enter path to psql.exe: ")

print(f"\nUsing PostgreSQL at: {psql_exe}")

# Database setup commands
commands = [
    ("Creating database 'tradingpost'...", "CREATE DATABASE tradingpost;"),
    (
        "Creating user 'tradinguser'...",
        "CREATE USER tradinguser WITH PASSWORD 'tradingpass';",
    ),
    (
        "Granting privileges...",
        "GRANT ALL PRIVILEGES ON DATABASE tradingpost TO tradinguser;",
    ),
    ("Granting schema permissions...", "GRANT ALL ON SCHEMA public TO tradinguser;"),
]

# Execute commands
for desc, cmd in commands:
    print(f"\n{desc}")
    try:
        result = subprocess.run(
            [psql_exe, "-U", "postgres", "-c", cmd],
            input=postgres_password.encode(),
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            print("✓ Success")
        else:
            if "already exists" in result.stderr:
                print("✓ Already exists")
            else:
                print(f"✗ Error: {result.stderr}")
    except Exception as e:
        print(f"✗ Error: {e}")

# Enable PostGIS
print("\nEnabling PostGIS extension...")
try:
    result = subprocess.run(
        [
            psql_exe,
            "-U",
            "postgres",
            "-d",
            "tradingpost",
            "-c",
            "CREATE EXTENSION IF NOT EXISTS postgis;",
        ],
        input=postgres_password.encode(),
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        print("✓ PostGIS enabled")
    else:
        print(f"Note: {result.stderr}")
        print("PostGIS might not be installed. You can install it later through Stack Builder.")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 50)
print("Database setup complete!\n")
print("Now run these commands to initialize the Trading Post database:\n")
print("SET DB_URL=postgresql://tradinguser:tradingpass@localhost:5432/tradingpost")
print("python db_init.py --migrate --seed")
print("\nOr in PowerShell:")
print('$env:DB_URL = "postgresql://tradinguser:tradingpass@localhost:5432/tradingpost"')
print("python db_init.py --migrate --seed")
