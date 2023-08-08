import { mongoose, Schema } from "mongoose";
const Lobby = mongoose.model("Lobby", new Schema(), "lobbies");

import {
    LobbyDoesNotExistError,
    LobbyNotAParticipantError
} from "./errors.js";

async function findById(id) {
    try {
        let lobby = await Lobby.findById(id);
        if (!lobby)
            throw new Error();
        return lobby;
    } catch (e) {
        throw new LobbyDoesNotExistError(`Lobby with id ${id} does not exist`);
    }
}

async function ensureParticipant(lobbyId, username) {
    let lobby = await findById(lobbyId);
    lobby = JSON.parse(JSON.stringify(lobby));
    if (lobby.players.every(p => p.name !== username))
        throw new LobbyNotAParticipantError(`You are not a participant of this lobby`);
    return;
}

async function retrieveAll() {
    return await Lobby.find();
}

export default {
    findById,
    ensureParticipant,
    retrieveAll
}
