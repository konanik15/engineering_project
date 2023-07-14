const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');

let players = new Map(); 
let chatHistory = []; 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/players', (req, res) => {
  res.json(Array.from(players.values()));
});

app.post('/api/players', (req, res) => {
  const { name } = req.body;

  const playerExists = Array.from(players.values()).some(
    (player) => player.name === name
  );
  if (playerExists) {
    return res.status(409).json({ message: 'Player with the same name already exists' });
  }

  const socketId = req.headers['x-socket-id'];

  const player = { id: socketId, name };
  players.set(socketId, player);

  res.status(201).json({ message: 'Player added successfully' });

  const playerList = Array.from(players.values());
  io.emit('playerList', playerList); 
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', (name) => {
    const player = Array.from(players.values()).find((p) => p.id === socket.id);
    if (player) {
      io.emit('joinMessage', `${player.name} joined the lobby`);
      socket.broadcast.emit('playerList', Array.from(players.values())); 

      socket.emit('chatHistory', chatHistory);
    }
  });

  socket.on('chatMessage', (message) => {
    const player = Array.from(players.values()).find((p) => p.id === socket.id);
    if (player) {
      const chatMessage = `${player.name}: ${message}`;
      chatHistory.push(chatMessage);
      io.emit('chatMessage', chatMessage);
    }
  });

  socket.on('disconnect', () => {
    const player = Array.from(players.values()).find((p) => p.id === socket.id);
    if (player) {
      players.delete(socket.id);
      io.emit('joinMessage', `${player.name} left the lobby`);
      io.emit('playerList', Array.from(players.values())); 
    }
  });
});

app.use(express.static('public'));

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});