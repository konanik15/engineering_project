# Overview

Service created for all funcionalities related to the lobby. Getting lobbies, creating lobbies, deleting lobbies, managing client connections.

## REST Endpoints

### GET ("/lobbies"):

This one provides the list of all lobbies 

```json
[
    {
        "_id": "64c80ce5c8b4b0493cc3f495",
        "id": "98c34c87-fd98-4852-ac83-92a373899369",
        "name": "55511",
        "players": [],
        "chatHistory": [],
        "inProgress": false,
        "isFull": false,
        "game": "durak",
        "minPlayers": 2,
        "maxPlayers": 5,
        "hasLeader": false,
        "passwordProtected": true,
        "password": "$2b$10$E0cPaAMj8dNhiB66aYaX8.v77hZIjHYaFkPFbw87m9CYmiiO50LYC",
        "__v": 0
    },
    {
        "_id": "64c80e6ec8b4b0493cc3f499",
        "id": "7e5f86c6-cbea-4177-933e-bc112e0fab78",
        "name": "555111",
        "players": [
            {
                "wsId": "434f18f8-fac1-45e8-bfee-7ca456440d6f",
                "name": "test2",
                "ready": false,
                "leader": true,
                "joinTime": "2023-07-31T19:42:02.610Z",
                "_id": "64c80e8ac8b4b0493cc3f49d"
            }
        ],
        "chatHistory": [],
        "inProgress": false,
        "isFull": false,
        "game": "durak",
        "minPlayers": 2,
        "maxPlayers": 5,
        "hasLeader": true,
        "passwordProtected": true,
        "password": "$2b$10$FYheQLMMM350h3W/mXJJaOBk389JQkEKD9eS1/oHpTnPXPvPa/XmO",
        "__v": 1
    }
]
```
### POST ("/lobbies"):

This one creates a lobby. Need to provide the name of the lobby and game. You can also provide a password and that will make the lobby password protected.

```json
{
    "message": "Lobby created successfully",
    "lobbyId": "f1fb7098-e13b-4512-92a7-80f607643a0e"
}
```
### GET ("/lobby/:id"):

This one gets the lobby info. You have to provide 

```json
{
    "_id": "64c81183961e641d02407b81",
    "id": "f1fb7098-e13b-4512-92a7-80f607643a0e",
    "name": "5551111",
    "players": [],
    "chatHistory": [],
    "inProgress": false,
    "isFull": false,
    "game": "durak",
    "minPlayers": 2,
    "maxPlayers": 5,
    "hasLeader": false,
    "passwordProtected": true,
    "password": "$2b$10$yQPCJNufrkKieB0fKKf8R.RqrZhZmzXCl7L7XHW/iAaN9yeA3iCnS",
    "__v": 0
}
```
### DELETE ("/lobby/:id"):

This one deletes a lobby. 


## WEBSOCKET Endpoints 

### mainmenu ("/lobbies")

This websocket connects the client to the mainmenu where all the information about current lobbies is listed. The client gets information about other players joining lobbies, leaving lobbies, lobbies being created, lobbies being deleted. 

There is also a message you can send to clients connected to this endpoint. This message can be used to verify a password for a lobby that the client wants to join.

```json
{
  "type": "validatePassword",
  "data": {
    "lobbyId": "3d8f627a-3a78-431d-b145-5720b51dadf8",
    "password": "123"
  }
}
```

### Connecting to lobby
- WS /lobby/:lobbyId
- WS /lobby/:inviteCode

This websocket connects the client to the lobby. There are 2 ways one can join a lobby: by its id or by an invite code.

When connecting to a password protected lobby by id, a client is required to provide a password to the lobby as a `password` header.<br>
If you have an invite code, you can join a lobby regardless if it's password protected or not (as long as it's not full yet).

Message to all clients in the lobby, that a new client joined
```json
{
    "type": "playerJoined",
    "data": {
        "username": "test2"
    }
}
```
Message to the client that joined about the actions success.
```json
{
    "type": "joinResult",
    "data": {
        "success": true
    }
}
```
There is also multiple messages for this endpoint that can be sent by the client. 

#### chatMessage

This message sends data with a chat message that the client wants to send. The server saves the message to the database and emits the new message to all of the clients in the lobby. Client that sent the message also gets an information from the server about it's success. 

Sent by client:
```json 
{
    "type": "chatMessage",
    "data": {
        "message": "kek123"
    }
    
}
```
Response too all clients in the lobby:
```json
{
    "type": "newMessage",
    "data": {
        "message": {
            "sender": "test2",
            "message": "kek123",
            "timestamp": 1690834504932
        }
    }
}
```
Response to the client that sent the message:
```json
{
    "type": "messageResult",
    "data": {
        "success": true
    }
}
```
#### ready

After this message is sent the server updates the .ready field in db to true and also emits a message back to the client about it's success. It also emits a message to all the clients in the lobby that one player is ready. 

Sent by client:
```json
{
    "type": "ready"
}
```
Response to all clients in the lobby:
```json
{
    "type": "playerReady",
    "data": {
        "username": "test2"
    }
}
```
Response to the client that sent the message:
```json
{
    "type": "readyResult",
    "data": {
        "success": true
    }
}
```
#### unready

This message is the same as ready but it sets the .ready db field to false. 

Sent by client:
```json
{
    "type": "unready"
}
```
Response to all clients in the lobby:
```json
{
    "type": "playerUnready",
    "data": {
        "username": "test2"
    }
}
```
Response to the client that sent the message:
```json
{
    "type": "unreadyResult",
    "data": {
        "success": true
    }
}
```

#### startGame

After this message is sent the server checks if all players are ready, minimum number of players condition is met, the lobby is not already in progress. If all those things are met the server uses POST REST Endpoint from game-core to start a game. It then emits back to the client, emits a message to all clients in the lobby that the game has started with the game id, emits a message to clients in mainmenu that this lobby is in progress. It also changes the .inProgress field in db to true. 

Sent by client:
```json
{
    "type": "startGame"
}
```
Response to all the clients in main menu:
```json
{
    "type": "lobbyInProgress",
    "data": {
        "lobbyId": "ddfd9290-43b5-4f26-a7cb-3f5f1d5ea825"
    }
}
```
Response to all the clients in the lobby:
```json
{
    "type": "gameStarted",
    "data": {
        "gameId": "64cc0a505597f7e0e67adfa1"
    }
}
```
Response to the client:
```json
{
    "type": "startGameResult",
    "data": {
        "success": true
    }
}
```

## Lobby db schema explained
```json
{
  "_id": {
    "$oid": "64c80e6ec8b4b0493cc3f499"
  },
  "name": "555111",
  "players": [
    {
      "wsId": "434f18f8-fac1-45e8-bfee-7ca456440d6f",
      "name": "test2",
      "ready": false,
      "leader": true,
      "joinTime": {
        "$date": {
          "$numberLong": "1690832522610"
        }
      },
      "_id": {
        "$oid": "64c80e8ac8b4b0493cc3f49d"
      }
    }
  ],
  "chatHistory": [
    {
      "sender": "test2",
      "message": "kek123",
      "timestamp": {
        "$date": {
          "$numberLong": "1690834504932"
        }
      },
      "_id": {
        "$oid": "64c81648961e641d02407b93"
      }
    },
    {
      "sender": "test2",
      "message": "kek123",
      "timestamp": {
        "$date": {
          "$numberLong": "1690835601639"
        }
      },
      "_id": {
        "$oid": "64c81a91961e641d02407bb0"
      }
    }
  ],
  "inProgress": false,
  "isFull": false,
  "game": "durak",
  "minPlayers": 2,
  "maxPlayers": 5,
  "hasLeader": true,
  "passwordProtected": true,
  "password": "$2b$10$FYheQLMMM350h3W/mXJJaOBk389JQkEKD9eS1/oHpTnPXPvPa/XmO",
  "__v": 1
}
```

- _id: generated by mongo, used everywhere to identify the lobby
- name: name of the lobby 
- players: array of players in the lobby
    - wsId: websocket id that is set when a client connects to the lobby
    - name: name of the player taken from the authentication token
    - ready: flag for player readiness
    - leader: flag for if the player is a leader
    - joinTime: used to determine who the next leader is after the old one disconnects
- chatHistory: array of chat messages
    - sender: name of the sender
    - message: the content of the message
    - timeStamp: can be used to show when the message was sent
- inProgress: it's used to update the main menu about the state of the lobby
- isFull: used to determine if a player can join the lobby
- game: what game is the lobby intending to play
- minPlayers: min players to start the game
- maxPlayers: max players for the game
- hasLeader: used to determine if new leader needs to be chosen(only a leader should be able to start a game maybe?)
- passwordProtected: flag for determining if lobby is private. If it is you need to put in a password to join the lobby(should be handled on front IMO)
- password: hashed password for the lobby


