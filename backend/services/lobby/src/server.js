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
const { v4: uuidv4 } = require("uuid");
const { startGame, pickNewLeader, areAllPlayersReady, broadcastToClients, getGameTypeInfo } = require("./lobby/helper.js");


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

  const mainMenuClients = new Set();
  const lobbyClients = new Map();


  //websocket endpoints
  app.ws("/lobbies", keycloak.protectWS(), async (ws, req) => {
    mainMenuClients.add(ws);
    console.log("New client connected to main menu:", ws._socket.remoteAddress);

    ws.on("close", () => {
      mainMenuClients.delete(ws);
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
            lobby = await Lobby.findById(lobbyId);
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
          const isValidPassword = await bcrypt.compare(password, lobby.password);
          if (!isValidPassword) {
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

    const lobbyId = req.params.lobbyId;
    let lobby = null;
    lobby = await Lobby.findById(lobbyId);
    
    if (!lobby) {
      console.error("Lobby not found");
      ws.close(1008, `No lobby found with id ${lobbyId}`);
      return;
    } 

    if (lobby.isFull) {
      console.error("Lobby is full");
      ws.close(1008, "Lobby is full");
      return;
    }

    if (lobby.passwordProtected) {
      const password = req.headers.password;
      if (!password) {
        console.error("Password is required");
        ws.close(1008, "Password is required");
        return;
      }

      const isValidPassword = await bcrypt.compare(password, lobby.password);
      if (!isValidPassword) {
        console.error("Wrong password");
        ws.close(1008, "Wrong lobby password");
        return;
      }
    }

    ws.id = uuidv4();
    console.log("New client:", ws.id, "connected to lobby:", req.params.lobbyId);
    //setting up the client in the lobby
    let player = {
      wsId: ws.id,
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
    if (lobby.players.length === lobby.maxPlayers) {
      lobby.isFull = true;
    }
    await lobby.save();
    //send info to all of the clients in the lobby that a player joined
    broadcastToClients(tempClients, JSON.stringify({ type: "playerJoined", data: { username: player.name }}));
    //send info to mainmenu clients that a player joined
    broadcastToClients(mainMenuClients, JSON.stringify({ type: "playerJoined", data: { lobbyId: lobbyId }}));
    ws.send(JSON.stringify({ type: "joinResult", data: { success: true } }));
    
    ws.on("close", async () => {
      console.log("Client:", ws.id, "disconnected from lobby:", req.params.lobbyId);
      tempClients = lobbyClients.get(lobbyId);
      tempClients.delete(ws);
      lobbyClients.set(lobbyId, tempClients);
      lobby = await Lobby.findById(lobbyId);
      const pulledPlayer = lobby.players.find((player) => player.wsId === ws.id);
      await Lobby.findOneAndUpdate({ _id: lobbyId }, { $pull: { players: { wsId: ws.id } } }, { new: false} );
      //ugly code idk how to do it better
      lobby = await Lobby.findById(lobbyId);

      if(lobby.isFull) {
        lobby.isFull = false;
        await lobby.save();
      }

      if(lobby.players.length === 0) {
        await Lobby.deleteOne({ _id: lobbyId });
        broadcastToClients(mainMenuClients, JSON.stringify({ type: "lobbyDeleted", data: { lobbyId: lobbyId }}));
        return;
      }

      if(pulledPlayer.leader) {
        lobby.hasLeader = false;
        await lobby.save();
        const newLeader = await pickNewLeader(lobbyId);
        if (newLeader) {
          console.log("new leader is:", newLeader.name);
          newLeader.leader = true;
          await Lobby.findOneAndUpdate({ _id: lobbyId, 'players.wsId': newLeader.wsId }, { '$set': { 'players.$.leader': true } }, { new: false} );
          lobby.hasLeader = true;
          await lobby.save();
        }
      }

      broadcastToClients(tempClients, JSON.stringify({ type: "playerLeft", data: { username: pulledPlayer.name }}));
      broadcastToClients(mainMenuClients, JSON.stringify({ type: "playerLeft", data: { lobbyId: lobbyId }}));
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

          lobby = await Lobby.findById(lobbyId);
          const pulledPlayer = lobby.players.find((player) => player.wsId === ws.id);
          const chatMessage = {
            sender: pulledPlayer.name,
            message,
            timestamp: Date.now(),
          };
          lobby = await Lobby.findById(lobbyId);
          lobby.chatHistory.push(chatMessage);
          await lobby.save();
          tempClients = lobbyClients.get(lobbyId);
          broadcastToClients(tempClients, JSON.stringify({ type: "newMessage", data: { message: chatMessage }}));
          ws.send(JSON.stringify({ type: "messageResult", data: { success: true } }));

          break;

        case "ready":
          try {
            await Lobby.findOneAndUpdate({ _id: lobbyId, 'players.wsId': ws.id }, { '$set': { 'players.$.ready': true } }, { new: false} );
            ws.send(JSON.stringify({ type: "readyResult", data: { success: true } }));
            tempClients = lobbyClients.get(lobbyId);
            const pulledPlayer = lobby.players.find((player) => player.wsId === ws.id);
            broadcastToClients(tempClients, JSON.stringify({ type: "playerReady", data: { username: pulledPlayer.name }}));
          } catch (err) {
            console.error(err);
            ws.send(JSON.stringify({ type: "readyResult", data: { success: false } }));
          }

          break;
        
        case "unready":
          try {
            await Lobby.findOneAndUpdate({ _id: lobbyId, 'players.wsId': ws.id }, { '$set': { 'players.$.ready': false } }, { new: false} );
            ws.send(JSON.stringify({ type: "unreadyResult", data: { success: true } }));
            tempClients = lobbyClients.get(lobbyId);
            const pulledPlayer = lobby.players.find((player) => player.wsId === ws.id);
            broadcastToClients(tempClients, JSON.stringify({ type: "playerUnready", data: { username: pulledPlayer.name }}));
          } catch (err) {
            console.error(err);
            ws.send(JSON.stringify({ type: "unreadyResult", data: { success: false } }));
            return res.status(500).send("Internal server error");
          }
          break;

        case "startGame":
          try {
            lobby = await Lobby.findById(lobbyId);
          } catch (err) {
            console.error(err);
            ws.send(JSON.stringify({ type: "startGameResult", data: { success: false } }));
            break;
          }
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
          try {
            const gameInfo = await startGame(lobby.game, lobby.players);
            tempClients = lobbyClients.get(lobbyId);
            broadcastToClients(tempClients, JSON.stringify({ type: "gameStarted", data: { gameId: gameInfo._id } }));
            console.log("game created: " + gameInfo._id);
          } catch (err) {
            console.error(err);
            break;
          }

          lobby.inProgress = true;
          await lobby.save();

          ws.send(JSON.stringify({ type: "startGameResult", data: { success: true} }));
          //broadcast to mainmenu clients that the lobby is in progress
          broadcastToClients(mainMenuClients, JSON.stringify({ type: "lobbyInProgress", data: { lobbyId: lobbyId }}));

          break;
    
        case "gameEnded":

          break;

        default:
          console.log("Invalid message type:", type);
          break;
      }
    });
  });


  //rest api endpoints
  app.get("/lobbies", keycloak.protectHTTP(), async (req, res) => {
    try {
      const lobbyList = await Lobby.find({}).select("-password");
      res.status(200).send(lobbyList);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error");
    }
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
    const lobby = new Lobby({
      name,
      players: [],
      chatHistory: [],
      inProgress: false,
      game,
      minPlayers: gameInfo.minPlayers,
      maxPlayers: gameInfo.maxPlayers,
      hasLeader: false,
      passwordProtected: password ? true : false,
      password: hashedPassword,
    });
    await lobby.save();

    broadcastToClients(mainMenuClients, JSON.stringify({ type: "lobbyCreated", data: { lobbyId: lobby._id }}));
    res.status(201).send({ message: "Lobby created successfully", lobbyId: lobby._id });
  });

  app.get("/lobby/:id", keycloak.protectHTTP(), async (req, res) => {
    const lobbyId = req.params.id;
    let lobby = null;
    try {
      lobby = await Lobby.findById(lobbyId).select("-password");
    } catch (err) {
      console.error(err);
      return res.status(500).send("Internal server error");
    }
    if (!lobby) {
      return res.status(404).send("Lobby not found");
    }
    
    res.status(200).send(lobby);
  });

  // Commented out for now 

  // app.delete("/lobby/:id", keycloak.protectHTTP(), async (req, res) => {
  //   const lobbyId = req.params.id;
  //   let lobby = null;
  //   try {
  //     lobby = await Lobby.findById(lobbyId);
  //   } catch (err) {
  //     console.error(err);
  //     return res.status(500).send("Internal server error");
  //   }
  //   if (!lobby) {
  //     return res.status(404).send("Lobby not found");
  //   }
  //   try {
  //     await Lobby.deleteOne({ _id: lobbyId });
  //     broadcastToClients(mainMenuClients, JSON.stringify({ type: "lobbyDeleted", data: { lobbyId: lobbyId }}));
  //     res.status(200).send("Lobby deleted successfully");
  //   } catch (err) {
  //     console.error(err);
  //     return res.status(500).send("Internal server error");
  //   }
  // });
      
  const PORT = 8080;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setup();
