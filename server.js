const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '5mb' }));

// Save canvas image
app.post('/save', (req, res) => {
  const base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
  const filePath = path.join(__dirname, 'public', 'saved-board.png');

  fs.writeFile(filePath, base64Data, 'base64', err => {
    if (err) {
      console.error("Error saving image:", err);
      return res.status(500).send("Failed to save image");
    }
    res.send("Whiteboard saved successfully!");
  });
});

// Serve HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', socket => {
  console.log("Client connected");

  socket.on('message', message => {
    wss.clients.forEach(client => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  socket.on('close', () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});