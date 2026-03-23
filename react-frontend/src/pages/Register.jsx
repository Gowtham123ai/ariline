import { useState } from "react"
import axios from "axios"
import { useNavigate, NavLink } from "react-router-dom"
import { Card, TextField, Button, Typography, Container, Box } from "@mui/material"

function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      await axios.post("/api/register", { email, password })
      navigate("/login")
    } catch (err) {
      setError("Registration failed")
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card sx={{ p: 4, background: 'rgba(30,41,59,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, textAlign: 'center' }}>
            Register to Airline AI
          </Typography>
          <form onSubmit={handleRegister}>
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
              Sign Up
            </Button>
            <Typography sx={{ textAlign: 'center' }}>
              Already have an account? <NavLink to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Login here</NavLink>
            </Typography>
          </form>
        </Card>
      </Box>
    </Container>
  )
}

export default Register
