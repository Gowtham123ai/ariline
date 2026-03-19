from pymongo import MongoClient
import sys

MONGO_URI = "mongodb+srv://jimysi_db_user:VStNjwPALrludofk@cluster0gffth.ynzxgp4.mongodb.net/"
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)

try:
    print("Connecting to MongoDB...")
    client.admin.command('ping')
    print("Ping successful")
    db = client["airline_db"]
    count = db.routes.count_documents({})
    print(f"Number of routes: {count}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
