import express from 'express';
import expressWS from 'express-ws';
expressWS(express);
const router = express.Router();
import keycloak from "kc-adapter";
import bodyParser from 'body-parser';

import handler from "./connection-handler.js";
import messageLobby from './service/message-lobby.js';
import { 
    LobbyDoesNotExistError, 
    LobbyNotAParticipantError 
} from '../common/errors.js';

//error handling really sucks in express-ws, you don't have the tools to make a proper
//error-handling middleware for ws routes that would receive a connection as an input parameter.
//therefore apparently you have to do it "manually" if you want to close it
const closeOnError = (connection) => { connection.close(1011, "Oops, something went wrong"); };

//-----Private--------

router.ws("/private", keycloak.protectWS(), async (connection, req, next) => { 
    try {
        await handler.connectPrivate(req.decoded_token.preferred_username, connection);
    } catch (e) {
        closeOnError(connection);
        return next(e);
    }
});

router.get("/private", keycloak.protectHTTP(), async (req, res, next) => {

});

router.get("/private/:collocutor", keycloak.protectHTTP(), async (req, res, next) => {

});

router.post("/private/:collocutor", keycloak.protectHTTP(), bodyParser.text(), async (req, res, next) => {

});

router.patch("/private/message/:id", keycloak.protectHTTP(), async (req, res, next) => {

});

//-----Lobby---------

router.ws("/lobby/:id", keycloak.protectWS(), async (connection, req, next) => { 
    try {
        await handler.connectLobby(req.params.id, req.decoded_token.preferred_username, connection);
    } catch (e) {
        if (e instanceof LobbyDoesNotExistError ||
            e instanceof LobbyNotAParticipantError) 
            return connection.close(1008, e.message);
        closeOnError(connection);
        return next(e);
    }
});

router.get("/lobby/:id", keycloak.protectHTTP(), async (req, res, next) => {
    try {
        return res.status(200).send(await messageLobby.get(req.params.id));
    } catch (e) {
        if (e instanceof LobbyDoesNotExistError)
            return res.status(400).send(e.message);
        return next(e);
    }
});

router.post("/lobby/:id", keycloak.protectHTTP(), bodyParser.text(), async (req, res, next) => {
    try {
        await messageLobby.send(req.params.id, req.decoded_token.preferred_username, req.body);
        return res.status(201).send();
    } catch (e) {
        if (e instanceof LobbyDoesNotExistError ||
            e instanceof LobbyNotAParticipantError) 
            return res.status(400).send(e.message);
        return next(e);
    }
});

export default router;
