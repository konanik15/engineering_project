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

export {
    LobbyDoesNotExistError,
    LobbyNotAParticipantError
};
