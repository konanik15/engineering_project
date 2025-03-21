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
  meta: UnoMetaDTO | DurakMetaDTO,
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
  color?: string,
  type?: string,
  rank?: string,
  suit?: string
}

export interface GameLiteDTO {
  type: string,
  description: string
}

export interface DurakMetaDTO {
  declarations: any[],
  direction: string,
  obligations: any[],
  attacker: PlayerLiteDTO,
  defender: PlayerLiteDTO,
  turn?: PlayerLiteDTO
  orderedColor?: string //this type never exists, it;s just my lack of iq to handle types in typescript
}

export interface UnoMetaDTO {
  declarations: any[],
  direction: string,
  obligations: ObligationDTO[],
  turn: PlayerLiteDTO,
  orderedColor: string
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
  color?: string,
  username?: string
}

export interface ObligationDTO {
  obliged: string,
  type: string,
  amount?: number,
  reason?: string
}

export interface ReasonDTO {
  actions: {
    destination: {
      type: string
    },
    source: {
      type: string,
      name: string
    }
    type: string
  },
  initiator: {
    username: string
  },
  type: string
}

export interface ProfileDTO {
  username: string,
  avatar: string,
  bio: string,
  friends: string[],
  online: boolean
}

