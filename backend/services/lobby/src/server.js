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

function pickNewLeader(lobby){
  let oldestPlayer = null;
  let oldestJoinTime = Infinity;

  for (const player of lobby.players) {
    if (player.joinTime < oldestJoinTime) {
      oldestPlayer = player;
      oldestJoinTime = player.joinTime;
    }
  }
  return oldestPlayer;
}

function areAllPlayersReady(lobbyId) {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) {
    return false; 
  }

  return lobby.players.every((player) => player.ready);
}

function maxPlayersForGame(game){
  let maxPlayers = 0;
  switch (game) {
    case "wojna":
    maxPlayers = 4;
    break;
    case "duren":
    maxPlayers = 5;
    break;
    case "makao":
    maxPlayers = 6;
    break;
    case "poker":
    maxPlayers = 7;
    break;
    default:
      console.log("wrong game");
  }
  return maxPlayers;
}


io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', (data) => {
    const { lobbyId } = data;
    
    const player = { socketId: socket.id, ready: false, leader: false, joinTime: Date.now() };
    players.set(socket.id, player);
    socket.join(lobbyId);

    const lobby = lobbies.get(lobbyId);
    if (lobby) {
      if (!lobby.leaderAvailable){
        player.leader = true;
        lobby.leaderAvailable = true;
      } else {
        if (lobby.passwordProtected) {
          io.to(socket.id).emit('passwordNeeded', { lobby });
        }
      }
      lobby.players.push(player);
      lobbies.set(lobbyId, lobby);
      io.to(lobbyId).emit('lobbyJoined', lobby);
      io.emit('mainMenuLobbiesUpdated', Array.from(lobbies.values()));
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
        const leaderPlayer = lobby.players.find((player) => player.leader === true);
        if(areAllPlayersReady(lobbyId)){
          io.to(leaderPlayer.socketId).emit('enableStartButton', { enabled: true });
        }
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
        io.to(lobbyId).emit('playerUnready', { lobby, enabled: false });
      } 
    }
  });

  socket.on('inProgress', (data) => {
    const { lobbyId } = data;
    const lobby = lobbies.get(lobbyId);
    if(lobby) {
      lobby.inProgress = true;
      io.emit('mainMenuLobbiesUpdated', Array.from(lobbies.values()));
      io.to(lobbyId).emit('gameStarted', { lobbyId });
    }
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    players.delete(socket.id);
    lobbies.forEach((lobby, lobbyId) => {
      const index = lobby.players.findIndex((p) => p.socketId === socket.id);
      if (index !== -1) {
        const leftPlayer = lobby.players.splice(index, 1)[0];
        if (lobby.players.length === 0) {
          lobbies.delete(lobbyId);
        } else {
          if(leftPlayer.leader){
            lobby.leaderAvailable = false;
            const newLeader = pickNewLeader(lobby);
            if(newLeader !== null){
              newLeader.leader = true;
              lobby.leaderAvailable = true;
            }
          }
          const leaderPlayer = lobby.players.find((player) => player.leader === true);
          if(areAllPlayersReady(lobbyId)){
            io.to(leaderPlayer.socketId).emit('enableStartButton', { enabled: true });
          }
          io.to(lobby.id).emit('lobbyUpdated', lobby);
          io.to(lobby.id).emit('joinMessage', { message: `${leftPlayer.socketId} left the lobby`, type: 'leave' });
        }
        io.emit('mainMenuLobbiesUpdated', Array.from(lobbies.values()));
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
  const { name, game, password } = req.body;

  const lobbyExists = Array.from(lobbies.values()).some((lobby) => lobby.name === name);
  if (lobbyExists) {
    return res.status(409).json({ message: 'Lobby with the same name already exists' });
  }
  const hasPassword = password.length !== 0 ? true : false;

  let maxPlayers = maxPlayersForGame(game);
  const lobbyId = generateRandomLobbyId().toString();

  const lobby = { id: lobbyId, name, players: [], chatHistory: [], inProgress: false, isFull: false, game: game, 
    maxPlayers: maxPlayers, leaderAvailable: false, passwordProtected: hasPassword, password: password };

  lobbies.set(lobbyId, lobby);

  res.status(201).json({ message: 'Lobby created successfully', lobbyId });

  io.emit('mainMenuLobbiesUpdated', Array.from(lobbies.values()));
});

app.get('/lobbies/:lobbyId', (req, res) => {
  const lobbyId = req.params.lobbyId;

  if (!lobbies.has(lobbyId)) {
    return res.status(404).send('Lobby not found');
  }
  const lobby = lobbies.get(lobbyId);
  if(lobby.players.length === lobby.maxPlayers || lobby.inProgress){
    return res.status(404).send('You cant join this lobby');
  }
  res.sendFile(__dirname + '/public/lobby.html');
});

//temp endpoint
app.get('/lobbies/:lobbyId/game', (req, res) => {
  res.sendFile(__dirname + '/public/game.html');
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});