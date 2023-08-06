import Message from "../models/message-lobby.js";
import Lobby from "./lobby.js";

async function get(lobbyId, page = 1, perPage = 100) {
    await Lobby.findById(lobbyId);
    return await Message.find({ lobbyId }, null, { 
        sort: { 
            sent: -1 
        }
        //todo: add limit and paging
    });
}

async function send(lobbyId, from, text) {
    await Lobby.ensureParticipant(lobbyId, from);
    let message = new Message({ from, lobbyId, text});
    await message.save();
    return message;
}

export default { get, send };
