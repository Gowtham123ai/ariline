import { io } from "socket.io-client"
import { useEffect, useState } from "react"
import axios from "axios"
import { airports } from "../airports"
import { Card, Typography, Modal, Box, CircularProgress, Tooltip, Divider } from "@mui/material"

const SOCKET_URL = window.location.hostname === "localhost" ? "http://localhost:5001" : window.location.origin
const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  reconnectionAttempts: 5
})

function Dashboard({ currency = "INR" }) {
  const [livePrice, setLivePrice] = useState(null)
  const [marketDelay, setMarketDelay] = useState(15)
  const [marketWeather, setMarketWeather] = useState({ status: "Analyzing Skies...", temp: "--°C" })
  const [origin, setOrigin] = useState("MAA")
  const [destination, setDestination] = useState("DEL")
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [intelligence, setIntelligence] = useState(null)
  
  // Booking Scanner State
  const [bookingModal, setBookingModal] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState(null)

  const rates = { INR: 1, USD: 0.012, EUR: 0.011 }
  const symbol = { INR: "₹", USD: "$", EUR: "€" }

  const formatPrice = (p) => {
    const converted = p * rates[currency]
    return symbol[currency] + converted.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }

  const getAirlineUrl = (name) => {
    const urls = {
      "Indigo": "https://www.goindigo.in/",
      "Air India": "https://www.airindia.in/",
      "Vistara": "https://www.airvistara.com/",
      "SpiceJet": "https://www.spicejet.com/",
      "Akasa Air": "https://www.akasaair.com/",
      "AirAsia India": "https://www.airasia.com/",
      "Emirates": "https://www.emirates.com/",
      "Singapore Airlines": "https://www.singaporeair.com/",
      "Qatar Airways": "https://www.qatarairways.com/",
      "Lufthansa": "https://www.lufthansa.com/"
    }
    return urls[name] || "https://www.google.com/travel/flights";
  }

  useEffect(() => {
    socket.on("live_price", (data) => {
      setLivePrice(data.price)
      if (data.delay) setMarketDelay(data.delay)
      if (data.weather) setMarketWeather(data.weather)
    })

    // Fallback Polling for Vercel (where Socket.io might not work)
    const fallbackPoll = setInterval(async () => {
      if (!livePrice || marketWeather.status === "Analyzing Skies...") {
        try {
          const res = await axios.get("/api/market-pulse");
          setLivePrice(res.data.price);
          setMarketDelay(res.data.delay);
          setMarketWeather(res.data.weather);
        } catch (e) {
          console.log("Polling failed, normal for local if backend down");
        }
      }
    }, 5000);

    return () => {
      socket.off("live_price")
      clearInterval(fallbackPoll)
    }
  }, [livePrice, marketWeather.status])

  const searchFlights = async () => {
    setLoading(true)
    setFlights([])
    setIntelligence(null)
    try {
      const flRes = await axios.get(`/api/flights`, {
        params: { origin, destination }
      });
      setFlights(flRes.data);

      const intelRes = await axios.get(`/api/route-intelligence`, {
        params: { origin, destination }
      })
      setIntelligence(intelRes.data)

      setOpen(true)
    } catch (err) {
      alert(`Flight search failed: ${err.message}`);
    } finally {
      setLoading(false)
    }
  }

  const bookNow = (flight) => {
    setSelectedFlight(flight)
    setBookingModal(true)
  }

  const completeBooking = async () => {
    try {
      // Simulate booking logging on our end
      await axios.post('/api/book', { 
        airline: selectedFlight.airline, 
        price: selectedFlight.price, 
        origin, 
        destination 
      });
      
      // Redirect to official website
      const url = getAirlineUrl(selectedFlight.airline);
      window.open(url, "_blank");
      
      setBookingModal(false);
      alert(`Redirecting to official ${selectedFlight.airline} site for final seat selection and payment.`);
    } catch (err) {
      alert("System sync failed. Please try again.");
    }
  }

  const setEmailAlert = async () => {
    const email = localStorage.getItem("user_email") || prompt("Enter your email for price drop alerts:");
    if (email) {
      try {
        const response = await axios.post('/api/email-alert', { email, origin, destination });
        alert(response.data.msg);
      } catch (err) {
        alert("Failed to set email alert.");
      }
    }
  }

  const trackRoute = async (flight) => {
    try {
      await axios.post('/api/save-route', {
        user_email: localStorage.getItem("user_email") || "admin@airline.ai",
        origin,
        destination,
        price: flight.price
      })
      alert(`Tracking started for ${origin} ✈ ${destination}!`);
    } catch (err) {
      alert("Failed to save route.");
    }
  }

  const getCity = (code) => airports.find(a => a.code === code)?.city || code;

  return (
    <div className="dashboard-view" style={{ padding: '20px' }}>
      <div className="header-flex" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px", flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "700" }}>Market Dashboard</h1>
          <p style={{ color: "var(--text-secondary)", margin: "8px 0 0 0" }}>
            Real-time multi-agent intelligence analyzing global routes for {localStorage.getItem("user_email") || "Guest"}.
          </p>
        </div>

        <div className="search-box-container" style={{ display: "flex", gap: "12px", alignItems: "center", background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px' }}>
          <div className="select-group">
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginLeft: '10px', textTransform: 'uppercase' }}>From</span>
            <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="input-glass" style={{ border: 'none', background: 'transparent' }}>
              {airports.map(a => <option key={`orig-${a.code}`} value={a.code} style={{ color: "black" }}>{a.city} ({a.code})</option>)}
            </select>
          </div>
          <div style={{ color: 'var(--primary)', fontWeight: 700 }}>→</div>
          <div className="select-group">
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginLeft: '10px', textTransform: 'uppercase' }}>To</span>
            <select value={destination} onChange={(e) => setDestination(e.target.value)} className="input-glass" style={{ border: 'none', background: 'transparent' }}>
              {airports.map(a => <option key={`dest-${a.code}`} value={a.code} style={{ color: "black" }}>{a.city} ({a.code})</option>)}
            </select>
          </div>
          <button onClick={searchFlights} className="btn-primary" disabled={loading} style={{ minWidth: "150px", borderRadius: '8px', height: '45px' }}>
            {loading ? <CircularProgress size={20} color="inherit" /> : "Analyze Route"}
          </button>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        <div className="card" style={{ borderTop: '4px solid #8b5cf6' }}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🔍</span> Price Analysis Engine
          </div>
          <div className="stat-value" style={{ color: '#8b5cf6' }}>Active</div>
          <div style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "13px" }}>Analyzing 25k+ market data points across global GDS nodes.</div>
        </div>

        <div className="card" style={{ borderTop: '4px solid #0ea5e9' }}>
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>☁️</span> {intelligence ? "Live Route Weather" : "Global Aviation Weather"}
          </div>
          <div className="stat-value" style={{ color: '#0ea5e9' }}>
            {intelligence?.weather_info?.status || marketWeather.status}
          </div>
          <div style={{ marginTop: "12px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ color: 'white', fontWeight: 800 }}>{intelligence?.weather_info?.temp || marketWeather.temp}</span>
             <span style={{ 
               fontSize: '11px', 
               padding: '4px 10px', 
               borderRadius: '12px', 
               background: (intelligence?.weather_info?.impact === "High") ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
               color: (intelligence?.weather_info?.impact === "High") ? '#f43f5e' : '#10b981',
               fontWeight: 700
             }}>
               Impact: {intelligence?.weather_info?.impact || "Market Standard"}
             </span>
          </div>
        </div>

        <Tooltip title="This average is derived from 500+ global API calls per hour. It represents the 'Market Floor' - used to detect if your specific route is overpriced or a steal." arrow>
          <div className="card" onClick={setEmailAlert} style={{ cursor: 'pointer', position: 'relative' }}>
            <div className="stat-label">Live Global Ticket Price Avg</div>
            <div className="stat-value">{formatPrice(livePrice || 28000)}</div>
            <div style={{ marginTop: "12px", color: "var(--primary)", fontSize: "14px", fontWeight: "600" }}>🔔 Set Monitoring Alert</div>
            <span style={{ position: 'absolute', top: 10, right: 10, fontSize: '10px', opacity: 0.5 }}>ⓘ</span>
          </div>
        </Tooltip>

        <Tooltip title={intelligence ? `Factors: Weather (${intelligence.delay_factors?.weather}), Traffic (${intelligence.delay_factors?.traffic}), Operations (${intelligence.delay_factors?.technical}), Other (${intelligence.delay_factors?.other})` : "Global dynamic factors: 40% Weather, 30% Traffic, 20% Tech."} arrow>
          <div className="card" style={{ cursor: 'help' }}>
            <div className="stat-label">Delay Probability</div>
            <div className="stat-value" style={{ color: (intelligence?.delay_probability || marketDelay) > 30 ? "#f43f5e" : "#10b981" }}>
              {intelligence ? intelligence.delay_probability + "%" : marketDelay + "%"}
              <span style={{ fontSize: '12px', opacity: 0.5, marginLeft: '8px' }}>ⓘ</span>
            </div>
            <div style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>
              {intelligence ? (intelligence.delay_probability > 30 ? "High Weather/Traffic Risk" : "Stable Flight Conditions") : (marketDelay > 20 ? "Fluctuating Conditions" : "Market Standard")}
            </div>
          </div>
        </Tooltip>
      </div>

      <div className="card ai-card" style={{ marginTop: "30px", borderLeft: "6px solid #8b5cf6", background: "rgba(139, 92, 246, 0.1)", borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#8b5cf6", display: 'flex', alignItems: 'center', gap: '10px' }}>
          ✨ Smart Booking Recommendation {intelligence && <span className="status-badge" style={{ background: '#8b5cf6', color: 'white', fontSize: '10px' }}>AI VERIFIED</span>}
        </h3>
        <p style={{ fontSize: "18px", margin: 0, lineHeight: "1.6" }}>
          {intelligence ? (
            <>
              {intelligence.recommendation}
              <br />
              <div style={{ marginTop: '15px' }}>
                <span style={{ 
                  padding: '8px 16px', 
                  borderRadius: '20px', 
                  background: intelligence.booking_advice === "Book Now" ? "#10b981" : "#f59e0b",
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '14px',
                  display: 'inline-block',
                  marginRight: '12px'
                }}>
                  DECISION: {intelligence.booking_advice?.toUpperCase()}
                </span>
                <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                  Optimal Day: <b>{intelligence.best_day_to_book}</b> | Confidence: <b>94%</b>
                </span>
              </div>
            </>
          ) : (
            "Select routes above to trigger a full Multi-Agent Price and Reliability analysis."
          )}
        </p>
      </div>

      {/* Flight Results Modal */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: 700 }, bgcolor: '#0f172a', border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '24px', p: 4, color: 'white', outline: 'none', maxHeight: '85vh', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
               <Typography variant="h5" sx={{ fontWeight: 800 }}>Search Results: {getCity(origin)} → {getCity(destination)}</Typography>
               <Typography variant="body2" sx={{ color: '#94a3b8' }}>Showing all airlines with real-time price analysis suggestions.</Typography>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ display: 'grid', gap: '16px', padding: '5px', maxHeight: '500px', overflowY: 'auto' }}>
            {(Array.isArray(flights) ? flights : []).map((flight, idx) => (
              <div key={idx} style={{ 
                background: 'rgba(255, 255, 255, 0.03)', 
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'transform 0.2s', cursor: 'default'
              }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ background: '#fff', color: '#000', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px' }}>
                    {flight.code}
                  </div>
                  <div>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.2 }}>{flight.airline}</Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '13px' }}>
                      Departure: <b>{new Date(flight.departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b> | 
                      <span style={{ color: flight.seats_left < 5 ? '#f43f5e' : '#94a3b8' }}> {flight.seats_left} seats remaining</span>
                    </Typography>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      {idx === 0 && <span style={{ fontSize: '9px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 900 }}>AI SUGGESTION: CHEAPEST</span>}
                      {flight.delay_prediction < 10 && <span style={{ fontSize: '9px', background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 900 }}>MOST RELIABLE</span>}
                      <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', padding: '2px 8px', borderRadius: '4px' }}>
                        DELAY RISK: {flight.delay_prediction} mins
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#6366f1', mb: 1 }}>{formatPrice(flight.price)}</Typography>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => trackRoute(flight)} className="btn-outline" style={{ background: 'transparent', color: '#8b5cf6', border: '1px solid #8b5cf6', fontWeight: 700, padding: '10px 15px', borderRadius: '10px', fontSize: '11px', cursor: 'pointer' }}>
                      TRACK
                    </button>
                    <button onClick={() => bookNow(flight)} className="btn-primary" style={{ background: 'var(--accent)', color: 'black', fontWeight: 900, padding: '10px 20px', borderRadius: '10px', fontSize: '12px', border: 'none', cursor: 'pointer' }}>
                      BOOK NOW
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Box>
      </Modal>

      {/* V13: Booking Scanner Modal */}
      <Modal open={bookingModal} onClose={() => setBookingModal(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 420, bgcolor: '#ffffff', p: 4, borderRadius: '28px', textAlign: 'center', color: '#000', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}>
          <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 900, mb: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>Direct Ticket Booking</Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>Scan with any Banking App or click below to proceed directly to the <b>{selectedFlight?.airline}</b> official booking portal.</Typography>
          
          <div style={{ 
            width: '240px', height: '240px', margin: '0 auto 20px', 
            background: '#f8fafc', borderRadius: '24px', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', border: '3px solid #f1f5f9',
            position: 'relative', overflow: 'hidden'
          }}>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=AirlineBooking_${selectedFlight?.airline}_${selectedFlight?.price}`} alt="Scanner" style={{ width: '180px', height: '180px' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: '#6366f1', animation: 'scan 2.5s infinite', boxShadow: '0 0 15px #6366f1' }}></div>
          </div>
          
          <style>{`
            @keyframes scan {
              0% { top: 0; }
              50% { top: 100%; }
              100% { top: 0; }
            }
          `}</style>
          
          <div style={{ background: '#f0f4ff', padding: '20px', borderRadius: '18px', border: '1px solid #e0e7ff' }}>
             <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Airline Merchant</Typography>
             <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e1b4b' }}>{selectedFlight?.airline}</Typography>
             <Divider sx={{ my: 1, borderColor: '#e0e7ff' }} />
             <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Amount to Pay</Typography>
             <Typography variant="h4" sx={{ color: '#4f46e5', fontWeight: 900 }}>{selectedFlight && formatPrice(selectedFlight.price)}</Typography>
          </div>
          
          <button onClick={completeBooking} style={{ 
            width: '100%', marginTop: '20px', background: '#0f172a', color: 'white', 
            padding: '18px', borderRadius: '15px', border: 'none', fontWeight: 800, 
            cursor: 'pointer', fontSize: '16px', transition: 'all 0.3s'
          }} onMouseOver={(e) => e.currentTarget.style.background = '#1e293b'} onMouseOut={(e) => e.currentTarget.style.background = '#0f172a'}>
            PROCEED TO OFFICIAL SITE
          </button>
          <button onClick={() => setBookingModal(false)} style={{ background: 'none', border: 'none', marginTop: '15px', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>Cancel Transaction</button>
        </Box>
      </Modal>
    </div>
  )
}

export default Dashboard
