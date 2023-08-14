class LobbyDoesNotExistError extends Error {
    constructor(message) {
        super(message);
        this.name = 'LobbyDoesNotExistError';
    }
}

class LobbyNotAParticipantError extends Error {
    constructor(message) {
        super(message);
        this.name = 'LobbyNotAParticipantError';
    }
}

class MessageDoesNotExistError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MessageDoesNotExistError';
    }
}

class MessageNotReceiverError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MessageNotReceiverError';
    }
}

class UserDoesNotExistError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UserDoesNotExistError';
    }
}

class InvalidParameters extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidParameters';
    }
}

class AlreadyFriendsWithError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AlreadyFriendsWithError';
    }
}

class NotFriendsWithError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFriendsWithError';
    }
}

class FriendRequestAlreadySent extends Error {
    constructor(message) {
        super(message);
        this.name = 'FriendRequestAlreadySent';
    }
}

class FriendRequestAlreadyReceived extends Error {
    constructor(message) {
        super(message);
        this.name = 'FriendRequestAlreadyReceived';
    }
}

class FriendRequestNotFound extends Error {
    constructor(message) {
        super(message);
        this.name = 'FriendRequestNotFound';
    }
}

class UserInvalidData extends Error {
    constructor(message) {
        super(message);
        this.name = 'UserInvalidData';
    }
}

export {
    LobbyDoesNotExistError,
    LobbyNotAParticipantError,
    MessageDoesNotExistError,
    MessageNotReceiverError,
    UserDoesNotExistError,
    InvalidParameters,
    NotFriendsWithError,
    AlreadyFriendsWithError,
    FriendRequestAlreadySent,
    FriendRequestAlreadyReceived,
    FriendRequestNotFound,
    UserInvalidData
};
