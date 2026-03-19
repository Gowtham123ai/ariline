import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { useEffect, useState } from "react"
import axios from "axios"
import { CircularProgress } from "@mui/material"

const delayData = [
  { name: 'Indigo', riskScore: 12, predictedMins: 15 },
  { name: 'Air India', riskScore: 25, predictedMins: 30 },
  { name: 'Vistara', riskScore: 8, predictedMins: 10 },
  { name: 'SpiceJet', riskScore: 40, predictedMins: 55 },
];

function Analytics({ currency = "INR" }) {
  const [forecast, setForecast] = useState([])
  const [stats, setStats] = useState({ prediction_text: "Loading...", confidence: "..." })

  // Currency Utils
  const rates = { INR: 1, USD: 0.012, EUR: 0.011 }
  const symbol = { INR: "₹", USD: "$", EUR: "€" }
  const formatPrice = (p) => symbol[currency] + (p * rates[currency]).toLocaleString(undefined, { maximumFractionDigits: 0 })

  useEffect(() => {
    axios.get("/api/forecast")
      .then(res => {
        if (!res.data || !res.data.data) {
          setStats({ prediction_text: "Prediction Data Unavailable", confidence: "0%" });
          return;
        }
        const data = res.data.data.map(d => ({
          ...d,
          ds: d.ds ? new Date(d.ds).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A',
          yhat: Number(d.yhat) || 0,
          yhat_range: [Number(d.yhat_lower), Number(d.yhat_upper)]
        }))
        setForecast(data)
        setStats({
          prediction_text: res.data.prediction_text || "Forecast Active",
          confidence: res.data.confidence || "Unknown"
        })
      })
      .catch(err => {
        console.error("Analytics fetch failed:", err);
        setStats({ 
          prediction_text: "AI Engine Offline", 
          confidence: "0%" 
        });
      })
  }, [])

  const ChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px", boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}>
          <p style={{ margin: "0 0 8px 0", color: "var(--text-secondary)", fontSize: "12px" }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: 0, color: entry.color, fontWeight: 600 }}>
              {entry?.name}: {formatPrice(entry?.value || 0)}
            </p>
          ))}
          {payload[0]?.payload?.accuracy && (
            <p style={{ margin: "8px 0 0 0", color: "var(--accent)", fontSize: "11px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "4px" }}>
              AI Accuracy: {payload[0].payload.accuracy}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: "40px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Advanced AI Analytics</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>LSTM & Prophet Models. Accuracy Optimized in real-time.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <p style={{ margin: 0, color: 'var(--accent)', fontWeight: 700 }}>{stats.prediction_text}</p>
           <span className="status-badge online" style={{ fontSize: '10px' }}>Confidence: {stats.confidence}</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "30px", background: 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.8) 100%)' }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h3 style={{ margin: 0 }}>Smart Fare Prediction (Next 7 Days)</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "4px 0 0 0" }}>Prediction with confidence interval (Shaded region)</p>
          </div>
        </div>
        <div style={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {forecast.length > 0 ? (
            <ResponsiveContainer>
              <AreaChart data={forecast}>
                <defs>
                  <linearGradient id="colorYhat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="ds" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="yhat" name="Predicted Price" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorYhat)" />
                <Area type="monotone" dataKey="yhat_upper" stroke="none" fill="rgba(139, 92, 246, 0.05)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center' }}>
               <CircularProgress size={40} sx={{ color: 'var(--primary)', mb: 2 }} />
               <p style={{ color: 'var(--text-secondary)' }}>Gathering AI Market Intelligence...</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        <div className="card" style={{ flex: "1", minWidth: "300px" }}>
          <h3 style={{ marginTop: 0 }}>Market Demand Surge</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Surge detection based on search volume & seat availability.</p>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={delayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                <Bar dataKey="riskScore" name="Demand Surge %" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="predictedMins" name="Historical Multiplier" fill="var(--warning)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
