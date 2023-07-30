const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const expressWs = require("express-ws");
expressWs(app, server);
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const keycloak = require("kc-adapter");
const mongo = require("./common/mongo.js");
const Lobby = require("./models/Lobby");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

async function setup() {
  await Promise.all([keycloak.init(), mongo.connect()]);

  app.set("view engine", "ejs");
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
  });
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static("public"));

  //players is not needed I think
  let players = new Map();
  const clients = new Set();
  const lobbyClients = new Map();

  // function getStoredPassword(cookies, lobbyId) {
  //   const cookieName = `lobbyPassword_${lobbyId}`;
  //   const storedPassword = cookies[cookieName];
  //   return storedPassword || null;
  // }

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
  function maxPlayersForGame(game) {
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

  function broadcastToClients(clients, message) {
    clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  }

  // can't send to ws.id, has to be ws
  // function broadcastToClient(client, message) {
  //   client.send(message);
  // }

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
      } 

      //setting up the client in the lobby
      const player = {
        name: req.decoded_token.preferred_username,
        joinTime: Date.now(),
      };

      tempClients = lobbyClients.get(lobbyId) || lobbyClients.set(lobbyId, new Set()).get(lobbyId);
      tempClients.add(ws);
      lobbyClients.set(lobbyId, tempClients);

      if (!lobby.hasLeader) {
        player.leader = true;
        lobby.hasLeader = true;
        //these messages can be used on client side to enable the start game button for the leader
        //I used them in my htmls, I am not sure if this is a good practice but it worked
        //ws.send(JSON.stringify({ type: "enableStartButton", data: { enabled: true } }));
        //ws.send(JSON.stringify({ type: "unhideStartButton"}));
      }
      lobby.players.push(player);
      await lobby.save();
      //send info to all of the clients in the lobby that a player joined
      broadcastToClients(tempClients, JSON.stringify({ type: "playerJoined", data: { username: player.name }}));
      //send info to mainmenu clients that a player joined
      broadcastToClients(clients, JSON.stringify({ type: "playerJoined", data: { lobbyId: lobbyId }}));
      ws.send(JSON.stringify({ type: "joinResult", data: { success: true } }));
    
    ws.on("close", async () => {
      tempClients.delete(ws);
      lobbyClients.set(lobbyId, tempClients);
      await Lobby.findOneAndUpdate({ id: lobbyId }, { $pull: { players: { name: player.name } } }, { new: false} );

      if(player.leader) {
        lobby.hasLeader = false;
        const newLeader = pickNewLeader(lobbyId);
        if (newLeader) {
          newLeader.leader = true;
          lobby.hasLeader = true;
        }
      }
      await lobby.save();
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
            return;
          }
          const chatMessage = {
            sender: player.name,
            message,
            timestamp: Date.now(),
          };
          lobby.chatHistory.push(chatMessage);
          await lobby.save();
          broadcastToClients(tempClients, JSON.stringify({ type: "newMessage", data: { message: chatMessage }}));
          ws.send(JSON.stringify({ type: "messageResult", data: { success: true } }));
          break;

        case "ready":
          player.ready = true;
          await Lobby.findOneAndUpdate({ id: lobbyId, 'players.name': player.name }, { '$set': { 'players.$.ready': true } }, { new: false} );
          ws.send(JSON.stringify({ type: "readyResult", data: { success: true } }));
          broadcastToClients(tempClients, JSON.stringify({ type: "playerReady", data: { username: player.name }}));
          // leaderPlayer = lobby.players.find(
          //   (player) => player.leader === true
          // );
          // if (areAllPlayersReady(lobbyId)) {
          //   broadcastToClient(leaderPlayer.wsId, JSON.stringify({ type: "enableStartButton", data: { enabled: true } }));
          // }
          break;
        
        case "unready":
          player.ready = false;
          await Lobby.findOneAndUpdate({ id: lobbyId, 'players.name': player.name }, { '$set': { 'players.$.ready': false } }, { new: false} );
          ws.send(JSON.stringify({ type: "unreadyResult", data: { success: true } }));
          broadcastToClients(tempClients, JSON.stringify({ type: "playerUnready", data: { username: player.name }}));
          // leaderPlayer = lobby.players.find(
          //   (player) => player.leader === true
          // );
          // broadcastToClient(leaderPlayer.wsId, JSON.stringify({ type: "enableStartButton", data: { enabled: false } }));
          break;

        case "startGame":
          if (!areAllPlayersReady(lobbyId) || lobby.inProgress) {
            console.log("Not all players are ready or the lobby is already in progress");
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
    
        default:
          console.log("Invalid message type:", type);
      }
    });
  });


  app.get("/lobbies", keycloak.protectHTTP(), async (req, res) => {
    const lobbyList = await Lobby.find({});
    res.json(lobbyList);
  });

  app.post("/lobbies", keycloak.protectHTTP(), async (req, res) => {
    const { name, game, password } = req.body;

    const lobbyExists = await Lobby.exists({ name });
    if (lobbyExists) {
      return res
        .status(409)
        .json({ message: "Lobby with the same name already exists" });
    }
    const maxPlayers = maxPlayersForGame(game);

    let hashedPassword = null;
    if (password.length !== 0) {
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
      maxPlayers,
      hasLeader: false,
      passwordProtected: password.length !== 0,
      password: hashedPassword,
    });
    await lobby.save();

    broadcastToClients(clients, JSON.stringify({ type: "lobbyCreated", data: { lobbyId: lobbyId }}));
    res.status(201).json({ message: "Lobby created successfully", lobbyId });
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
    // I think those things should be handled on websockets
    // if (lobby.players.length === lobby.maxPlayers || lobby.inProgress) {
    //   return res.status(404).send("You cant join this lobby");
    // }
    res.json(lobby);
  });

  // app.get("/lobby/:lobbyId/game", (req, res) => {
  //   res.sendFile(__dirname + "/public/game.html");
  // });

  const PORT = 8080;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setup();
