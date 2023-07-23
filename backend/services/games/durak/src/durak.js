import fs from "fs";
import _ from "lodash";

const pack = JSON.parse(fs.readFileSync("./config/pack.json"));

class Durak {
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
        this.meta.stage = "ready";
        this.meta.participantsFallenOut = [];

        this.state.stacks.push({
            name: "discard",
            cards: []
        });

        for (let i = 0; i < 6; i++) {
            this.state.piles.push({
                name: "attack" + i,
                facing: "up",
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
        let participants = this.participantsLeftInGame();
        let prev = false;
        for (let p of participants) {
            if (prev)
                return p;
            if (p.username === currentParticipant.username)
                prev = true;
        };
        return participants[0];
    }

    participantsLeftInGame() {
        return this.participants.filter(p => 
            !this.meta.participantsFallenOut.map(f => f.username).includes(p.username));
    }

    validateAction(action, initiator) {
        if (![this.meta.attacker, this.meta.defender]
            .map(p => p.username)
            .includes(initiator.username))
            return {
                valid: false,
                message: "It is not your turn now"
            }

        let common = this.validateCommon(action);
        if (!common.valid)
            return common;
        
        if (initiator.username === this.meta.attacker.username)
            return this.validateAttacker(action);
        
        if (initiator.username === this.meta.defender.username)
            return this.validateDefender(action);
    }

    validateCommon(action) {
        if (action.source.type === "hand") {
            if (action.destination.type !== "pile")
                return {
                    valid: false,
                    message: "You may not put your cards there"
                }

            if (action.cards.length !== 1)
                return {
                    valid: false,
                    message: "You may only transfer 1 card to an attack pile"
                }
        }

        if (action.source.type === "stack") {
            if (action.source.name !== "draw")
                return {
                    valid: false,
                    message: `You may not take cards from stack ${action.source.name}`
                } 
            
            if (action.destination.type !== "hand")
                return { 
                    valid: false,
                    message: "You may only take cards to your hand from draw stack"
                }
        }

        return { valid: true };
    } 

    validateAttacker(action) {
        if (action.source.type === "hand") {
            this.checkFinishCondition();

            if (this.meta.stage === "ready") {
                this.meta.stage = "attack";
                return { valid: true };
            }

            if (this.meta.stage === "attack") {
                let targetPile = _.find(this.state.piles, { name: action.destination.name });

                if (targetPile.cards.length > 0)
                    return {
                        valid: false,
                        message: "To attack you need to place a card into a separate pile"
                    }

                if (_.find(this.state.hands, { owner: this.meta.defender.username }).cards.length === 0)
                    return {
                        valid: false,
                        message: "The defender has no cards left"
                    }
                
                let contestCards = _.flatten(this.state.piles.map(p => p.cards));
                if (!_.find(contestCards, { rank: action.cards[0].rank }))
                    return {
                        valid: false,
                        message: "You may not attack with this card"
                    }
            
                return { valid: true };
            }

            if (this.meta.stage === "preparation")
                return {
                    valid: false,
                    message: "You must finish preparations first"
                }
        }

        if (action.source.type === "stack") {
            if (this.meta.stage === "attack") {
                if (!this.state.piles.every(p => p.cards.length === 2 || p.cards.length === 0))
                    return {
                        valid: false,
                        message: "To take cards from the draw stack an attack must be finished first"
                    }
                
                this.meta.stage = "preparation";
                this.meta.attackStatus = "repelled";
            }

            if (this.meta.stage === "preparation") {
                let targetHand = _.find(this.state.hands, { owner: this.meta.attacker.username });
                if (targetHand.cards.length + action.amount > 6)
                    return {
                        valid: false,
                        message: "You may not take that many cards from the draw stack"
                    }
                this.checkPreparationFinished();
                return { valid: true };
            }

            if (this.meta.stage === "ready")
                return {
                    valid: false,
                    message: "You may not do that now"
                }
        }

        if (action.source.type === "pile") { 
            if (action.destination.type !== "stack" || action.destination.name !== "discard")
                return { 
                    valid: false,
                    message: "You may only discard these cards"
                }

            if (this.meta.stage === "attack") {
                if (!this.state.piles.every(p => p.cards.length === 2 || p.cards.length === 0))
                    return {
                        valid: false,
                        message: "You may only discard cards once they are all beaten"
                    };

                this.meta.stage = "preparation";
                this.meta.attackStatus = "repelled";
                this.checkPreparationFinished();
                return { valid: true };
            }

            if (this.meta.stage === "preparation") {
                this.checkPreparationFinished();
                return { valid: true };
            }
        }
    }

    validateDefender(action) {
        if (action.source.type === "hand") {
            this.checkFinishCondition();

            if (this.meta.stage === "preparation") 
                return {
                    valid: false,
                    message: "You may not do this at this stage"
                }
            
            if (this.meta.stage === "attack") {
                let targetPile = _.find(this.state.piles, { name: action.destination.name });

                if (targetPile.cards.length != 1)
                    return {
                        valid: false,
                        message: "To repel an attack you need to place your card into a pile with an attacker's card"
                    }

                if (!this.beats(action.cards[0], targetPile.cards[0]))
                    return {
                        valid: false,
                        message: `Card ${JSON.stringify(action.cards[0])} does not beat card ${JSON.stringify(targetPile.cards[0])}`
                    }

                return { valid: true };
            }
        }

        if (action.source.type === "stack") {
            if (this.meta.stage === "attack") {
                return {
                    valid: false,
                    message: "To take cards from the draw stack an attack must be finished first"
                }
            }

            if (this.meta.stage === "preparation") {
                let targetHand = _.find(this.state.hands, { owner: this.meta.defender.username });
                let attackersHand = _.find(this.state.hands, { owner: this.meta.attacker.username });

                if (attackersHand.cards.length < 6) {
                    return {
                        valid: false,
                        message: "You may only take cards from draw pile after the attacker"
                    }
                }

                if (targetHand.cards.length + action.amount > 6)
                    return {
                        valid: false,
                        message: "You may not take that many cards from the draw stack"
                    }
                
                this.checkPreparationFinished();
                return { valid: true };
            }
        }

        if (action.source.type === "pile") { 
            if (action.destination.type === "hand") {
                if (this.meta.stage === "attack") {
                    this.meta.stage = "preparation";
                    this.meta.attackStatus = "surrendered";
                    this.checkPreparationFinished();
                    return { valid: true };
                }

                if (this.meta.stage === "preparation") {
                    if (this.meta.attackStatus === "surrendered") {
                        this.checkPreparationFinished();
                        return { valid: false };
                    }
                    if (this.meta.attackStatus === "repelled") {
                        return {
                            valid: false,
                            message: "You must may only discard these cards"
                        }
                    }
                }
            }

            if (action.destination.type === "stack" && action.destination.name === "discard") {
                if (this.meta.stage === "attack") {
                    return {
                        valid: false,
                        message: "You may not discard until the attack is finished"
                    }
                }

                if (this.meta.stage === "preparation") {
                    if (this.meta.attackStatus === "repelled") {
                        this.checkPreparationFinished();
                        return { valid: true };
                    }
                    if (this.meta.attackStatus === "surrendered") {
                        return {
                            valid: false,
                            message: "You must take these cards to your hand"
                        }
                    }
                }
            }
        }
    }

    checkFinishCondition() {
        const checkFallenOut = () => {
            let emptyHand = this.newState.hands.find(h => h.cards.length === 0);
            if (!emptyHand)
                return null;

            let emptyHandOwner = this.participants.find(p => p.username === emptyHand.owner);
            let drawStack = this.newState.stacks.find(s => s.name === "draw");
            if (drawStack.cards.length === 0)
                return emptyHandOwner;
            
            if (emptyHand.owner === this.meta.attacker.username) 
                return null;
            
            if (this.participantsLeftInGame() > 2) 
                return emptyHandOwner;

            let attackersHand = _.find(this.state.hands, { owner: this.meta.attacker.username });

            if (attackersHand.cards.length + drawStack.cards.length <= 6)
                return emptyHandOwner;

            return null;
        }

        let fallenOut = checkFallenOut();
        if (!fallenOut)
            return;

        this.meta.participantsFallenOut.push(fallenOut);
        let participantsLeft = this.participantsLeftInGame();
        if (participantsLeft.length > 1)
            return;

        this.status = "ended";
        this.meta.loser = participantsLeft[0];
    }

    checkPreparationFinished() {
        const handsAreMaxed = () => {
            if (this.newState.hands.every(hand => hand.cards.length >= 6))
                return true;
            if (this.newState.stacks.find(stack => stack.name === "draw").cards.length === 0)
                return true;
            return false;
        }
        
        if (!handsAreMaxed())
            return;

        if (!this.newState.piles.every(p => p.cards.length === 0))
            return;

        this.meta.stage = "ready";
        if (this.meta.attackStatus === "repelled") {
            this.meta.attacker = this.meta.defender;
            this.meta.defender = this.nextParticipant(this.meta.attacker);
        } else {
            this.meta.attacker = this.nextParticipant(this.meta.defender);
            this.meta.defender = this.nextParticipant(this.meta.attacker);
        }
        delete this.meta.attackStatus;
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
        return _.findIndex(rankOrder, r => r === card1.rank) > 
            _.findIndex(rankOrder, r => r === card2.rank);
    }
}

export default Durak;
