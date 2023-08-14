# Profile
### Endpoints
- GET /profile - get own profile
- GET /profile/\<username\> - get someone else's profile
- GET /profile/avatar - download own avatar
- GET /profile/\<username\>/avatar - download someone else's avatar
- POST /profile/avatar - upload a new avatar for your profile
- PATCH /profile - update your profile info

# Friends
### Endpoints
- GET /friends - get a list of all your friends
- DELETE /friends/\<username\> - remove a user from your friends 

- GET /friends/requests/received - get friend requests sent to you
- GET /friends/requests/sent - get friend requests sent by you to others
- POST /friends/requests/\<username\> - send a friend request to a user
- DELETE /friends/requests/\<username\> - cancel your friend request
- PATCH /friends/requests/\<username\>/accept - accept a friend request from another user
- PATCH /friends/requests/\<username\>/reject - reject a friend request from another user

- WS /friends - receive events like new friend requests received, answers to yours, etc.

# Chat
## Private
### Overview
Every private message has the following properties:
- from - a sender
- to - a receiver
- read - whether this message was read by its receiver
- text - the content of a message
- _id - it's id, nothing new here
- sent - ISO datetime when it was sent

```json
{
    "from": "foo",
    "to": "bar",
    "read": false,
    "text": "hello",
    "_id": "64cfde7a7c66d89294462197",
    "sent": "2023-08-06T17:55:06.027Z"
}
```
### Endpoints
- <a href=#follow-private-chat-updates>WS chat/private</a> - follow chat updates
- <a href=#get-conversations-summary>GET chat/private</a> - conversations summary
- <a href=#get-conversation-history>GET chat/private/\<username\></a> - conversation history
- <a href=#send-a-message>POST chat/private/\<username\></a> - send a message
- <a href=#read-a-message>PATCH chat/private/message/read/\<messageId\></a> - read a message

### Get conversations summary
GET chat/private

This endpoint returns a summary of the conversations you have with other users. Every conversation has: 
- with - your collocutor 
- unread - amount of messages from them you haven't read
- lastMessage - last message sent within that conversation

Example (private chat summary requested by <i>foo</i>):
```json
[
    {
        "with": "bar",
        "lastMessage": {
            "_id": "64cfdc2de810fd60bb40b254",
            "from": "foo",
            "to": "bar",
            "read": true,
            "text": "gg",
            "sent": "2023-08-05T22:45:17.004Z"
        },
        "unread": 0
    },
    {
        "with": "baz",
        "lastMessage": {
            "_id": "64cfde7a7c66d89294462197",
            "from": "baz",
            "to": "foo",
            "read": false,
            "text": "how are you doin' today?",
            "sent": "2023-08-06T18:53:06.027Z"
        },
        "unread": 2
    }
]
```

### Get conversation history
GET chat/private/\<username\>

Get whole conversation history with requested user

Example (private chat history requested by <i>foo</i> with user <i>bar</i>):
```json
[
    {
        "_id": "64cfdc2de810fd60bb40b254",
        "from": "foo",
        "to": "bar",
        "read": true,
        "text": "hi, im fine",
        "sent": "2023-08-06T17:45:17.004Z"
    },
    {
        "_id": "64cfdbc7e810fd60bb40b245",
        "from": "bar",
        "to": "foo",
        "read": true,
        "text": "how are u doin",
        "sent": "2023-08-06T17:43:35.070Z"
    },
    {
        "_id": "64cfdb92e810fd60bb40b241",
        "from": "bar",
        "to": "foo",
        "read": true,
        "text": "hi",
        "sent": "2023-08-06T17:42:42.641Z"
    }
]
```
Messages are always sorted by sent time (most recent go first).

#### Pagination
In order to not generate unncessary traffic and not to send excessive amounts of data, the endpoint supports pagination and limits the amount of messages sent in the response. In order to use it, you may add 'perPage' and 'page' query parameters.

Examples:
GET chat/private/\<username\>?page=1&perPage=10 will get you most recent 10 messages
GET chat/private/\<username\>?page=2&perPage=10 will get you second most recent 10 messages... and so on.

By default perPage is 50. If page isn't specified

This may be used to load messages gradually for example as the user scrolls the chat history.

### Send a message 
POST chat/private/\<username\>

Send a message to another user. Text is sent as a request body.

Example:
POST chat/private/bar
Headers:
- Content-Type: text/plain
Body:
how are u doin?

### Read a message
PATCH chat/private/message/read/\<messageId\>

Notify the server (and the other user if online) that a message they sent to you has been read.

Example:
POST chat/private/message/read/64cfdb92e810fd60bb40b241

### Follow private chat updates
WS chat/private

Receive information about incoming messages being sent to you and about your messages being read by others.

There are 2 kinds of events you may receive while being connected to this endpoint:
- newMessage - you received a new message from someone else
- messageRead - someone else read your message

Examples (connected as <i>foo</i>):
```json
{
    "event": "newMessage",
    "data": {
        "message": {
            "from": "baz",
            "to": "foo",
            "read": false,
            "text": "nice game yesterday",
            "_id": "64cfde7a7c66d89294462197",
            "sent": "2023-08-06T17:55:06.027Z"
        }
    }
}
```
```json
{
    "event": "messageRead",
    "data": {
        "message": {
            "from": "foo",
            "to": "bar",
            "read": true,
            "text": "have you seen that new game?",
            "_id": "64cfde7a7c66d89294462198",
            "sent": "2023-08-06T13:23:54.352Z"
        }
    }
}
```

## Lobby
### Overview
Every private message has the following properties:
- from - a sender
- lobbyId - id of the lobby it was sent to
- text - the content of a message
- _id - it's id, nothing new here
- sent - ISO datetime when it was sent

```json
{
    "from": "foo",
    "lobbyId": "64d160827ae3d4b5fe5ea856",
    "text": "hello",
    "_id": "64cfde7a7c66d89294462197",
    "sent": "2023-08-06T17:55:06.027Z"
}
```

Lobby messaging is simpler when it comes to certain functionalities. E.g. backend does not track the fact that a message has been read and by whom. Messages are simply sent and received by the members of the lobby.

### Endpoints 
- <a href=#follow-lobby-chat-updates>WS chat/lobby/\<lobbyId\></a> - receive new lobby messages as they arrive
- <a href=#get-lobby-message-history>GET chat/lobby/\<lobbyId\></a> - get whole chat history within the lobby
- <a href=#send-a-lobby-message>POST chat/lobby/\<lobbyId\></a> - send a message to the lobby (todo: how to disconnect clients who left the lobby?)

### Get lobby message history
GET chat/lobby/\<lobbyId\>

Get whole conversation history within the lobby

Example (private chat history requested by <i>foo</i> with user <i>bar</i>):
```json
[
    {
        "_id": "64cfdc2de810fd60bb40b254",
        "from": "foo",
        "lobbyId": "64d160827ae3d4b5fe5ea856",
        "text": "same here",
        "sent": "2023-08-06T17:45:17.004Z"
    },
    {
        "_id": "64cfdbc7e810fd60bb40b245",
        "from": "bar",
        "lobbyId": "64d160827ae3d4b5fe5ea856",
        "text": "nah, I played it irl before",
        "sent": "2023-08-06T17:43:35.070Z"
    },
    {
        "_id": "64cfdb92e810fd60bb40b241",
        "from": "baz",
        "lobbyId": "64d160827ae3d4b5fe5ea856",
        "text": "are you guys new to the game?",
        "sent": "2023-08-06T17:42:42.641Z"
    }
]
```

Messages are always sorted by sent time (most recent go first).

Lobby chat history can only be obtained while being connected to the corresponding lobby. Otherwise you will get 403 error.

This endpoint supports pagination <a href=#pagination>in the same way as pm history</a>.

### Send a lobby message 
POST chat/lobby/\<lobbyId\>

Send a message to the specfied lobby. Text is sent as a request body.

Example:
POST chat/private/bar
Headers:
- Content-Type: text/plain
Body:
are you guys new to the game?

A message can only be sent if you are connected to the corresponding lobby. Otherwise you will get 403 error.

### Follow lobby chat updates
WS chat/lobby/\<lobbyId\>

Receive information about incoming messages being sent to you and about your messages being read by others.

There is only 1 kind of event you may receive while being connected to this endpoint:
- newMessage - a new message has been sent to this lobby chat by another user

Examples (connected as <i>foo</i>):
```json
{
    "event": "newMessage",
    "data": {
        "message": {
            "from": "baz",
            "lobbyId": "64d160827ae3d4b5fe5ea856",
            "text": "so do we start or?...",
            "_id": "64cfde7a7c66d89294462197",
            "sent": "2023-08-06T17:55:06.027Z"
        }
    }
}
```

You only get information about the messages being sent by the other users on the lobby. You don't get info about your own messages. 

A connection can only be established if you are connected to the corresponding lobby. If you disconnect from the lobby, you also get disconnected from it's chat by the server.
