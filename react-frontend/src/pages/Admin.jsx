import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

const apiData = [
  { time: "08:00", requests: 120 },
  { time: "10:00", requests: 350 },
  { time: "12:00", requests: 700 },
  { time: "14:00", requests: 420 },
  { time: "16:00", requests: 310 },
  { time: "18:00", requests: 550 },
]

function Admin() {
  const [logs, setLogs] = useState([
    "User john@example.com logged in.",
    "Route MAA>DEL searched 42 times.",
    "API limit reached for IP 192.168.1.5",
    "Price alert triggered for DEL>BLR."
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      const actions = [
        "New user registration.",
        "System health check: OK.",
        "Database backup completed.",
        "High traffic detected on MAA>DXB.",
        "WebSocket connection dropped."
      ]
      const randomAction = actions[Math.floor(Math.random() * actions.length)]
      setLogs(prev => [randomAction, ...prev.slice(0, 4)])
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ margin: 0 }}>Admin Control Panel</h1>
        <div className="status-badge online">
          ● System Online
        </div>
      </div>

      <div className="card-grid">
        <div className="card" style={{ borderTop: "4px solid var(--primary)" }}>
          <div className="stat-label">Total Users</div>
          <div className="stat-value">1,540</div>
          <div style={{ color: "var(--accent)", fontSize: "14px", marginTop: "8px" }}>↑ 12% this week</div>
        </div>

        <div className="card" style={{ borderTop: "4px solid #8b5cf6" }}>
          <div className="stat-label">API Requests Today</div>
          <div className="stat-value">8,420</div>
          <div style={{ color: "var(--accent)", fontSize: "14px", marginTop: "8px" }}>↑ 5% this week</div>
        </div>

        <div className="card" style={{ borderTop: "4px solid var(--warning)" }}>
          <div className="stat-label">Avg Latency</div>
          <div className="stat-value">45ms</div>
          <div style={{ color: "var(--danger)", fontSize: "14px", marginTop: "8px" }}>↓ 2ms this week</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", marginTop: "30px", flexWrap: "wrap" }}>
        <div className="card" style={{ flex: "2", minWidth: "400px" }}>
          <h3 style={{ marginTop: 0, marginBottom: "20px" }}>API Usage (Today)</h3>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer>
              <BarChart data={apiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  itemStyle={{ color: "white" }}
                />
                <Bar dataKey="requests" radius={[6, 6, 0, 0]}>
                  {apiData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 2 ? "var(--primary)" : "rgba(59, 130, 246, 0.4)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ flex: "1", minWidth: "300px", background: "rgba(0,0,0,0.3)" }}>
          <h3 style={{ marginTop: 0, borderBottom: "1px solid var(--glass-border)", paddingBottom: "12px" }}>
            {">"} Console Logs
          </h3>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: "13px", lineHeight: "1.8" }}>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: "12px", opacity: 1 - i * 0.15 }}>
                <span style={{ color: "var(--warning)" }}>[{new Date().toLocaleTimeString()}]</span>
                <span style={{ color: i === 0 ? "var(--accent)" : "white", marginLeft: "10px" }}>{log}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "20px", fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic" }}>
            Live Stream active...
          </div>
        </div>
      </div>
    </>
  )
}

export default Admin
