import express from 'express';

import Game from "./durak.js";

const router = express.Router();

const description = "A classic card game of Russian origins that is popular in many post-Soviet states.";
const maxPlayers = 4;
const minPlayers = 2;

router.get("/info", async (req, res, next) => {
    return res.status(200).send({ description, pack: Game.getPack(), minPlayers, maxPlayers });
});

router.post("/init", async (req, res, next) => {
    let game = new Game(req.body);
    game.setup();
    return res.status(200).send(game);
});

router.post("/validate", async (req, res, next) => {
    try {
        let gameData = req.body.game;
        gameData.newState = req.body.newGameState;
        let game = new Game(gameData);

        let result = game.validateAction(req.body.action, req.body.initiator);
        if (result && result.valid)
            return res.status(200).send({ status: game.status, meta: game.meta });
        else
            return res.status(400).send(result.message || "Invalid action");
    } catch (e) {
        console.error(e);
        return res.status(500).send();
    }
});

export default router;
