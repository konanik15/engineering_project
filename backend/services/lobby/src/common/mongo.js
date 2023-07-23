const mongoose = require('mongoose');

const MONGO_USERNAME = process.env.MONGO_USERNAME;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_HOST = process.env.MONGO_HOST;
const MONGO_PORT = process.env.MONGO_PORT || '27017';
const MONGO_DB = process.env.MONGO_DB;

async function connect() {
    if (!MONGO_HOST || !MONGO_PORT || !MONGO_USERNAME || !MONGO_PASSWORD || !MONGO_DB)
        throw new Error("Mongo environment variables are missing")

    const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;
    let connected = false;
    while (!connected) {
        try {
            console.log("Connecting to the database...");
            await mongoose.connect(url, { useNewUrlParser: true });
            console.log("Connected to the database");
            connected = true;
        } catch (e) {
            console.error("Could not connect to the database", e.message || e);
            console.log("Retrying db connection in 5 seconds...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

module.exports = { connect };