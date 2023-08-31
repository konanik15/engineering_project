import fs from "fs";
import _ from "lodash";

const pack = JSON.parse(fs.readFileSync("./config/pack.json"));

class Uno {
    constructor(obj) {
        this.participants = obj.participants;
        this.status = obj.status;
        this.state = obj.state || {
            hands: [],
            stacks: [],
            piles: []
        };
        this.newState = obj.newState || null;
        this.meta = obj.meta || {};
    }

    setup() {
        let cards = _.shuffle(pack.cards);

        this.participants.forEach(p => {
            this.state.hands.push({
                owner: p.username,
                cards: cards.slice(0, 7)
            });
            cards.splice(0, 7);
        });

        let drawStack = {
            name: "draw",
            cards
        };
        let firstCard;
        while(!firstCard) {
            firstCard = drawStack.cards.shift();
            if (firstCard.color == "black" || firstCard.type == "draw") {
                drawStack.cards.push(firstCard);
                firstCard = null;
            }
        }
        let discardPile = {
            name: "discard",
            facing: "up",
            cards: [ firstCard ]
        };
        this.state.stacks.push(drawStack);
        this.state.piles.push(discardPile);

        this.meta.direction = "clockwise";
        this.meta.turn = _.sample(this.participants);
        this.meta.obligations = [];
        this.meta.declarations = [];
    }

    static getPack() { return pack; }

    //it is assumed that the order of participants in the array corresponds 
    //to the clockwise order of players "around the play table"
    nextParticipant(currentParticipant) {
        let participants = JSON.parse(JSON.stringify(this.participants));
        if (this.meta.direction == "counterclockwise")
            participants = _.reverse(participants);
        let prev = false;
        for (let p of participants) {
            if (prev)
                return p;
            if (p.username == currentParticipant.username)
                prev = true;
        };
        return participants[0];
    }

    canBePlacedOnTopOf(topCard, bottomCard) {
        if (topCard.color == "black")
            return true;
        if (bottomCard.color == "black")
            return this.meta.orderedColor == topCard.color;
        if (topCard.color == bottomCard.color ||
            topCard.type == bottomCard.type)
            return true;
        return false;
    }

    reverseDirection() {
        this.meta.direction = this.meta.direction == "clockwise" ? "counterclockwise" : "clockwise";
    }

    processPlay(card) {
        let turn = this.meta.turn;
        switch (card.type) {
            case "reverse":
                this.reverseDirection();
                this.meta.turn = this.nextParticipant(turn);
                break;
            case "skip":
                this.meta.turn = this.nextParticipant(this.nextParticipant(turn));
                break;
            case "draw":
                this.meta.obligations.push({
                    type: "draw",
                    amount: card.color == "black" ? 4 : 2,
                    obliged: this.nextParticipant(turn).username,
                    reason: "card"
                });
                this.meta.turn = card.color == "black" ? 
                    this.nextParticipant(this.nextParticipant(turn)) :
                    this.nextParticipant(turn);
                break;
            default:
                this.meta.turn = this.nextParticipant(turn);
        }

        if (card.color == "black") {
            this.meta.obligations.push({
                type: "orderColor",
                obliged: turn.username
            });
        }
        delete this.meta.orderedColor;
    }

    lastPlayedCard() {
        return this.state.piles.find(p => p.name == "discard").cards[0];
    }

    validateAction(action, initiator) {
        switch (action.type) {
            case "transfer":
                return this.validateTransfer(action, initiator);
            case "orderColor":
                return this.validateOrder(action, initiator);
            case "declare":
                return this.validateDeclare(action, initiator);
            case "accuse":
                return this.validateAccuse(action, initiator);
            case "skip":
                return this.validateSkip(action, initiator);
            default:
                return {
                    valid: false,
                    message: `Action ${action.type} is not allowed in this game`
                }
        }
    }

    validateTransfer(action, initiator) {
        if (action.source.type == "hand" && action.destination.type == "pile") {
            if (initiator.username != this.meta.turn.username)
                return {
                    valid: false,
                    message: "It is not your turn now"
                } 

            if (this.meta.obligations.length > 0)
                return {
                    valid: false,
                    message: "Players must fulfill their obligations first"
                }

            if (action.cards.length != 1)
                return {
                    valid: false,
                    message: "A play can only be performed with 1 card"
                }

            let card = action.cards[0];
            if (this.meta.turn.cardsDrawn) {
                let drawnCards = _.takeRight(
                    this.state.hands.find(h => h.owner == initiator.username).cards,
                    this.meta.turn.cardsDrawn
                );
                if (_.findIndex(drawnCards, card) == -1)
                    return {
                        valid: false,
                        message: "You've drawn additional cards from the draw stack this turn. You may only use the cards you've drawn now"
                    }
            }
            if (!this.canBePlacedOnTopOf(card, this.lastPlayedCard()))
                return {
                    valid: false,
                    message: "You may not play this card"
                }

            this.trackUno(action, initiator);
            this.processPlay(card);
            this.checkWinCondition(action, initiator);
            return { valid: true };
        }

        if (action.source.type == "stack" && action.destination.type == "hand") {
            let leftoverAmount = action.amount;

            let obligations = this.meta.obligations.filter(o => 
                o.obliged == initiator.username && o.type == "draw");
            obligations.forEach(obligation => {
                leftoverAmount -= obligation.amount;
                obligation.amount -= action.amount;
                if (obligation.amount <= 0) {
                    _.remove(this.meta.obligations, o => o === obligation);
                    if (obligation.reason == "accusation" && 
                        this.meta.accusation == initiator.username)
                        delete this.meta.accusation;
                }
            });

            if (leftoverAmount > 0) {
                if (initiator.username != this.meta.turn.username)
                    return {
                        valid: false,
                        message: "You may not take additional cards out of your turn"
                    }

                if (this.meta.obligations.length > 0)
                    return {
                        valid: false,
                        message: "Players must fulfill their obligations first"
                    }

                this.meta.turn.cardsDrawn ??= 0;
                this.meta.turn.cardsDrawn += leftoverAmount;
            }

            let drawStack = this.newState.stacks.find(s => s.name == "draw");
            if (drawStack.cards.length == 0) {
                this.modifiedState = JSON.parse(JSON.stringify(this.newState));
                let drawStack = this.modifiedState.stacks.find(s => s.name == "draw");
                let discardPile = this.modifiedState.piles.find(s => s.name == "discard");
                let cards = _.drop(discardPile.cards, 1);
                discardPile.cards = [ _.head(discardPile.cards) ];
                drawStack.cards = _.shuffle(cards);
            }

            this.trackUno(action, initiator);
            return { valid: true };
        }

        return {
            valid: false,
            message: "You may not do that"
        }
    }

    validateOrder(action, initiator) {
        let obligation = this.meta.obligations
            .find(o => o.obliged == initiator.username && o.type == "orderColor");
        if (!obligation) 
            return {
                valid: false,
                message: "You may not order color now"
            }
        if (!["red", "green", "yellow", "blue"].includes(action.color))
            return {
                valid: false,
                message: `Unknown color: ${action.color}`
            }
        _.remove(this.meta.obligations, o => o === obligation);
        this.meta.orderedColor = action.color;
        return { valid: true };
    }

    validateSkip(action, initiator) {
        if (initiator.username != this.meta.turn.username)
            return {
                valid: false,
                message: "It is not your turn now"
            } 
        if (!this.meta.turn.cardsDrawn) 
            return {
                valid: false,
                message: "You may not skip your turn if you haven't drawn any cards"
            }
        this.meta.turn = this.nextParticipant(this.meta.turn);
        return { valid: true };
    }

    validateDeclare(action, initiator) {
        let hand = this.newState.hands.find(h => h.owner == initiator.username);
        if (hand.cards.length > 2)
            return {
                valid: false,
                message: "You have too many cards to declare Uno"
            }
        if (this.meta.declarations.includes(initiator.username))
            return {
                valid: false,
                message: "You have already declared Uno"
            }
        if (hand.cards.length == 2 && initiator.username != this.meta.turn.username)
            return {
                valid: false,
                message: "You may not declare Uno yet"
            }
        if (hand.cards.length == 1 && this.meta.opening != initiator.username)
            return {
                valid: false,
                message: "You may not declare Uno now"
            }
        
        this.meta.declarations.push(initiator.username);
        return { valid: true };
    }

    validateAccuse(action, initiator) {
        if (!this.participants.map(p => p.username).includes(action.username))
            return {
                valid: false,
                message: `${action.username} is not a participant of this game`
            }
        let hand = this.newState.hands.find(h => h.owner == action.username); 
        if (hand.cards.length > 1)
            return {
                valid: false,
                message: "This player has too many cards to accuse them"
            }
        if (this.meta.accusation &&
            this.meta.accusation == action.username)
            return {
                valid: false,
                message: "This player was already accused"
            }
        if (!this.meta.opening ||
            this.meta.opening != action.username)
            return {
                valid: false,
                message: "You can no longer accuse this player"
            }
        if (this.meta.declarations.includes(action.username))
            return {
                valid: false,
                message: "This player declared their Uno"
            }
        
        this.meta.accusation = action.username;
        this.meta.obligations.push({
            type: "draw",
            amount: 2,
            obliged: action.username,
            reason: "accusation"
        });
        return { valid: true };
    }

    trackUno(action, initiator) {
        if (action.type != "transfer")
            return;

        delete this.meta.opening;

        let hand = this.newState.hands.find(h => h.owner == initiator.username);
        if (action.source.type == "hand" && 
            action.destination.type == "pile")
            if (hand.cards.length == 1)
                this.meta.opening = initiator.username;
            
        if (action.source.type == "stack" && 
            action.destination.type == "hand")
            _.remove(this.meta.declarations, d => d == initiator.username);
    }

    checkWinCondition(action, initiator) {
        let hand = this.newState.hands.find(h => h.owner == initiator.username);
        if (hand.cards.length > 0)
            return;

        this.status = "ended";
        this.meta.winner = initiator.username;
    }
}

export default Uno;
