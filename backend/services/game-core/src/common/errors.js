class GameTypeUnsupportedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GameTypeUnsupportedError';
    }
}

class GameDoesNotExistError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GameDoesNotExistError';
    }
}

class GameNotAParticipantError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GameNotAParticipantError';
    }
}

class GameDataInvalidError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GameDataInvalidError';
    }
}

class GameNotInProgressError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GameNotInProgressError';
    }
}

class ActionInvalidError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ActionInvalidError';
    }
}

class ActionIllegalError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ActionIllegalError';
    }
}

export {
    GameDoesNotExistError,
    GameTypeUnsupportedError,
    GameNotAParticipantError,
    GameDataInvalidError,
    GameNotInProgressError,
    ActionInvalidError,
    ActionIllegalError
};
