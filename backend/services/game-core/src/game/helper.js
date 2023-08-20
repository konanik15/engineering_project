import _ from 'lodash';
import { 
    ActionInvalidError,
    ActionIllegalError 
} from '../common/errors.js';

function perform(state, action, user) {
    if (!_.isPlainObject(action))
        throw new ActionInvalidError("Action is not an object");

    if (!action.type)
        throw new ActionInvalidError("Action must have a type");
    switch (action.type) {
        case "transfer":
            transfer(state, action.source, action.destination, action.cards, action.amount, user);
            break;
        case "flipStack":
            flipStack(state, action.name);
            break;
        case "createStack":
            createStack(state, action.name, action.facing);
            break;
        case "createPile":
            createPile(state, action.name, action.facing);
            break;
        default:
            //ignore the action and let the game deal with it 
    }
}

function transfer(state, source, destination, cards, amount, user) {
    add(state, destination, remove(state, source, cards, amount, user), user);
}

function remove(state, source, cards, amount, user) {
    if (!_.isPlainObject(source))
        throw new ActionInvalidError("Source is not an object");
    switch(source.type) {
        case "hand":
            let hand = _.find(state.hands, { owner: user.username });
            if (!hand)
                throw new ActionInvalidError(`No hand found with owner ${user.username}`);
            return pull(hand.cards, cards);
        case "stack":
            let stack = _.find(state.stacks, { name: source.name });
            if (!stack)
                throw new ActionInvalidError(`No stack found with name ${source.name}`); 
            return take(stack.cards, amount);
        case "pile":
            let pile = _.find(state.piles, { name: source.name });
            if (!pile)
                throw new ActionInvalidError(`No pile found with name ${source.name}`); 
            return cards ? pull(pile.cards, cards) : take(pile.cards, amount);
        default:
            throw new ActionInvalidError(`Unsupported source type ${source.type}`);
    }
}

function pull(source, cards) {
    if (!Array.isArray(cards))
        throw new ActionInvalidError("Cards are not an array");
    cards.forEach(card => {
        let index = _.findIndex(source, card);
        if (index == -1)
            throw new ActionIllegalError(`Source does not have card ${JSON.stringify(card)}`);
        _.pullAt(source, index);
    });
    return cards;
}

function take(source, amount) {
    if (!Number.isInteger(amount))
        throw new ActionInvalidError(`Amount is not an integer`);
    if (source.length < amount)
        throw new ActionInvalidError(`Not enough cards in source`);
    let cards = _.take(source, amount);
    source.splice(0, amount);
    //source = _.drop(source, amount);
    return cards;
}

function add(state, destination, cards, user) {
    if (!_.isPlainObject(destination))
        throw new ActionInvalidError("Destination is not an object");
    switch(destination.type) {
        case "hand":
            let hand = _.find(state.hands, { owner: user.username });
            if (!hand)
                throw new ActionInvalidError(`No hand found with owner ${user.username}`);
            hand.cards.push(...cards);
            break;
        case "stack":
            let stack = _.find(state.stacks, { name: destination.name });
            if (!stack)
                throw new ActionInvalidError(`No stack found with name ${destination.name}`); 
            stack.cards.unshift(...cards);
            break;
        case "pile": 
            let pile = _.find(state.piles, { name: destination.name });
            if (!pile)
                throw new ActionInvalidError(`No pile found with name ${destination.name}`); 
            pile.cards.unshift(...cards);
            break;
        default:
            throw new ActionInvalidError(`Unsupported destination type ${source.type}`);
    }
}

function flipStack(state, name) {
    let stack = _.find(state.stacks, { name });
    if (!stack)
        throw new ActionInvalidError(`No stack found with name ${name}`); 
    _.reverse(stack.cards);
    stack.facing = stack.facing == "up" ? "down" : "up";
}

function createStack(state, name, facing) {
    let stack = _.find(state.stacks, { name });
    if (stack)
        throw new ActionIllegalError(`Stack with name ${name} already exists`);
    if (!["up", "down"].includes(facing))
        throw new ActionInvalidError(`Invalid facing ${facing}`);
    state.stacks.push({
        name,
        facing,
        cards: []
    });
}

function createPile(state, name, facing) {
    let pile = _.find(state.piles, { name });
    if (pile)
        throw new ActionIllegalError(`Pile with name ${name} already exists`);
    if (!["up", "down"].includes(facing))
        throw new ActionInvalidError(`Invalid facing ${facing}`);
    state.piles.push({
        name,
        facing,
        cards: []
    });
}

export default { perform };
