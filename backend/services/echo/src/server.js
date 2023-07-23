const express = require('express');
const bodyParser = require('body-parser');
const app = express();
require('express-ws')(app);

const keycloak = require("kc-adapter");

async function setup() {
    await keycloak.init();

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.text());

    app.use(require('./app'));

    app.use(require('./error-handler'));

    const port = 8080;
    app.listen(port, () => {
        console.log('Server listening on port ' + port);
    });

    app.use('/health', async (req, res) => {
        res.status(200).send();
    });
}

setup();
