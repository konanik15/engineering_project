const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');

let players = new Map();
let lobbies = new Map();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function generateRandomLobbyId() {
  const min = 10000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

app.get('/api/lobbies', (req, res) => {
  const lobbyList = Array.from(lobbies.values());
  res.json(lobbyList);
});

app.post('/api/lobbies', (req, res) => {
  const { name } = req.body;

  const lobbyExists = Array.from(lobbies.values()).some(
    (lobby) => lobby.name === name
  );
  if (lobbyExists) {
    return res.status(409).json({ message: 'Lobby with the same name already exists' });
  }

  const lobbyId = generateRandomLobbyId().toString();
  const lobby = { id: lobbyId, name, players: [] };
  lobbies.set(lobbyId, lobby);
  io.to('mainMenu').emit('lobbyUpdated', lobby);

  // Move the lobby creator to the lobby
  const socketId = req.headers['x-socket-id'];
  const player = players.get(socketId);
  if (player) {
    lobby.players.push(player);
    socket.join(lobbyId); // Add the creator to the lobby room
    io.to(socketId).emit('lobbyJoined', lobby); // Send the updated lobby data to the creator
    io.to(lobbyId).emit('joinMessage', { message: `${player.name} joined the lobby`, type: 'join' });
    io.to(lobbyId).emit('lobbyUpdated', lobby); // Send the updated lobby data to all clients in the lobby
  }

  res.status(201).json({ message: 'Lobby created successfully', lobbyId });
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.join('mainMenu');
  socket.on('join', (data) => {
    const { name, lobbyId } = data;
    const player = Array.from(players.values()).find((p) => p.id === socket.id);
    if (player) {
      const lobby = lobbies.get(lobbyId);
      if (lobby) {
        // Add the player to the lobby
        lobby.players.push(player);

        // Update the lobby in the lobbies map
        lobbies.set(lobbyId, lobby);

        // Send the updated lobby data to all clients in the lobby
        io.to(lobbyId).emit('lobbyUpdated', lobby);

        // Send a message to the lobby indicating that the player joined
        io.to(lobbyId).emit('joinMessage', { message: `${player.name} joined the lobby`, type: 'join' });

        // Send the lobby ID to the player who joined
        io.to(socket.id).emit('joinLobby', { lobbyId });
      }
    }
  });

  socket.on('chatMessage', (data) => {
    const { message, lobbyId } = data;
    const player = Array.from(players.values()).find((p) => p.id === socket.id);
    if (player) {
      const chatMessage = { sender: player.name, message };
      const lobby = lobbies.get(lobbyId);
      if (lobby) {
        // Add the chat message to the lobby's chat history
        lobby.chatHistory.push(chatMessage);

        // Send the chat message to all clients in the lobby
        io.to(lobbyId).emit('message', { message: chatMessage, type: 'chat' });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('New client disconnected:', socket.id);

    const player = Array.from(players.values()).find((p) => p.id === socket.id);
    if (player) {
      players.delete(socket.id);

      // Remove the player from the lobby they were in, if any
      lobbies.forEach((lobby) => {
        const index = lobby.players.findIndex((p) => p.id === player.id);
        if (index !== -1) {
          lobby.players.splice(index, 1);

          // Update the lobby in the lobbies map
          lobbies.set(lobby.id, lobby);

          // Send the updated lobby data to all clients in the lobby
          io.to(lobby.id).emit('lobbyUpdated', lobby);

          // Send a message to the lobby indicating that the player left
          io.to(lobby.id).emit('joinMessage', { message: `${player.name} left the lobby`, type: 'leave' });
        }
      });

      const playerList = Array.from(players.values());
      io.emit('playerList', playerList); // Send updated player list to all clients
    }
  });
});

app.use(express.static('public'));

app.get('/lobbies/:lobbyId', (req, res) => {
  res.sendFile(__dirname + '/public/lobby.html');
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});