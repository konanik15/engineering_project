# Overview
This is a poor man's keycloak adapter with very rudimental functionality. It is meant to be used on backend to verify jwt tokens provided by keycloak and protect backend endpoints. It provides straightforward middleware for express and express-ws.

# Usage
Import it to your app:
```js
const keycloak = require("kc-adapter");
```
Initialize:
```js
await keycloak.init();
```
Use the middleware to protect your endpoints:
```js
const express = require('express');
require('express-ws')(express);
const router = express.Router();

router.ws("/ws/echo", keycloak.protectWS(), (connection, req) => {
    connection.on("message", async message => {
        connection.send("you said: " + message);
    });
});

router.get("/rest/echo", keycloak.protectHTTP(), (req, res, next) => {
    return res.status(200).send("you said: " + req.query.message);
});
```

If a client requesting those endpoints does not send a valid access token, the server responds with 401 (in case of http) or immediately closes the connection with 1008 (in case of ws).
