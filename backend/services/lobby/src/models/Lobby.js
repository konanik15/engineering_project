const mongoose = require("mongoose");
const lobbySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  players: [
    {
      socketId: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: false,
      },
      ready: {
        type: Boolean,
        default: false,
      },
      leader: {
        type: Boolean,
        default: false,
      },
      joinTime: {
        type: Date,
        required: true,
      },
    },
  ],
  chatHistory: [
    {
      sender: {
        type: String,
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        required: true,
      },
    },
  ],
  inProgress: {
    type: Boolean,
    default: false,
  },
  isFull: {
    type: Boolean,
    default: false,
  },
  game: {
    type: String,
    required: true,
  },
  maxPlayers: {
    type: Number,
    required: true,
  },
  leaderAvailable: {
    type: Boolean,
    default: false,
  },
  passwordProtected: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    default: "",
  },
});

const Lobby = mongoose.model("Lobby", lobbySchema);

module.exports = Lobby;
