import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import Analytics from "./pages/Analytics"
import SavedRoutes from "./pages/SavedRoutes"
import Admin from "./pages/Admin"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ProtectedRoute from "./ProtectedRoute"
import Chatbot from "./components/Chatbot"
import "./App.css"

function App() {
  const [notifications] = useState(["Price Alert: MAA-DXB down 15%", "Weather: Operations normal at BOM"])
  const [currency, setCurrency] = useState("INR")
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"))

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("user_email")
    setIsLoggedIn(false)
    window.location.href = "/login"
  }

  return (
    <Router>
      <div className="layout">
        <div className="sidebar">
          <div className="logo-section">
            <h2 style={{ background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Airline AI Core
            </h2>
          </div>
          
          <nav className="nav-menu">
            <NavLink to="/" end className="nav-item"><i>(Dashboard)</i> <span>Route Intelligence</span></NavLink>
            <NavLink to="/analytics" className="nav-item"><i>(Analytics)</i> <span>Market Analytics</span></NavLink>
            <NavLink to="/saved" className="nav-item"><i>(Watchlist)</i> <span>Price Watchlist</span></NavLink>
            <NavLink to="/admin" className="nav-item"><i>(Admin)</i> <span>System Admin</span></NavLink>
          </nav>
          
          <div className="sidebar-footer">
             {isLoggedIn ? (
               <button onClick={handleLogout} className="btn-logout">Logout System</button>
             ) : (
               <NavLink to="/login" className="nav-item"><i>(Login)</i> <span>Member Access</span></NavLink>
             )}
             
             <div className="currency-panel">
                <p className="label">Display Currency</p>
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
        </div>

        <div className="content">
          <div className="topbar">
            <div className="breadcrumb">Multi-Agent Intelligence &gt; {window.location.pathname === "/" ? "Dashboard" : "Analysis"}</div>
            
            <div className="topbar-actions">
              <div className="notification-bell">
                <span>🔔</span>
                <span className="count">{notifications.length}</span>
              </div>
              <div className="user-profile">
                <div className="avatar">👤</div>
                <div className="info">
                  <span className="name">{localStorage.getItem("user_email")?.split('@')[0] || "User"}</span>
                  <span className="role">{localStorage.getItem("role") || "Traveler"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="page-container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
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

        {/* Premium AI Chatbot Component */}
        <Chatbot />
      </div>
    </Router>
  )
}

export default App
