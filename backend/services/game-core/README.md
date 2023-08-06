# Overview
This service is responsible for basic game functionality, state control, managing clients, broadcasting events, etc. 

# Approach to games
The whole model is built upon an idea that all (most) card games can be boiled down to managed by a universal set of entities and actions. Entities comprise the current game state and actions are modifiers that can be applied by clients (users) to change the game said state.

Depending on the game certain actions in a certain game state are available to certain users, while others are not. GameCore is responsible for managing the basics of any given game, while each game service is responsible for managing the intricacies and rules of that game. More on that below.

## Game and its state
Game state expresses what is currently going on on the table. Game state consists of several entities.

### Hand
Hand is a collection of cards belonginig to a player that they have direct access to. A hand has the following properties:
- owner - this is a user the hand belongs to
- open - whether the hand is open or not, open means that other players can see it's content
- cards - this is the content of a hand

### Stack and Pile
Stacks and piles are both collections of cards located on the table. The main difference is that the contents of a stack are not known to clients, while the contents of a pile are. Also stacks can be seen as orderly and neat, while a pile is less so (although this is not a hard imposed limitation). Both stacks and piles have the following properties:
- name - a name that a stack or a pile is identified by, this must be unique within their domain (there can be a pile and a stack with the same name, but not two stacks with the same name)
- facing - decides what direction it's facing, "up" means cards are turned upwards with their faces, "down" means cards are turned upwards with their backs
- cards - this is the content of a stack or pile

### Card
The model does not impose any hard requirements towards the cards. Cards can be anything as long as they are serializable to a json object. A pack of cards is supplied by each game individually and can vary a lot.

## Other game properties
Apart from its state, a game has several other important properties:
- type - this is the type of the game: durak, bridge, preferans etc.
- status - summarizes overal status of the game, can be one of: pending, inProgress, ended
- participants - users participating in the game, these are set upon creation and cannot be modified

### Meta
Game meta is any meta information about the game that might be useful to track additional conditions or stages of a specific game. The model does not impose any requirements towards this property at all as long as it is serializable to a json object. How to use this property is entirely up to the specific game.

## Combining it all together
According to the model any game can be expressed as an object like the one below:
```json
{
    "type": "example",
    "status": "inProgress",
    "participants": [{
        "username": "foo"
    }, {
        "username": "bar"
    }],
    "state": {
        "hands": [{
            "owner": "foo",
            "open": false,
            "cards": [{
                "suit": "clubs",
                "rank": "ace"
            }, ...]
        }, {
            "owner": "bar",
            "open": false,
            "cards": [{
                "suit": "diamonds",
                "rank": "6"
            }, {
                "suit": "diamonds",
                "rank": "10"
            }, ...]
        }],
        "stacks": [{
            "name": "draw",
            "facing": "down",
            "cards": [{
                "suit": "spades",
                "rank": "queen"
            }, ...]
        }],
        "piles": [{
            "name": "main",
            "facing": "up",
            "cards":[{
                "suit": "clubs",
                "rank": "king"
            }, ...]
        }]
    },
    "meta": {}
}
```

### Note
The order of cards in piles and stacks always corresponds to the order of real cards on a table from top to bottom. I.e. the first card in array is the topmost card. This is true regardless of the facing (that means that if a stack is flipped the contents are reversed as well).

## Actions
Actions are operations that users can impose upon a game to change it's state. The model implies that all (most) card games can be conducted using the basic set of actions that may have different meanings depending on the specific game. Actions include:
- create a new stack or pile
- shuffle a stack or pile
- flip a stack or pile
- transfer cards from any hand/stack/pile to any other hand/stack/pile

Actions are sent from the client to the backend where the are validated and performed, actions can be either successful or not. Core is responsible for validating the basics like whether or not there are actually cards specified by the client where they are trying to transfer them from, whether a pile with the provided name exists, etc. Further validation of what actions can be performed and when is required from the specific game.

Actions are expressed as jsons.

### Transfer
When requesting transfer a client must specify a source and a destination. Source and destination are objects that must have a property 'type' specifying what kind of entity it is. When specifying stacks and piles, a client must also provide a 'name'.

As for the cards being transfered there are two otions: specifying them directly or providing a required amount. Each have uses in different scenarios. For instance when transferring from a stack you do not know the contents of, specifying the amount is the way to go. When transfering from a hand, specifying cards explicitly might be more preferable.

An example of what actions might look like:
```json
{
    "type": "transfer",
    "source": {
        "type": "hand"
    },
    "destination": {
        "type": "pile",
        "name": "example"
    },
    "cards": [{
        "suit": "clubs",
        "rank": "ace"
    }, {
        "suit": "hearts",
        "rank": "jack"
    }]
}
```

```json
{
    "type": "transfer",
    "source": {
        "type": "stack",
        "name": "draw"
    },
    "destination": {
        "type": "hand"
    },
    "amount": 3
}
```

### Other actions 
TODO: implement and describe other actions

# Endpoints
## Get available games
GET /

Returns an array of available implemented games

### Examples
#### Request
GET http://example:80/<br>

#### Response
Body: 
```json
[{
    "type": "durak",
    "description": "A classic card game of Russian origins that is popular in many post-Soviet states."
}, {
    "type": "uno",
    "description": "A fun game that is sadly not implemented yet"
}]
```

## Get game info
GET /{gameType}

Returns detailed information about a specific game

### Examples
#### Request
GET http://example:80/durak<br>

#### Response
Body: 
```json
{
    "description": "A classic card game of Russian origins that is popular in many post-Soviet states.",
    "pack": {
        "type": "standard36",
        "name": "Standard 36-card deck",
        "cards": [
            {
                "suit": "clubs",
                "rank": "ace"
            },
            {
                "suit": "clubs",
                "rank": "6"
            },
            .
            .
            .
        ]
    },
    "minPlayers": 2,
    "maxPlayers": 5,
    "type": "durak"
}
```

## Create new game
POST /{gameType}

Expects participants and lobby id (optional) in request body.

### Examples
#### Request
POST http://example:80/durak<br>
Body: 
```json
{
    "participants": [{
        "username": "foo"
    }, {
        "username": "bar"
    }],
    "lobbyId": "64cd4358d52d6c7d2bdad986"
}
```

#### Responses
Code: 201<br>
Body: 
```json
{
    "type": "durak",
    "status": "pending",
    "participants": [{
        "username": "foo"
    },{
        "username": "bar"
    }],
    "_id": "64bc08194a90c03651ce51f7",
    "__v": 0
}
```

Code: 400<br>
Body:
```
Some descriptive message
```

## Apply actions
PATCH /{gameId}

Expects an action or an array of actions in request body.

Requires authorization.

### Examples
#### Request
PATCH http://example:80/64bc08194a90c03651ce51f7<br>
Body: 
```json
{
    "type": "transfer",
    "source": {
        "type": "stack",
        "name": "draw"
    },
    "destination": {
        "type": "hand"
    },
    "amount": 3
}
```

#### Responses
Code: 200

Code: 400<br>
Body:
```
Some descriptive message
```

## Connect to a game
WS /{gameId}

Requires authorization.

This endpoint serves two purposes:
- to make sure all players are ready and connected before starting the game
- to broadcast events happening in the game to clients 

This endpoint does not expect any messages from clients and does not react to them in any capacity. Messages it sends to the clients are events.

Event types:
- gameStarted - notifies that all participants have connected and the game was initialized; this is the moment when the game changes its status from "pending" to "inProgress"
- gameUpdated - notifies that the game was updated along with the reason that caused it
- gameEnded - notifies that the game has ended; the preceding gameUpdated event bears the final state of the game; this is the moment when the game changes its status from "inProgress" to "ended" 

### Examples
Connect to:<br>
ws://example:80/64bc08194a90c03651ce51f7

Messages from the server:
```json
{
    "event": "gameStarted",
    "data": {
        "game": { ... }
    }
}
```
```json
{
    "event": "gameUpdated",
    "data": {
        "game": { ... },
        "reason": {
            "type": "userActions",
            "initiator": {
                "username": "foo"
            },
            "actions": [{
                "type": "transfer",
                "source": {
                    "type": "hand"
                },
                "destination": {
                    "type": "pile",
                    "name": "example"
                },
                "cards": [{
                    "suit": "diamonds",
                    "rank": "queen"
                }]
            }]
        }
    }
}
```
<i>see example of a 'game' field is <a href="#combining-it-all-together">here</a></i>

```json
{
    "event": "gameEnded",
    "data": {} //dunno what else can be put here
}
```

### Note
Certain parts of information about the game is concealed from the clients depending on who is connected. For instance, a participant <i>foo</i> cannot see the contents of the <i>bar's</i> hand. Instead in the corresponding field 'cards' of the game received from the ws events <i>foo</i> will get the same array but filled with empty objects.

What <i>foo</i> sees:
```json
{
    "type": "example",
    "status": "inProgress",
    "participants": [{
        "username": "foo"
    }, {
        "username": "bar"
    }],
    "state": {
        "hands": [{
            "owner": "foo",
            "open": false,
            "cards": [{
                "suit": "clubs",
                "rank": "ace"
            }, {
                "suit": "diamonds",
                "rank": "6"
            }, {
                "suit": "hearts",
                "rank": "king"
            }]
        }, {
            "owner": "bar",
            "open": false,
            "cards": [ {}, {} ]
        }],
        "stacks": [{
            "name": "draw",
            "facing": "down",
            "cards": [ {}, {}, {}, {}, {}]
        }],
        "piles": [{
            "name": "main",
            "facing": "down",
            "cards": [{
                "suit": "clubs",
                "rank": "king"
            }, {
                "suit": "clubs",
                "rank": "king"
            }]
        }]
    },
    "meta": {}
}
```

What <i>bar</i> sees:
```json
{
    "type": "example",
    "status": "inProgress",
    "participants": [{
        "username": "foo"
    }, {
        "username": "bar"
    }],
    "state": {
        "hands": [{
            "owner": "foo",
            "open": false,
            "cards": [ {}, {}, {} ]
        }, {
            "owner": "bar",
            "open": false,
            "cards": [{
                "suit": "hearts",
                "rank": "jack"
            }, {
                "suit": "clubs",
                "rank": "7"
            }]
        }],
        "stacks": [{
            "name": "draw",
            "facing": "down",
            "cards": [ {}, {}, {}, {}, {} ]
        }],
        "piles": [{
            "name": "main",
            "facing": "down",
            "cards": [{
                "suit": "clubs",
                "rank": "king"
            }, {
                "suit": "clubs",
                "rank": "king"
            }]
        }]
    },
    "meta": {}
}
```

What is concealed:
- other player's hands
- contents of stacks (if a stack is facing up, the first card is shown)

# Game developer manual
TODO
