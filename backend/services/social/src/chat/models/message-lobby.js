import { Schema, model } from 'mongoose';

const Message = new Schema({
    from: { type: String, required: true },
    lobbyId: { type: String, required: true },
    text: { type: String, required: true }
}, {
    timestamps: {
        createdAt: "sent"
    }
});

export default model("Message", Message, "messagesLobby");
