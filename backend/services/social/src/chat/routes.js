import express from 'express';
import expressWS from 'express-ws';
expressWS(express);
const router = express.Router();
import keycloak from "kc-adapter";
import bodyParser from 'body-parser';

import handler from "./connection-handler.js";
import chatLobby from './service/message-lobby.js';
import chatPrivate from './service/message-private.js';
import { 
    InvalidParameters,
    LobbyDoesNotExistError, 
    LobbyNotAParticipantError,
    MessageDoesNotExistError,
    MessageNotReceiverError,
    UserDoesNotExistError
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

    connection.on("close", () => {
        handler.disconnectPrivate(connection);
    })
});

router.get("/private", keycloak.protectHTTP(), async (req, res, next) => {
    try {
        return res.status(200).send(await chatPrivate.getSummary(req.username));
    } catch (e) {
        return next(e);
    }
});

router.get("/private/:collocutor", keycloak.protectHTTP(), async (req, res, next) => {
    try {
        if (!(await keycloak.userExists(req.params.collocutor, req.token)))
            throw new UserDoesNotExistError(`User ${req.params.collocutor} does not exist`);
        return res.status(200).send(
            await chatPrivate.getConversation(req.username, req.params.collocutor, 
                req.query.page || 1, req.query.perPage || 50));
    } catch (e) {
        if (e instanceof UserDoesNotExistError ||
            e instanceof InvalidParameters)
            return res.status(400).send(e.message);
        return next(e);
    }
});

router.post("/private/:collocutor", keycloak.protectHTTP(), bodyParser.text(), async (req, res, next) => {
    try {
        if (!(await keycloak.userExists(req.params.collocutor, req.token)))
            throw new UserDoesNotExistError(`User ${req.params.collocutor} does not exist`);
        let result = await chatPrivate.send(req.username, req.params.collocutor, req.body);
        result.read.forEach(m => handler.handlePrivateMessageRead(m));
        handler.handlePrivateMessageSent(result.message);
        return res.status(201).send();
    } catch (e) {
        if (e instanceof UserDoesNotExistError)
            return res.status(400).send(e.message);
        return next(e);
    }
});

router.patch("/private/message/read/:id", keycloak.protectHTTP(), async (req, res, next) => {
    try {
        let message = await chatPrivate.findById(req.params.id);
        if (message.to !== req.username)
            throw new MessageNotReceiverError("You are not the receiver of this message");
        await chatPrivate.read(message);
        handler.handlePrivateMessageRead(message);
        return res.status(200).send();
    } catch (e) {
        if (e instanceof MessageDoesNotExistError)
            return res.status(400).send(e.message);
        else if (e instanceof MessageNotReceiverError)
            return res.status(403).send(e.message);
        return next(e);
    }
});

//-----Lobby---------

router.ws("/lobby/:id", keycloak.protectWS(), async (connection, req, next) => { 
    try {
        await handler.connectLobby(req.params.id, req.username, connection);
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
        return res.status(200).send(
            await chatLobby.get(req.params.id, req.username, req.query.page || 1, req.query.perPage || 50));
    } catch (e) {
        if (e instanceof LobbyDoesNotExistError ||
            e instanceof InvalidParameters)
            return res.status(400).send(e.message);
        else if (e instanceof LobbyNotAParticipantError)
            return res.status(403).send(e.message);  
        return next(e);
    }
});

router.post("/lobby/:id", keycloak.protectHTTP(), bodyParser.text(), async (req, res, next) => {
    try {
        let message = await chatLobby.send(req.params.id, req.decoded_token.preferred_username, req.body);
        await handler.handleLobbyMessageSent(message);
        return res.status(201).send();
    } catch (e) {
        if (e instanceof LobbyDoesNotExistError ||
            e instanceof LobbyNotAParticipantError) 
            return res.status(400).send(e.message);
        return next(e);
    }
});

export default router;
