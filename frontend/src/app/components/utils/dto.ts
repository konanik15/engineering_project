export interface LobbyDTO {
  id?: string,
  _id?: string,
  name: string,
  players?: PlayerDTO[],
  chat?: ChatHistoryDTO[],
  inProgress?: boolean,
  isFull?: boolean,
  game: string,
  minPlayers?: number,
  maxPlayers?: number,
  hasLeader?: boolean,
  passwordProtected?: boolean,
  password?: string
}

export interface LobbyLiteDTO {
  message?: string,
  lobbyId: string,
}

export interface PlayerDTO {
  wsId: string,
  name: string,
  ready: boolean,
  leader: boolean,
  joinTime: Date,
}

export interface ChatHistoryDTO {

  sender: string
  message: string
  timestamp: Date
}

export interface GameLiteDTO {
  type: string,
  description: string
}
