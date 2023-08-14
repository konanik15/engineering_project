import express from 'express';
import expressWS from 'express-ws';
expressWS(express);
const router = express.Router();
import keycloak from "kc-adapter";
import bodyParser from 'body-parser';

import User from "../profile/service/user.js";
import Request from "./service/request.js";
import { AlreadyFriendsError, FriendRequestAlreadyReceived, FriendRequestAlreadySent, FriendRequestNotFound, NotFriendsError, UserDoesNotExistError } from '../common/errors.js';
import handler from "./connection-handler.js";

//error handling really sucks in express-ws, you don't have the tools to make a proper
//error-handling middleware for ws routes that would receive a connection as an input parameter.
//therefore apparently you have to do it "manually" if you want to close it
const closeOnError = (connection) => { connection.close(1011, "Oops, something went wrong"); };

router.ws("/", keycloak.protectWS(), async (connection, req, next) => {
    try {
        let reconnected = await handler.connect(req.username, connection);
        if (!reconnected) {
            let user = await User.retrieve(req.username);
            handler.handleConnected(user.username, user.friends);
        }
    } catch (e) {
        closeOnError(connection);
        return next(e);
    }

    connection.on("close", async (code, reason) => {
        if (code === 1001 &&
            reason === "Established another connection")
            return;

        handler.disconnect(req.username);
        let user = await User.retrieve(req.username);
        handler.handleDisconnected(user.username, user.friends);
    });
});

router.get("/", keycloak.protectHTTP(), async (req, res, next) => {
    try {
        return res.status(200).send(await User.getFriends(req.username));
    } catch (e) {
        return next(e);
    }
});

router.delete("/:username", keycloak.protectHTTP(), async (req, res, next) => {
    try {
        if (!(await keycloak.userExists(req.params.username, req.token)))
            throw new UserDoesNotExistError(`User ${req.params.username} does not exist`);
        await User.unmakeFriends(req.username, req.params.username);
        handler.handleUnfriended(req.username, req.params.username);
        return res.status(204).send();
    } catch (e) {
        let code;
        if (e instanceof UserDoesNotExistError)
            code = 404;
        else if (e instanceof NotFriendsError)
            code = 409;
        
        return code ? res.status(code).send(e.message) : next(e);
    }
});

router.get("/requests/received", keycloak.protectHTTP(), async (req, res, next) => {
    try {
        return res.status(200).send(await Request.getReceived(req.username));
    } catch (e) {
        return next(e);
    }
});

router.get("/requests/sent", keycloak.protectHTTP(), async (req, res, next) => {
    try {
        return res.status(200).send(await Request.getSent(req.username));
    } catch (e) {
        return next(e);
    }
});

router.post("/requests/:username", keycloak.protectHTTP(), async (req, res, next) => {
    try {
        if (!(await keycloak.userExists(req.params.username, req.token)))
            throw new UserDoesNotExistError(`User ${req.params.username} does not exist`);
        let request = await Request.send(req.username, req.params.username);
        handler.handleFriendRequestSent(request);
        return res.status(201).send(request);
    } catch (e) {
        let code;
        if (e instanceof UserDoesNotExistError)
            code = 404;
        else if (e instanceof AlreadyFriendsError ||
            e instanceof FriendRequestAlreadySent ||
            e instanceof FriendRequestAlreadyReceived)
            code = 409;
        
        return code ? res.status(code).send(e.message) : next(e);
    }
});

router.delete("/requests/:username", keycloak.protectHTTP(), async (req, res, next) => {
    try {
        await Request.cancel(req.username, req.params.username);
        return res.status(204).send();
    } catch (e) {
        let code;
        if (e instanceof FriendRequestNotFound)
            code = 404;
        
        return code ? res.status(code).send(e.message) : next(e);
    }
});

router.patch("/requests/:username/accept", keycloak.protectHTTP(), async (req, res, next) => {
    respondToFriendRequest(req, res, next, "accept");
});

router.patch("/requests/:username/reject", keycloak.protectHTTP(), async (req, res, next) => {
    respondToFriendRequest(req, res, next, "reject");
});

async function respondToFriendRequest(req, res, next, response) {
    try {
        let request = await Request.respond(req.params.username, req.username, response);
        handler.handleFriendRequestResponded(request, response === "accept" ? "accepted" : "rejected");
        return res.status(200).send();
    } catch (e) {
        let code;
        if (e instanceof FriendRequestNotFound)
            code = 404;
        
        return code ? res.status(code).send(e.message) : next(e);
    }
}

export default router;
