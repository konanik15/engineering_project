const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const keycloak = require("kc-adapter"); 
const mongo = require("./common/mongo.js");
const Lobby = require("./models/Lobby");
const { v4: uuidv4 } = require('uuid');
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

  function getStoredPassword(cookies, lobbyId) {
    const cookieName = `lobbyPassword_${lobbyId}`;
    const storedPassword = cookies[cookieName];
    return storedPassword || null;
  }

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

  async function areAllPlayersReady (lobbyId) {
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

  io.on("connection", async (socket, req) => {
    console.log("New client connected:", socket.id);

    const player = {
      socketId: socket.id,
      ready: false,
      leader: false,
      joinTime: Date.now(),
    };
    players.set(socket.id, player);

    socket.on("validatePassword", async (data) => {
      const { lobbyId, password } = data;
      let lobby = null;
      try {
        lobby = await Lobby.findOne({ id: lobbyId });
      } catch (err) {
        console.error(err);
        socket.emit("passwordValidationResult", { isValid: false });
      }
      if (lobby && await bcrypt.compare(password, lobby.password)) {
        socket.emit("passwordValidationResult", { isValid: true });
        console.log("correct password");
      } else {
        console.log("wrong password");
        socket.emit("passwordValidationResult", { isValid: false });
      }
    });

    socket.on("join", async (data) => {
      const { lobbyId } = data;
      
      let lobby = null;
      try {
        lobby = await Lobby.findOne({ id: lobbyId });
      } catch (err) {
        console.error(err);
        socket.emit("joinResult", { success: false });
      }

      if (!lobby) {
        socket.emit("joinResult", { success: false });
      }

      if (!lobby.isFull) {
        if (!lobby.leaderAvailable) {
          player.leader = true;
          lobby.leaderAvailable = true;
          //io.to(player.socketId).emit('enableGameComboBox', { enabled: true });
          io.to(player.socketId).emit("enableStartButton", { enabled: false });
          io.to(player.socketId).emit("unhideStartButton");
        } else {
          //io.to(lobbyId).emit('enableGameComboBox', { enabled: false });
          const leaderPlayer = lobby.players.find(
            (player) => player.leader === true
          );
          //io.to(leaderPlayer.socketId).emit('enableGameComboBox', { enabled: true });
          io.to(leaderPlayer.socketId).emit("enableStartButton", {
            enabled: false,
          });
          io.to(leaderPlayer.socketId).emit("unhideStartButton");
        }
        socket.join(lobbyId);
        lobby.players.push(player);
        await lobby.save();
        io.to(lobbyId).emit("lobbyJoined", lobby);
        const lobbyList = await Lobby.find({});
        io.emit("mainMenuLobbiesUpdated", lobbyList);
        socket.emit("joinResult", { success: true });
      } else {
        socket.emit("joinResult", { success: false });
      }
    });

    socket.on("chatMessage", async (data) => {
      const { message, lobbyId } = data;
      const player = players.get(socket.id);
      if (player) {
        const chatMessage = { sender: socket.id, message, timestamp: Date.now() };
        let lobby = null;
        try {
          lobby = await Lobby.findOne({ id: lobbyId });
        } catch (err) {
          console.error(err);
          socket.emit("messageResult", { success: false });
        }
        if (lobby) {
          lobby.chatHistory.push(chatMessage);
          await lobby.save();
          io.to(lobbyId).emit("message", { messages: lobby.chatHistory });
          socket.emit("messageResult", { success: true });
        } else {
          socket.emit("messageResult", { success: false });
        }
      }
    });

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

    // socket.on('gameChanged', (data) => {
    //   const { game, lobbyId } = data;
    //   const lobby = lobbies.get(lobbyId);
    //   if (lobby) {
    //     let maxPlayers = maxPlayersForGame(game);
    //     lobby.game = game;

    //     lobby.maxPlayers = maxPlayers;
    //     io.emit('mainMenuLobbiesUpdated', Array.from(lobbies.values()));
    //     io.to(lobbyId).emit('gameUpdated', { game });
    //   }
    // })

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
      console.log("Client disconnected:", socket.id);

      players.delete(socket.id);
      const lobbyList = await Lobby.find({});
      lobbyList.forEach(async (lobby, lobbyId) => {
        const index = lobby.players.findIndex((p) => p.socketId === socket.id);
        if (index !== -1) {
          const leftPlayer = lobby.players.splice(index, 1)[0];
          if (lobby.players.length === 0) {
            await Lobby.deleteOne( {id: lobbyId});
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

  app.get("/api/lobbies", keycloak.protectHTTP(), async (req, res) => {
    const lobbyList = await Lobby.find({});
    res.json(lobbyList);
  });

  app.post("/api/lobbies", keycloak.protectHTTP(), async (req, res) => {
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
      leaderAvailable: false,
      passwordProtected: password.length !== 0,
      password: hashedPassword,
    });
    await lobby.save();

    const lobbyList = await Lobby.find({});
    io.emit("mainMenuLobbiesUpdated", lobbyList);

    //res.cookie(`lobbyPassword_${lobbyId}`, password, { maxAge: 3600000 });
    res.status(201).json({ message: "Lobby created successfully", lobbyId });
  });

  app.get("/lobbies/:id", keycloak.protectHTTP(), async (req, res) => {
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
    if (lobby.players.length === lobby.maxPlayers || lobby.inProgress) {
      return res.status(404).send("You cant join this lobby");
    }
    // const storedPassword = getStoredPassword(req.cookies, lobbyId);
    // let storedPasswordMatches = false;
    // if(storedPassword !== null){
    //   storedPasswordMatches = await bcrypt.compare(storedPassword, lobby.password);
    //   console.log(storedPasswordMatches);
    //   console.log(storedPassword);
    //   console.log(lobby.password);
    // }
    // if (lobby.passwordProtected && !storedPasswordMatches) {
    //   res.redirect(`/password_prompt?lobbyId=${lobbyId}`);
    //   console.log("2");
    
    res.json(lobby);

  });

  // app
  //   .route("/password_prompt")
  //   .get((req, res) => {
  //     const { error, lobbyId } = req.query;
  //     res.render("password_prompt", { error, lobbyId });
  //   })
  //   .post(async (req, res) => {
  //     const { lobbyId, password } = req.body;
  //     let lobby = null;
  //     try {
  //       lobby = await Lobby.findOne({ id: lobbyId });
  //     } catch (err) {
  //       console.error(err);
  //       return res.status(500).send("Internal server error");
  //     }
  //     if (lobby && await bcrypt.compare(password, lobby.password)) {
  //       res.cookie(`lobbyPassword_${lobbyId}`, password, { maxAge: 3600000 });
  //       res.redirect(`/lobbies/${lobbyId}`);
  //     } else {
  //       res.redirect(`/password_prompt?lobbyId=${lobbyId}&error=invalid`);
  //     }
  //   });
  //temp endpoint
  app.get("/lobbies/:lobbyId/game", (req, res) => {
    res.sendFile(__dirname + "/public/game.html");
  });

  const PORT = 8080;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}


setup();