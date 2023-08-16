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

class LobbyFullError extends Error {
    constructor(message) {
        super(message);
        this.name = 'LobbyFullError';
    }
}

class LobbyInProgessError extends Error {
    constructor(message) {
        super(message);
        this.name = 'LobbyInProgessError';
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

class AlreadyFriendsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AlreadyFriendsError';
    }
}

class NotFriendsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFriendsError';
    }
}

class FriendNotOnlineError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FriendNotOnlineError';
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
    LobbyFullError,
    LobbyInProgessError,
    MessageDoesNotExistError,
    MessageNotReceiverError,
    UserDoesNotExistError,
    InvalidParameters,
    NotFriendsError,
    AlreadyFriendsError,
    FriendNotOnlineError,
    FriendRequestAlreadySent,
    FriendRequestAlreadyReceived,
    FriendRequestNotFound,
    UserInvalidData
};
