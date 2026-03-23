import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter, ZAxis, ComposedChart } from 'recharts';
import { useEffect, useState } from "react"
import axios from "axios"
import { Typography, Box, Paper, Grid, Divider } from "@mui/material"

function Analytics({ currency = "INR" }) {
  const [forecast, setForecast] = useState([])
  const [delayData, setDelayData] = useState([])
  const [stats, setStats] = useState({ prediction_text: "Running Market Analysis...", confidence: "...", analysis_factors: {} })

  const rates = { INR: 1, USD: 0.012, EUR: 0.011 }
  const symbol = { INR: "₹", USD: "$", EUR: "€" }
  const formatPrice = (p) => symbol[currency] + (p * rates[currency]).toLocaleString(undefined, { maximumFractionDigits: 0 })

  useEffect(() => {
    // 1. Fetch Forecast (Price Analysis) - Now incorporates demand factors
    axios.get("/api/forecast")
      .then(res => {
        const data = res.data.data.map(d => ({
          ...d,
          ds: new Date(d.ds).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          yhat: Number(d.yhat),
          delayRisk: d.delay_risk,
          demandPercent: d.demand
        }))
        setForecast(data)
        setStats({
          prediction_text: res.data.prediction_text || "Analysis Active",
          confidence: res.data.confidence || "Unknown",
          analysis_factors: res.data.analysis_factors || {}
        })
      })    // 2. Fetch Delay Analysis - Expanded to 10 major airlines (V9)
    axios.get("/api/delay-analysis")
      .then(res => {
        setDelayData(res.data)
      })
  }, [])

  const ChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "#0f172a", border: "1px solid #6366f1", borderRadius: "16px", padding: "18px", boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', minWidth: '200px' }}>
          <p style={{ margin: "0 0 12px 0", color: "white", fontSize: "15px", fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: '8px' }}>{label}</p>
          {payload.map((entry, index) => (
            <div key={index} style={{ margin: "8px 0", display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: entry.color, fontWeight: 700, fontSize: '13px' }}>{entry.name}:</span>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '13px' }}>
                {
                  entry?.name?.includes("Price") ? formatPrice(entry?.value) : 
                  entry?.name?.includes("Risk") || entry?.name?.includes("Demand") || entry?.name?.includes("Reliability") ? entry?.value + "%" : 
                  entry?.value + " mins"
                }
              </span>
            </div>
          ))}
          {label.includes("Airlines") || delayData.find(d => d.name === label) && (
             <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px', fontStyle: 'italic' }}>
               * Primarily driven by Weather & Traffic patterns.
             </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-view" style={{ padding: '20px', background: '#020617', minHeight: '100vh', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: "40px", flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1px', background: 'linear-gradient(135deg, #fff 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Multi-Factor Price Analysis</h1>
          <p style={{ color: "#94a3b8", marginTop: "12px", fontSize: '1.2rem', fontWeight: 500 }}>High-fidelity market sentiment tracking & arrival probability.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <Paper sx={{ p: 3, background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '20px' }}>
             <p style={{ margin: 0, color: '#10b981', fontWeight: 900, fontSize: '1.4rem' }}>{stats.prediction_text}</p>
             <span className="status-badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', marginTop: '10px', display: 'inline-block', fontWeight: 700 }}>AI Accuracy Score: {stats.confidence}</span>
           </Paper>
        </div>
      </div>

      <Grid container spacing={4}>
        {/* V5, V12: Price vs Demand Correlation */}
        <Grid item xs={12}>
          <div className="card" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '30px', borderRadius: '32px', boxShadow: '0 10px 30px -15px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Market Delta & Demand Pulse</h3>
                <p style={{ color: "#94a3b8", fontSize: '1rem' }}>Correlation between seat availability (demand) and historical price shifts.</p>
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ textAlign: 'left', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 20px', borderRadius: '15px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#f87171', fontWeight: 800, textTransform: 'uppercase' }}>SEAT SCARCITY</p>
                  <p style={{ margin: 0, fontWeight: 900, color: '#fff' }}>{stats.analysis_factors.seat_scarcity || "Critical"}</p>
                </div>
                <div style={{ textAlign: 'left', background: 'rgba(245, 158, 11, 0.1)', padding: '10px 20px', borderRadius: '15px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>DEMAND IMPACT</p>
                  <p style={{ margin: 0, fontWeight: 900, color: '#fff' }}>{stats.analysis_factors.demand_impact || "High"}</p>
                </div>
              </div>
            </div>
            <div style={{ width: '100%', height: 450 }}>
              <ResponsiveContainer>
                <ComposedChart data={forecast}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="ds" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis yAxisId="left" orientation="left" stroke="#818cf8" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} label={{ value: 'Market Floor ('+currency+')', angle: -90, position: 'insideLeft', fill: '#818cf8', dy: -20, fontWeight: 700 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickLine={false} axisLine={false} domain={[0, 200]} label={{ value: 'Demand Intensity %', angle: 90, position: 'insideRight', fill: '#10b981', dy: -20, fontWeight: 700 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="top" height={50} align="right" iconType="circle" />
                  <Area yAxisId="left" type="monotone" dataKey="yhat" name="Predicted Floor Price" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" />
                  <Line yAxisId="right" type="monotone" dataKey="demandPercent" name="Global Demand Pulse" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="delayRisk" name="7-Day Delay Risk %" stroke="#f43f5e" strokeDasharray="8 4" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '15px', marginTop: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                 <b>💡 AI Insight:</b> The 7-Day Delay Risk is higher for long-range predictions because of seasonal weather adjustments (like monsoon or winter fog) that our models detect in advance.
               </p>
            </div>
          </div>
        </Grid>

        {/* V9: Global Delay Risk - Dual Axis Fix */}
        <Grid item xs={12} md={7}>
          <div className="card" style={{ height: '100%', borderRadius: '32px', background: '#0f172a', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '30px' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.6rem', fontWeight: 800 }}>Global Airline Reliability Index</h3>
            <p style={{ color: "#94a3b8", fontSize: "15px", marginBottom: '30px' }}>
              Comparative breakdown showing which airlines prioritize punctuality. 
              <br/><span style={{ color: '#6366f1', fontSize: '12px', fontWeight: 700 }}>📊 Interaction Enabled: Hover on bars to see precise minutes vs risk.</span>
            </p>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <BarChart data={delayData} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tick={{ fill: '#94a3b8' }} angle={-45} textAnchor="end" interval={0} dy={10} fontWeight={600} />
                  <YAxis yAxisId="risk" stroke="#3b82f6" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Risk Index %', angle: -90, position: 'insideLeft', fill: '#3b82f6', fontWeight: 700 }} />
                  <YAxis yAxisId="mins" orientation="right" stroke="#f59e0b" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Avg Delay (Mins)', angle: 90, position: 'insideRight', fill: '#f59e0b', fontWeight: 700 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar yAxisId="risk" dataKey="riskScore" name="Reliability Risk Index" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={20} />
                  <Bar yAxisId="mins" dataKey="predictedMins" name="Historical Delay (Mins)" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Grid>

        {/* V12: Decision Matrix */}
        <Grid item xs={12} md={5}>
          <div className="card" style={{ height: '100%', borderRadius: '32px', background: '#0f172a', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '30px' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.6rem', fontWeight: 800 }}>AI Decision Matrix</h3>
            <p style={{ color: "#94a3b8", fontSize: "15px", marginBottom: '20px' }}>Optimal 'Sweet Spot' for booking based on cost vs. punctuality.</p>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="5 5" />
                  <XAxis type="number" dataKey="riskScore" name="Risk" unit="%" stroke="#64748b" fontSize={11} label={{ value: 'Delay Risk %', position: 'insideBottom', offset: -10, fill: '#64748b' }} domain={[0, 100]} />
                  <YAxis type="number" dataKey="predictedMins" name="Delay" unit="m" stroke="#64748b" fontSize={11} label={{ value: 'Predicted Delay', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                  <ZAxis type="number" dataKey="weatherImpact" range={[100, 800]} name="Weather Factor" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip />} />
                  <Scatter name="Airlines" data={delayData} fill="#6366f1">
                    {delayData.map((entry, index) => (
                      <cell key={`cell-${index}`} fill={entry.riskScore > 60 ? '#f43f5e' : entry.riskScore < 30 ? '#10b981' : '#6366f1'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <Box sx={{ mt: 2, p: 2.5, background: 'rgba(16, 185, 129, 0.05)', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 700, display: 'flex', gap: '10px' }}>
                <span>🎯</span> Insight: The green zone indicates airlines with the lowest volatility. Weather factors (bubble size) are currently stable for these selections.
              </Typography>
            </Box>
          </div>
        </Grid>

        {/* V15: Detailed logic explanation */}
        <Grid item xs={12}>
          <Paper sx={{ p: 5, borderRadius: '32px', background: 'rgba(30, 41, 59, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'flex', gap: '40px', alignItems: 'center', mb: 5 }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white', padding: '20px', borderRadius: '24px', fontWeight: 900, fontSize: '28px', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.5)' }}>AI</div>
            <div>
              <Typography variant="h4" sx={{ mb: 2, fontWeight: 900, letterSpacing: '-0.5px' }}>Price Analysis Intelligence Model</Typography>
              <Typography variant="body1" sx={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '1.1rem' }}>
                Our <b>Analysis Engine</b> goes beyond basic price matching. We combine three distinct data streams to generate your "Book vs Wait" recommendation:
                <br/>• <b>Supply Scarcity (35%)</b>: Scans remaining seats across global GDS nodes. Prices rise sharply below 10 seats.
                <br/>• <b>Environmental Probability (40%)</b>: Integrates live weather forecasts to predict delay risk.
                <br/>• <b>Historical Market Floor (25%)</b>: Identifies the lowest price ever recorded for this route in the current season.
                <br/>This multi-agent process ensures that every <b>Price Analysis</b> move is backed by real-time infrastructure data.
              </Typography>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  )
}

export default Analytics
