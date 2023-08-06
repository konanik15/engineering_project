# Endpoints
## Chat
### Private
- WS chat/private - receive new pm messages as they arrive
- GET chat/private - get a summary of all conversations - for every conversation you get: the collocutor, amount of unread messages, last message sent
- GET chat/private/<username> - get whole chat history within the conversation (todo: add paging)
- POST chat/private/<username> - send a message to a person
- PATCH chat/private/message/<messageId> - notify the server a message has been read (todo: maybe add functionality to edit own messages here?)

### Lobby
- WS chat/lobby/<lobbyId> - receive new lobby messages as they arrive
- GET chat/lobby/<lobbyId> - get whole chat history within the lobby
- POST chat/lobby/<lobbyId> - send a message to the lobby (todo: how to disconnect clients who left the lobby?)
