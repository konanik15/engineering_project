# Overview
This game uses the following entities:

Stacks:
- draw - a stack to draw cards from
- discard - a stack to discard the cards to after an attack (in real game this is called a "discard <u>pile</u>", but technically here it is a stack because you are not supposed to be able to inspect it's contents)

Piles:<br>
There are 6 piles named "attack<0-5>". These piles are meant for performing attacks and repelling them. In order to attack an attacker must put their card into an empty attack pile. In order to repel, a defender must put their card into a pile with an attackers card.

There are only 6 piles because an attack can consist of maximum 6 cards (even if the players have more cards in their hands).

In order to play this game you only need transfer actions. See <a href="../../game-core/README.md#actions">actions</a> for directions.

# Stages
The game cycles between 3 stages: ready -> attack -> preparation -> ready.

## Ready 
This stage means that the field is cleared (piles are emptied into discard stack) and players took up to 6 cards from the draw stack. This is the default stage of the game.

## Attack
This stage signifies that there is an active attack, where an attacker puts their cards on the table (into piles) and the defender tries to repel an attack by beating them with thier own.

## Preparation
This stage comes after an attack has ended. During this stage players must clear the piles from cards (by either putting them into discard - if the attack was repelled, or into defender's hand - if the defender surrendered) and fill up their hands from the draw stack.

## Logic and transitions
### When in "ready"
During this stage the only allowed action is for the attacker to transfer cards from their hand to piles. Act of doing so automatically advances the game into "attack" stage.

### When in "attack"
During this stage both attacker and defender are allowed to transfer the cards from hands into corresponding piles (with appropriate validation). An attack can be ended in several ways:
- an act of transferring cards from piles to their hand by a defender is considered a surrender
- an act of transferring cards from piles to the discard stack by an attacker makes an attack repelled (on the condition that cards in piles are beaten by a defender)
- an act of transferring cards from draw stack to their hand by an attacker makes an attack repelled (on the condition that cards in piles are beaten by a defender)

All 3 of these instances advance the game stage to "preparation".

### When in "preparation":
During this stage:
- if the previous attack was repelled - both attacker and defender are allowed to transfer the (remaining) cards from piles into discard
- if the previous attack was surrendered - defender is only allowed to transfer the (remaining) cards from piles into their hand

Also both attacker and defender are allowed to transfer cards from the draw stack into their hands (on the condition that the attacker is maxed out first).

Whenever the piles are cleared and hands are maxed out, the game transitions into stage "ready". Also this is the moment when the next attacker and defender are assingned based to the previous attack outcome.

# Ending
The players left with no cards in their hand and no more cards to draw from the draw stack fall out from the game. The last player having cards in their hand loses and earns a title of "fool" or "durak".

# Notes
Technically a trump card is a part of the draw stack and goes last in it. And it is also supposed to be drawn from it. However, on the frontend it should be displayed differently - perpendicular to the stack and facing up. Info about what is the trump card in the game can be found in meta.

# Meta examples
Somewhere during an attack of foo on bar
```json
{
    "trumpCard": {
        "suit": "clubs",
        "rank": "ace"
    },
    "stage": "attack",
    "participantsFallenOut": [],
    "attacker": {
        "username": "foo"
    },
    "defender": {
        "username": "bar"
    }
}
```

Bar repelled foo's attack and now they prepare for the next round
```json
{
    "trumpCard": {
        "suit": "clubs",
        "rank": "ace"
    },
    "stage": "preparation",
    "attackStatus": "repelled",
    "participantsFallenOut": [],
    "attacker": {
        "username": "foo"
    },
    "defender": {
        "username": "bar"
    }
}
```

Preparations ended and bar is now an attacker
```json
{
    "trumpCard": {
        "suit": "clubs",
        "rank": "ace"
    },
    "stage": "ready",
    "participantsFallenOut": [],
    "attacker": {
        "username": "bar"
    },
    "defender": {
        "username": "foo"
    }
}
```

Bar put out his last card during his attack. Foo is now a loser as he is the only player remained.
```json
{
    "trumpCard": {
        "suit": "clubs",
        "rank": "ace"
    },
    "stage": "attack",
    "participantsFallenOut": [{
        "username": "bar"
    }],
    "attacker": {
        "username": "bar"
    },
    "defender": {
        "username": "foo"
    },
    "loser": {
        "username": "foo"
    }
}
```
