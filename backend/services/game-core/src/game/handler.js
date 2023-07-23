import fs from "fs";
import _ from "lodash";
import axios from "axios";

import service from "./service.js";
import helper from './helper.js';
import {
    ActionIllegalError,
    ActionInvalidError,
    GameDoesNotExistError,
    GameNotAParticipantError,
    GameNotInProgressError
} from "../common/errors.js";

const gamesConfig = JSON.parse(fs.readFileSync("./config/games.json"));

let connections = {};

async function connect(gameId, user, connection) {
    let game = await service.findById(gameId);
    if (!game)
        throw new GameDoesNotExistError(`Game with id ${gameId} does not exist`);
    if (game.participants.every(p => p.username !== user.username))
        throw new GameNotAParticipantError(`You are not a participant of this game`);

    connections[game.type] ??= {};
    connections[game.type][gameId] ??= [];
    connections[game.type][gameId].push({
        username: user.username,
        connection
    });

    //if all participants are connected and the game hasn't started - initialize it
    if (game.participants.every(p => 
        !!connections[game.type][gameId].find(c =>
            c.username === p.username)) && 
        game.status === "pending") {
            game = await initialize(game);
            game = await service.update(game._id, { status: "inProgress" });
            connections[game.type][gameId].forEach(item => {
                item.connection.send(JSON.stringify({
                    event: "gameStarted",
                    data: { game: conceal(game, item.username) }
                }));
            });
    } else if (game.status === "inProgress") { //otherwise just send it to connected client
        connection.send(JSON.stringify({
            event: "lateJoined",
            data: { game: conceal(game, user.username) }
        }));
    }
}

async function disconnect(gameId, connection) {
    let game = await service.findById(gameId);
    connections[game.type][gameId] = connections[game.type][gameId]
        .filter(item => item.connection !== connection);
}

async function initialize(game) {
    let host = gamesConfig.find(g => g.type === game.type).host;
    let initializedGame = (await axios.post(`http://${host}/init`, _.pick(game, ["participants"]))).data; 
    //TODO: make a manager for calling game services, handle errors etc.
    return await service.update(game._id, initializedGame);
}

async function performActions(gameId, actions, user) {
    if (!Array.isArray(actions))
        throw new ActionInvalidError(`Actions are not an array`);
    let game = await service.findById(gameId);
    if (!game)
        throw new GameDoesNotExistError(`Game with id ${gameId} does not exist`);
    if (game.participants.every(p => p.username !== user.username))
        throw new GameNotAParticipantError(`You are not a participant of this game`);
    if (game.status !== "inProgress")
        throw new GameNotInProgressError(`This game either hasn't started yet or is already finished`);
    
    for (let action of actions) {
        let newGame = JSON.parse(JSON.stringify(game)); //making a deep copy of object
        helper.perform(newGame.state, action, user); //helper mutates state

        let response;
        try {
            let host = gamesConfig.find(g => g.type === game.type).host;
            response = await axios.post(`http://${host}/validate`, {
                game,
                action,
                initiator: user,
                newGameState: newGame.state
            });
        } catch (e) {
            //console.log(e);
            if (e.response && e.response.status === 400)
                throw new ActionIllegalError(e.response.data);
            else if (e.response && e.response.status === 500)
                throw new Error("Game service invalid response")
            else 
                throw e;
        }
        /*let data = response.data;
        data.state ??= newGame.state;*/
        let data = {
            state: newGame.state
        };
        if (response.data.meta) data.meta = response.data.meta;
        if (response.data.state) data.state = response.data.state;
        if (response.data.status) data.status = response.data.status;

        await service.apply(game, data); 
    } 

    game = await service.update(gameId, game);
    connections[game.type] ??= {};
    connections[game.type][gameId] ??= [];
    connections[game.type][gameId].forEach(item => {
        item.connection.send(JSON.stringify({
            event: "gameUpdated",
            data: { 
                game: conceal(game, item.username),
                reason: {
                    type: "userMove",
                    user,
                    actions
                }
            }
        }));
    });

    if (game.status === "ended") {
        connections[game.type][gameId].forEach(item => {
            item.connection.send(JSON.stringify({
                event: "gameEnded",
                data: {}
            }));
            item.connection.close(1000, "Game ended");
        });
    }
}

function conceal(game, username) {
    //despite the description, .pick() doesn't seem to create an entirely new object, 
    //nested objects are still references to those of the original
    //that's what parse/stringify is for - creating a deep copy
    let concealed = _.pick(JSON.parse(JSON.stringify(game)), ["type", "status", "participants", "state", "meta"]);
    concealed.state.hands = concealed.state.hands.map(hand => {
        if (hand.owner !== username && !hand.open) {
            hand.cards = _.fill(hand.cards, {});
            return hand;
        }
        return hand;
    });
    concealed.state.stacks = concealed.state.stacks.map(stack => {
        if (stack.facing === "up") {
            stack.cards = _.fill(stack.cards, {}, 1); //leave the upper card known
            return stack;
        }
        else {
            stack.cards = _.fill(stack.cards, {});
            return stack;
        }
    });
    return concealed;
}

export default { connect, disconnect, performActions };
