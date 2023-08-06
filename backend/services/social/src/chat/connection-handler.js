import Lobby from "./service/lobby.js";
import Lock from "async-lock";
const lock = new Lock();

let lobbyConnections = {};
let privateConnections = [];

async function connectLobby(lobbyId, username, connection) {
    await Lobby.ensureParticipant(lobbyId, username);

    lobbyConnections[lobbyId] ??= [];
    lobbyConnections[lobbyId].push({ username, connection });
}

async function connectPrivate(username, connection) {
    lock.acquire("private-connections", (done) => {
        privateConnections.push({
            username,
            connection
        });
        done();
    });
}

async function disconnectPrivate(username, connection) {
    lock.acquire("private-connections", (done) => {
        privateConnections = privateConnections.filter(c => c.connection === connection);
        done();
    });
}

function handlePrivateMessageSent(message) {
    lock.acquire("private-connections", (done) => {
        privateConnections.filter(c => c.username === message.to).forEach(c => 
            c.connection.send(JSON.stringify({
                event: "newMessage",
                data: { message }
            })));
        done();
    });
}

function handlePrivateMessageRead(message) {
    lock.acquire("private-connections", (done) => {
        privateConnections.filter(c => c.username === message.from).forEach(c => 
        c.connection.send(JSON.stringify({
            event: "messageRead",
            data: { message }
        })));
        done();
    });
}

//todo: rewrite the part below to use a replicaset and mongo change stream
//or make an endpoint for lobby service to notify social about ws closures
setTimeout(async () => {
    let lobbies = await Lobby.retrieveAll();
    lobbies.forEach(lobby => {
        if (lobbyConnections[lobby.id]) {
            let connections = lobbyConnections[lobby.id].filter(c => 
                !lobby.players.map(p => p.name).includes(c.username));
            console.log("for deletion: ", connections.map(c => c.username));
            connections.forEach(c => {
                c.connection.close(1000, "Disconnected from lobby");
                lobbyConnections[lobby.id] = lobbyConnections[lobby.id]
                    .filter(lc => lc.connection === c.connection)
            });
        }
    });
}, 1000);

export default { 
    connectLobby, 
    connectPrivate, 
    disconnectPrivate, 
    handlePrivateMessageRead, 
    handlePrivateMessageSent
};
