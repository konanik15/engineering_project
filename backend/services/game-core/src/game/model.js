import { Schema, model } from 'mongoose';

const Card = new Schema({ 
    any: Object
}, { _id: false, strict: false });

const Hand = new Schema({
    owner: { type: String, required: true },
    open: { type: Boolean, default: false },
    cards: [ Card ]
}, { _id: false });

const Stack = new Schema({
    name: { type: String, required: true },
    facing: { type: String, enum: [ "up", "down" ], default: "down" },
    cards: [ Card ]
}, { _id: false });

const Pile = new Schema({
    name: { type: String, required: true },
    facing: { type: String, enum: [ "up", "down" ], default: "down" },
    cards: [ Card ]
}, { _id: false });

const Participant = new Schema({ 
    username: { type: String, required: true }
}, { _id: false });

const State = new Schema({ 
    hands: [ Hand ],
    stacks: [ Stack ],
    piles: [ Pile ]
}, { _id: false });

const Meta = new Schema({ 
    any: Object
}, { _id: false, strict: false });

const Game = new Schema({
    type : { type: String, required: true },
    status: { type: String, enum: [ "pending", "inProgress", "ended" ], default: "pending" },
    participants: [ Participant ],
    state: State,
    meta: Meta
});

export default model("Game", Game);
