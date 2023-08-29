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
        case "flip":
            flip(state, action.entity);
            break;
        case "create":
            create(state, action.entity);
            break;
        case "openHand":
            setHandOpen(state, user, true);
            break;
        case "closeHand":
            setHandOpen(state, user, false);
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

function flip(state, entity) {
    if (!_.isPlainObject(entity))
        throw new ActionInvalidError("Entity is not an object");
    let selectedEntity;
    switch(entity.type) {
        case "stack":
            selectedEntity = _.find(state.stacks, { name: entity.name });
            if (!selectedEntity)
                throw new ActionInvalidError(`No stack found with name ${entity.name}`);
            break;
        case "pile":
            selectedEntity = _.find(state.piles, { name: entity.name });
            if (!selectedEntity)
                throw new ActionInvalidError(`No pile found with name ${entity.name}`);
            break;
        default:
            throw new ActionInvalidError(`Unsupported entity type ${entity.type}`);
    }

    _.reverse(selectedEntity.cards);
    selectedEntity.facing = selectedEntity.facing == "up" ? "down" : "up";
}

function create(state, entity) {
    if (!_.isPlainObject(entity))
        throw new ActionInvalidError("Entity is not an object");
    let existingEntity;
    switch(entity.type) {
        case "stack":
            existingEntity = _.find(state.stacks, { name: entity.name });
            if (existingEntity)
                throw new ActionInvalidError(`A stack with name ${entity.name} already exists`);
            break;
        case "pile":
            existingEntity = _.find(state.piles, { name: entity.name });
            if (existingEntity)
                throw new ActionInvalidError(`A pile with name ${entity.name} already exists`);
            break;
        default:
            throw new ActionInvalidError(`Unsupported entity type ${entity.type}`);
    }

    if (_.has(entity, "facing") && !["up", "down"].includes(entity.facing))
        throw new ActionInvalidError(`Invalid facing ${entity.facing}`);

    state[entity.type == "stack" ? "stacks" : "piles"].push({
        name: entity.name,
        facing: entity.facing || "down",
        cards: []
    });
}

function setHandOpen(state, user, open) {
    let hand = _.find(state.hands, { owner: user.username });
    if (!hand)
        throw new ActionInvalidError(`No hand found with owner ${user.username}`);
    hand.open = open;
}

export default { perform };
