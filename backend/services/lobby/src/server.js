const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

let players = new Map();
let lobbies = new Map();

function generateRandomLobbyId() {
  const min = 10000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', (data) => {
    const { lobbyId } = data;
    const player = { socketId: socket.id, ready: false };
    players.set(socket.id, player);
    socket.join(lobbyId);

    const lobby = lobbies.get(lobbyId);
    if (lobby) {
      lobby.players.push(player);
      lobbies.set(lobbyId, lobby);
      io.to(lobbyId).emit('lobbyJoined', lobby);
    }
  });

  socket.on('chatMessage', (data) => {
    const { message, lobbyId } = data;
    const player = players.get(socket.id);
    if (player) {
      const chatMessage = { sender: socket.id, message };
      const lobby = lobbies.get(lobbyId);
      if (lobby) {
        lobby.chatHistory.push(chatMessage);
        io.to(lobbyId).emit('message', { messages: lobby.chatHistory });
      }
    }
  });

  socket.on('ready', (data) => {
    const { lobbyId } = data;
    const player = players.get(socket.id);
    if (player) {
      player.ready = true;
      const lobby = lobbies.get(lobbyId);
      if (lobby) {
        io.to(lobbyId).emit('playerReady', lobby);
      } 
    }
  });

  socket.on('unready', (data) => {
    const { lobbyId } = data;
    const player = players.get(socket.id);
    if (player) {
      player.ready = false;
      const lobby = lobbies.get(lobbyId);
      if (lobby) {
        io.to(lobbyId).emit('playerUnready', lobby);
      } 
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    players.delete(socket.id);
    lobbies.forEach((lobby) => {
      const index = lobby.players.findIndex((p) => p.socketId === socket.id);
      if (index !== -1) {
        const leftPlayer = lobby.players.splice(index, 1)[0];
        io.to(lobby.id).emit('lobbyUpdated', lobby);
        io.to(lobby.id).emit('joinMessage', { message: `${leftPlayer.socketId} left the lobby`, type: 'leave' });
      }
      
      socket.leave(lobby.id);
    });
  });
});

app.get('/api/lobbies', (req, res) => {
  const lobbyList = Array.from(lobbies.values());
  res.json(lobbyList);
});

app.post('/api/lobbies', (req, res) => {
  const { name } = req.body;

  const lobbyExists = Array.from(lobbies.values()).some((lobby) => lobby.name === name);
  if (lobbyExists) {
    return res.status(409).json({ message: 'Lobby with the same name already exists' });
  }

  const lobbyId = generateRandomLobbyId().toString();

  const lobby = { id: lobbyId, name, players: [], chatHistory: [], inProgress: false };

  lobbies.set(lobbyId, lobby);

  res.status(201).json({ message: 'Lobby created successfully', lobbyId });

  io.emit('lobbyUpdated', Array.from(lobbies.values()));
});

app.get('/lobbies/:lobbyId', (req, res) => {
  const lobbyId = req.params.lobbyId;

  if (!lobbies.has(lobbyId)) {
    return res.status(404).send('Lobby not found');
  }

  res.sendFile(__dirname + '/public/lobby.html');
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});