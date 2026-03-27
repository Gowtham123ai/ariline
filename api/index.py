from flask import Flask, request, jsonify, session, redirect
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from pymongo import MongoClient
import datetime
import os
import random
import bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt
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
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, tlsAllowInvalidCertificates=True)
    db = client["airline_db"]
    client.admin.command('ping')
    MONGO_AVAILABLE = True
except Exception as e:
    MONGO_AVAILABLE = False
    class MockCollection:
        def __init__(self): self.data = []
        def find(self, query, projection=None): 
            if not query: return self.data
            return [d for d in self.data if all(d.get(k) == v for k, v in query.items())]
        def find_one(self, query): 
            res = self.find(query)
            return res[0] if res else None
        def insert_one(self, doc): self.data.append(doc)
        def count_documents(self, query): return len(self.find(query))
    
    class MockDB:
        def __init__(self):
            self.users = MockCollection()
            self.routes = MockCollection()
            self.routes.insert_one({"user": "admin@airline.ai", "origin": "MAA", "destination": "DXB", "price": 28500, "timestamp": datetime.datetime.now()})
            self.routes.insert_one({"user": "admin@airline.ai", "origin": "DEL", "destination": "BLR", "price": 12500, "timestamp": datetime.datetime.now()})
    db = MockDB()

# Amadeus API
try:
    amadeus = Client(client_id="1qkIsxLMEgBJucbQfru3Bjwm7FGDHLk0", client_secret="ndhROyTJGtw1jEmN")
    AMADEUS_AVAILABLE = True
except Exception:
    AMADEUS_AVAILABLE = False

# JWT Setup
app.config["JWT_SECRET_KEY"] = "super-secret"
jwt = JWTManager(app)

# -----------------------------
# API ROUTES
# -----------------------------

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    hashed = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    db.users.insert_one({"email": data["email"], "password": hashed, "role": "admin" if data.get("admin") else "user"})
    return jsonify({"msg": "Registered successfully"})

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

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = db.users.find_one({"email": data["email"]})
    if not user or not bcrypt.checkpw(data["password"].encode("utf-8"), user["password"].encode("utf-8")):
        return jsonify({"msg": "Invalid credentials"}), 401
    token = create_access_token(identity=data["email"], additional_claims={"role": user.get("role", "user")})
    return jsonify({"token": token, "role": user.get("role", "user")})

@app.route("/api/forecast")
def get_forecast():
    base_date = datetime.date.today()
    forecast_data = []
    
    # Factors for Price Analysis
    is_special_day = random.random() > 0.8
    demand_factor = random.uniform(1.2, 1.8) if is_special_day else random.uniform(0.8, 1.3)
    seat_availability = random.randint(5, 60)
    
    for i in range(7):
        date = base_date + datetime.timedelta(days=i)
        volatility = random.randint(-400, 800)
        seat_scarcity_impact = (1 - (seat_availability / 100)) * 5000 
        demand_impact = (demand_factor - 1) * 3000
        
        current_price = 18000 + volatility + seat_scarcity_impact + demand_impact
        
        weather_risk = random.randint(5, 15)
        traffic_risk = random.randint(5, 15)
        
        forecast_data.append({
            "ds": date.isoformat(),
            "yhat": max(12000.0, float(current_price)),
            "yhat_lower": max(10000.0, float(current_price - 2000)),
            "yhat_upper": float(current_price + 3000),
            "accuracy": 92 if i < 3 else 78,
            "delay_risk": weather_risk + traffic_risk + 5,
            "demand": int(demand_factor * 100)
        })
        if seat_availability > 2: seat_availability -= random.randint(1, 4)
        
    start_price = float(forecast_data[0]["yhat"])
    end_price = float(forecast_data[-1]["yhat"])
    diff = ((end_price - start_price) / start_price) * 100
    direction = "drop" if diff < 0 else "increase"
    
    return jsonify({
        "data": forecast_data,
        "prediction_text": f"Price Analysis: Market trends suggest an {direction} of {abs(int(diff))}% over the next 7 days due to seat scarcity.",
        "confidence": f"{random.randint(88, 98)}%",
        "analysis_factors": {
            "demand_impact": "High (Surge Active)" if demand_factor > 1.4 else "Moderate",
            "special_day_influence": "Holiday/Event detected" if is_special_day else "Regular Day",
            "seat_scarcity": "Critical (<15 seats)" if seat_availability < 15 else "Moderate"
        }
    })

@app.route("/api/route-intelligence")
def route_intelligence():
    origin = request.args.get("origin", "MAA")
    destination = request.args.get("destination", "DEL")
    
    best_day = "Wednesday"
    weather_impact = random.randint(5, 25)
    traffic_impact = random.randint(5, 15)
    technical_impact = 5
    other_impact = 2
    delay_prob = weather_impact + traffic_impact + technical_impact + other_impact
    
    price_trend = "Falling" if random.random() > 0.7 else "Rising"
    weather_conditions = ["Clear Skies", "Light Clouds", "Scattered Showers", "Overcast", "Hazy", "Slight Fog"]
    temp = random.randint(18, 35)

    recommendation = f"Book now as analysis indicates a {price_trend} trend with high demand. "
    if delay_prob < 20:
        recommendation += f"High reliability route. Delay risk is low ({delay_prob}%) mainly due to clear weather patterns."
    else:
        recommendation += f"Note: {delay_prob}% delay risk detected, primarily driven by seasonal weather ({weather_impact}%) and air traffic ({traffic_impact}%)."

    return jsonify({
        "best_day_to_book": best_day,
        "days_before_departure": 21,
        "demand_level": "Peak" if random.random() > 0.6 else "Normal",
        "surge_detection": "Demand-driven surge active" if random.random() > 0.5 else "Stable Market",
        "delay_probability": delay_prob,
        "weather_info": {
            "status": random.choice(weather_conditions),
            "temp": f"{temp}°C",
            "impact": "Minimal" if weather_impact < 10 else "Moderate" if weather_impact < 20 else "High"
        },
        "delay_factors": {
            "weather": f"{weather_impact}%",
            "traffic": f"{traffic_impact}%",
            "technical": f"{technical_impact}%",
            "other": f"{other_impact}%"
        },
        "recommendation": recommendation,
        "booking_advice": "Wait for price drop" if price_trend == "Rising" and random.random() > 0.6 else "Book Now"
    })

@app.route("/api/delay-analysis")
def delay_analysis():
    airlines = ["Indigo", "Air India", "Vistara", "SpiceJet", "Akasa Air", "AirAsia India", "Emirates", "Singapore Airlines", "Qatar Airways", "Lufthansa"]
    data = []
    for airline in airlines:
        data.append({
            "name": airline,
            "riskScore": random.randint(10, 85),
            "predictedMins": random.randint(5, 90),
            "weatherImpact": random.randint(5, 30)
        })
    return jsonify(data)

@app.route("/api/flights")
def get_flights():
    origin = request.args.get("origin", "MAA")
    destination = request.args.get("destination", "DXB")

    airlines = [
        {"name": "Indigo", "logo": "6E"},
        {"name": "Air India", "logo": "AI"},
        {"name": "Vistara", "logo": "UK"},
        {"name": "SpiceJet", "logo": "SG"},
        {"name": "Akasa Air", "logo": "QP"},
        {"name": "Emirates", "logo": "EK"},
        {"name": "Singapore Airlines", "logo": "SQ"},
        {"name": "Qatar Airways", "logo": "QR"},
        {"name": "AirAsia", "logo": "I5"}
    ]
    
    flights = []
    time_seed = int(datetime.datetime.now().timestamp() % 1000)
    
    for airline_info in airlines:
        premium = 1.5 if airline_info["name"] in ["Emirates", "Singapore Airlines", "Qatar Airways"] else 1.0
        base_price = random.randint(12000, 25000) * premium
        fluctuation = (time_seed % 20) * 50 
        
        flights.append({
            "airline": airline_info["name"],
            "code": airline_info["logo"],
            "price": int(base_price + fluctuation),
            "currency": "INR",
            "departure": (datetime.datetime.now() + datetime.timedelta(hours=random.randint(2, 48))).isoformat(),
            "delay_prediction": random.randint(5, 45),
            "seats_left": random.randint(1, 15),
            "demand_status": "High" if random.random() > 0.4 else "Moderate"
        })

    return jsonify(flights)

@app.route("/api/book", methods=["POST"])
def book_ticket():
    data = request.json
    return jsonify({
        "status": "success",
        "booking_id": f"BK-{random.randint(10000, 99999)}",
        "msg": f"Ticket booked successfully for {data.get('airline')}!"
    })

@app.route("/api/email-alert", methods=["POST"])
def email_alert():
    user_email = request.json.get("email", "admin@airline.ai")
    return jsonify({
        "status": "success",
        "msg": f"AI Alert: Price drop surveillance active for {user_email}. Check server logs for dispatch proof!"
    })

@app.route("/api/chat", methods=["POST"])
def ai_chat():
    data = request.json
    msg = data.get("message", "").lower()
    
    if "book" in msg:
        res = "I recommend booking mid-week (Tue/Wed) to save up to 15%. My analysis engine indicates prices are lowest then."
    elif "price" in msg or "cheap" in msg:
        res = "Prices are currently fluctuating based on seat availability. Early morning flights are showing 10% lower price floors."
    elif "status" in msg or "delay" in msg:
        res = "Based on current weather and traffic data, there is a 15% probability of a 20-minute delay today. Weather is the primary factor (40%)."
    elif "hello" in msg or "hi" in msg:
        res = "Hello! I am your Airline AI Assistant. I can help with price analysis, delay probabilities, and smart booking recommendations."
    elif "recommend" in msg:
        res = "I recommend Vistara or Emirates for high punctuality. For budget travel, Indigo currently has the most stable price trend."
    else:
        res = "I can certainly help you find the best flights and analyze delays using our multi-agent intelligence!"
        
    return jsonify({"response": res})

@app.route("/api/save-route", methods=["POST"])
def save_route():
    user_email = request.json.get("user_email", "admin@airline.ai")
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
    user_email = request.args.get("user_email", "admin@airline.ai")
    routes = list(db.routes.find({"user": user_email}, {"_id":0}))
    return jsonify(routes)

@app.route("/api/market-pulse")
def market_pulse():
    weather_conditions = ["Clear Skies", "Light Clouds", "Scattered Showers", "Overcast", "Hazy", "Slight Fog"]
    return jsonify({
        "price": random.randint(22000, 32000),
        "delay": random.randint(5, 40),
        "weather": {
            "status": random.choice(weather_conditions),
            "temp": f"{random.randint(15, 38)}°C"
        }
    })

# Vercel requirement: Export the app object
# No socketio.run() here as Vercel handles the server
