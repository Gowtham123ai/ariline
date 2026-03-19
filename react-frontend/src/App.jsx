import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom"
import axios from "axios"
import Dashboard from "./pages/Dashboard"
import Analytics from "./pages/Analytics"
import SavedRoutes from "./pages/SavedRoutes"
import Admin from "./pages/Admin"
import ProtectedRoute from "./ProtectedRoute"
import "./App.css"

function App() {
  const [notifications] = useState(["Price dropped ₹300", "Weather alert: Rain expected"])
  const [currency, setCurrency] = useState("INR")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMsg, setChatMsg] = useState("")
  const [chatLog, setChatLog] = useState([{ role: "bot", text: "Hello! Im your Airline AI Assistant. How can I help?" }])

  const sendChat = async (e) => {
    e.preventDefault()
    if (!chatMsg.trim()) return
    const userMsg = { role: "user", text: chatMsg }
    setChatLog([...chatLog, userMsg])
    setChatMsg("")
    try {
      const res = await axios.post("http://localhost:10000/api/chat", { message: chatMsg })
      setChatLog(prev => [...prev, { role: "bot", text: res.data.response }])
    } catch (err) {
      setChatLog(prev => [...prev, { role: "bot", text: "Something went wrong. Is the backend running?" }])
    }
  }

  return (
    <Router>
      <div className="layout">
        <div className="sidebar">
          <h2><span>✈</span> <span>Airline AI</span></h2>
          <NavLink to="/" end className="nav-item"><i>📊</i> <span>Dashboard</span></NavLink>
          <NavLink to="/analytics" className="nav-item"><i>📈</i> <span>Analytics</span></NavLink>
          <NavLink to="/saved" className="nav-item"><i>📍</i> <span>Saved Routes</span></NavLink>
          <NavLink to="/admin" className="nav-item"><i>🛡</i> <span>Admin</span></NavLink>
          
          <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '20px' }}>
             <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Currency</p>
             <div className="currency-selector">
                {["INR", "USD", "EUR"].map(cur => (
                  <button 
                    key={cur}
                    onClick={() => setCurrency(cur)}
                    className={currency === cur ? "active" : ""}
                  >{cur}</button>
                ))}
             </div>
          </div>
        </div>

        <div className="content">
          <div className="topbar">
            <h3>Airline Intelligence System</h3>
            <div style={{ display: "flex", alignItems: "center", gap: '15px' }}>
              <div className="notification-bell">
                <span>🔔</span>
                <span className="notification-count">{notifications.length}</span>
              </div>
              <div className="user-box">
                <span>👤</span>
                <span>Admin</span>
              </div>
            </div>
          </div>

          <div className="page">
            <Routes>
              <Route path="/" element={<Dashboard currency={currency} />} />
              <Route path="/analytics" element={<Analytics currency={currency} />} />
              <Route path="/saved" element={<SavedRoutes currency={currency} />} />
              <Route path="/admin" element={
                <ProtectedRoute role="admin">
                  <Admin />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </div>

        {/* Floating Chatbot */}
        <div className={`chatbot-container ${isChatOpen ? "open" : ""}`}>
          <div className="chat-header" onClick={() => setIsChatOpen(!isChatOpen)}>
            <span>💬 AI Travel Assistant</span>
          </div>
          {isChatOpen && (
            <div className="chat-body">
              <div className="chat-messages">
                {chatLog.map((log, i) => (
                  <div key={i} className={`msg ${log.role}`}>{log.text}</div>
                ))}
              </div>
              <form onSubmit={sendChat} className="chat-input-area">
                <input 
                  type="text" 
                  value={chatMsg} 
                  onChange={(e) => setChatMsg(e.target.value)} 
                  placeholder="Ask something..."
                />
                <button type="submit">➤</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </Router>
  )
}

export default App
