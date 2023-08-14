import { Schema, model } from 'mongoose';

const User = new Schema({
    username: { type: String, required: true },
    friends: [{ type: String }],
    bio: { type: String, default: "" }
});

export default model("User", User);
