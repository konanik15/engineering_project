const express = require('express');
require('express-ws')(express);
const router = express.Router();
const keycloak = require("kc-adapter");

router.ws("/ws/echo", keycloak.protectWS(), (connection, req) => {
    connection.on("message", async message => {
        connection.send("you said: " + message);
    });
});

router.get("/rest/echo", keycloak.protectHTTP(), (req, res, next) => {
    return res.status(200).send("you said: " + req.body);
});

module.exports = router;
