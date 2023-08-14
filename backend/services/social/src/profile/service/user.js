import { AlreadyFriendsWithError, NotFriendsWithError, UserInvalidData } from "../../common/errors.js";
import User from "../models/user.js";
import Lock from "async-lock";
const lock = new Lock();
import _ from "lodash";

async function retrieve(username) {
    let user;
    await lock.acquire(`user:${username}`, async (done) => {
        user = await User.findOne({ username });
        if (!user) {
            user = new User({ username });
            await user.save();
        }
        done();
    });
    return user;
}

async function getFriends(username) {
    let user = await retrieve(username);
    return user.friendsWith;
}

async function makeFriends(username1, username2) {
    await lock.acquire(`friends:${[username1, username2].sort().join("-")}`, async () => {
        await ensureNotFriends(username1, username2);
        
        let user1 = await retrieve(username1);
        let user2 = await retrieve(username2);

        user1.friendsWith.push(user2.username);
        user2.friendsWith.push(user1.username);
        await Promise.all([user1.save(), user2.save()]);
    });
    return;
}

async function unmakeFriends(username1, username2) {
    await lock.acquire(`friends:${[username1, username2].sort().join("-")}`, async () => {
        await ensureFriends(username1, username2);
        
        let user1 = await retrieve(username1);
        let user2 = await retrieve(username2);

        user1.friendsWith = user1.friendsWith.filter(f => f !== user2.username);
        user2.friendsWith = user2.friendsWith.filter(f => f !== user1.username);
        await Promise.all([user1.save(), user2.save()]);
    });
    return;
}

async function ensureFriends(username1, username2) {
    let user1 = await retrieve(username1);
    if (!user1.friendsWith.includes(username2))
        throw new NotFriendsWithError(`User ${username2} is not a friend`);
}

async function ensureNotFriends(username1, username2) {
    let user1 = await retrieve(username1);
    if (user1.friendsWith.includes(username2))
        throw new AlreadyFriendsWithError(`User ${username2} is already a friend`);
}

async function update(username, data) {
    let user = await retrieve(username);
    let newUser = _.pick(data, ["bio"]); //maybe add more profile fields in the future
    for (let property in newUser)
        user[property] = newUser[property];

    try {
        await User.validate(user);
    } catch (e) {
        if (e instanceof mongoose.Error.ValidationError)
            throw new UserInvalidData(e.message);
        throw e;
    }
    await user.save();
    return user;
}

export default { retrieve, makeFriends, ensureFriends, ensureNotFriends, unmakeFriends, getFriends, update };
