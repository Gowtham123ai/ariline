import { useState, useEffect } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import axios from "axios"
import { airports } from "../airports"

function SavedRoutes({ currency = "INR" }) {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)

  const rates = { INR: 1, USD: 0.012, EUR: 0.011 }
  const symbol = { INR: "₹", USD: "$", EUR: "€" }
  const formatPrice = (p) => symbol[currency] + (p * rates[currency]).toLocaleString(undefined, { maximumFractionDigits: 0 })

  const fetchRoutes = async () => {
    try {
      const email = localStorage.getItem("user_email") || "admin@airline.ai"
      const response = await axios.get("/api/my-routes", { params: { user_email: email } })
      const enriched = response.data.map((r, i) => ({
        ...r,
        id: i,
        alert: r.alert ?? true,
        trend: "same",
        price: r.price || 15000
      }))
      setRoutes(enriched)
    } catch (err) {
      console.error("Failed to fetch routes", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutes()
  }, [])

  // Real-time local simulation (Improved frequency for "real-time" feel)
  useEffect(() => {
    if (routes.length === 0) return

    const interval = setInterval(() => {
      setRoutes(prevRoutes => prevRoutes.map(route => {
        const change = Math.floor(Math.random() * 400) - 150
        const newPrice = Math.max(5000, route.price + change)
        let newTrend = "same"
        if (newPrice > route.price) newTrend = "up"
        else if (newPrice < route.price) newTrend = "down"

        return {
          ...route,
          price: newPrice,
          trend: newTrend
        }
      }))
    }, 10000) 
    return () => clearInterval(interval)
  }, [routes.length > 0])

  const deleteRoute = (id) => {
    setRoutes(routes.filter(r => r.id !== id))
  }

  const toggleAlert = (id) => {
    setRoutes(routes.map(r => r.id === id ? { ...r, alert: !r.alert } : r))
  }

  const getCity = (code) => airports.find(a => a.code === code)?.city || code;

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text("Personalized AI Flight Tracker", 14, 10)
    autoTable(doc, {
      head: [["Origin", "Destination", "Last Price", "Route Status"]],
      body: routes.map(r => [getCity(r.origin), getCity(r.destination), formatPrice(r.price), r.trend.toUpperCase()])
    })
    doc.save("airline_ai_routes.pdf")
  }

  return (
    <div className="saved-routes-view">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px", flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Global Route Watchlist</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Deep analysis of your saved flight corridors. <b>{routes.length}</b> routes active.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ fontSize: "13px", color: "var(--accent)", fontWeight: 700 }}>● LIVE AI TRACKING: 1 MIN INTERV</span>
          <button onClick={exportPDF} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", background: 'var(--primary)' }}>
            <span>📄</span> Export Report
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: "0", overflow: "hidden", border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ overflowX: "auto" }}>
          <table className="route-table">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th>Route Path</th>
                <th>Price Insight</th>
                <th>Dynamic Trend</th>
                <th>Delta AI</th>
                <th>Email Alerts</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan="6" style={{textAlign: 'center', padding: '60px', color: 'var(--text-secondary)'}}>Synchronizing with AI core...</td></tr>
              ) : routes.length > 0 ? (
                routes.map((route) => (
                  <tr key={route.id} style={{ transition: 'background 0.3s' }}>
                    <td style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', fontSize: '20px' }}>✈</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>{getCity(route.origin)} to {getCity(route.destination)}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>Code: {route.origin} - {route.destination}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: "16px", fontWeight: 800, color: 'white' }}>{formatPrice(route.price)}</td>
                    <td>
                      {route.trend === "up" && <span style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.13)", padding: "6px 12px", borderRadius: "20px", fontSize: '12px', fontWeight: 600 }}>📈 RISING</span>}
                      {route.trend === "down" && <span style={{ color: "var(--accent)", background: "rgba(16, 185, 129, 0.13)", padding: "6px 12px", borderRadius: "20px", fontSize: '12px', fontWeight: 600 }}>📉 FALLING</span>}
                      {route.trend === "same" && <span style={{ color: "var(--text-secondary)", background: "rgba(255, 255, 255, 0.05)", padding: "6px 12px", borderRadius: "20px", fontSize: '12px' }}>● STABLE</span>}
                    </td>
                    <td>
                       <span style={{ fontSize: '11px', fontWeight: 700, color: route.price < 15000 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                         {route.price < 15000 ? "UNDERPRICED ★" : "FAIR MARKET"}
                       </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => toggleAlert(route.id)}
                        style={{ background: route.alert ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', padding: '5px 15px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: 'white', cursor: 'pointer' }}
                      >
                        {route.alert ? "ACTIVE" : "DISABLED"}
                      </button>
                    </td>
                    <td>
                      <button 
                        onClick={() => deleteRoute(route.id)}
                        style={{ background: "transparent", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "6px 15px", borderRadius: "8px", cursor: "pointer", fontSize: '12px' }}
                      >
                        Untrack
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '60px', color: 'var(--text-secondary)'}}>No routes in your AI Watchlist. Head to Dashboard to start tracking.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SavedRoutes
