import { Schema, model } from 'mongoose';

const User = new Schema({
    username: { type: String, required: true },
    friendsWith: [{ type: String }],
    bio: { type: String, default: "" }
});

export default model("User", User);
