export interface LobbyDTO {
  id?: string,
  _id?: string,
  name: string,
  players?: PlayerDTO[],
  chatHistory?: ChatHistoryDTO[],
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

export interface PlayerLiteDTO {
  username: string
}

export interface ChatHistoryDTO {

  sender: string
  message: string
  timestamp: Date
}


export interface GameDTO {
  meta?: UnoMetaDTO | DurakMetaDTO,
  participants: PlayerLiteDTO[],
  state?: StateDTO,
  status: string,
  type: string,
}

export interface StateDTO {
  hands: HandDTO[],
  stacks: StackDTO[],
  piles: PileDTO[]

}

export interface HandDTO {
  open: boolean,
  owner: string,
  cards: CardDTO[]
}


export interface StackDTO {
  name: string,
  facing: string,
  cards: CardDTO[]
}

export interface PileDTO {
  name: string,
  facing: string,
  cards: CardDTO[]
}

export interface CardDTO {
  color: string,
  type: string
}

export interface GameLiteDTO {
  type: string,
  description: string
}

export interface DurakMetaDTO {
  declarations: any[],
  direction: string,
  obligations: any[],
  turn: PlayerLiteDTO,
}

export interface UnoMetaDTO {
  declarations: any[],
  direction: string,
  obligations: any[],
  turn: PlayerLiteDTO,
}

export interface TransferDTO {
  type: string,
  source: {
    type: string,
    name?: string
  }
  destination: {
    type: string,
    name?: string
  },
  amount?: number
  cards?: CardDTO[]
}

export interface UnoMessageDTO {
  type: string,
}

