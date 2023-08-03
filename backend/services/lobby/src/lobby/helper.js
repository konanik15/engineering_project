const Lobby = require("../models/Lobby");
const axios = require("axios");

async function pickNewLeader(lobbyId) {
  let lobby = null;
  try {
    lobby = await Lobby.findById(lobbyId);
  } catch (err) {
    console.error(err);
    return false;
  }
  if (!lobby) {
    return false;
  }
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

async function areAllPlayersReady(lobbyId) {
  let lobby = null;
  try {
    lobby = await Lobby.findById(lobbyId);
  } catch (err) {
    console.error(err);
    return false;
  }
  if (!lobby) {
    return false;
  }
  return lobby.players.every((player) => player.ready);
}

function broadcastToClients(clients, message) {
  clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

async function getGameTypeInfo(gameType) {
  const url = `http://game-core:8080/${gameType}`;
  let gameInfo = null;
  try{
    const response = await axios.get(url);
    gameInfo = response.data;
  } catch (err) {
    console.error(err);
    return gameInfo;
  }
  return gameInfo;
}

async function startGame(gameType, players) {
  const url = `http://game-core:8080/${gameType}`;
  const participants = players.map((player) => ({ username: player.name }));
  const data = { participants };
  let gameInfo = null;
  try{
    const response = await axios.post(url, data);
    gameInfo = response.data;
  } catch (err) {
    console.error(err);
    return gameInfo;
  }
  return gameInfo;
}

module.exports = { pickNewLeader, areAllPlayersReady, broadcastToClients, getGameTypeInfo, startGame };