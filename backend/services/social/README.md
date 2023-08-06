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

Get whole conversation history with requested user (todo: add paging later)

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

Note: messages are always sorted by sent time (most recent go first)

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

## Lobby (WIP)
- WS chat/lobby/<lobbyId> - receive new lobby messages as they arrive
- GET chat/lobby/<lobbyId> - get whole chat history within the lobby
- POST chat/lobby/<lobbyId> - send a message to the lobby (todo: how to disconnect clients who left the lobby?)
