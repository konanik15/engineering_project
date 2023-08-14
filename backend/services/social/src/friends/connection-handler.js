import Lobby from "../common/lobby.js";
import Lock from "async-lock";
const lock = new Lock();

let connections = [];

function isOnline(username) {
    return !!connections.find(c => c.username === username);
}

async function connect(username, connection) {
    lock.acquire("connections", (done) => {
        connections.push({
            username,
            connection
        });
        done();
    });
}

async function disconnect(connection) {
    lock.acquire("connections", (done) => {
        connections = connections.filter(c => c.connection === connection);
        done();
    });
}

function handleFriendRequestSent(request) {
    lock.acquire("connections", (done) => {
        connections.filter(c => c.username === request.to).forEach(c => 
            c.connection.send(JSON.stringify({
                event: "newFriendRequest",
                data: { request }
            })));
        done();
    });
}

function handleFriendRequestResponded(request, response) {
    lock.acquire("connections", (done) => {
        connections.filter(c => c.username === request.from).forEach(c => 
            c.connection.send(JSON.stringify({
                event: "friendRequestResponse",
                data: { request, response }
            })));
        done();
    });
}

function handleUnfriended(initiator, target) {
    lock.acquire("connections", (done) => {
        connections.filter(c => c.username === target).forEach(c => 
            c.connection.send(JSON.stringify({
                event: "unfriend",
                data: { by: initiator }
            })));
        done();
    });
}

export default { 
    connect,
    disconnect,
    handleFriendRequestSent,
    handleFriendRequestResponded,
    handleUnfriended,
    isOnline
};
