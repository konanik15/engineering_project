import express from 'express';
const router = express.Router();

import _ from "lodash";

import Game from "./uno.js";

const description = "A fun, simple and easy to understand game, where the primary objective is to get rid of your cards";
const maxPlayers = 10;
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
        if (result && result.valid) {
            let data = { status: game.status, meta: game.meta };
            if (game.modifiedState)
                data.state = game.modifiedState;
            return res.status(200).send(data);
        }
        else
            return res.status(400).send(result.message || "Invalid action");
    } catch (e) {
        console.error(e);
        return res.status(500).send();
    }
});

export default router;
