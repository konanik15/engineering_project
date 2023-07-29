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

  let players = new Map();

  // function getStoredPassword(cookies, lobbyId) {
  //   const cookieName = `lobbyPassword_${lobbyId}`;
  //   const storedPassword = cookies[cookieName];
  //   return storedPassword || null;
  // }

  function generateRandomLobbyId() {
    return uuidv4();
  }

  function pickNewLeader(lobby) {
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

  function broadcast(clients, message) {
    clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  }

  const clients = new Set();
  app.ws("/lobbies", keycloak.protectWS(), async (ws, req) => {
    clients.add(ws);
    console.log("New client connected to main menu:", ws._socket.remoteAddress);

    ws.on("close", () => {
      clients.delete(ws);
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

  const lobbyClients = new Map();
  app.ws("/lobby/:lobbyId", keycloak.protectWS(), async (ws, req) => {
    console.log("New client:", ws._socket.remoteAddress, "connected to lobby:", req.params.lobbyId);

    const lobbyId = req.params.lobbyId;
    let lobby = null;
    lobby = await Lobby.findOne({ id: lobbyId });
    if (!lobby) {
      console.error("Lobby not found");
      ws.close(1000, "Connection closed by server");
    } 
    tempClients = lobbyClients.get(lobbyId) || lobbyClients.set(lobbyId, new Set()).get(lobbyId);
    tempClients.add(ws);
    lobbyClients.set(lobbyId, tempClients);

    const player = {
      name: req.decoded_token.preferred_username,
      joinTime: Date.now(),
    };

    ws.on("close", () => {
      tempClients.delete(ws);
      lobbyClients.set(lobbyId, tempClients);
      ws.close(1000, "Connection closed by server");
    });

    ws.on("message", async (message) => {
      const { type, data } = JSON.parse(message);
      switch (type) {
        //when a user joins a lobby he sends a message with type "join" and data containing lobbyId
        //if everything is ok, server assigns the player to the lobby and emits a message to the lobby that a new player joined
        case "join":
          if (!lobby.isFull) {
            if (!lobby.hasLeader) {
              player.leader = true;
              lobby.hasLeader = true;
              //these messages can be used on client side to enable the start game button for the leader
              //I used them in my htmls, I am not sure if this is a good practice but it worked
              // ws.send(JSON.stringify({ type: "enableStartButton", data: { enabled: false } }));
              // ws.send(JSON.stringify({ type: "unhideStartButton"}));
            }

            lobby.players.push(player);
            await lobby.save();
            //send info to all of the clients in the lobby that a player joined
            broadcast(tempClients, JSON.stringify({ type: "playerJoined", data: { username: player.name }}));
            ws.send(JSON.stringify({ type: "joinResult", data: { success: true } }));
            
            //TODO: how to send a message to /lobbies
            // const lobbyList = await Lobby.find({});
            // io.emit("mainMenuLobbiesUpdated", lobbyList);
          } else {
            ws.send(JSON.stringify({ type: "joinResult", data: { success: false } }));
            ws.close(1000, "Connection closed by server");
          }
          break;
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
          broadcast(tempClients, JSON.stringify({ type: "newMessage", data: { message: chatMessage }}));
          ws.send(JSON.stringify({ type: "messageResult", data: { success: true } }));
          break;
      }


    });
    

  });
  const lobbySocket = io.of("/lobby");
  lobbySocket.on("connection", async (socket, req) => {
    const lobbyId = socket.handshake.query.lobbyId;
    console.log("New client connected to lobby:", socket.id, "lobbyId:", lobbyId);

    const player = {
      socketId: socket.id,
      ready: false,
      leader: false,
      joinTime: Date.now(),
    };
    players.set(socket.id, player);

    socket.on("ready", async (data) => {
      const { lobbyId } = data;
      const player = players.get(socket.id);
      if (player) {
        player.ready = true;
        let lobby = null;
        try {
          lobby = await Lobby.findOne({ id: lobbyId });
        } catch (err) {
          console.error(err);
          socket.emit("readyResult", { success: false });
        }
        if (lobby) {
          const leaderPlayer = lobby.players.find(
            (player) => player.leader === true
          );
          if (areAllPlayersReady(lobbyId)) {
            io.to(leaderPlayer.socketId).emit("enableStartButton", {
              enabled: true,
            });
          }
          await lobby.save();
          io.to(lobbyId).emit("playerReady", lobby);
          socket.emit("readyResult", { success: true });
        } else {
          socket.emit("readyResult", { success: false });
        }
      } else {
        socket.emit("readyResult", { success: false });
      }
    });

    socket.on("unready", async (data) => {
      const { lobbyId } = data;
      const player = players.get(socket.id);
      if (player) {
        player.ready = false;
        let lobby = null;
        try {
          lobby = await Lobby.findOne({ id: lobbyId });
        } catch (err) {
          console.error(err);
          socket.emit("readyResult", { success: false });
        }
        if (lobby) {
          await lobby.save();
          const leaderPlayer = lobby.players.find(
            (player) => player.leader === true
          );
          io.to(lobbyId).emit("playerUnready", { lobby });
          io.to(leaderPlayer.socketId).emit("enableStartButton", {
            enabled: false,
          });
          socket.emit("readyResult", { success: true });
        } else {
          socket.emit("readyResult", { success: false });
        }
      } else {
        socket.emit("readyResult", { success: false });
      }
    });

    socket.on("inProgress", async (data) => {
      const { lobbyId } = data;
      let lobby = null;
      try {
        lobby = await Lobby.findOne({ id: lobbyId });
      } catch (err) {
        console.error(err);
        socket.emit("inProgressResult", { success: false });
      }
      if (lobby) {
        lobby.inProgress = true;
        await lobby.save();
        const lobbyList = await Lobby.find({});
        io.emit("mainMenuLobbiesUpdated", lobbyList);
        io.to(lobbyId).emit("gameStarted", { lobbyId });
        socket.emit("inProgressResult", { success: true });
      } else {
        socket.emit("inProgressResult", { success: false });
      }
    });

    socket.on("leaveLobby", async () => {
      const socketId = socket.id;
      const player = players.get(socketId);

      if (player) {
        const lobbyId = player.lobbyId;
        let lobby = null;
        try {
          lobby = await Lobby.findOne({ id: lobbyId });
        } catch (err) {
          console.error(err);
          socket.emit("leaveLobbyResult", { success: false });
        }

        if (lobby) {
          lobby.players = lobby.players.filter((p) => p.socketId !== socketId);
          players.delete(socketId);

          if (player.leader) {
            const newLeader = chooseNewLeader(lobby.players);
            if (newLeader) {
              newLeader.leader = true;
              io.to(lobbyId).emit("updateLobby", lobby);
            }
          }
          io.to(lobbyId).emit("updateLobby", lobby);
          await lobby.save();
          const lobbyList = await Lobby.find({});
          io.emit("mainMenuLobbiesUpdated", lobbyList);
          socket.emit("leaveLobbyResult", { success: true });
        } else {
          socket.emit("leaveLobbyResult", { success: false });
        }
      }
    });

    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id, "lobbyId:", lobbyId);

      players.delete(socket.id);
      const lobbyList = await Lobby.find({});
      lobbyList.forEach(async (lobby, lobbyId) => {
        const index = lobby.players.findIndex((p) => p.socketId === socket.id);
        if (index !== -1) {
          const leftPlayer = lobby.players.splice(index, 1)[0];
          if (lobby.players.length === 0) {
            await Lobby.deleteOne({ id: lobbyId });
          } else {
            if (leftPlayer.leader) {
              lobby.leaderAvailable = false;
              const newLeader = pickNewLeader(lobby);
              if (newLeader !== null) {
                newLeader.leader = true;
                lobby.leaderAvailable = true;
              }
            }
            const leaderPlayer = lobby.players.find(
              (player) => player.leader === true
            );
            if (areAllPlayersReady(lobbyId)) {
              io.to(leaderPlayer.socketId).emit("enableStartButton", {
                enabled: true,
              });
            }
            await lobby.save();
            io.to(leaderPlayer.socketId).emit("unhideStartButton");
            io.to(lobby.id).emit("lobbyUpdated", lobby);
            io.to(lobby.id).emit("joinMessage", {
              message: `${leftPlayer.socketId} left the lobby`,
              type: "leave",
            });
          }
          const lobbyList = await Lobby.find({});
          io.emit("mainMenuLobbiesUpdated", lobbyList);
        }

        socket.leave(lobby.id);
      });
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

    const lobbyList = await Lobby.find({});
    io.of('lobbies').emit("mainMenuLobbiesUpdated", lobbyList);

    //res.cookie(`lobbyPassword_${lobbyId}`, password, { maxAge: 3600000 });
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
