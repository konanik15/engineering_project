import express from 'express';
const server = express();
import expressWS from 'express-ws';
expressWS(server);

import keycloak from "kc-adapter";
import mongo from "./common/mongo.js";
import app from "./app.js";

async function setup() {
    await Promise.all([
        keycloak.init(),
        mongo.connect()
    ]);

    //server.use(bodyParser.urlencoded({ extended: false }));
    //server.use(bodyParser.json());

    server.use(app);

    const port = 8080;
    server.listen(port, () => {
        console.log('Server listening on port ' + port);
    });

    server.use('/health', async (req, res) => {
        res.status(200).send();
    });

    server.use((err, req, res, next) => {
        //bodyparser error
        if (err instanceof SyntaxError && err.status === 400 && 'body' in err)
            return res.status(400).send(err.message);

        console.error(err);
        if (!req.ws)
            return res.status(500).send("Oops, something went wrong");
    });
}

setup();
