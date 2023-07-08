const express = require('express');
require('express-ws')(express);
const router = express.Router();
const keycloak = require("./keycloak");

router.ws("/ws/echo", keycloak.protectWS(), (connection, req) => {
    connection.on("message", async message => {
        connection.send("you said: " + message);
    });
});

router.get("/rest/echo", keycloak.protectHTTP(), (req, res, next) => {
    console.log(req.query.body)
    return res.status(200).send("you said: " + req.query.body);
});

module.exports = router;
