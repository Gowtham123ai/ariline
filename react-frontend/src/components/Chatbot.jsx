import { useState, useEffect, useRef } from 'react';
import { Box, Paper, TextField, IconButton, Typography, Avatar, Fab } from '@mui/material';
import axios from 'axios';

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([
    { role: 'bot', text: 'Hello! I am your Airline AI Assistant. How can I help you today?' }
  ]);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = { role: 'user', text: message };
    setChat([...chat, userMsg]);
    setMessage('');

    try {
      const res = await axios.post('/api/chat', { message: userMsg.text });
      setChat(prev => [...prev, { role: 'bot', text: res.data.response }]);
    } catch (err) {
      setChat(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting right now." }]);
    }
  };

  return (
    <>
      <Fab 
        color="primary" 
        aria-label="chat" 
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', bottom: 30, right: 30, background: '#8b5cf6', '&:hover': { background: '#7c3aed' } }}
      >
        <span style={{ fontSize: '24px' }}>🤖</span>
      </Fab>

      {open && (
        <Paper 
          elevation={10}
          sx={{ 
            position: 'fixed', bottom: 100, right: 30, width: 350, height: 500, 
            display: 'flex', flexDirection: 'column', borderRadius: '20px', 
            overflow: 'hidden', zIndex: 9999, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' 
          }}
        >
          <Box sx={{ p: 2, background: '#8b5cf6', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'white', color: '#8b5cf6', width: 30, height: 30, fontSize: '18px' }}>
                🤖
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>Airline AI</Typography>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white', fontWeight: 'bold' }}>
              ✕
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {chat.map((msg, idx) => (
              <Box 
                key={idx} 
                sx={{ 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                  color: 'white', p: 1.5, borderRadius: msg.role === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0',
                  maxWidth: '80%', fontSize: '13px', border: msg.role === 'bot' ? '1px solid rgba(255,255,255,0.1)' : 'none'
                }}
              >
                {msg.text}
              </Box>
            ))}
            <div ref={chatEndRef} />
          </Box>

          <Box sx={{ p: 2, background: 'rgba(0,0,0,0.2)', display: 'flex', gap: 1 }}>
            <TextField 
              fullWidth size="small" placeholder="Ask AI..."
              value={message} onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              sx={{ 
                '& .MuiOutlinedInput-root': { borderRadius: '20px', color: 'white', background: 'rgba(255,255,255,0.05)' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }
              }}
            />
            <IconButton color="primary" onClick={sendMessage} sx={{ color: '#8b5cf6', fontSize: '20px' }}>
              ➤
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default Chatbot;
