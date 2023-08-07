import { type } from "os";
import { InvalidParameters, MessageDoesNotExistError } from "../../common/errors.js";
import Message from "../models/message-private.js";
import Lock from "async-lock";
const lock = new Lock();

async function findById(id) {
    try {
        let message = await Message.findById(id);
        if (!message)
            throw new Error();
        return message;
    } catch (e) {
        throw new MessageDoesNotExistError(`Message with id ${id} does not exist`);
    }
}

async function getConversation(participant1, participant2, page, perPage) {
    page = parseInt(page); 
    perPage = parseInt(perPage);
    if (!Number.isInteger(page) || !Number.isInteger(perPage))
        throw new InvalidParameters("page and perPage parameters are not valid integers");

    let messages = await Message.find({
        from: { $in: [ participant1, participant2 ] },
        to: { $in: [ participant1, participant2 ] }
    }, null, {
        sort: { sent: -1 }
    }).skip(perPage * (page - 1)).limit(perPage);
    return messages;
}

async function getSummary(participant) {
    let unreadMessages = await Message.aggregate([{ 
        $match: {
            to: participant,
            read: false
        }
    }, {
        $sort: { sent: -1 }
    }, {
        $group: {
            _id: "$from",
            count: { $sum: 1 }
        }
    }]);

    let lastMessages = await Message.aggregate([{ 
        $match: {
            $or: [{ from: participant }, { to: participant }]
        }
    }, {
        $sort: { sent: -1 }
    }, { 
        $addFields: {
            conversation: {
                $function: {
                    body: function(from, to) { return [from, to].sort().join("-") },
                    args: ["$from", "$to"],
                    lang: "js"
                }
            }
        }
    }, {
        $group: {
            _id: "$conversation",
            last: { $first: "$_id" }
        }
    }]);
    lastMessages = await Promise.all(lastMessages.map(async m => await findById(m.last)));

    let conversations = lastMessages.map(lm => {
        return {
            with: [lm.from, lm.to].find(p => p !== participant),
            lastMessage: lm
        }
    });
    conversations = conversations.map(c => {
        let um = unreadMessages.find(m => m._id === c.with);
        c.unread = um ? um.count : 0;
        return c;
    });
    return conversations;
}

async function send(from, to, text) {
    let message = new Message({ from, to, text });
    let prevUnread;
    await lock.acquire([from, to].sort().join("-"), async (done) => {
        prevUnread = await Message.find({
            from: to,
            read: false
        });
        prevUnread = await Promise.all(prevUnread.map(async m => {
            m.read = true;
            m.save();
            return m;
        }));
        await message.save();
        done();
    });
    return {
        message,
        read: prevUnread
    };
}

async function read(message) {
    await lock.acquire([message.from, message.to].sort().join("-"), async (done) => {
        message.read = true;
        await message.save();
        done();
    });
    return message;
}

export default { findById, getConversation, getSummary, send, read };
