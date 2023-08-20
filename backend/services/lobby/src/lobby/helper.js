const Lobby = require("../models/Lobby");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

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

async function startGame(gameType, players, lobbyId) {
  const url = `http://game-core:8080/${gameType}`;
  const participants = players.map((player) => ({ username: player.name }));
  const data = { participants, lobbyId };
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

async function getInviteCode(lobbyId) {
  let lobby = await Lobby.findById(lobbyId);
  if (!lobby)
    throw new Error("notFound");
  if (!lobby.inviteCode) {
    lobby.inviteCode = uuidv4();
    await lobby.save();
  }
  return lobby.inviteCode;
}

module.exports = { pickNewLeader, areAllPlayersReady, broadcastToClients, getGameTypeInfo, startGame, getInviteCode };