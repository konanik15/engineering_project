import FriendRequest from "../models/request.js";
import User from "../../profile/service/user.js";
import Lock from "async-lock";
const lock = new Lock();
import { 
    FriendRequestAlreadyReceived,
    FriendRequestAlreadySent,
    FriendRequestNotFound
} from "../../common/errors.js"

async function send(from, to, text) {
    let request;
    await lock.acquire([`request:${from}`, `request:${to}`], async () => {
        await User.ensureNotFriends(from, to);

        request = await FriendRequest.findOne({ from, to });
        if (request) 
            throw new FriendRequestAlreadySent("There is already an active friend request you sent to this user");

        request = await FriendRequest.findOne({ to: from, from: to });
        if (request) 
            throw new FriendRequestAlreadyReceived("You have an active request from this user. Accept it instead.");

        request = new FriendRequest({ from, to, text });
        await request.save();
    });
    return request;
}

async function getSent(username) {
    return await FriendRequest.find({ from: username });
}

async function getReceived(username) {
    return await FriendRequest.find({ to: username });
}

async function respond(from, to, response) {
    let request;
    await lock.acquire([`request:${from}`, `request:${to}`], async () => {
        request = await FriendRequest.findOne({ from, to });
        if (!request) 
            throw new FriendRequestNotFound(`There is no friend request from user ${from}`);
        
        if (response === "accept")
            await User.makeFriends(from, to);
        await FriendRequest.deleteOne({ from, to });
    });
    return request;
}

async function cancel(from, to) {
    await lock.acquire([`request:${from}`, `request:${to}`], async () => {
        let request = await FriendRequest.findOne({ from, to });
        if (!request) 
            throw new FriendRequestNotFound(`No active friend request towards user ${to} was found`);

        await FriendRequest.deleteOne({ from, to });
    });
    return;
}

export default { send, getSent, getReceived, respond, cancel };
