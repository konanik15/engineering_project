import { Schema, model } from 'mongoose';

const Message = new Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    read: { type: Boolean, default: false },
    text: { type: String, required: true }
}, {
    timestamps: {
        createdAt: "sent"
    }
});

Message.index({ sent: -1 });

export default model("MessagePrivate", Message, "messagesPrivate");
