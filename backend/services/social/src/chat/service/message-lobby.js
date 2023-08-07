import Message from "../models/message-lobby.js";
import Lobby from "./lobby.js";

async function get(lobbyId, reader, page, perPage) {
    page = parseInt(page); 
    perPage = parseInt(perPage);
    if (!Number.isInteger(page) || !Number.isInteger(perPage))
        throw new InvalidParameters("page and perPage parameters are not valid integers");

    await Lobby.ensureParticipant(lobbyId, reader);
    return await Message.find({ lobbyId }, null, { 
        sort: { sent: -1 }
        //todo: add limit and paging
    }).skip(perPage * (page - 1)).limit(perPage);
}

async function send(lobbyId, from, text) {
    await Lobby.ensureParticipant(lobbyId, from);
    let message = new Message({ from, lobbyId, text });
    await message.save();
    return message;
}

export default { get, send };
