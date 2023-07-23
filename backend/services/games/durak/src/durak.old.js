import fs from "fs";
import _ from "lodash";

const pack = JSON.parse(fs.readFileSync("./config/pack.json"));

class Durak {
    constructor(obj) {
        this.participants = obj.participants;
        this.state = obj.state || {
            hands: [],
            stacks: []
        };
        this.meta = obj.meta || {};
    }

    setup() {
        let cards = _.shuffle(pack.cards);

        this.participants.forEach(p => {
            this.state.hands.push({
                owner: p.username,
                cards: cards.slice(0, 6)
            });
            cards.splice(0, 6);
        });

        let drawStack = {
            name: "draw",
            cards
        };
        let trumpCard = drawStack.cards.shift();
        drawStack.cards.push(trumpCard);
        this.state.stacks.push(drawStack);
        this.meta.trumpCard = trumpCard;

        this.state.stacks.push({
            name: "discard",
            cards: []
        });

        for (let i = 0; i < 5; i++) {
            this.state.piles.push({
                name: "contest" + i,
                cards: []
            });
        }

        this.meta.attacker = _.sample(this.participants);
        this.meta.defender = this.nextParticipant(this.meta.attacker);
    }

    //logic assumes that moves are made in a clockwise fashion.
    //it is assumed that the order of participants in the array corresponds 
    //to the clockwise order of players "around the play table"
    nextParticipant(currentParticipant) {
        let prev = false;
        for (let p of this.participants) {
            if (prev)
                return p;
            if (p.username === currentParticipant.username)
                prev = true;
        };
        return this.participants[0];
    }

    validateAction(action, initiator) {
        if (![this.meta.attacker, this.meta.defender].includes(initiator.username))
            throw new Error("It is not your turn now");

        switch (action.type) {
            case "transfer":
                return this.validateTransfer(action, initiator);
            default:
                return {
                    valid: false,
                    message: "You may not do this right now"
                }
        }
    }

    validateTransfer(action, initiator) {
        switch (action.source.type) {
            case "hand":
                if (action.destination.type !== "pile")
                    return {
                        valid: false,
                        message: "When transfering from hand you may only transfer cards to contest piles"
                    }
                if (action.cards.length === 1)
                    return {
                        valid: false,
                        message: "You may only transfer 1 card to a contest pile"
                    }

                if (initiator.username === this.meta.attacker)
                    return validateAttack(action);
                if (initiator.username === this.meta.defender)
                    return validateDefence(action);
                break;
            case "pile":
                if (action.destination.type == "stack" || action.destination.name == "discard") {
                    if (this.meta.status === "preparation")
                        return { valid: true };
                    
                }
            default:   
                return {
                    valid: false,
                    message: "You may not do this right now"
                }
        }
    }

    validateDiscard(action) {
        if (action.destination.type !== "stack" || action.destination.name !== "discard")
            return {
                valid: false,
                message: "You may only discard these cards"
            };
        if (!this.state.piles.every(p => p.cards.length === 2))
            return {
                valid: false,
                message: "You may only discard cards once they are all beaten"
            };
        this.meta.status = "preparation";
        return { valid: true };
    }

    validateSurrender(action) {
        if (action.destination.type !== "hand")
            return {
                valid: false,
                message: "You "
            };
    }

    validateAttack(action) {
        if (this.meta.status === "preparation") {
            if (this.state.piles.every(p => p.cards.length == 0)) { //it's the begining of an attack
                this.meta.status = "attack";
                return { valid: true };
            } else 
                return {
                    valid: false,
                    message: "Before attacking you must first clear the table "
                }
        }

        let targetPile = _.find(this.state.piles, { name: action.destination.name });

        if (targetPile.cards.length > 0)
            return {
                valid: false,
                message: "To attack you need to place a card into a separate pile"
            }
        
        let contestCards = _.flatten(this.state.piles.map(p => p.cards));
        if (!_.find(contestCards, { rank: action.cards[0] }))
            return {
                valid: false,
                message: "You may not attack with this card"
            }
        
        return { valid: true };
    }

    validateDefence(action) {
        let targetPile = _.find(this.state.piles, { name: action.destination.name });
        if (targetPile.cards.length != 1)
            return {
                valid: false,
                message: "To repel an attack you need to place your card into a pile with an attackers card"
            }

        if (!this.beats(action.cards[0], targetPile.cards[0]))
            return {
                valid: false,
                message: `Card ${action.cards[0]} does not beat card ${targetPile.cards[0]}`
            }

        return { valid: true };
    }

    beats(card1, card2) {
        if (card1.suit === card2.suit) 
            return this.isHigherByRank(card1, card2);
        if (card1.suit === this.meta.trumpCard.suit)
            return true;
        return false;
    }

    isHigherByRank(card1, card2) {
        const rankOrder = ["6", '7', "8", "9", "10", "jack", "queen", "king", "ace"];
        return _.findIndex(rankOrder, card1.rank) > _.findIndex(rankOrder, card2.rank);
    }

    handsAreMaxed
}

export default Durak;
