# Profile
### Overview
Each user has a social profile. Each profile consists of:
- username - this is unique and derived from keycloak
- bio - some description a user might write about themselves
- avatar - some image of thir choosing to represent them
- friends - other users this user is friends with
- online - whether or not this user is online

Examples:
```json
{
    "username": "bar",
    "avatar": "/profile/bar/avatar",
    "bio": "some clever story about myself",
    "friendsWith": [ "foo", "baz" ],
    "online": true
}
```
```json
{
    "username": "xyz",
    "avatar": null,
    "bio": "",
    "friendsWith": [ "abc" ],
    "online": false
}
```

Avatar can either be null - that means a user hasn't set it yet. Or a relative link where it can be downloaded.

By default bio is an empty string, it will only contain something if the user fills it.

Note: friend list and online status are only available for users you are friends with. 

### Endpoints
- <a href=#getting-profile>GET /profile/\<username\></a> - get someone else's profile
- <a href=#downloading-avatar>GET /profile/\<username\>/avatar</a> - download someone else's avatar
- <a href=#uploading-avatar>POST /profile/avatar</a> - upload a new avatar for your profile
- <a href=#editing-profile>PATCH /profile</a> - update your profile info

### Getting profile
GET /profile/\<username\>

Returns user's profile depending on the requesting user relation.

Example:
foo is friends with bar, foo makes a GET /profile/bar request and receives:
```json
{
    "username": "bar",
    "avatar": "/profile/bar/avatar",
    "bio": "some clever story about myself",
    "friends": [ "foo", "baz" ],
    "online": true
}
```
foo is not friends with xyz, foo makes a GET /profile/xyz request and receives:
```json
{
    "username": "xyz",
    "avatar": "/profile/xyz/avatar",
    "bio": "casual player, serious gamer"
}
```

Note: getting your own profile yields full info as well, like in the first example.

### Downloading avatar
GET /profile/\<username\>/avatar

Returns a file of one of the image types. You'll get 404 if either user does not exist or they have no avatar.

### Uploading avatar
POST /profile/avatar

An avatar must be uploaded as a form-data in a 'file' key. E.g.:
POST http://host:1234/profile/avatar
Headers:
- Content-Type: multipart/form-data - <i>this is important</i>
- Authorization: Bearer \<your_token\>
Body (form-data keys):
- file: \<your_file\>

There are certain restrictions on the files that can be uploaded:
- it must be of an image MIME type
- it's size must not exceed 1MB
- it must be a square (it's height must equal it's width)

### Editing profile
PATCH /profile

In order to edit your profile, include all the fields you want to update as a json in request body:
PATCH http://host:1234/profile
Headers:
- Content-Type: application/json
- Authorization: Bearer \<your_token\>
Body:
```json
{
    "bio": "some other clever description I just thought of"
}
```

For now the only profile field that can be changed this way is bio. Maybe there will be others in the future.

# Friends
### Overview
In order to become friends with someone you must send them a friend request, which the other user may or may not accept.

A friend request looks like this:
```json
{
    "from": "foo",
    "to": "bar",
    "sent": "2023-08-14T20:42:56.927Z"
}
```
- from - who wants to become friends with someone else
- to - whom the initiator wants to become friends with
- sent - when was the friend request sent

### Endpoints
- GET /friends - get a list of all your friends
- DELETE /friends/\<username\> - remove a user from your friends 

- GET /friends/requests/received - get friend requests sent to you
- GET /friends/requests/sent - get friend requests sent by you to others
- POST /friends/requests/\<username\> - send a friend request to another user
- DELETE /friends/requests/\<username\> - cancel your friend request sent to the specified user
- PATCH /friends/requests/\<username\>/accept - accept a friend request from the specified user
- PATCH /friends/requests/\<username\>/reject - reject a friend request from the specified user

- <a href=#follow-updates-from-your-friends>WS /friends</a> - receive events like new friend requests received, answers to yours, other activities.

### Follow updates from your friends
Being connected to this endpoint sets your status as "online" for all your friends. Also you receive events related to your friends here.

Events that can be sent by the server:
- friendCameOnline - notifies that a friend has come online
- friendCameOffline - notifies that a friend has come offline
- friendRequestReceived - notifies that you received a new friend request from someone
- friendRequestResponded - notifies that someone responded to a friend request you sent to them
- unfriended - notifies that a (now former) friend unfriended you

#### Examples: 
Your friend foo came online:
```json
{
    "event": "friendCameOnline",
    "data": {
        "username": "foo"
    }
}
```
Your friend bar came offline:
```json
{
    "event": "friendCameOffline",
    "data": {
        "username": "bar"
    }
}
```
Your friend xyz removed you from friends, they are not your friend anymore((:
```json
{
    "event": "unfriended",
    "data": {
        "username": "xyz"
    }
}
```
You received a new friend request from baz:
```json
{
    "event": "friendRequestReceived",
    "data": {
        "request": {
            "from": "baz",
            "to": "mario",
            "sent": "2023-08-14T21:20:52.036Z"
        }
    }
}
```
You sent a friend request to abc earlier and now they accepted it (you are friends now):
```json
{
    "event": "friendRequestResponded",
    "data": {
        "request": {
            "from": "luigi",
            "to": "abc",
            "sent": "2023-08-14T21:20:52.036Z"
        },
        "response": "accepted"
    }
}
```
You sent a friend request to xyz earlier but now they rejected it:
```json
{
    "event": "friendRequestResponded",
    "data": {
        "request": {
            "from": "luigi",
            "to": "xyz",
            "sent": "2023-08-14T21:20:52.036Z"
        },
        "response": "rejected"
    }
}
```


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
