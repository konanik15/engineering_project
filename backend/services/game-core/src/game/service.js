import _ from 'lodash';
import fs from "fs";
import mongoose from "mongoose";

import Game from './model.js';
import { 
    GameDoesNotExistError, 
    GameTypeUnsupportedError,
    GameDataInvalidError
} from "../common/errors.js";

const gamesConfig = JSON.parse(fs.readFileSync("./config/games.json"));

async function create(type, participants, lobbyId) {
    let game = gamesConfig.find(item => item.type === type);
    if (!game)
        throw new GameTypeUnsupportedError(`Unsupported game type ${type}`);

    if (!Array.isArray(participants) || _.isEmpty(participants))
        throw new GameDataInvalidError(`Participants must not be empty. Received: ${JSON.stringify(participants)}`);

    try {
        game = new Game({ type, participants, lobbyId });
        await game.save();
    } catch (e) {
        throw new GameDataInvalidError(e.message, { cause: e });
    }

    return game;
}

async function findById(id) {
    let game = await Game.findById(id);
    //console.log("service | findById | ", game);
    if (!game)
        throw new GameDoesNotExistError(`Game with id ${id} does not exist`);
    return game;
}

async function update(id, data) {
    let game = await findById(id);
    await apply(game, data);
    await game.save();
    return game;
}

async function apply(game, data) {
    let newGame = _.pick(data, ["status", "participants", "state", "meta"]);

    if (_.has(newGame, "participants")) {
        if (!_.isEmpty(_.xorBy(game.participants, newGame.participants, "username")))
            throw new GameDataInvalidError("Participant contents may not be changed. " +
                + `Old: ${JSON.stringify(game)}. New: ${JSON.stringify(newGame)}.`);
    }

    for (let property in newGame)
        game[property] = newGame[property];

    try {
        await Game.validate(game);
    } catch (e) {
        if (e instanceof mongoose.Error.ValidationError)
            throw new GameDataInvalidError(e.message);
        throw e;
    }
}

export default { create, findById, update, apply };
