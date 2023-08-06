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

export {
    LobbyDoesNotExistError,
    LobbyNotAParticipantError,
    MessageDoesNotExistError,
    MessageNotReceiverError,
    UserDoesNotExistError
};
