import { useState, useEffect } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import axios from "axios"

function SavedRoutes({ currency = "INR" }) {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)

  // Currency Utils
  const rates = { INR: 1, USD: 0.012, EUR: 0.011 }
  const symbol = { INR: "₹", USD: "$", EUR: "€" }
  const formatPrice = (p) => symbol[currency] + (p * rates[currency]).toLocaleString(undefined, { maximumFractionDigits: 0 })

  const fetchRoutes = async () => {
    try {
      const response = await axios.get("/api/my-routes")
      // Initialize trend data for the frontend simulation
      const enriched = response.data.map((r, i) => ({
        ...r,
        id: i,
        alert: r.alert ?? true,
        trend: "same",
        price: r.price || 5000
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

  // Mock auto-refresh live prices for existing routes
  useEffect(() => {
    if (routes.length === 0) return

    const interval = setInterval(() => {
      setRoutes(prevRoutes => prevRoutes.map(route => {
        const change = Math.floor(Math.random() * 200) - 100
        const newPrice = route.price + change
        let newTrend = "same"
        if (newPrice > route.price) newTrend = "up"
        else if (newPrice < route.price) newTrend = "down"

        return {
          ...route,
          price: newPrice,
          trend: newTrend
        }
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [routes.length > 0])

  const deleteRoute = (id) => {
    setRoutes(routes.filter(r => r.id !== id))
    // Note: In a real app, we'd call a DELETE API here
  }

  const toggleAlert = (id) => {
    setRoutes(routes.map(r => r.id === id ? { ...r, alert: !r.alert } : r))
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text("Saved Airline Routes", 14, 10)
    autoTable(doc, {
      head: [["Origin", "Destination", "Price"]],
      body: routes.map(r => [r.origin, r.destination, r.price])
    })
    doc.save("saved_routes.pdf")
  }

  return (
    <div className="saved-routes-view">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Saved Routes</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Monitor and manage your tracked flight paths.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>🔄 Live update: 5s</span>
          <button onClick={exportPDF} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📄</span> Export PDF
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="route-table">
            <thead>
              <tr>
                <th>Map</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Current Price</th>
                <th>Trend</th>
                <th>Status</th>
                <th>Price Alerts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan="8" style={{textAlign: 'center', padding: '40px', color: 'var(--text-secondary)'}}>Loading your routes...</td></tr>
              ) : routes.length > 0 ? (
                routes.map((route) => (
                  <tr key={route.id}>
                    <td>
                      <a 
                        href={`https://www.google.com/maps/dir/${route.origin}/${route.destination}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: "var(--primary)", textDecoration: "none", fontSize: "18px" }}
                      >
                        🌍
                      </a>
                    </td>
                    <td style={{ fontWeight: 700 }}>{route.origin}</td>
                    <td style={{ fontWeight: 700 }}>{route.destination}</td>
                    <td style={{ fontSize: "16px", fontWeight: 600 }}>₹{route.price}</td>
                    <td>
                      {route.trend === "up" && <span style={{ color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)", padding: "4px 8px", borderRadius: "6px" }}>↑ Rising</span>}
                      {route.trend === "down" && <span style={{ color: "var(--accent)", background: "rgba(16, 185, 129, 0.1)", padding: "4px 8px", borderRadius: "6px" }}>↓ Falling</span>}
                      {route.trend === "same" && <span style={{ color: "var(--text-secondary)", background: "rgba(255, 255, 255, 0.05)", padding: "4px 8px", borderRadius: "6px" }}> Stable</span>}
                    </td>
                    <td>
                      {route.price < 5000 ? 
                        <span style={{ color: "#34d399", fontWeight: 700, fontSize: "12px" }}>BEST PRICE 🔥</span> :
                        <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>NORMAL</span>
                      }
                    </td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" checked={route.alert} onChange={() => toggleAlert(route.id)} />
                        <span className="slider"></span>
                      </label>
                    </td>
                    <td>
                      <button 
                        onClick={() => deleteRoute(route.id)}
                        className="btn-delete"
                        style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, transition: "0.2s" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '40px', color: 'var(--text-secondary)'}}>No routes tracked yet. Search and click "Track" on the Dashboard!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SavedRoutes
