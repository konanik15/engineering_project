import express from 'express';
import bodyParser from 'body-parser';
const server = express();

import app from "./app.js";

server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

server.use(app);

const port = 80;
server.listen(port, () => {
    console.log('Server listening on port ' + port);
});

server.use('/health', async (req, res) => {
    res.status(200).send();
});
