import express from 'express';
import expressWS from 'express-ws';
expressWS(express);
const router = express.Router();
import keycloak from "kc-adapter";
import bodyParser from 'body-parser';
import minio from "../common/minio.js";
import Multer from "multer";

import User from "./service/user.js";
import friendsConnectionHandler from "../friends/connection-handler.js";
import { UserInvalidData } from '../common/errors.js';

const bucketName = "avatars";

const multerConfig = {
    fileFilter: (req, file, cb) => {
        const types = file.mimetype.split('/');
        if (types[0] !== 'image') {
            return cb(new Multer.MulterError('Only image formats are allowed'), false);
        }
        return cb(null, true);
    },
    limits: {
        fileSize: 1024 * 1024 * 1, //1 mb - maybe change later
    },
    storage: Multer.memoryStorage(),
};
const multer = Multer(multerConfig);

router.post("/avatar", keycloak.protectHTTP(), async (req, res, next) => {
    multer.single("file")(req, res, async (e) => {
        try {
            if (e) throw e;
            if (!req.file)
                throw new Multer.MulterError("File is required");

            if (!(await minio.bucketExists(bucketName)))
                await minio.makeBucket(bucketName);
            await minio.putObject(bucketName, req.username, req.file.buffer);
            return res.status(201).send();
        } catch (e) {
            if (e instanceof Multer.MulterError)
                return res.status(400).send(e.message || e.code);
            return next(e);
        }
    });
});

router.get("/avatar", keycloak.protectHTTP(), async (req, res, next) => {
    return downloadAvatar(res, next, req.username);
});

router.get("/:username/avatar", keycloak.protectHTTP(), async (req, res, next) => {
    return downloadAvatar(res, next, req.params.username);
});

function downloadAvatar(res, next, username) {
    minio.getObject(bucketName, username, (e, stream) => {
        try {
            if (e) throw e;

            return stream.pipe(res);
        } catch (e) {
            if (e.code === "NoSuchKey")
                return res.status(404).send();
            return next(e);
        }
    });
}

router.get("/", keycloak.protectHTTP(), async (req, res, next) => {
    return getProfile(req, res, next, req.username);
});

router.get("/:username", keycloak.protectHTTP(), async (req, res, next) => {
    try {
        if (!(await keycloak.userExists(req.params.username, req.token)))
            return res.status(404).send();
    } catch (e) {
        next(e);
    }
    return getProfile(req, res, next, req.params.username);
});

async function getProfile(req, res, next, username) {
    try {
        let user = (await User.retrieve(username)).toJSON();
        if (username === req.username || user.friendsWith.includes(req.username))
            user.online = friendsConnectionHandler.isOnline(username);
        else
            delete user.friendsWith;

        user.avatar = null;
        try { 
            await minio.statObject(bucketName, username);
            user.avatar = `/profile/${username}/avatar`;
        } catch (e) {};

        return res.status(200).send(user);
    } catch (e) {
        next(e);
    }
}

router.patch("/", keycloak.protectHTTP(), bodyParser.json(), async (req, res, next) => {
    try {
        await User.update(req.username, req.body);
        return res.status(200).send();
    } catch (e) {
        if (e instanceof UserInvalidData)
            return res.status(400).send(e.message)
        return next(e);
    }
});

export default router;
