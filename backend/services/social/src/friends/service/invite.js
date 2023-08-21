import { LobbyFullError, LobbyInProgessError } from "../../common/errors.js";
import Lobby from "../../common/lobby.js";
import axios from "axios";
import _ from "lodash";

const host = process.env.LOBBY_HOST;
const port = process.env.LOBBY_PORT;

if (!host || !port)
    throw new Error("Environment variables LOBBY_HOST or LOBBY_PORT are required");

async function inviteToLobby(sender, receiver, lobbyId) {
    let lobby = await Lobby.findById(lobbyId);
    await Lobby.ensureParticipant(lobbyId, sender);
    if (lobby.isFull)
        throw new LobbyFullError("This lobby is already full");
    if (lobby.inProgress)
        throw new LobbyInProgessError("There is already a game in progress on this lobby");
    
    let response = await axios.get(`http://${host}:${port}/lobby/${lobbyId}/invite-code`);
    let lobbyData = _.pick(lobby.toJSON(), ["name", "game"]);
    lobbyData.inviteCode = response.data;
    return {
        type: "lobby",
        from: sender,
        to: receiver,
        data: lobbyData
    }
}

export default { inviteToLobby }; 
