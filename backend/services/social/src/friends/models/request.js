import { Schema, model } from 'mongoose';

const Request = new Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    text: { type: String, required: false }
}, {
    timestamps: {
        createdAt: "sent"
    }
});

export default model("FriendRequest", Request, "friendRequests");
