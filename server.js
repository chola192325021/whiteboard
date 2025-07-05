const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Serve static files from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Send index.html for all GET requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Create HTTP server and bind WebSocket server to it
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', socket => {
  console.log('Client connected');

  socket.on('message', message => {
    wss.clients.forEach(client => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  socket.on('close', () => {
    console.log('Client disconnected');
  });
});

// ✅ Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
