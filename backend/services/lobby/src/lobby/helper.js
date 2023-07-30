const { v4: uuidv4 } = require("uuid");
const Lobby = require("../models/Lobby");

function generateRandomLobbyId() {
  return uuidv4();
}

async function pickNewLeader(lobbyId) {
  let lobby = null;
  try {
    lobby = await Lobby.findOne({ id: lobbyId });
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
    lobby = await Lobby.findOne({ id: lobbyId });
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

module.exports = { generateRandomLobbyId, pickNewLeader, areAllPlayersReady, broadcastToClients };