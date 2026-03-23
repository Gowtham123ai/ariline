import { useState } from "react"
import axios from "axios"
import { useNavigate, NavLink } from "react-router-dom"
import { Card, TextField, Button, Typography, Container, Box } from "@mui/material"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post("/api/login", { email, password })
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("role", res.data.role)
      localStorage.setItem("user_email", email)
      navigate("/")
      window.location.reload()
    } catch (err) {
      setError("Invalid credentials")
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card sx={{ p: 4, background: 'rgba(30,41,59,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, textAlign: 'center' }}>
            Login to Airline AI
          </Typography>
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{ style: { color: 'white' } }}
              inputProps={{ style: { color: 'white' } }}
              sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&:hover fieldset': { borderColor: 'var(--primary)' } } }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{ style: { color: 'white' } }}
              inputProps={{ style: { color: 'white' } }}
              sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&:hover fieldset': { borderColor: 'var(--primary)' } } }}
            />
            {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, bgcolor: 'var(--primary)', '&:hover': { bgcolor: 'var(--primary-hover)' } }}
            >
              Sign In
            </Button>
            <Typography sx={{ textAlign: 'center' }}>
              Don't have an account? <NavLink to="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Register here</NavLink>
            </Typography>
          </form>
        </Card>
      </Box>
    </Container>
  )
}

export default Login
