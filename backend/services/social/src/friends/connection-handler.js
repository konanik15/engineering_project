import Lock from "async-lock";
const lock = new Lock();

let connections = {};

function isOnline(username) {
    return !!connections[username];
}

async function connect(username, connection) {
    let reconnected = false;
    await lock.acquire(`connections:${username}`, (done) => {
        if (connections[username]) {
            connections[username].close(1001, "Established another connection");
            reconnected = true;
        }
        connections[username] = connection;
        done();
    });
    return reconnected;
}

async function disconnect(username) {
    lock.acquire(`connections:${username}`, (done) => {
        delete connections[username];
        done();
    });
}

function handleFriendRequestSent(request) {
    lock.acquire(`connections:${request.to}`, (done) => {
        let connection = connections[request.to];
        if (connection)
            connection.send(JSON.stringify({
                event: "friendRequestReceived",
                data: { request }
            }));
        done();
    });
}

function handleFriendRequestResponded(request, response) {
    lock.acquire(`connections:${request.from}`, (done) => {
        let connection = connections[request.from];
        if (connection)
            connection.send(JSON.stringify({
                event: "friendRequestResponded",
                data: { request, response }
            }));
        done();
    });
}

function handleUnfriended(initiator, target) {
    lock.acquire(`connections:${target}`, (done) => {
        let connection = connections[target];
        if (connection)
            connection.send(JSON.stringify({
                event: "unfriended",
                data: { username: initiator }
            }));
        done();
    });
}

function handleConnected(username, friends) {
    friends.map(friend => {
        lock.acquire(`connections:${friend}`, (done) => {
            let connection = connections[friend];
            if (connection)
                connection.send(JSON.stringify({
                    event: "friendCameOnline",
                    data: { username }
                }));
            done();
        });
    });
}

function handleDisconnected(username, friends) {
    friends.map(friend => {
        lock.acquire(`connections:${friend}`, (done) => {
            let connection = connections[friend];
            if (connection)
                connection.send(JSON.stringify({
                    event: "friendCameOffline",
                    data: { username }
                }));
            done();
        });
    });
}

function handleInvite(invite) {
    lock.acquire(`connections:${invite.to}`, (done) => {
        let connection = connections[invite.to];
        if (connection)
            connection.send(JSON.stringify({
                event: "invite",
                data: { invite }
            }));
        done();
    });
}

export default { 
    connect,
    disconnect,
    handleFriendRequestSent,
    handleFriendRequestResponded,
    handleUnfriended,
    isOnline,
    handleConnected,
    handleDisconnected,
    handleInvite
};
