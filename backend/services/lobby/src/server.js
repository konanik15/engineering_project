const express = require("express");
const app = express();
const server = require("http").Server(app);
const expressWs = require("express-ws");
expressWs(app, server);
const bodyParser = require("body-parser");
const keycloak = require("kc-adapter");
const mongo = require("./common/mongo.js");
const Lobby = require("./models/Lobby");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { generateRandomLobbyId, pickNewLeader, areAllPlayersReady, broadcastToClients } = require("./lobby/helper.js");


async function setup() {
  await Promise.all([keycloak.init(), mongo.connect()]);

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
  });
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  const clients = new Set();
  const lobbyClients = new Map();


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

  app.ws("/lobbies", keycloak.protectWS(), async (ws, req) => {
    clients.add(ws);
    console.log("New client connected to main menu:", ws._socket.remoteAddress);

    ws.on("close", () => {
      clients.delete(ws);
      ws.close(1000, "Connection closed by server");
    });
    
    ws.on("message", async (message) => {
      const { type, data } = JSON.parse(message);
      
      switch (type) {
        //this can be used to validate the password of a lobby client wants to join from main menu
        case "validatePassword":
          const { lobbyId, password } = data;
          let lobby = null;
          try {
            lobby = await Lobby.findOne({ id: lobbyId });
          } catch (err) {
            console.error(err);
            ws.send(JSON.stringify({ type: "passwordValidationResult", data: { isValid: false } }));
            return;
          }
  
          if (!lobby) {
            console.log("Lobby not found");
            ws.send(JSON.stringify({ type: "passwordValidationResult", data: { isValid: false } }));
            return;
          }
          if (!bcrypt.compare(password, lobby.password)) {
            console.log("Wrong password");
            ws.send(JSON.stringify({ type: "passwordValidationResult", data: { isValid: false } }));
            return;
          }
  
          ws.send(JSON.stringify({ type: "passwordValidationResult", data: { isValid: true } }));
          break;

        default:
          console.log("Invalid message type:", type);
      }
    });
  });

  app.ws("/lobby/:lobbyId", keycloak.protectWS(), async (ws, req) => {
    console.log("New client:", ws._socket.remoteAddress, "connected to lobby:", req.params.lobbyId);

    const lobbyId = req.params.lobbyId;
    let lobby = null;
    lobby = await Lobby.findOne({ id: lobbyId });
    if (!lobby) {
      console.error("Lobby not found");
      ws.close(1000, "Connection closed by server");
      return;
    } 

    //setting up the client in the lobby
    let player = {
      name: req.decoded_token.preferred_username,
      joinTime: Date.now(),
    };

    tempClients = lobbyClients.get(lobbyId) || lobbyClients.set(lobbyId, new Set()).get(lobbyId);
    tempClients.add(ws);
    lobbyClients.set(lobbyId, tempClients);

    if (!lobby.hasLeader) {
      player.leader = true;
      lobby.hasLeader = true;
    }
    lobby.players.push(player);
    await lobby.save();
    //send info to all of the clients in the lobby that a player joined
    broadcastToClients(tempClients, JSON.stringify({ type: "playerJoined", data: { username: player.name }}));
    //send info to mainmenu clients that a player joined
    broadcastToClients(clients, JSON.stringify({ type: "playerJoined", data: { lobbyId: lobbyId }}));
    ws.send(JSON.stringify({ type: "joinResult", data: { success: true } }));
    
    ws.on("close", async () => {
      console.log("Client:", ws._socket.remoteAddress, "disconnected from lobby:", req.params.lobbyId);
      tempClients.delete(ws);
      lobbyClients.set(lobbyId, tempClients);
      lobby = await Lobby.findOne({ id: lobbyId });
      const playerUpdated = lobby.players.find((player) => player.name === player.name);
      await Lobby.findOneAndUpdate({ id: lobbyId }, { $pull: { players: { name: player.name } } }, { new: false} );
      if(lobby.players.length === 0) {
        await Lobby.deleteOne({ id: lobbyId });
        broadcastToClients(clients, JSON.stringify({ type: "lobbyDeleted", data: { lobbyId: lobbyId }}));
        return;
      }

      if(playerUpdated.leader) {
        lobby.hasLeader = false;
        await lobby.save();
        const newLeader = await pickNewLeader(lobbyId);
        if (newLeader) {
          console.log("new leader is:", newLeader.name);
          newLeader.leader = true;
          await Lobby.findOneAndUpdate({ id: lobbyId, 'players.name': newLeader.name }, { '$set': { 'players.$.leader': true } }, { new: false} );
          lobby.hasLeader = true;
          await lobby.save();
        }
      }

      broadcastToClients(tempClients, JSON.stringify({ type: "playerLeft", data: { username: player.name }}));
      broadcastToClients(clients, JSON.stringify({ type: "playerLeft", data: { lobbyId: lobbyId }}));
      ws.close(1000, "Connection closed by server");
    });

    ws.on("message", async (message) => {
      const { type, data } = JSON.parse(message);
      switch (type) {
        case "chatMessage":
          const { message } = data;
          
          if(message === undefined){
            ws.send(JSON.stringify({ type: "messageResult", data: { success: false } }));
            console.error("Message is undefined");
            //return or break?
            return;
          }
          const chatMessage = {
            sender: player.name,
            message,
            timestamp: Date.now(),
          };
          lobby = await Lobby.findOne({ id: lobbyId });
          lobby.chatHistory.push(chatMessage);
          await lobby.save();
          broadcastToClients(tempClients, JSON.stringify({ type: "newMessage", data: { message: chatMessage }}));
          ws.send(JSON.stringify({ type: "messageResult", data: { success: true } }));

          break;

        case "ready":
          await Lobby.findOneAndUpdate({ id: lobbyId, 'players.name': player.name }, { '$set': { 'players.$.ready': true } }, { new: false} );
          ws.send(JSON.stringify({ type: "readyResult", data: { success: true } }));
          broadcastToClients(tempClients, JSON.stringify({ type: "playerReady", data: { username: player.name }}));

          break;
        
        case "unready":
          await Lobby.findOneAndUpdate({ id: lobbyId, 'players.name': player.name }, { '$set': { 'players.$.ready': false } }, { new: false} );
          ws.send(JSON.stringify({ type: "unreadyResult", data: { success: true } }));
          broadcastToClients(tempClients, JSON.stringify({ type: "playerUnready", data: { username: player.name }}));

          break;

        case "startGame":
          lobby = await Lobby.findOne({ id: lobbyId });
          if (!(await areAllPlayersReady(lobbyId))) {
            console.log("Not all players are ready");
            ws.send(JSON.stringify({ type: "startGameResult", data: { success: false } }));
            break;
          }
          if (lobby.inProgress) {
            console.log("Lobby is already in progress");
            ws.send(JSON.stringify({ type: "startGameResult", data: { success: false } }));
            break;
          }
          if (lobby.players.length < lobby.minPlayers) {
            console.log("Not enough players for this game type");
            ws.send(JSON.stringify({ type: "startGameResult", data: { success: false } }));
            break;
          }
          lobby.inProgress = true;
          await lobby.save();

          ws.send(JSON.stringify({ type: "startGameResult", data: { success: true } }));
          //maybe send what game or something idk
          broadcastToClients(tempClients, JSON.stringify({ type: "gameStarted"}));
          //broadcast to mainmenu clients that the lobby is in progress
          broadcastToClients(clients, JSON.stringify({ type: "lobbyInProgress", data: { lobbyId: lobbyId }}));

          break;
    
        case "gameEnded":

          break;

        default:
          console.log("Invalid message type:", type);
          break;
      }
    });
  });

  app.get("/lobbies", keycloak.protectHTTP(), async (req, res) => {
    const lobbyList = await Lobby.find({});
    res.status(200).send(lobbyList);
  });

  app.post("/lobbies", keycloak.protectHTTP(), async (req, res) => {
    const { name, game, password } = req.body;

    const lobbyExists = await Lobby.exists({ name });
    if (lobbyExists) {
      return res
        .status(409)
        .send({ message: "Lobby with the same name already exists" });
    }

    const gameInfo = await getGameTypeInfo(game);
    if (!gameInfo) {
      return res.status(404).send({ message: "Game not found" });
    }

    let hashedPassword = null;
    if (password && password.length !== 0) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }
    const lobbyId = generateRandomLobbyId().toString();
    const lobby = new Lobby({
      id: lobbyId,
      name,
      players: [],
      chatHistory: [],
      inProgress: false,
      isFull: false,
      game,
      minPlayers: gameInfo.minPlayers,
      maxPlayers: gameInfo.maxPlayers,
      hasLeader: false,
      passwordProtected: password ? true : false,
      password: hashedPassword,
    });
    await lobby.save();

    broadcastToClients(clients, JSON.stringify({ type: "lobbyCreated", data: { lobbyId: lobbyId }}));
    res.status(201).send({ message: "Lobby created successfully", lobbyId });
  });

  app.get("/lobby/:id", keycloak.protectHTTP(), async (req, res) => {
    const lobbyId = req.params.id;
    let lobby = null;
    try {
      lobby = await Lobby.findOne({ id: lobbyId });
    } catch (err) {
      console.error(err);
      return res.status(500).send("Internal server error");
    }
    if (!lobby) {
      return res.status(404).send("Lobby not found");
    }
    
    res.status(200).send(lobby);
  });

  const PORT = 8080;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setup();
