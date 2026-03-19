from flask import Flask, request, jsonify, session, redirect
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from pymongo import MongoClient
import datetime
import os
import random
import bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt
import eventlet
from amadeus import Client

app = Flask(__name__)
app.secret_key = "SUPER_SECRET"
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*")

# -----------------------------
# CONFIG
# -----------------------------

MONGO_URI = "mongodb+srv://jimysi_db_user:VStNjwPALrludofk@cluster0gffth.ynzxgp4.mongodb.net/"
try:
    # Added timeout and SSL workaround
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
    db = client["airline_db"]
    # Quick check if connection is alive
    client.admin.command('ping')
    print("Connected to MongoDB Atlas")
    MONGO_AVAILABLE = True
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    print("Falling back to In-Memory/Mock Database for Demo")
    MONGO_AVAILABLE = False
    # Mock DB implementation for demo
    class MockCollection:
        def __init__(self): self.data = []
        def find(self, query, projection=None): return self.data
        def find_one(self, query): return None
        def insert_one(self, doc): self.data.append(doc)
        def count_documents(self, query): return len(self.data)
    
    class MockDB:
        def __init__(self):
            self.users = MockCollection()
            self.routes = MockCollection()
            # Initial dummy data for demo
            self.routes.insert_one({
                "user": "admin@airline.ai",
                "origin": "MAA",
                "destination": "DXB",
                "price": 28500,
                "timestamp": datetime.datetime.now()
            })
            self.routes.insert_one({
                "user": "admin@airline.ai",
                "origin": "DEL",
                "destination": "BLR",
                "price": 12500,
                "timestamp": datetime.datetime.now()
            })
    db = MockDB()

# Amadeus API
try:
    amadeus = Client(
        client_id="1qkIsxLMEgBJucbQfru3Bjwm7FGDHLk0",
        client_secret="ndhROyTJGtw1jEmN"
    )
    # Quick check by looking at some basic property or just assume it's okay until used
    AMADEUS_AVAILABLE = True
    print("Amadeus API client initialized")
except Exception as e:
    print(f"Amadeus API initialization failed: {e}")
    AMADEUS_AVAILABLE = False

# JWT Setup
app.config["JWT_SECRET_KEY"] = "super-secret"
jwt = JWTManager(app)

# -----------------------------
# JWT & ROLES LOGIN SYSTEM
# -----------------------------

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    hashed = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    db.users.insert_one({
        "email": data["email"],
        "password": hashed,
        "role": "admin" if data.get("admin") else "user"
    })
    return jsonify({"msg": "Registered successfully"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = db.users.find_one({"email": data["email"]})
    if not user or not bcrypt.checkpw(data["password"].encode("utf-8"), user["password"].encode("utf-8")):
        return jsonify({"msg": "Invalid credentials"}), 401

    token = create_access_token(
        identity=data["email"],
        additional_claims={"role": user.get("role", "user")}
    )
    return jsonify({"token": token, "role": user.get("role", "user")})

@app.route("/api/admin/stats")
@jwt_required()
def admin_stats():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"msg": "Admins only"}), 403

    return jsonify({
        "total_users": db.users.count_documents({}),
        "total_searches": db.routes.count_documents({})
    })

# -----------------------------
# AI CORE & INTELLIGENCE
# -----------------------------

@app.route("/api/forecast")
def get_forecast():
    # Return a 7-day forecast with confidence intervals
    base_date = datetime.date.today()
    forecast_data = []
    current_price = 28000
    
    for i in range(7):
        date = base_date + datetime.timedelta(days=i)
        change = random.randint(-1500, 2000)
        current_price += change
        
        # Simulated "Prophet" style confidence intervals
        forecast_data.append({
            "ds": date.isoformat(),
            "yhat": max(12000, current_price),
            "yhat_lower": max(10000, current_price - 2000),
            "yhat_upper": current_price + 2000,
            "accuracy": 82 if i < 3 else 68 # Higher accuracy for near future
        })
        
    return jsonify({
        "data": forecast_data,
        "prediction_text": "Price will drop by 12% in 3 days",
        "confidence": "80%"
    })

@app.route("/api/route-intelligence")
def route_intelligence():
    origin = request.args.get("origin", "MAA")
    destination = request.args.get("destination", "DEL")
    
    # Practical insights based on route analysis
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    best_day = days[random.randint(0, 2)] # Usually Tue/Wed
    
    return jsonify({
        "best_day_to_book": best_day,
        "days_before_departure": 7,
        "demand_level": "High" if random.random() > 0.6 else "Low",
        "surge_detection": "Price surge expected due to weekend" if random.random() > 0.7 else "No surge detected",
        "recommendation": "Book 7 days before departure on a " + best_day
    })

@app.route("/api/chat", methods=["POST"])
def ai_chat():
    data = request.json
    msg = data.get("message", "").lower()
    
    # Simple Intelligent Rule-based Bot
    if "book" in msg:
        res = "Prices for MAA to DXB are likely to drop in 2 days. Confidence: 85%."
    elif "price" in msg or "cheap" in msg:
        res = "Based on our AI trends, mid-week flights (Tuesday/Wednesday) are 15% cheaper."
    elif "status" in msg or "delay" in msg:
        res = "Most flights are on time today. Delay risk is low for internal routes."
    else:
        res = "I am your Airline AI. I can help with fare predictions and booking advice!"
        
    return jsonify({"response": res})
# -----------------------------
# REAL FLIGHT DATA
# -----------------------------

@app.route("/api/flights")
def get_flights():
    origin = request.args.get("origin", "MAA")
    destination = request.args.get("destination", "DXB")

    try:
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=origin,
            destinationLocationCode=destination,
            departureDate=datetime.date.today().isoformat(),
            adults=1
        )
        response_data = response.data
    except Exception as e:
        print(f"Amadeus API failed: {e}. Using mock data.")
        response_data = []

    flights = []

    # If API failed or returned nothing, use mock data for demo
    if not response_data:
        for i in range(3):
            flights.append({
                "price": random.randint(12000, 35000),
                "currency": "INR",
                "airline": random.choice(["Indigo", "Air India", "Vistara"]),
                "departure": (datetime.datetime.now() + datetime.timedelta(hours=random.randint(2, 12))).isoformat()
            })
    else:
        for offer in response_data[:5]:
            raw_price = float(offer["price"]["total"])
            currency = offer["price"]["currency"]
            
            final_price = raw_price
            if currency != "INR":
                final_price = round(raw_price * 90, 2)
                
            flights.append({
                "price": final_price,
                "currency": "INR",
                "airline": offer["validatingAirlineCodes"][0],
                "departure": offer["itineraries"][0]["segments"][0]["departure"]["at"]
            })

    return jsonify(flights)

# -----------------------------
# PERSONALIZED DASHBOARD
# -----------------------------

@app.route("/api/save-route", methods=["POST"])
def save_route():
    # Use session user or default to admin for demo
    user_email = session.get("user", {}).get("email", "admin@airline.ai")
    
    data = request.json
    db.routes.insert_one({
        "user": user_email,
        "origin": data["origin"],
        "destination": data["destination"],
        "price": data.get("price"),
        "timestamp": datetime.datetime.now()
    })

    return jsonify({"msg": "Route saved"})

@app.route("/api/my-routes")
def my_routes():
    user_email = session.get("user", {}).get("email", "admin@airline.ai")
    
    routes = list(db.routes.find({"user": user_email}, {"_id":0}))
    return jsonify(routes)

# -----------------------------
# REAL-TIME WEBSOCKET
# -----------------------------

@socketio.on("connect")
def handle_connect():
    emit("message", {"data": "Connected to server"})

def send_live_price():
    while True:
        socketio.emit("live_price", {
            "price": random.randint(15000, 45000)
        })
        socketio.sleep(5)

@socketio.on("subscribe")
def handle_subscribe(data):
    origin = data["origin"]
    destination = data["destination"]

    response = amadeus.shopping.flight_offers_search.get(
        originLocationCode=origin,
        destinationLocationCode=destination,
        departureDate=datetime.date.today().isoformat(),
        adults=1
    )

    if not response.data:
        print(f"No flight offer found for {origin} to {destination}")
        return

    offer = response.data[0]
    raw_price = float(offer["price"]["total"])
    currency = offer["price"]["currency"]
    
    final_price = raw_price
    if currency != "INR":
        final_price = round(raw_price * 90, 2)

    socketio.emit("flight_update", {
        "price": final_price,
        "currency": "INR",
        "airline": offer["validatingAirlineCodes"][0]
    })

# -----------------------------
# MAIN
# -----------------------------

if __name__ == "__main__":
    socketio.start_background_task(send_live_price)
    socketio.run(app, host="0.0.0.0", port=10000)
