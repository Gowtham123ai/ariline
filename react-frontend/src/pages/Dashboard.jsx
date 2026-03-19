import { io } from "socket.io-client"
import { useEffect, useState } from "react"
import axios from "axios"
import { airports } from "../airports"
import { Card, Typography, Modal, Box, CircularProgress, Tooltip } from "@mui/material"

const socket = io("")

function Dashboard({ currency = "INR" }) {
  const [livePrice, setLivePrice] = useState(null)
  const [origin, setOrigin] = useState("MAA")
  const [destination, setDestination] = useState("DEL")
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [intelligence, setIntelligence] = useState(null)

  // Currency Conversion Rates (Dummy)
  const rates = { INR: 1, USD: 0.012, EUR: 0.011 }
  const symbol = { INR: "₹", USD: "$", EUR: "€" }

  const formatPrice = (p) => {
    const converted = p * rates[currency]
    return symbol[currency] + converted.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }

  useEffect(() => {
    socket.on("live_price", (data) => {
      setLivePrice(data.price)
    })
    return () => socket.off("live_price")
  }, [])

  const searchFlights = async () => {
    setLoading(true)
    setFlights([])
    setIntelligence(null)
    try {
      // Ensure we always have an array for flights to prevent .map() crashes
      const flightData = Array.isArray(flRes.data) ? flRes.data : [];
      setFlights(flightData);
      console.log("Flight Search Results:", flightData);

      // 2. Fetch AI Intelligence
      const intelRes = await axios.get(`/api/route-intelligence`, {
        params: { origin, destination }
      })
      setIntelligence(intelRes.data)

      setOpen(true)
    } catch (err) {
      console.error("Flight search failed", err)
      const errorDetail = err.response?.data?.error || err.message;
      alert(`Flight search failed: ${errorDetail}`);
    } finally {
      setLoading(false)
    }
  }

  const trackRoute = async (flight) => {
    try {
      await axios.post('/api/save-route', {
        origin,
        destination,
        price: flight.price
      })
      socket.emit("subscribe", { origin, destination })
      alert(`Tracking started for ${origin} ✈ ${destination}!`)
    } catch (err) {
      alert("Failed to save route.")
    }
  }

  return (
    <div className="dashboard-view">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "700" }}>Dashboard Overview</h1>
          <p style={{ color: "var(--text-secondary)", margin: "8px 0 0 0" }}>Welcome back, Admin. Real-time AI Intelligence Active.</p>
        </div>

        <div className="search-box" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="input-glass">
            {airports.map(a => <option key={`orig-${a.code}`} value={a.code} style={{ color: "black" }}>{a.city} ({a.code})</option>)}
          </select>
          <select value={destination} onChange={(e) => setDestination(e.target.value)} className="input-glass">
            {airports.map(a => <option key={`dest-${a.code}`} value={a.code} style={{ color: "black" }}>{a.city} ({a.code})</option>)}
          </select>
          <button onClick={searchFlights} className="btn-primary" disabled={loading} style={{ minWidth: "140px" }}>
            {loading ? <CircularProgress size={20} color="inherit" /> : "Search Flights"}
          </button>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="stat-label">Total Global Searches</div>
          <div className="stat-value">1,240</div>
          <div style={{ marginTop: "12px", color: "var(--accent)", fontSize: "14px", fontWeight: "600" }}>↑ 8% from yesterday</div>
        </div>

        <div className="card">
          <div className="stat-label">Live Global Ticket Price</div>
          <div className="stat-value">{formatPrice(livePrice || 28000)}</div>
          <div style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>Updates globally every 5s</div>
        </div>

        <div className="card">
          <div className="stat-label">Demand & Surge detection</div>
          <div className="stat-value" style={{ color: intelligence?.demand_level === "High" ? "var(--danger)" : "var(--accent)" }}>
            {intelligence ? intelligence.demand_level : "Stable"}
          </div>
          <div style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px" }}>
            {intelligence ? intelligence.surge_detection : "No surge detected in global cache"}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "30px", borderLeft: "4px solid var(--primary)", background: "rgba(59, 130, 246, 0.1)" }}>
        <h3 style={{ margin: "0 0 10px 0", color: "var(--primary)", display: 'flex', alignItems: 'center', gap: '10px' }}>
          ✨ AI Route Intelligence {intelligence && <span className="status-badge online" style={{ fontSize: '10px' }}>Confidence: 82%</span>}
        </h3>
        <p style={{ fontSize: "18px", margin: 0, lineHeight: "1.6" }}>
          {intelligence ? (
            <>
              Smart Recommendation: <span style={{ fontWeight: 700, color: "white" }}>{intelligence.recommendation}</span>.
              Efficiency: <span style={{ color: "var(--accent)", fontWeight: 700 }}>Best day is {intelligence.best_day_to_book}</span>.
            </>
          ) : (
            "Select a route and search to see localized AI recommendations and demand surgence analysis."
          )}
        </p>
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 600, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px', p: 4, color: 'white', outline: 'none'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Results: {origin} ✈ {destination}</Typography>
            <span style={{ background: 'var(--accent)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
              {intelligence?.demand_level} Demand
            </span>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px dashed var(--primary)' }}>
            <p style={{ margin: 0, fontSize: '14px' }}>💡 <b>AI Tip:</b> {intelligence?.recommendation}. Tuesday is cheapest for this route.</p>
          </div>

          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {(Array.isArray(flights) ? flights : []).map((flight, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', marginBottom: '12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{flight.airline}</Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>{new Date(flight.departure).toLocaleTimeString()}</Typography>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Typography variant="h5" sx={{ color: 'var(--accent)', fontWeight: 700 }}>{formatPrice(flight.price)}</Typography>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button className="btn-primary" style={{ padding: '5px 12px', fontSize: '11px', background: 'var(--accent)' }}>Book</button>
                    <button className="btn-primary" onClick={() => trackRoute(flight)} style={{ padding: '5px 12px', fontSize: '11px', background: 'transparent', border: '1px solid var(--primary)' }}>📍 Track</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setOpen(false)} style={{ width: '100%', marginTop: '20px', color: 'gray', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
        </Box>
      </Modal>
    </div>
  )
}

export default Dashboard
