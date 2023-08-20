# Overview
This game uses the following entities: 
- a 'draw' stack - in a real game this is called "draw pile", but it is a stack according to the game engine concept because you are not supposed to inspect it's contents
- a 'discard' pile - a pile facing upwards for players to make their moves

### Some basic terms
- move - technically a move is a transfer of 1 card from a hand to the discard pile, this is going to be the most often encountered activity in this game 
- draw - a transfer of n cards from the draw stack to a hand, this may be a part of making a move or satisfying certain obligations (more on obligations below)

In order to play this game you primarily need transfer actions. See <a href="../../game-core/README.md#actions">actions</a> for directions.

Apart from the standard transfer actions this game uses some custom actions as well. These are:
- orderColor - you'll need this to order a color of the card for the next turn in case you used a black card
- declare - you're going to use this to announce "Uno!"
- accuse - you'll need this in order to punish another player who forgot to announce their "Uno!"
- skip - pass your turn without making a move

# Turns
Moves can only be performed during a player's turn. Turns change depending on the game conditions, such as:
- direction - can be either "clockwise" or "counterclockwise", this changes when a "reverse" card is played
- previously played card - some cards force players to skip their turns, this can either be a "skip" card or a black "draw" card

The current turn and direction can always be determined by the <i>'turn'</i> property of the game meta:
```json
{
    "direction": "clockwise",
    "turn": {
        "username": "foo"
    }
}
```
The above means that it is now foo's turn to make a move.

## Making a move
If a player doesn't have a proper card to make a move with (or does not wish to use the ones they have), they may draw them from the draw stack, just like in the real game. Keep in mind that if a player drew cards during their turn, they may only make a move with one of the cards they've drawn, and not one of those they previously had in their hand (also according to the official rules).

If a player still does not have a card to make a move with (or doesn't want to), they may end their turn without making a move. To do this you'll have to send a "skip" action:
```json
{
    "type": "skip"
}
```
Note that a player may only end their turn this way if they've drawn at least 1 additional card.

# Obligations
Obligations are some activities players must fulfill in order for the game to continue. Players may not make their moves until there are unsatisfied obligations.

There are 2 types of obligations:
- orderColor
- draw

### Order color
When a player plays a black card, they must also choose a color of a card for the next turn. E.g. making a move:
```json
{
    "type": "transfer",
    "source": {
        "type": "hand"
    },
    "destination": {
        "type": "pile",
        "name": "discard"
    },
    "cards": [{
        "color": "black",
        "type": "wild"
    }]
}
```
Will cause the game to update and in the game meta you will see the following:
```json
{
    "obligations": [{
        "type": "orderColor",
        "obliged": "bar"
    }]
}
```
This means that bar made a move with a black card and now has to choose a color.

In order to satisfy that obligation bar has to order a color by sending an action: 
```json
{
    "type": "orderColor",
    "color": "yellow"
}
```
After performing this action in the game meta you'll see:
```json
{
    "orderedColor": "yellow"
}
```
This meta property is removed automatically once the next player makes their move.

### Draw
When a player plays a draw card it automatically adds a new obligation for the next player. E.g. bar making a move:
```json
{
    "type": "transfer",
    "source": {
        "type": "hand"
    },
    "destination": {
        "type": "pile",
        "name": "discard"
    },
    "cards": [{
        "color": "red",
        "type": "draw"
    }]
}
```
Will cause the game to update and in the game meta you will see the following:
```json
{
    "obligations": [{
        "type": "draw",
        "amount": 2,
        "obliged": "baz",
        "reason": "card"
    }]
}
```
This means that baz (the next player) now has to draw 2 cards.

Obligations are removed once they are satisfied.

# Getting out
When a player is about to make a move with their second to last card, or has already done so (they are about to be or already are left with a single card in their hands), they should declare "Uno!". To do so a player should send the following action:
```json
{
    "type": "declare"
}
```
Note that this action can only be send in the following conditions:
- a player still has 2 cards but it is their turn now
- a player has 1 card but the next player haven't started their turn yet (starting a turn is either making a move or drawing cards)

When a player declares "Uno!", the game updates and in the game meta you may see:
```json
{
    "declarations": [
        "foo"
    ]
}
```
This means that foo declared their "Uno!" and the other players are now in danger of losing)

Declarations are removed automatically if the player draws more cards (e.g. if forced by another player's move or cannot play their last card).

If, however, a player forgot to declare their "Uno!" and are now left with 1 card on their hands, other players can punish them for it. In case another player notices it and points it out, the player who forgot to declare their "Uno!" must draw 2 cards.

In order to accuse someone, the following action must be sent:
```json
{
    "type": "accuse",
    "username": "foo"
}
```
Username here is the username of the player to be accused.

Note that this action can only be send if all of the following conditions are met:
- the player has 1 card on their hand
- the player have not declared "Uno!"
- the next player haven't started their turn yet
- the player haven't been accused yet

After a successful accusation the game will update and in the meta you'll see:
```json
{
    "obligations": [{
        "type": "draw",
        "amount": 2,
        "obliged": "foo",
        "reason": "accusation"
    }],
    "accusation": "foo"
}
```
'accusation' field signifies an active accusation against a player (there can only be one at a time).<br>
Also a successful accusation automatically adds an obligation for the accused to draw 2 cards.

# Game ending
The game ends whenever any player gets rid of all their cards. In the original game the game is continued until any player gets to 500 points that they receive for all the leftover cards from other players' hands. However in the current version of implementation this isn't supported and the game simply ends after the first 'round' and the winner is declared.

Once the game ends, the game meta will contain a new field:
```json
{
    "winner": "baz"
}
```
