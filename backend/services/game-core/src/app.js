import express from 'express';
import expressWS from 'express-ws';
expressWS(express);
import bodyParser from 'body-parser';
const router = express.Router();
import keycloak from "kc-adapter";

import handler from "./game/handler.js";
import service from "./game/service.js";
import { 
    GameDoesNotExistError, 
    GameTypeUnsupportedError,
    GameNotAParticipantError,
    ActionInvalidError,
    ActionIllegalError,
    GameNotInProgressError,
    GameDataInvalidError
} from "./common/errors.js";

import _ from "lodash";

let gamesInfo;

async function init() {
    gamesInfo = await handler.getGamesInfo();
}

//error handling really sucks in express-ws, you don't have the tools to make a proper
//error-handling middleware for ws routes that would receive a connection as an input parameter.
//therefore apparently you have to do it "manually" if you want to close it
const closeOnError = (connection) => { connection.close(1011, "Oops, something went wrong"); };

router.post("/:gameType", bodyParser.json(), async (req, res, next) => {
    try {
        let game = await service.create(req.params.gameType, req.body.participants, req.body.lobbyId);
        return res.status(201).send(game);
    } catch (e) {
        if (e instanceof GameTypeUnsupportedError)
            return res.status(404).send(e.message);
        else if (e instanceof GameDataInvalidError)
            return res.status(400).send(e.message);
        return next(e);
    }
});

router.ws("/:gameId", keycloak.protectWS(), async (connection, req, next) => {
    let user = { username: req.decoded_token.preferred_username };
    try {
        await handler.connect(req.params.gameId, user, connection);
    } catch (e) {
        if (e instanceof GameNotAParticipantError ||
            e instanceof GameDoesNotExistError)
            return connection.close(1008, e.message);
        next(e);
        return closeOnError(connection);
    }

    connection.on("close", () => {
        handler.disconnect(req.params.gameId, connection);
    })
});

router.patch("/:gameId", keycloak.protectHTTP(), bodyParser.json(), async (req, res, next) => {
    let user = { username: req.decoded_token.preferred_username };
    try {
        await handler.performActions(req.params.gameId, 
            Array.isArray(req.body) ? req.body : [ req.body ], 
            user);
        return res.status(200).send();
    } catch (e) {
        if (e instanceof GameDoesNotExistError)
            return res.status(404).send(e.message);
        else if (e instanceof ActionInvalidError ||
            e instanceof ActionIllegalError ||
            e instanceof GameNotInProgressError)
            return res.status(400).send(e.message);
        else if (e instanceof GameNotAParticipantError)
            return res.status(403).send(e.message);
        return next(e);
    }
});

router.get("/", bodyParser.json(), async (req, res, next) => {
    return res.status(200).send(gamesInfo.map(g => _.pick(g, ["type", "description"])));
});

router.get("/:gameType", bodyParser.json(), async (req, res, next) => {
    let game = _.find(gamesInfo, { type: req.params.gameType });
    if (!game)
        return res.status(404).send(`No game found with type ${req.params.gameType}`);
    return res.status(200).send(game);
});

export default { init, router };
